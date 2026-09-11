import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilo.css";
import { App } from "./app";
import { CaixaDeErro } from "./componentes/caixa-de-erro";

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <CaixaDeErro>
      <App />
    </CaixaDeErro>
  </StrictMode>,
);
