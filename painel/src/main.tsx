import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilo.css";
import { App } from "./app";

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
