# Casos de Prueba QA — Sistema de Gestión Hotelera (Hodelpa)

> **Instrucciones de formato para la conversión de este documento a Word (no forman parte del contenido del informe, léelas y aplícalas, no las copies al documento final):**
> - No usar emojis ni íconos decorativos en ningún punto del documento.
> - No usar texto con colores llamativos (rojo, verde, naranja, etc.). Todo el texto va en color negro estándar; la única variación permitida es **negrita** para énfasis puntual, usada con moderación.
> - Evitar cualquier formato que se vea "genérico de IA": nada de tablas resumen decorativas de más, nada de barras de progreso con emojis, nada de íconos tipo ✅/❌/⚠️/🔴, nada de bloques de cita excesivos. El documento debe leerse como un informe profesional escrito por una persona.
> - No usar líneas horizontales (`---`) para separar secciones. La separación entre módulos y apartados se hace únicamente con el salto de título (encabezado), sin líneas divisorias.
> - Tipografía: títulos principales en tamaño 16, subtítulos en tamaño 14, texto normal en tamaño 12, y el texto dentro de tablas en tamaño 11. Los títulos y subtítulos van en MAYÚSCULAS.
> - Alineación de párrafos: justificada.
> - Paleta de colores de referencia del sistema (tomada del CSS del proyecto), por si se necesita algún acento de color puntual (por ejemplo, en encabezados de tabla o una línea de énfasis, siempre de forma sobria):
>   - Azul primario: `#2F6BFF`
>   - Azul del degradado de login: `#488ada`
>   - Morado primario: `#8A4DFF`
>   - Morado/magenta del degradado de login: `#ab2497`
>   - Gris oscuro (texto de títulos): `#1a1a2e`
>   - Gris oscuro secundario (fondos oscuros): `#232633`
>   - Gris de texto: `#333333`
>   - Gris de texto secundario: `#666666`
>   - Gris de bordes/separadores: `#E5E7EB`
>   - Fondo claro azulado: `#F1F5FF`
>   - Fondo claro morado: `#F1E9FF`
>   - Blanco: `#FFFFFF`
>   - Acento rojo (usado en la interfaz para alertas): `#CA4754`
>   - Acento dorado (usado en la interfaz para detalles): `#E5951E`

Este documento reúne los casos de prueba diseñados para validar el funcionamiento del sistema de gestión hotelera, módulo por módulo. Para cada módulo se define un objetivo, las condiciones que hay que tener en cuenta antes de probar, los escenarios que se van a cubrir, y luego cada escenario desarrollado como caso de prueba completo: un id, los datos que se usaron, los pasos, lo que se esperaba que pasara, lo que realmente pasó, y un espacio para la evidencia.

Los IDs siguen la convención `HTL-<módulo>-###`. Para "Resultado obtenido" solo se usan cuatro palabras: **Pasó**, **No pasó**, **Bloqueado** o **No corrió**. Donde dice `[imagen de ... aquí]` es donde va la captura de pantalla correspondiente cuando el equipo ejecute el caso a mano.

Una parte de este documento no se quedó en "esto debería pasar": se armó una pequeña suite de pruebas automáticas (Jest + Supertest) que le pega directamente al backend real, conectado a la base de datos del proyecto ya sembrada con datos de ejemplo, y se corrió de verdad el 28 de julio de 2026. Esos casos están marcados como **"ejecutado por automatización"** y su resultado no es una suposición: es lo que la API respondió en ese momento. El archivo de esa suite es [`backend/test/qa-casos-prueba.e2e-spec.ts`](../../backend/test/qa-casos-prueba.e2e-spec.ts). El resto de los casos —los que dependen de hacer clic en pantalla, llenar formularios o recibir un correo— quedan con la plantilla en blanco para que el equipo los complete con capturas reales.

Antes de entrar en los módulos, vale la pena explicar dos cosas que se repiten en casi todos los hallazgos, para no tener que repetirlas cien veces:

**No hay validación real del lado del servidor.** El backend está construido en NestJS y usa una librería (`class-validator`) que permite marcar campos como obligatorios, con cierto formato, etc. El problema es que en `backend/src/main.ts` nunca se activa el mecanismo que realmente aplica esas reglas (se llama `ValidationPipe` y falta la línea que lo enciende). En la práctica, eso significa que todas esas reglas están escritas pero no se ejecutan: si alguien le manda datos raros a la API directamente (sin pasar por la pantalla), el sistema los acepta igual, y en varios casos ni siquiera devuelve un error entendible, sino que se cae con un error genérico de base de datos. Esto se confirmó con pruebas reales, no solo leyendo el código.

**No hay control de quién puede hacer qué.** Los roles (Administrador, Recepcionista, Gerente, Mantenimiento) existen y la interfaz web los respeta —oculta botones y redirige según el rol— pero esa es la única barrera. El backend no verifica el rol del que hace la petición en casi ningún endpoint, salvo el de login. Esto quiere decir que si alguien sabe la dirección de la API, puede saltarse la pantalla por completo y hacer cosas que su rol no debería permitirle.

Con eso en mente, vamos módulo por módulo.

---

## Roles del sistema

| Rol | Qué puede ver (según la interfaz) |
|---|---|
| ADMINISTRADOR | Todo |
| RECEPCIONISTA | Panel principal, check-in/salida, reservas, ventas, cuestionario, ofertas |
| GERENTE | Panel principal, reportes, cuestionario, ofertas |
| MANTENIMIENTO | Habitaciones, limpieza |

---

## Antes de las pruebas: la infraestructura de testing del proyecto no funcionaba

Antes de poder correr una sola prueba automática, nos topamos con que el comando `npm test` del backend no corre: 21 de las 22 suites de pruebas fallan al arrancar porque a la configuración de Jest le falta indicarle cómo resolver los imports que el proyecto usa (tipo `import ... from 'src/utils/...'`). Tampoco corría la prueba de ejemplo que trae NestJS por defecto, por un desajuste entre la versión de la librería `supertest` instalada y la forma en que se importa en el código.

Tuvimos que corregir la configuración de la prueba end-to-end (`backend/test/jest-e2e.json`) para poder ejecutar la suite de este documento. No tocamos la configuración de las pruebas unitarias (`package.json`) ni el archivo de ejemplo (`test/app.e2e-spec.ts`) porque esa corrección le corresponde al equipo de desarrollo del proyecto, pero queda anotado aquí como algo que hay que arreglar antes de poder confiar en `npm test` de nuevo.

---

# Módulo HTL-AUTH — Autenticación (Login)

Este es el punto de entrada de todo el sistema: sin loguearse, nadie hace nada. Lo que hay que comprobar aquí es que solo entre quien tiene usuario y contraseña correctos, y que el sistema se defienda de alguien que intenta adivinar la contraseña a la fuerza bloqueando la cuenta después de varios intentos fallidos.

**Condiciones de prueba**: el usuario y la contraseña no pueden quedar vacíos; después de 3 intentos fallidos seguidos la cuenta se debe bloquear; una cuenta bloqueada no debe poder entrar aunque después alguien use la contraseña correcta; y si el login es exitoso, el contador de intentos fallidos debe volver a cero.

