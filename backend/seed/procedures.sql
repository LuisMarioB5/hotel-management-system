-- Procedimiento GenerateRoomAssignments
--
-- Este procedimiento no existía en el repositorio ni en la base de datos
-- que se venía usando para las pruebas, aunque `offers.service.ts` lo
-- invoca con `CALL GenerateRoomAssignments(...)`. Se reconstruyó a partir
-- de un respaldo anterior del proyecto (que nunca se llegó a subir al
-- repositorio) y de cómo el backend y el frontend (`oferts.js`,
-- `cuestionario.js`) consumen su resultado. Depende de la tabla `seasons`
-- (temporadas y su multiplicador de precio) y del catálogo de amenidades
-- (`amenities`, `amenity_categories`, `amenity_options`, `room_amenities`,
-- `client_amenities`), que tampoco existían y se sembraron por separado.
--
-- Qué hace: dado un conjunto de criterios (cantidad de clientes, si deben
-- ser frecuentes, un cliente específico, tipo de habitación, estadía mínima
-- y temporada), elige clientes candidatos -priorizando a quienes ya llenaron
-- el cuestionario de preferencias- y les asigna la mejor habitación
-- disponible, sin repetir una misma habitación entre dos clientes de la
-- misma corrida.
--
-- Cómo decide cuál es "la mejor" habitación para cada cliente: combina dos
-- puntajes, cada uno entre 0 y 1.
--   - Puntaje de precio: qué tan cerca está el precio de la habitación del
--     extremo más barato dentro del rango [min_cost, max_cost] que el
--     cliente puso en el cuestionario. 1 = lo más barato posible dentro de
--     su rango, 0 = el límite superior de lo que estaba dispuesto a pagar.
--   - Puntaje de amenidades: qué porcentaje de la importancia total que el
--     cliente le dio a sus amenidades marcadas (client_amenities) cubre esa
--     habitación en concreto. 1 = tiene todas las amenidades que pidió, con
--     el nivel de importancia completo; 0 = no tiene ninguna.
-- Los dos puntajes se combinan usando weight_level (1-5, qué tanto le
-- importa el precio al cliente): entre más alto, más pesa el precio sobre
-- las amenidades en la decisión final. Si el cliente nunca llenó el
-- cuestionario, no hay con qué calcular estos puntajes y simplemente se le
-- asigna la habitación disponible más barata que cumpla el tipo pedido.
--
-- Devuelve una de dos cosas:
--   - Un conjunto de filas (customer_id, room_id, price, details, email,
--     room_number, name) con las asignaciones encontradas.
--   - Si no se encontró ninguna, una sola fila con la columna
--     WarningMessage explicando que no hubo coincidencias.

DROP PROCEDURE IF EXISTS GenerateRoomAssignments;

DELIMITER $$

