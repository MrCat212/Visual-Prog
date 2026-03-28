import React from "react";
import { createRoot } from "react-dom/client";
import Lab7 from "./lab7";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Элемент #root не найден");
}

createRoot(root).render(
  <React.StrictMode>
    <Lab7 />
  </React.StrictMode>,
);
