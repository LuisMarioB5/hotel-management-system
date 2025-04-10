DELIMITER //

CREATE PROCEDURE `GenerateRoomAssignments`(
    IN p_num_customers INT,
    IN p_is_frequent_guest TINYINT
)
BEGIN
    -- Crear una tabla temporal para almacenar los resultados finales
    CREATE TEMPORARY TABLE TempResults (
        customer_id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        room_id INT,
        room_number VARCHAR(10),
        details TEXT,
        price DECIMAL(10, 2),
        total_score INT,
        max_preference_level INT,
        customer_rank INT
    );

    -- Insertar los resultados de la consulta en la tabla temporal
    INSERT INTO TempResults
    WITH SelectedCustomers AS (
        SELECT 
            c.id AS customer_id,
            c.name,
            c.email,
            ROW_NUMBER() OVER (ORDER BY RAND()) AS customer_rank
        FROM customers c
        WHERE c.isFrequentGuest = p_is_frequent_guest
        ORDER BY RAND()
        LIMIT p_num_customers
    ),
    RankedPreferences AS (
        SELECT 
            ca.customer_id,
            ca.amenity_id,
            ca.preference_level
        FROM client_amenities ca
        WHERE ca.customer_id IN (SELECT customer_id FROM SelectedCustomers)
        ORDER BY ca.preference_level DESC
    ),
    RoomScores AS (
        SELECT 
            sc.customer_id,
            sc.name,
            sc.email,
            sc.customer_rank,
            r.id AS room_id,
            r.number AS room_number,
            r.details,
            r.price,
            COALESCE(SUM(rp.preference_level), 0) AS total_score,
            COALESCE(MAX(rp.preference_level), 0) AS max_preference_level,
            ROW_NUMBER() OVER (PARTITION BY sc.customer_id ORDER BY COALESCE(MAX(rp.preference_level), 0) DESC, COALESCE(SUM(rp.preference_level), 0) DESC, RAND()) AS room_rank
        FROM SelectedCustomers sc
        CROSS JOIN rooms r
        LEFT JOIN room_amenities ra ON r.id = ra.room_id
        LEFT JOIN RankedPreferences rp ON ra.amenity_id = rp.amenity_id AND rp.customer_id = sc.customer_id
        WHERE r.status = 'DISPONIBLE'
        GROUP BY sc.customer_id, sc.name, sc.email, sc.customer_rank, r.id, r.number, r.details, r.price
    ),
    AssignedRooms AS (
        SELECT 
            customer_id,
            name,
            email,
            customer_rank,
            room_id,
            room_number,
            details,
            price,
            total_score,
            max_preference_level,
            ROW_NUMBER() OVER (PARTITION BY room_id ORDER BY customer_rank) AS assignment_rank
        FROM RoomScores
        WHERE room_rank = 1
    ),
    FinalAssignments AS (
        SELECT 
            customer_id,
            name,
            email,
            room_id,
            room_number,
            details,
            price,
            total_score,
            max_preference_level,
            customer_rank,
            SUM(CASE WHEN assignment_rank = 1 THEN 1 ELSE 0 END) OVER (ORDER BY customer_rank ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS rooms_assigned_so_far
        FROM AssignedRooms
        WHERE assignment_rank = 1
    ),
    RemainingCustomers AS (
        SELECT 
            sc.customer_id,
            sc.name,
            sc.email,
            sc.customer_rank
        FROM SelectedCustomers sc
        LEFT JOIN FinalAssignments fa ON sc.customer_id = fa.customer_id
        WHERE fa.customer_id IS NULL
    ),
    RemainingRooms AS (
        SELECT 
            r.id AS room_id,
            r.number AS room_number,
            r.details,
            r.price
        FROM rooms r
        LEFT JOIN FinalAssignments fa ON r.id = fa.room_id
        WHERE r.status = 'DISPONIBLE'
        AND fa.room_id IS NULL
    ),
    RemainingAssignments AS (
        SELECT 
            rc.customer_id,
            rc.name,
            rc.email,
            rc.customer_rank,
            rr.room_id,
            rr.room_number,
            rr.details,
            rr.price,
            0 AS total_score,
            0 AS max_preference_level,
            ROW_NUMBER() OVER (PARTITION BY rc.customer_id ORDER BY RAND()) AS remaining_room_rank
        FROM RemainingCustomers rc
        CROSS JOIN RemainingRooms rr
    ),
    FinalResults AS (
        SELECT 
            customer_id,
            name,
            email,
            room_id,
            room_number,
            details,
            price,
            total_score,
            max_preference_level,
            customer_rank
        FROM FinalAssignments
        WHERE rooms_assigned_so_far <= customer_rank
        UNION ALL
        SELECT 
            customer_id,
            name,
            email,
            room_id,
            room_number,
            details,
            price,
            total_score,
            max_preference_level,
            customer_rank
        FROM RemainingAssignments
        WHERE remaining_room_rank = 1
    )
    SELECT 
        customer_id,
        name,
        email,
        room_id,
        room_number,
        details,
        price,
        total_score,
        max_preference_level,
        customer_rank
    FROM FinalResults
    ORDER BY customer_rank;

    -- Devolver los resultados de la tabla temporal
    SELECT 
        customer_id,
        name,
        email,
        room_id,
        room_number,
        details,
        price,
        total_score,
        max_preference_level
    FROM TempResults
    ORDER BY customer_rank;

    -- Eliminar la tabla temporal
    DROP TEMPORARY TABLE TempResults;
END //

DELIMITER ;