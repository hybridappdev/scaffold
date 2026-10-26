import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Screen } from "./screen";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");

createRoot(root).render(
  <StrictMode>
    <Screen />
  </StrictMode>,
);