**Escenarios**
1. Login exitoso con credenciales válidas.
2. Dos intentos fallidos seguidos, que todavía no deberían bloquear la cuenta.
3. Un tercer intento fallido consecutivo, que sí debería bloquear la cuenta.
4. Intentar entrar con la contraseña correcta en una cuenta ya bloqueada.
5. Login con los campos vacíos.
6. Mandar datos con tipos incorrectos directo a la API, saltándose el formulario.
7. Verificar que el contador de intentos se reinicia después de un login exitoso.

### HTL-AUTH-001 — Login exitoso
**Precondiciones**: existe el usuario `recepcion01`, rol Recepcionista, cuenta activa.
**Datos**: usuario `recepcion01`, contraseña `Recepcion#2026`.
**Pasos**: entrar a la pantalla de login, escribir usuario y contraseña, presionar "Iniciar sesión".
**Resultado esperado**: el sistema redirige al panel principal y el menú muestra solo las opciones que le corresponden a Recepcionista.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la pantalla de login con los campos llenos aquí] [imagen del panel principal cargado aquí]

### HTL-AUTH-002/003 — Dos intentos fallidos no bastan, el tercero sí bloquea (ejecutado por automatización)
Para este caso creamos un usuario de prueba por API con contraseña conocida y le mandamos tres intentos de login seguidos con contraseñas incorrectas, revisando en la base de datos qué pasaba después de cada uno.

**Datos**: usuario de prueba `qa_auth_<marca de tiempo>`, contraseña correcta `ClaveCorrecta#2026`, intentos fallidos con `Mala1`, `Mala2` y `Mala3`.
**Resultado esperado**: después de dos intentos fallidos la cuenta debía seguir activa; después del tercero, debía quedar bloqueada.
**Resultado obtenido**: **Pasó.** Tras los dos primeros intentos la cuenta seguía activa con el contador en 2; tras el tercero, el campo que marca si la cuenta está activa pasó a "no". El comportamiento coincide exactamente con lo que dice el código (`backend/src/auth/auth.service.ts`, líneas 15 y 25).
**Evidencias**: salida real de la ejecución de la prueba:
```
√ HTL-AUTH-002: dos intentos con contraseña incorrecta no bloquean la cuenta (137 ms)
√ HTL-AUTH-003: el tercer intento fallido consecutivo bloquea la cuenta (isActive=false) (65 ms)
```
[imagen de la consola corriendo `npx jest --config ./test/jest-e2e.json qa-casos-prueba --verbose` aquí]

### HTL-AUTH-004 — Contraseña correcta en cuenta ya bloqueada (ejecutado por automatización)
Con la misma cuenta ya bloqueada del caso anterior, probamos entrar usando la contraseña correcta, para confirmar que el bloqueo realmente impide el acceso y no es solo un aviso.

**Resultado esperado**: el login debía rechazarse igual, aunque la contraseña fuera la correcta.
**Resultado obtenido**: **Pasó.** El sistema respondió con un rechazo (401) y no permitió entrar.
**Evidencias**:
```
√ HTL-AUTH-004: login con contraseña CORRECTA sobre cuenta ya bloqueada debe seguir rechazando (4 ms)
```

### HTL-AUTH-005 — Campos vacíos
**Pasos**: dejar usuario y contraseña vacíos y presionar "Iniciar sesión".
**Resultado esperado**: el sistema no debe dejar enviar el formulario y debe marcar los campos como obligatorios.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de los campos vacíos con el mensaje de validación aquí]

> Nota: revisando el código del formulario de login (`frontend/src/validations/login.form.js`) encontramos que la validación de longitud mínima y complejidad de la contraseña está escrita pero comentada, es decir, deshabilitada a propósito en algún momento. Solo queda activa la validación de "no vacío". Si el criterio del negocio pedía una contraseña con cierta longitud o complejidad, este caso probablemente no pase.

### HTL-AUTH-006 — Datos con tipos incorrectos directo a la API
**Datos**: enviar a `/auth/login` un usuario que es un número en vez de texto, y una contraseña con una inyección SQL de prueba.
**Pasos**: usar Postman o una herramienta similar para mandar la petición sin pasar por la pantalla.
**Resultado esperado**: el sistema debería rechazar la petición con un error controlado, no con una caída del servidor.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la petición y la respuesta en Postman aquí]

### HTL-AUTH-007 — El contador se reinicia tras un login exitoso
**Precondiciones**: usuario con 1 o 2 intentos fallidos registrados, todavía activo.
**Pasos**: entrar con la contraseña correcta y revisar el contador en la base de datos.
**Resultado esperado**: el contador debe volver a cero.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del registro en base de datos con el contador en cero aquí]

---

# Módulo HTL-USR — Gestión de Usuarios

Aquí se administran las cuentas del personal: quién puede entrar al sistema y con qué rol. Solo el Administrador debería tener acceso a esta pantalla, y hay que asegurarse de que no se puedan crear dos usuarios con el mismo nombre de usuario ni asignar un rol que no exista.

**Condiciones de prueba**: solo el Administrador entra a la pantalla de usuarios; el nombre de usuario debe ser único; la contraseña se guarda cifrada, nunca en texto plano; el rol es obligatorio y solo puede ser uno de los cuatro válidos.

**Escenarios**
1. Crear un usuario válido.
2. Intentar crear un usuario con un nombre de usuario que ya existe.
3. Editar el rol de un usuario existente.
4. Desactivar un usuario y comprobar que ya no pueda entrar.
5. Eliminar un usuario que tiene tareas de mantenimiento asignadas.
6. Enviar un rol que no existe directo a la API.
7. Intentar entrar a la pantalla de usuarios con una cuenta de Recepcionista.

### HTL-USR-001 — Crear usuario válido
**Precondiciones**: sesión iniciada como Administrador.
**Datos**: usuario `mantenimiento02`, contraseña `Mant#2026Seguro`, rol Mantenimiento, activo.
**Pasos**: ir a Usuarios, presionar "Nuevo usuario", llenar el formulario, guardar.
**Resultado esperado**: el usuario se crea y aparece en el listado con el rol correcto.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario lleno con los datos aquí] [imagen del listado mostrando el nuevo usuario aquí]

### HTL-USR-002 — Nombre de usuario duplicado (ejecutado por automatización)
Creamos un usuario de prueba y luego intentamos crear un segundo usuario con exactamente el mismo nombre de usuario, para ver cómo reacciona el sistema.

**Resultado esperado**: el segundo registro debería rechazarse con un mensaje claro de "este usuario ya existe".
**Resultado obtenido**: **No pasó del todo.** El sistema sí evita el duplicado —no llega a crear el segundo usuario— pero en vez de devolver un mensaje de negocio entendible, responde con un error genérico de servidor (500 "Internal server error"). Es decir, el resultado final es correcto (no se duplica), pero la manera en que se comunica el error no lo es: cualquiera que use la API directamente ve un error críptico en vez de "el usuario ya existe".
**Evidencias**:
```
[HTL-USR-002] status real al duplicar username: 500 { statusCode: 500, message: 'Internal server error' }
```

### HTL-USR-003 — Editar rol de usuario
**Pasos**: buscar el usuario en el listado, editar, cambiar el rol, guardar.
**Resultado esperado**: el rol se actualiza y en el siguiente login el usuario recibe los permisos nuevos.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario de edición con el nuevo rol aquí]

### HTL-USR-004 — Desactivar usuario
**Pasos**: marcar el usuario como inactivo desde el listado, luego intentar entrar con esa cuenta.
**Resultado esperado**: el login debe rechazarse aunque la contraseña sea correcta.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del usuario marcado como inactivo aquí] [imagen del intento de login fallido aquí]

