/*
    * Validación del nombre de usuario.
    * Requisitos:
    * - Longitud de 3 a 15 caracteres.
    * - Solo permite letras, números, guiones bajos (_) y puntos (.).
*/   
function validateUsername() {
    const username = document.getElementById('username');
    username.setCustomValidity("El nombre de usuario debe tener entre 3 y 15 caracteres");

    username.addEventListener('input', () => {
        const value = username.value;

        const regexp = new RegExp('A-Za-z0-9._');
        if (value.length < 3 || value.length > 15) {
            username.setCustomValidity("La longitud debe tener entre 3 y 15 caracteres");
        } else if (!/^[A-Za-z0-9._]+$/.test(value)) {
            username.setCustomValidity("Solo se permiten letras, números, guiones bajos (_) y puntos (.)")
        } else {
            username.setCustomValidity("");
        }
    });
}
validateUsername();

/*
    * Clave del usuario.
    *
    * Reglas de validación:
    * - Debe tener al menos 8 caracteres y maximo 255 caracteres.
    * - Debe incluir al menos una letra minúscula.
    * - Debe incluir al menos una letra mayúscula.
    * - Debe contener al menos un número.
    * - Debe incluir al menos un carácter especial, como: @, $, !, %, *, ?, &.
    *
    * Esta validación asegura que la clave cumpla con los estándares de seguridad mínimos requeridos.
*/
function validatePassword() {
    const password = document.getElementById('password');
    password.setCustomValidity("El nombre de usuario debe tener entre 3 y 15 caracteres");

    password.addEventListener('input', () => {
        const value = password.value;

        const regexp = new RegExp('A-Za-z0-9._');
        if (value.length < 8) {
            password.setCustomValidity("La longitud debe tener al menos 8 caracteres");
        } else if (value.length > 255) {
            password.setCustomValidity("La longitud debe tener entre 8 y 255 caracteres");
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(value)) {
            password.setCustomValidity("Debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial(@, $, !, %, *, ?, &)")
        } else {
            password.setCustomValidity("");
        }
    });
}
validatePassword();
