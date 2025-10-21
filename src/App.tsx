import React, { useEffect } from "react";
import { LevelSelector } from "./level_selector";
import { BrowserRouter, Route, Routes } from "react-router";
import { LevelPage } from "./LevelPage";

export default function App() {
useEffect(() => {
        console.log('Interactive Graph Tool - Game Mode');

    console.log('Application initialized - Select a level to begin');
}, [])
  return (
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<LevelSelector/>}/>
    <Route path="/level/:levelId/" element={<LevelPage/>} />
    </Routes>
    </BrowserRouter>
  );
}