### HTL-USR-005 — Eliminar usuario con tareas asignadas
**Precondiciones**: el usuario tiene al menos una tarea de mantenimiento asignada.
**Pasos**: intentar eliminarlo desde el listado.
**Resultado esperado**: el sistema debería impedir la eliminación o manejar de forma controlada qué pasa con esa tarea, no fallar con un error de base de datos sin explicación.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de eliminación y su resultado aquí]

### HTL-USR-006 — Rol que no existe, enviado directo a la API (ejecutado por automatización)
Mandamos una petición de creación de usuario con el rol `"SUPERADMIN"`, que no es uno de los cuatro roles válidos del sistema.

**Resultado esperado**: el sistema debería devolver un error de "solicitud incorrecta" (código 400).
**Resultado obtenido**: **No pasó.** El sistema respondió con un error 500, no con un 400. Esto confirma lo que se explicó al principio: como la validación automática de datos no está activada, la comprobación de que el rol sea válido nunca se ejecuta, y el valor inválido llega tal cual hasta la base de datos, que es la que finalmente lo rechaza de forma abrupta.
**Evidencias**:
```
× HTL-USR-006: rol inválido vía API directa debería devolver 400 (62 ms)
Expected: 400
Received: 500
```

### HTL-USR-007 — Acceso a la pantalla de usuarios con un rol no autorizado
**Precondiciones**: sesión iniciada como Recepcionista.
**Pasos**: intentar entrar directamente a la URL de la pantalla de usuarios; intentar llamar al listado de usuarios directo desde la API con el token de Recepcionista.
**Resultado esperado**: ambos intentos deberían bloquearse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del bloqueo en la pantalla aquí] [imagen de la respuesta de la API en Postman aquí]

> Este caso probablemente falle a nivel de API: como se explicó al inicio, casi ningún endpoint del backend revisa el rol de quien hace la petición.

---

# Módulo HTL-CLI — Clientes / Huéspedes

Este módulo guarda los datos de las personas que se hospedan: nombre, documento, contacto. Esta información alimenta después las reservas, las ofertas y el cuestionario de preferencias, así que un dato mal guardado aquí se arrastra a todo lo demás.

**Condiciones de prueba**: solo el Administrador entra a esta pantalla; documento, nombre, apellido, teléfono y correo son obligatorios; el número de documento y el correo deben ser únicos en el sistema; los clientes inactivos no deberían aparecer cuando se busca un cliente para una reserva o un cuestionario.

**Escenarios**
1. Registrar un cliente nuevo correctamente.
2. Intentar registrar un cliente con un documento que ya existe.
3. Intentar registrar un cliente con un correo que ya existe en otro cliente.
4. Enviar un correo con formato inválido directo a la API.
5. Escribir letras en el campo de teléfono.
6. Dejar campos obligatorios vacíos.
7. Confirmar que un cliente inactivo no aparezca al buscarlo para una reserva o un cuestionario.

### HTL-CLI-001 — Registro exitoso de cliente
**Precondiciones**: sesión iniciada como Administrador.
**Datos**: documento `402-1234567-8` (cédula), nombre `María`, apellido `Pérez`, teléfono `809-555-1234`, correo `maria.perez@example.com`, género femenino.
**Pasos**: ir a Clientes, "Nuevo cliente", llenar el formulario, guardar.
**Resultado esperado**: el cliente se crea y aparece en el listado como activo.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario lleno con los datos aquí] [imagen del cliente en el listado aquí]

### HTL-CLI-002 — Documento duplicado (ejecutado por automatización)
Tomamos el número de documento de un cliente que ya existía en la base de datos sembrada y tratamos de registrar un cliente nuevo reutilizándolo.

**Resultado esperado**: el sistema debería avisar claramente que ese documento ya está registrado.
**Resultado obtenido**: **No pasó del todo.** Igual que con el usuario duplicado del módulo anterior, el sistema sí evita crear el registro duplicado, pero lo hace devolviendo un error genérico de base de datos ("Duplicate entry...") envuelto en un 500, en vez de un mensaje amigable de negocio.
**Evidencias**:
```
[HTL-CLI-002] status real al duplicar documentNumber: 500 { statusCode: 500, message: 'Internal server error' }
```

### HTL-CLI-003 — Correo duplicado
**Datos**: intentar registrar un cliente nuevo usando el correo `maria.perez@example.com`, que ya pertenece a otro cliente.
**Resultado esperado**: mismo comportamiento esperado que con el documento: debería rechazarse con un mensaje claro.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del mensaje de error de correo duplicado aquí]

### HTL-CLI-004 — Correo con formato inválido enviado directo a la API (ejecutado por automatización)
En el formulario web, el campo de correo usa el tipo `email` del navegador, que ya bloquea formatos obviamente incorrectos. Pero eso es una barrera del lado del cliente, fácil de saltarse. Mandamos un correo sin arroba (`correo-no-valido-sin-arroba`) directo a la API para ver si el backend lo detecta por su cuenta.

**Resultado esperado**: el backend debería rechazar el correo mal formado.
**Resultado obtenido**: **No pasó.** El cliente se creó sin ningún problema, con el correo inválido guardado tal cual. Revisando el código encontramos la causa exacta: el campo de correo en el formulario de creación está validado como "cualquier texto", no como "un correo válido" (`backend/src/customers/dtos/create.customer.dto.ts`, líneas 33-35), y de todos modos esa validación tampoco se estaría aplicando por lo explicado al inicio del documento.
**Evidencias**:
```
[HTL-CLI-004] status real con email inválido: 201 { documentNumber: 'QA-1785282085407', email: 'correo-no-valido-sin-arroba', ... id: 26 }
```
*(el registro de prueba se borró automáticamente al terminar la ejecución de la suite)*

### HTL-CLI-005 — Teléfono con letras
**Pasos**: llenar el campo de teléfono con texto no numérico y guardar.
**Resultado esperado**: el sistema debería rechazar el formato o forzar solo números.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del campo con datos inválidos y el resultado aquí]

> No encontramos ninguna validación de formato de teléfono, ni en la pantalla ni en el backend, así que es probable que este caso no pase.

### HTL-CLI-006 — Campos obligatorios vacíos
**Pasos**: dejar documento, nombre, apellido, teléfono o correo vacíos y presionar guardar.
**Resultado esperado**: el sistema no debe permitir guardar y debe señalar los campos faltantes.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario con campos vacíos y la validación visible aquí]

### HTL-CLI-007 — Cliente inactivo no debe aparecer en los buscadores
**Precondiciones**: un cliente marcado como inactivo.
**Pasos**: buscarlo desde el formulario de nueva reserva y también desde el buscador del cuestionario.
**Resultado esperado**: no debería aparecer en ninguno de los dos lugares.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la búsqueda sin resultados para el cliente inactivo aquí]

---

# Módulo HTL-HAB — Habitaciones

Aquí se administra el inventario físico del hotel: cuántas habitaciones hay, en qué piso, de qué tipo, a qué precio y en qué estado (disponible, ocupada, en limpieza, etc.). El estado de la habitación es clave porque de él dependen las reservas y el check-in/check-out.

