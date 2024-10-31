export function handleLoginNotification(state, username, url) {
    switch(state) {
        case 'success':
            return  Swal.fire({
                        title: 'Inicio de Sesión Exitoso',
                        text: `Bienvenido/a, ${username}. Su inicio de sesión fue exitoso. Presione 'Aceptar' para continuar.`,
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = `${url}`;
                        }
                    });
        
        case 'failed':
            return  Swal.fire({
                        title: 'Error de Inicio de Sesión',
                        text: 'No tiene autorización para logearse, sus credenciales son incorrectas. Por favor, intente nuevamente.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                    
        case 'network':
            return  Swal.fire({
                        title: 'Error de Conexión',
                        text: 'Hubo un problema al intentar conectar con el servidor. Verifique su conexión a internet o intente nuevamente más tarde.',
                        icon: 'warning',
                        confirmButtonText: 'Reintentar'
                    });
    }

}
