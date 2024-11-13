export function validateFields() {
    validateUsername();
    validatePassword();
}

function validateUsername() {
    const username = document.getElementById('username');
    username.setCustomValidity('El nombre de usuario no puede estar vacío');
    // username.setCustomValidity("El nombre de usuario debe tener entre 3 y 15 caracteres");

    username.addEventListener('input', () => {
        const value = username.value;

        // if (value.length < 3 || value.length > 15) {
        //     username.setCustomValidity("La longitud debe tener entre 3 y 15 caracteres");
        // } else if (!/^[A-Za-z0-9._]+$/.test(value)) {
        //     username.setCustomValidity("Solo se permiten letras, números, guiones bajos (_) y puntos (.)")
        // } else {
        //     username.setCustomValidity("");
        // }

        if(value.length > 0) {
            username.setCustomValidity('');
        }
    });
}

function validatePassword() {
    const password = document.getElementById('password');
    password.setCustomValidity('La contraseña no puede estar vacía');

    password.addEventListener('input', () => {
        const value = password.value;

        // if (value.length < 8) {
        //     password.setCustomValidity("La longitud debe tener al menos 8 caracteres");
        // } else if (value.length > 255) {
        //     password.setCustomValidity("La longitud debe tener entre 8 y 255 caracteres");
        // } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(value)) {
        //     password.setCustomValidity("Debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial(@, $, !, %, *, ?, &)")
        // } else {
        //     password.setCustomValidity("");
        // }

        if(value.length > 0) {
            password.setCustomValidity("");
        }
    });
}