**Condiciones de prueba**: solo Administrador y Mantenimiento acceden a esta pantalla; el número de habitación debe ser único; el precio tiene que ser mayor que cero; los cambios de estado deberían seguir el flujo normal del negocio (por ejemplo, no se debería poder "desocupar" una habitación a mano sin pasar por un check-out real).

**Escenarios**
1. Crear una habitación válida.
2. Intentar crear una habitación con un número que ya existe.
3. Intentar crear una habitación con precio negativo o en cero, directo a la API.
4. Cambiar el estado de una habitación a un valor que no le corresponde en ese momento del flujo.
5. Confirmar que después de un check-out la habitación pase automáticamente a estado de limpieza.

### HTL-HAB-001 — Crear habitación válida
**Datos**: número `301`, piso tercero, tipo doble, precio RD$ 3,500.
**Pasos**: ir a Habitaciones, "Nueva habitación", llenar y guardar.
**Resultado esperado**: la habitación se crea con estado inicial "disponible".
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario lleno aquí] [imagen de la habitación 301 en el listado aquí]

### HTL-HAB-002 — Número de habitación duplicado
**Pasos**: intentar crear otra habitación con el número 301.
**Resultado esperado**: debe rechazarse con un mensaje claro.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del mensaje de número duplicado aquí]

### HTL-HAB-003 — Precio negativo directo a la API (ejecutado por automatización)
Mandamos crear una habitación con precio -100 directo a la API, sin pasar por el formulario.

**Resultado esperado**: el sistema debía rechazarlo, ya que el campo de precio en el código está marcado como "debe ser positivo".
**Resultado obtenido**: **No pasó.** La habitación se creó sin problema con el precio negativo guardado tal cual. Otra vez, la causa es que la regla "debe ser positivo" existe en el código pero nunca se ejecuta porque falta activar la validación automática.
**Evidencias**:
```
[HTL-HAB-003] status real con precio negativo: 201 { number: 9049, price: -100, status: 'DISPONIBLE', id: 24, ... }
```

### HTL-HAB-004 — Cambio de estado no permitido
**Precondiciones**: una habitación ocupada.
**Pasos**: intentar cambiarla a "disponible" directamente, sin pasar por el check-out.
**Resultado esperado**: el sistema debería impedirlo o al menos advertir que hay una reserva activa.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de cambio de estado y su resultado aquí]

### HTL-HAB-005 — Cambio automático a limpieza tras el check-out
**Precondiciones**: una reserva con check-in ya realizado.
**Pasos**: hacer el check-out de esa reserva y revisar el estado de la habitación y el módulo de mantenimiento.
**Resultado esperado**: la habitación debe pasar a estado "limpieza" y debe crearse automáticamente una tarea de limpieza para esa habitación.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la habitación en estado limpieza aquí] [imagen de la tarea de limpieza creada aquí]

---

# Módulo HTL-CUE — Cuestionario de Preferencias del Cliente

Este es el módulo que mencionaste que probablemente iba a dar problemas, y después de revisar el código y probarlo, la sospecha se confirmó. La idea del cuestionario es que el personal registre qué prefiere un cliente (rango de precio, amenidades) para luego generarle una oferta a la medida. El problema es que el flujo pensado para que el propio huésped lo llene desde su casa está roto en varios puntos, y además el backend no valida casi nada de lo que se guarda aquí.

**Condiciones de prueba**: solo Administrador, Gerente y Recepcionista entran a esta pantalla; los datos del cliente se cargan solos al seleccionarlo, no se escriben a mano; el nivel de importancia de cada preferencia debe estar entre 1 y 5; el botón de guardar debe funcionar.

**Escenarios**
1. Registrar preferencias completas para un cliente existente.
2. Intentar guardar sin haber seleccionado ningún cliente.
3. Poner un rango de precio invertido (el mínimo más alto que el máximo).
4. Mandar un nivel de importancia fuera del rango 1-5 directo a la API.
5. Intentar consultar las preferencias de un cliente sin haber iniciado sesión.
6. Revisar si el enlace que se le manda al cliente por correo realmente funciona para él.
7. Generar una oferta a partir de las preferencias guardadas.

### HTL-CUE-001 — Registrar preferencias completas
**Precondiciones**: sesión Recepcionista; cliente María Pérez activo.
**Datos**: rango de precio RD$ 3,000 a RD$ 5,000, importancia del precio 4, amenidades "vista al mar" (importancia 5) y "cama king" (importancia 3).
**Pasos**: ir a Cuestionario, buscar y seleccionar al cliente, verificar que sus datos se autocompleten, marcar el rango de precio y las amenidades con sus niveles, guardar.
**Resultado esperado**: el guardado responde exitoso y los datos quedan almacenados para ese cliente.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del cuestionario con el cliente seleccionado y todos los campos llenos aquí] [imagen de la confirmación de guardado aquí]

### HTL-CUE-002 — Guardar sin seleccionar cliente
**Pasos**: entrar al cuestionario sin usar el buscador de clientes y tratar de guardar de todas formas.
**Resultado esperado**: debería impedirse el guardado, avisando que falta el cliente.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de guardar sin cliente seleccionado aquí]

### HTL-CUE-003 — Rango de precio invertido
**Datos**: precio mínimo RD$ 6,000, precio máximo RD$ 3,000.
**Pasos**: seleccionar ese rango invertido y guardar.
**Resultado esperado**: debería rechazarse o corregirse automáticamente.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del rango invertido y el resultado obtenido aquí]

> Revisando el servicio que guarda las preferencias no encontramos ninguna comprobación de que el mínimo sea menor que el máximo, así que es probable que este caso no pase.

### HTL-CUE-004 — Nivel de importancia fuera de rango, directo a la API (ejecutado por automatización)
Mandamos guardar preferencias con un nivel de importancia de 9, cuando la escala del sistema va de 1 a 5.

**Resultado esperado**: el backend debería rechazar el valor fuera de rango.
**Resultado obtenido**: **No pasó.** El sistema guardó el 9 sin ningún problema. La razón es que el endpoint que guarda las preferencias recibe los datos "en crudo", sin ningún tipo de validación de estructura ni de rango (`backend/src/preferences/preferences.controller.ts`); lo único que sí revisa el servicio es que se haya mandado un cliente válido, nada más.
**Evidencias**:
```
[HTL-CUE-004] status real con weight_level=9: 201 { success: true, message: 'Preferencias guardadas exitosamente' }
```

### HTL-CUE-005 — Consultar preferencias sin haber iniciado sesión (ejecutado por automatización)
Este es probablemente el hallazgo más serio de todo el documento. Llamamos directamente al endpoint que devuelve las preferencias de un cliente, sin mandar ningún token de sesión, como si fuéramos cualquier persona con acceso a la red del hotel.

**Resultado esperado**: el sistema debería rechazar la petición por falta de autenticación.
**Resultado obtenido**: **No pasó — y es un hallazgo de seguridad real, no solo teórico.** El sistema respondió con éxito y devolvió las preferencias completas del cliente (rango de precio, amenidades, todo) sin pedir ninguna credencial. Esto significa que, tal como está hoy, cualquiera que conozca o adivine el identificador de un cliente puede leer —y por el mismo motivo, probablemente también sobrescribir— sus preferencias sin haber iniciado sesión en el sistema.
**Evidencias**:
```
[HTL-CUE-005] status real sin token de auth: 200 { configuration: { weight_level: 9, min_cost: '1000.00', max_cost: '3000.00' }, amenities: [] }
```

