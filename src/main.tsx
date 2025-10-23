import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LevelSelector } from "./pages/LevelSelector";
import { BrowserRouter, Route, Routes } from "react-router";
import { LevelPage } from "./pages/LevelPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LevelSelector />} />
        <Route path="/level/:levelId/" element={<LevelPage />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
