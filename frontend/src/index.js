import ReactDOM from "react-dom/client";
import React from "react";
import Login from "./pages/login";
import { HelmetProvider } from "react-helmet-async";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <HelmetProvider>
    <Login />
  </HelmetProvider>
);