### HTL-CUE-006 — El enlace del cuestionario enviado por correo
**Pasos**: generar el correo automático que incluye el enlace al cuestionario (se dispara, por ejemplo, al crear una reserva) y tratar de abrirlo desde un dispositivo fuera de la red del hotel, simulando ser el huésped real.
**Resultado esperado**: el huésped debería poder abrir el cuestionario y llenarlo sin necesitar una cuenta de personal del hotel.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del correo recibido con el enlace aquí] [imagen del error al abrir el enlace desde fuera de la red del hotel aquí]

> Este caso ya se puede dar por adelantado como "No pasó" con solo leer el código: el enlace que se manda apunta a `http://127.0.0.1:5500/...`, que es la dirección de la propia computadora de quien genera el correo, no una dirección pública del hotel. Un cliente real que reciba ese correo y haga clic no va a poder entrar nunca, porque esa dirección no existe fuera de esa máquina. Además, el enlace no incluye ningún dato que identifique al cliente, y la página de cuestionario está protegida para que solo entre personal del hotel — así que aunque la dirección funcionara, un huésped normal no podría pasar la pantalla de login. Vale la pena ejecutar este caso igual y guardar la captura del correo real, como evidencia formal para el reporte.

### HTL-CUE-007 — Generar oferta a partir de las preferencias
**Precondiciones**: preferencias ya guardadas para un cliente.
**Pasos**: desde el cuestionario guardado, presionar "Generar oferta" y revisar el resultado en el módulo de ofertas.
**Resultado esperado**: se genera una oferta coherente con el rango de precio y las amenidades marcadas.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del botón presionado aquí] [imagen de la oferta resultante en el listado aquí]

> Este paso depende de un procedimiento almacenado en la base de datos que no está versionado dentro del repositorio, así que si el resultado no es el esperado, conviene pedirle el script al equipo de base de datos para entender mejor la lógica antes de reportarlo como error.

---

# Módulo HTL-RES — Reservas (Bookings)

Este módulo cubre todo el ciclo de vida de una reserva: se crea, se confirma, el huésped hace check-in, después check-out, o en algún punto se cancela. Lo más importante que hay que proteger aquí es que nunca se pueda reservar la misma habitación dos veces para fechas que se cruzan (lo que se conoce como sobreventa u overbooking).

**Condiciones de prueba**: no debe permitirse reservar una habitación con fechas que choquen con otra reserva confirmada o pendiente; el check-in solo se permite desde una reserva confirmada, con un adelanto mayor a cero, y con la habitación en condiciones (no en limpieza ni fuera de servicio); el check-out solo se permite si ya hubo check-in; no se debe poder cancelar una reserva que ya tuvo su salida.

**Escenarios**
1. Crear una reserva válida.
2. Intentar crear una reserva con fechas que se solapan con otra ya existente.
3. Intentar crear una reserva con fecha de entrada en el pasado.
4. Confirmar una reserva que no está en el estado correcto para confirmarse.
5. Hacer check-in sin adelanto.
6. Hacer check-in en una habitación que está en limpieza o fuera de servicio.
7. Hacer check-out sin que haya habido check-in antes.
8. Cancelar una reserva que ya tuvo check-out.
9. Confirmar o cancelar una reserva usando el enlace de correo de otra persona.

### HTL-RES-001 — Crear reserva válida
**Precondiciones**: cliente y habitación disponible existentes.
**Datos**: check-in `2026-08-05`, check-out `2026-08-10`, adelanto RD$ 2,000.
**Pasos**: ir a Reservas, "Nueva reserva", seleccionar cliente y habitación, ingresar fechas y adelanto, guardar.
**Resultado esperado**: la reserva se crea en estado pendiente.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario lleno aquí] [imagen de la reserva en el listado aquí]

### HTL-RES-002 — Fechas que se solapan con otra reserva (ejecutado por automatización)
Creamos una reserva confirmada para una habitación de prueba entre el 5 y el 10 de septiembre, y luego intentamos crear una segunda reserva para la misma habitación entre el 8 y el 12 de septiembre, que se cruza con la primera.

**Resultado esperado**: la segunda reserva debía rechazarse por falta de disponibilidad.
**Resultado obtenido**: **Pasó.** El sistema rechazó la segunda reserva con un mensaje claro: "La habitación ya tiene reservas en las fechas seleccionadas." Este es uno de los pocos puntos del sistema donde la regla de negocio está bien protegida directamente en el código del servicio, sin depender de la validación automática que falta en el resto del sistema.
**Evidencias**:
```
[HTL-RES-002] status real al solapar fechas: 400 { message: 'La habitación ya tiene reservas en las fechas seleccionadas.', error: 'Bad Request', statusCode: 400 }
```

### HTL-RES-003 — Fecha de entrada en el pasado (ejecutado por automatización)
Mandamos crear una reserva con fecha de entrada del 1 de enero de 2020, muy anterior a la fecha actual.

**Resultado esperado**: el sistema debería rechazar una reserva con una fecha de entrada que ya pasó.
**Resultado obtenido**: **No pasó.** La reserva se creó sin ningún problema con esa fecha. Revisando el código, la única comprobación que hace el sistema al crear una reserva es que no se solape con otra ya existente; en ningún momento revisa si la fecha de entrada es una fecha futura.
**Evidencias**:
```
[HTL-RES-003] status real con fecha de check-in pasada: 201 { checkInDate: '2020-01-01', status: 'PENDIENTE', id: 71, ... }
```

### HTL-RES-004 — Confirmar reserva desde un estado inválido
**Precondiciones**: una reserva ya cancelada.
**Pasos**: intentar confirmarla.
**Resultado esperado**: debe rechazarse, ya que solo se puede confirmar una reserva pendiente.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de confirmación y el mensaje de error aquí]

### HTL-RES-005 — Check-in sin adelanto
**Precondiciones**: reserva confirmada sin adelanto registrado.
**Pasos**: intentar hacer el check-in.
**Resultado esperado**: debe rechazarse, exigiendo un adelanto mayor a cero.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de check-in y el mensaje de error aquí]

### HTL-RES-006 — Check-in en habitación no disponible
**Precondiciones**: reserva confirmada en una habitación que está en limpieza.
**Pasos**: intentar hacer el check-in.
**Resultado esperado**: debe rechazarse mientras la habitación no esté lista.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de check-in y el mensaje de error aquí]

### HTL-RES-007 — Check-out sin check-in previo
**Precondiciones**: reserva confirmada, pero sin check-in realizado.
**Pasos**: intentar hacer el check-out directamente.
**Resultado esperado**: debe rechazarse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de check-out y el mensaje de error aquí]

### HTL-RES-008 — Cancelar reserva que ya tuvo check-out
**Pasos**: intentar cancelar una reserva que ya está marcada como salida completada.
**Resultado esperado**: debe impedirse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de cancelación y el mensaje de error aquí]

### HTL-RES-009 — Confirmar o cancelar con el enlace de otra reserva
**Pasos**: tomar el enlace de confirmación por correo de una reserva y cambiar el número por el de otra reserva que no es la propia, luego abrirlo sin haber iniciado sesión.
**Resultado esperado**: debería pedirse algún tipo de verificación antes de confirmar o cancelar.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del enlace modificado confirmando o cancelando una reserva ajena aquí]

