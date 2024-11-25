import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { loginIntegration } from "../integrations/login.integration";
import "../styles/login.css";


function Login() {
  useEffect(() => {
    loginIntegration();
  }, []);

  return (
    <>
      <Helmet>
        <title>Login | Hotel Hodelpa</title>
        <meta name="description" content="Incia sección con tu cuenta" />
      </Helmet>

      <section className="login-container">
        <div className = "login-hotel-img-section">
          <img
            className="login-hotel-img"
            src="/assets/login-img.jpeg"
            alt="Logo del hotel Hodelpa"
          />
        </div>
        <div className="login-form-section">
          <h1 className="login-h1">Bienvenido</h1>
          <form>
            <input type="text" id="username" placeholder="Nombre de usuario" required />
            <input type="password" id="password" placeholder="•••••••••" required />
            <button type="submit">Ingresar</button>
            <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
          </form>
          <p>Todos los derechos reservados &copy;</p>
        </div>
      </section>
    </>
  );
}

export default Login;