CREATE PROCEDURE GenerateRoomAssignments(
    IN p_numCustomers INT,
    IN p_isFrequentGuest INT,
    IN p_specificCustomer INT,
    IN p_roomType VARCHAR(20),
    IN p_minStayDuration INT,
    IN p_seasonName VARCHAR(10)
)
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_customer_id INT;
    DECLARE v_min_cost DECIMAL(10,2);
    DECLARE v_max_cost DECIMAL(10,2);
    DECLARE v_weight_level TINYINT;
    DECLARE v_weight_norm DECIMAL(4,3);
    DECLARE v_customer_total_pref INT;
    DECLARE v_multiplier DECIMAL(4,2);
    DECLARE v_room_id INT;
    DECLARE v_room_price DECIMAL(10,2);

    DECLARE cur_customers CURSOR FOR
        SELECT customer_id, min_cost, max_cost, weight_level FROM tmp_candidate_customers;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DROP TEMPORARY TABLE IF EXISTS tmp_candidate_customers;
    DROP TEMPORARY TABLE IF EXISTS tmp_assigned_rooms;
    DROP TEMPORARY TABLE IF EXISTS tmp_offers;

    CREATE TEMPORARY TABLE tmp_offers (
        customer_id INT,
        room_id INT,
        price DECIMAL(10,2),
        details VARCHAR(500),
        email VARCHAR(255),
        room_number INT,
        name VARCHAR(255)
    );

    CREATE TEMPORARY TABLE tmp_assigned_rooms (room_id INT PRIMARY KEY);

    CREATE TEMPORARY TABLE tmp_candidate_customers (
        customer_id INT,
        min_cost DECIMAL(10,2),
        max_cost DECIMAL(10,2),
        weight_level TINYINT
    );

    -- Candidatos: un cliente específico si se pidió uno, o clientes activos
    -- filtrados por frecuencia, priorizando a quienes ya tienen preferencias
    -- guardadas en el cuestionario (client_configuration) y a los más
    -- recientes.
    INSERT INTO tmp_candidate_customers (customer_id, min_cost, max_cost, weight_level)
    SELECT c.id, cc.min_cost, cc.max_cost, cc.weight_level
    FROM customers c
    LEFT JOIN client_configuration cc ON cc.customer_id = c.id
    WHERE c.isActive = 1
      AND (p_specificCustomer = 0 OR c.id = p_specificCustomer)
      AND (p_specificCustomer > 0 OR p_isFrequentGuest = -1 OR c.isFrequentGuest = p_isFrequentGuest)
    ORDER BY (cc.customer_id IS NOT NULL) DESC, c.registrationDate DESC;

    -- Ajuste de precio según temporada, usando la tabla `seasons`. Si no se
    -- indica una temporada, se busca cuál aplica según la fecha de hoy.
    SELECT price_multiplier INTO v_multiplier
    FROM seasons
    WHERE (p_seasonName = '' AND CURDATE() BETWEEN start_date AND end_date)
       OR (p_seasonName != '' AND name = p_seasonName)
    LIMIT 1;
    IF v_multiplier IS NULL THEN
        SET v_multiplier = 1.00;
    END IF;

    OPEN cur_customers;

    read_loop: LOOP
        -- En modo "top N clientes" nos detenemos apenas alcanzamos la
        -- cantidad pedida; en modo "cliente específico" el cursor solo
        -- trae ese único candidato de todas formas.
        IF p_specificCustomer = 0 AND v_count >= p_numCustomers THEN
            LEAVE read_loop;
        END IF;

        FETCH cur_customers INTO v_customer_id, v_min_cost, v_max_cost, v_weight_level;
        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_room_id = NULL;
        SET v_room_price = NULL;

        -- Entre más alto el weight_level (1-5), más pesa el precio sobre
        -- las amenidades en la puntuación final. Sin cuestionario llenado,
        -- se deja en un punto neutral (no se usa de todas formas, ver más
        -- abajo).
        SET v_weight_norm = IFNULL(v_weight_level, 3) / 5;

        -- Suma de importancia de todas las amenidades que este cliente
        -- marcó; es el "100%" contra el que se compara cada habitación.
        SELECT COALESCE(SUM(preference_level), 0) INTO v_customer_total_pref
        FROM client_amenities
        WHERE customer_id = v_customer_id;

        -- Mejor habitación disponible para este cliente: respeta el tipo
        -- pedido, respeta su rango de precio si llenó el cuestionario (si
        -- no lo llenó, no se restringe por precio ni se puntúa nada,
        -- solo se toma la más barata disponible), no repite una habitación
        -- ya asignada en esta misma corrida, y entre las que califican
        -- prefiere la que mejor combina precio y amenidades según lo que el
        -- cliente indicó que le importa.
        SELECT r.id, r.price
        INTO v_room_id, v_room_price
        FROM rooms r
        LEFT JOIN room_amenities ra ON ra.room_id = r.id
        LEFT JOIN client_amenities ca ON ca.amenity_id = ra.amenity_id AND ca.customer_id = v_customer_id
        WHERE r.status = 'DISPONIBLE'
          AND r.id NOT IN (SELECT room_id FROM tmp_assigned_rooms)
          AND (p_roomType = '' OR r.type = p_roomType)
          AND (v_min_cost IS NULL OR (r.price * v_multiplier) BETWEEN v_min_cost AND v_max_cost)
        GROUP BY r.id, r.price
        ORDER BY
          CASE
            WHEN v_min_cost IS NULL THEN 0
            ELSE
              v_weight_norm * (
                CASE WHEN v_max_cost = v_min_cost THEN 1
                     ELSE 1 - (((r.price * v_multiplier) - v_min_cost) / (v_max_cost - v_min_cost))
                END
              )
              +
              (1 - v_weight_norm) * (
                CASE WHEN v_customer_total_pref = 0 THEN 0
                     ELSE COALESCE(SUM(ca.preference_level), 0) / v_customer_total_pref
                END
              )
          END DESC,
          r.price ASC
        LIMIT 1;

        IF v_room_id IS NOT NULL THEN
            INSERT INTO tmp_assigned_rooms (room_id) VALUES (v_room_id);

            INSERT INTO tmp_offers (customer_id, room_id, price, details, email, room_number, name)
            SELECT c.id, r.id, ROUND(v_room_price * v_multiplier, 2),
                   CONCAT(COALESCE(r.details, 'Habitación estándar'), ' — Estadía mínima: ', p_minStayDuration, ' noche(s)'),
                   c.email, r.number, CONCAT(c.name, ' ', c.lastName)
            FROM customers c, rooms r
            WHERE c.id = v_customer_id AND r.id = v_room_id;

            SET v_count = v_count + 1;
        END IF;
    END LOOP;

    CLOSE cur_customers;

    IF (SELECT COUNT(*) FROM tmp_offers) = 0 THEN
        SELECT 'No se encontraron habitaciones disponibles que coincidan con los criterios seleccionados.' AS WarningMessage;
    ELSE
        SELECT customer_id, room_id, price, details, email, room_number, name FROM tmp_offers;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_candidate_customers;
    DROP TEMPORARY TABLE IF EXISTS tmp_assigned_rooms;
    DROP TEMPORARY TABLE IF EXISTS tmp_offers;
END$$

DELIMITER ;