> Al igual que con el cuestionario, este caso se puede anticipar leyendo el código: el enlace que se manda por correo para confirmar o cancelar una reserva no lleva ninguna firma ni fecha de vencimiento, solo el número de la reserva en la dirección web. Cualquiera que tenga o adivine ese número puede confirmar o cancelar una reserva ajena sin haber iniciado sesión. Vale la pena ejecutarlo igual para tener la captura como evidencia formal.

---

# Módulo HTL-OFE — Ofertas

Cuando el hotel quiere ofrecerle un descuento a un cliente (por ejemplo, a partir de lo que dijo en el cuestionario), se genera una oferta que el cliente recibe por correo y puede aceptar o rechazar. Aquí lo más delicado es que una oferta no se pueda responder dos veces, ni aceptar si ya venció, ni generar una reserva que choque con otra.

**Condiciones de prueba**: no se debe poder aceptar una oferta que ya fue respondida antes; no se debe poder aceptar una oferta vencida; al aceptar, no debe crearse una reserva que se solape con otra ya confirmada.

**Escenarios**
1. Generar y enviar una oferta válida.
2. Intentar aceptar una oferta que ya fue respondida antes.
3. Intentar aceptar una oferta vencida.
4. Aceptar una oferta cuyas fechas chocan con una reserva ya confirmada.
5. Aceptar una oferta sin indicar fechas de estadía.
6. Simular una interrupción a mitad del proceso de aceptación, para ver si el sistema queda en un estado inconsistente.
7. Responder una oferta usando el enlace de otra persona.

### HTL-OFE-001 — Generar y enviar oferta válida
**Datos**: descuento 15%, precio RD$ 4,000, válida del 1 al 15 de agosto de 2026.
**Pasos**: ir a Ofertas, "Nueva oferta", llenar los datos, seleccionar cliente y habitación, guardar y enviar.
**Resultado esperado**: la oferta queda pendiente y se envía el correo.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario de oferta lleno aquí] [imagen del correo de oferta recibido aquí]

### HTL-OFE-002 — Aceptar oferta ya respondida
**Precondiciones**: una oferta que ya fue aceptada o rechazada antes.
**Pasos**: intentar responderla de nuevo desde el enlace de correo.
**Resultado esperado**: debe rechazarse indicando que ya fue procesada.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del mensaje de "oferta ya procesada" aquí]

### HTL-OFE-003 — Aceptar oferta vencida
**Precondiciones**: una oferta cuya fecha de vencimiento ya pasó.
**Pasos**: intentar aceptarla desde el enlace de correo.
**Resultado esperado**: debería rechazarse por estar vencida.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de aceptación de una oferta vencida aquí]

> No encontramos en el código ninguna comprobación de que la fecha de vencimiento no haya pasado, así que es probable que este caso no pase.

### HTL-OFE-004 — Aceptar oferta con fechas que chocan con otra reserva
**Precondiciones**: una reserva confirmada en fechas cercanas para la misma habitación.
**Pasos**: aceptar la oferta indicando fechas que se cruzan con esa reserva.
**Resultado esperado**: debe rechazarse por falta de disponibilidad.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del mensaje de habitación no disponible al aceptar la oferta aquí]

### HTL-OFE-005 — Aceptar oferta sin fechas
**Pasos**: intentar aceptar la oferta sin indicar fechas de estadía.
**Resultado esperado**: debería exigir las fechas antes de continuar.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de aceptación sin fechas aquí]

### HTL-OFE-006 — Interrupción a mitad del proceso de aceptación
**Pasos**: iniciar la aceptación de una oferta y forzar un corte (por ejemplo, apagando el backend un momento) justo después de que cambie el estado pero antes de que se termine de crear la reserva.
**Resultado esperado**: el sistema debería revertir el estado de la oferta a "pendiente" de forma consistente, sin quedar a medias.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del estado de la oferta en base de datos tras la interrupción aquí]

> Revisando el código, la reversión de estado se hace "a mano" con una actualización directa, no dentro de una transacción real de base de datos. Si el proceso se corta justo en ese punto, es un candidato real a quedar en un estado raro, así que vale la pena probarlo con calma.

### HTL-OFE-007 — Responder oferta con el enlace de otra persona
**Pasos**: cambiar el identificador de la oferta en la URL del correo por el de otra oferta que no es la propia.
**Resultado esperado**: debería pedirse alguna verificación de identidad.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del enlace modificado procesando una oferta ajena aquí]

> Mismo patrón que con las reservas: el enlace no lleva firma ni vencimiento, solo el número de la oferta.

---

# Módulo HTL-FAC — Facturación

Cuando un huésped termina su estadía, se le genera una factura con el costo de la habitación más lo que haya consumido. Lo que hay que confirmar aquí es que la factura siempre esté ligada a una reserva y a un cliente reales, y que el total refleje lo que realmente se cobró.

**Condiciones de prueba**: toda factura debe estar ligada a una reserva y a un cliente, no debería poder crearse "huérfana"; el total debe calcularse bien; el estado de pago debe reflejar la realidad.

**Escenarios**
1. Generar una factura válida a partir de una reserva con consumos.
2. Intentar crear una factura vacía directo a la API.
3. Marcar una factura como pagada.
4. Confirmar que una factura deshabilitada no aparezca en los reportes.

### HTL-FAC-001 — Generar factura válida
**Precondiciones**: una reserva con check-out ya hecho y consumos registrados.
**Pasos**: ir a Facturación desde la reserva finalizada, generar la factura.
**Resultado esperado**: la factura sale con el total correcto (estadía más consumos) y queda pendiente de pago.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la factura generada con el desglose de montos aquí]

### HTL-FAC-002 — Factura vacía directo a la API
**Pasos**: mandar una petición de crear factura sin ningún dato (sin reserva, sin cliente, sin ítems).
**Resultado esperado**: debería rechazarse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la petición y respuesta en Postman aquí]

> Revisando el DTO de creación de facturas, todos los campos están marcados como opcionales, así que probablemente el sistema sí permita crear una factura vacía si no hay una regla adicional en el servicio que lo impida; conviene revisarlo antes de dar por sentado el resultado.

### HTL-FAC-003 — Marcar factura como pagada
**Precondiciones**: factura pendiente.
**Pasos**: registrar el pago completo.
**Resultado esperado**: el estado cambia a pagada y se refleja en los reportes.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la factura marcada como pagada aquí]

### HTL-FAC-004 — Factura deshabilitada fuera de los reportes
**Precondiciones**: una factura marcada como deshabilitada.
**Pasos**: generar el reporte del período correspondiente.
**Resultado esperado**: esa factura no debe sumarse en los totales del reporte.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del reporte generado sin incluir la factura deshabilitada aquí]

---

# Módulo HTL-CON — Consumos (Venta de productos y servicios)

Este módulo cubre lo que un huésped consume durante su estadía (agua, snacks, servicios) y que después termina reflejado en su factura final. Lo importante es que cada consumo quede ligado a una reserva real y que no se pueda vender más de lo que hay en inventario.

**Condiciones de prueba**: todo consumo debe estar ligado a una reserva y a un producto existentes; el subtotal debe calcularse bien; no debería poder venderse más cantidad de la que hay disponible.

**Escenarios**
1. Registrar un consumo válido.
2. Intentar vender más cantidad de la que hay en inventario.
3. Intentar registrar un consumo en una reserva que ya está cerrada.
4. Cambiar un consumo de pendiente a pagado.

