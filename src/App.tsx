import React, { useEffect } from "react";
import { initializeLevelSelector, showLevelSelector } from "./level_selector";
import { startLevel } from "./app";

export default function App() {
useEffect(() => {
        console.log('Interactive Graph Tool - Game Mode');

    initializeLevelSelector(startLevel);
    showLevelSelector();

    console.log('Application initialized - Select a level to begin');
}, [])
  return (
    <div className="level-selector" id="levelSelector">
        <div className="level-selector-content">
            <h1>Graph Esolang</h1>
            <p className="subtitle">Programming Challenges</p>
            <div className="levels-grid" id="levelsGrid">
            </div>
        </div>
    </div>
  );
}