### HTL-CON-001 — Registrar consumo válido
**Precondiciones**: reserva con check-in ya hecho; producto con stock disponible.
**Datos**: producto agua embotellada, cantidad 2, precio unitario RD$ 100.
**Pasos**: desde la habitación ocupada, seleccionar el producto y la cantidad, confirmar la venta.
**Resultado esperado**: el consumo se registra con el subtotal correcto (RD$ 200) y queda pendiente de pago.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario de venta lleno aquí] [imagen del consumo reflejado en la cuenta de la habitación aquí]

### HTL-CON-002 — Vender más de lo que hay en inventario
**Precondiciones**: un producto con solo 5 unidades disponibles.
**Pasos**: intentar vender 10.
**Resultado esperado**: debería rechazarse o avisar que no hay stock suficiente.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de venta y el mensaje resultante aquí]

> No encontramos ningún control de inventario negativo en el código revisado; vale la pena confirmarlo directamente en el servicio de consumos antes de calificar este caso.

### HTL-CON-003 — Consumo en una reserva ya cerrada
**Precondiciones**: reserva ya con check-out hecho.
**Pasos**: intentar registrar un consumo nuevo para esa reserva.
**Resultado esperado**: debe impedirse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de venta sobre una reserva cerrada aquí]

### HTL-CON-004 — Cambiar consumo de pendiente a pagado
**Pasos**: registrar el pago de un consumo pendiente.
**Resultado esperado**: el estado cambia a pagado y se refleja en la factura final.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del consumo marcado como pagado aquí]

---

# Módulo HTL-PRO — Productos

Es el catálogo de todo lo que se puede vender a un huésped: productos físicos y servicios. Hay que confirmar que los datos básicos (nombre, precio, cantidad) estén bien validados y que un producto desactivado deje de estar disponible para la venta.

**Condiciones de prueba**: solo el Administrador entra a esta pantalla; nombre, precio unitario y cantidad son obligatorios, y precio y cantidad deben ser positivos; la categoría solo puede ser "producto" o "servicio".

**Escenarios**
1. Crear un producto válido.
2. Crear un producto con precio o cantidad negativa o en cero.
3. Crear un producto sin nombre.
4. Filtrar el listado usando la opción "Todos".
5. Desactivar un producto y confirmar que ya no se pueda vender.

### HTL-PRO-001 — Crear producto válido
**Datos**: nombre `Refresco Cola`, categoría producto, precio unitario RD$ 80, cantidad 50.
**Pasos**: ir a Productos, "Nuevo producto", llenar y guardar.
**Resultado esperado**: el producto se crea y aparece activo en el listado.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario lleno aquí] [imagen del producto en el listado aquí]

### HTL-PRO-002 — Precio o cantidad negativa
**Datos**: precio -50, cantidad 0.
**Pasos**: intentar guardar el producto con esos valores.
**Resultado esperado**: debería rechazarse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario con valores negativos y el resultado aquí]

### HTL-PRO-003 — Producto sin nombre
**Pasos**: dejar el campo de nombre vacío y guardar.
**Resultado esperado**: no debe permitir guardar sin nombre.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del campo vacío con el mensaje de validación aquí]

### HTL-PRO-004 — Filtro "Todos"
**Pasos**: aplicar el filtro de categoría "Todos" en el listado.
**Resultado esperado**: deben listarse tanto productos como servicios, sin excepción.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del listado completo con el filtro aplicado aquí]

### HTL-PRO-005 — Desactivar producto
**Pasos**: marcar el producto como inactivo, luego intentar venderlo.
**Resultado esperado**: no debe aparecer disponible para la venta.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del producto inactivo aquí] [imagen del listado de venta sin ese producto aquí]

---

# Módulo HTL-MAN — Mantenimiento / Limpieza

Aquí se gestionan las tareas de limpieza y mantenimiento de las habitaciones. Una parte importante es que estas tareas se creen solas cuando corresponde (por ejemplo, al hacer un check-out) y no dependan de que alguien se acuerde de crearlas a mano.

**Condiciones de prueba**: solo Administrador y Mantenimiento entran aquí; habitación y tipo de tarea son obligatorios; cada check-out debe generar automáticamente una tarea de limpieza para la habitación correcta, ni una de más ni una de menos.

**Escenarios**
1. Crear una tarea de mantenimiento manual.
2. Confirmar la creación automática de una tarea de limpieza tras un check-out.
3. Asignar una tarea a alguien que no tiene el rol de Mantenimiento.
4. Completar una tarea y ver que la habitación cambie de estado.
5. Intentar crear una tarea sin habitación o sin tipo.

### HTL-MAN-001 — Crear tarea de mantenimiento manual
**Datos**: habitación 301, tipo mantenimiento, prioridad alta, descripción "aire acondicionado no enfría".
**Pasos**: ir a Mantenimiento, "Nueva tarea", llenar y guardar.
**Resultado esperado**: la tarea se crea pendiente y aparece en el listado.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario lleno aquí] [imagen de la tarea en el listado aquí]

### HTL-MAN-002 — Tarea automática de limpieza tras check-out
Este caso es el mismo que HTL-HAB-005, visto desde el lado de Mantenimiento: se hace un check-out y se revisa que aparezca exactamente una tarea nueva de limpieza para esa habitación, sin duplicados.
**Resultado esperado**: exactamente una tarea de limpieza nueva por cada check-out.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del listado de tareas mostrando solo una tarea generada aquí]

### HTL-MAN-003 — Asignar tarea a un rol que no corresponde
**Pasos**: intentar asignar una tarea de limpieza a alguien con rol de Recepcionista.
**Resultado esperado**: debería advertirse o impedirse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del intento de asignación y su resultado aquí]

### HTL-MAN-004 — Completar tarea y ver el cambio de estado de la habitación
**Precondiciones**: tarea de limpieza en curso para una habitación.
**Pasos**: marcar la tarea como completada, revisar el estado de la habitación.
**Resultado esperado**: la tarea queda completada y la habitación vuelve a estar disponible.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen de la tarea completada aquí] [imagen de la habitación disponible de nuevo aquí]

### HTL-MAN-005 — Tarea sin habitación o sin tipo
**Pasos**: intentar guardar una tarea sin seleccionar habitación, y luego sin seleccionar tipo.
**Resultado esperado**: no debería permitirse en ninguno de los dos casos.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del formulario incompleto con el mensaje de validación aquí]

---

# Módulo HTL-REP — Reportes

Este módulo genera reportes en PDF y Excel a partir de la información del hotel (ventas, reservas, ocupación). Lo importante es que los filtros funcionen bien y que la exportación no falle.

**Condiciones de prueba**: solo Administrador y Gerente entran aquí; el filtro "Todos" debe incluir todo, sin dejar nada afuera; la exportación a PDF y Excel debe funcionar sin errores.

**Escenarios**
1. Generar un reporte con el filtro de categoría en "Todos".
2. Generar un reporte filtrado por un rango de fechas.
3. Exportar el reporte a PDF.
4. Exportar el reporte a Excel.
5. Intentar acceder a los reportes con un rol que no debería tener acceso.

### HTL-REP-001 — Reporte con filtro "Todos"
**Pasos**: ir a Reportes, elegir el filtro "Todos", generar.
**Resultado esperado**: el reporte incluye todos los registros del período, sin omitir ninguna categoría.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del reporte generado con el filtro Todos aquí]

### HTL-REP-002 — Reporte filtrado por fechas
**Datos**: desde el 1 hasta el 28 de julio de 2026.
**Pasos**: aplicar el rango de fechas y generar el reporte.
**Resultado esperado**: solo deben aparecer los registros dentro de ese rango.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del reporte con el rango de fechas aplicado aquí]

### HTL-REP-003 — Exportar a PDF
**Pasos**: generar el reporte y exportarlo a PDF.
**Resultado esperado**: se descarga un PDF legible con los datos correctos.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del PDF exportado aquí]

### HTL-REP-004 — Exportar a Excel
**Pasos**: generar el reporte y exportarlo a Excel.
**Resultado esperado**: se descarga un Excel con los datos y columnas correctas.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del Excel exportado aquí]

### HTL-REP-005 — Acceso con un rol no autorizado
**Precondiciones**: sesión Recepcionista.
**Pasos**: intentar entrar a la pantalla de reportes por URL directa, y también llamar al endpoint de reportes directo desde la API.
**Resultado esperado**: ambos intentos deberían bloquearse.
**Resultado obtenido**: _(Pasó / No pasó / Bloqueado / No corrió)_
**Evidencias**: [imagen del bloqueo en la pantalla aquí] [imagen de la respuesta de la API aquí]

> Este caso probablemente falle a nivel de API, ya que —como se explicó al inicio— casi ningún endpoint revisa el rol de quien hace la petición.

---

# Lo que ya sabemos con certeza (resumen de lo automatizado)

De los 12 casos que se corrieron de verdad contra el sistema, 8 fallaron o fallaron parcialmente:

| Caso | Módulo | Resultado |
|---|---|---|
| HTL-AUTH-002/003 | Login | Pasó |
| HTL-AUTH-004 | Login | Pasó |
| HTL-USR-002 | Usuarios | No pasó del todo (rechaza el duplicado, pero con error crudo) |
| HTL-USR-006 | Usuarios | No pasó (rol inválido se cae con error 500) |
| HTL-CLI-002 | Clientes | No pasó del todo (mismo patrón que usuarios) |
| HTL-CLI-004 | Clientes | No pasó (correo inválido se guarda igual) |
| HTL-HAB-003 | Habitaciones | No pasó (precio negativo se guarda igual) |
| HTL-RES-002 | Reservas | Pasó (overbooking bien bloqueado) |
| HTL-RES-003 | Reservas | No pasó (fecha pasada se acepta) |
| HTL-CUE-004 | Cuestionario | No pasó (nivel fuera de rango se acepta) |
| HTL-CUE-005 | Cuestionario | No pasó (endpoint accesible sin sesión) |

El patrón se repite una y otra vez: todo lo que depende de que el backend valide los datos que le llegan —formato de correo, precio positivo, rango de un número, rol válido— falla, porque esa validación está escrita en el código pero nunca se activa. En cambio, las dos reglas que sí pasaron (el bloqueo de cuenta y el control de fechas solapadas en reservas) tienen algo en común: están programadas explícitamente dentro del servicio, como código que se ejecuta sí o sí, en vez de depender de un mecanismo automático que nadie encendió. Esa es, en el fondo, la lección de este documento: el sistema funciona cuando alguien programó la regla a mano, y falla cuando confió en que la validación automática la iba a cubrir.

---

# Pruebas de mutación

El proyecto usa Jest como motor de pruebas (no Vitest) tanto en el backend como en el frontend. El equivalente de Vitest para este caso es **Stryker Mutator**, con el paquete `@stryker-mutator/jest-runner`. La idea de una prueba de mutación es sencilla: la herramienta cambia pequeños detalles del código a propósito (por ejemplo, cambia un `>` por un `>=`, o quita una condición) y corre las pruebas existentes contra ese código "dañado". Si las pruebas siguen pasando igual, es una señal de que esas pruebas en realidad no estaban comprobando nada útil en ese punto.

Antes de poder usar Stryker en este proyecto hay que resolver primero el problema explicado al inicio del documento: si `npm test` no corre, Stryker tampoco va a poder correr las pruebas de referencia que necesita. Una vez resuelto eso, tendría sentido apuntarlo primero a los archivos de reservas y de autenticación, que son los dos lugares donde vive la lógica de negocio más importante escrita directamente en el código (no en un DTO), y por lo tanto los más valiosos de revisar con esta técnica. El frontend, por su parte, no tiene ninguna prueba unitaria real escrita todavía, así que ahí habría que empezar por escribir pruebas base antes de pensar en mutación.

---

# Plan de Pruebas

**Objetivo**: comprobar que los módulos del sistema —login, usuarios, clientes, habitaciones, cuestionario, reservas, ofertas, facturación, consumos, productos, mantenimiento y reportes— cumplan lo que se espera de ellos según su rol, respeten las reglas de negocio sobre disponibilidad y estados, y validen correctamente lo que reciben, tanto desde la pantalla como cuando alguien le habla directo a la API.

**Alcance y relación entre módulos**: se cubren los 12 módulos de este documento. Vale la pena aclarar que Cuestionario, Ofertas y Reservas no son independientes entre sí: el cuestionario alimenta la generación de ofertas, y aceptar una oferta termina creando una reserva. Por eso conviene probar esos tres módulos en el mismo ciclo y en ese orden, porque un error en uno se puede arrastrar a los otros dos sin que sea obvio de dónde vino.

**Qué queda fuera de este ciclo**: no se prueba el detalle exacto del algoritmo que asigna habitaciones al generar una oferta, porque vive en un procedimiento de base de datos que no está guardado como parte del código del proyecto. Tampoco se incluyen pruebas de carga ni de muchos usuarios usando el sistema al mismo tiempo. Y no se prueba la infraestructura de correo en sí (el servidor SMTP); solo se valida que el sistema dispare el envío y que el contenido y el enlace generado sean los correctos.

**Ambientes**: las pruebas se ejecutan primero en desarrollo local para depurar, después formalmente en un ambiente de QA con una base de datos separada que imite la configuración real, y solo se hace una verificación rápida de humo en producción después de cada despliegue, sin correr el ciclo completo ahí.

**Para empezar a probar** (criterio de entrada) hace falta que el ambiente de QA tenga al menos un usuario de cada rol, algunos clientes activos y uno inactivo, varias habitaciones en distintos estados, y que tanto el backend como el frontend arranquen sin errores.

**Para cerrar el ciclo** (criterio de salida) todos los casos de este documento deben tener un resultado registrado con su evidencia correspondiente, y cualquier hallazgo marcado como grave debe haber sido reportado formalmente al equipo de desarrollo, esté o no corregido todavía.

**Qué se espera encontrar**: con base en lo que ya se probó de verdad, es razonable esperar que los módulos donde la regla de negocio vive directamente en el código del servicio (el bloqueo de cuenta, el control de solapamiento de reservas) sigan funcionando bien en las pruebas manuales. En cambio, se espera que Cuestionario, Habitaciones, Clientes y Usuarios sigan mostrando fallas cuando se les manda información inválida directo a la API, mientras no se active la validación automática de datos en el backend. Y como los módulos que todavía no se probaron por automatización (Ofertas, Facturación, Consumos, Productos, Mantenimiento, Reportes) comparten exactamente la misma arquitectura y la misma falta de validación, lo más probable es que muestren el mismo tipo de problemas cuando se les someta a las mismas pruebas.
