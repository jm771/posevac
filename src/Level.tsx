import React from "react";
import { LEVELS } from "./levels";

type LevelParams = {
    levelId: number
}

export function Level(params : LevelParams) {
    const level = LEVELS[params.levelId]
    console.log(level);

    return (
        <div className="container" id="graphEditor">
        <aside className="sidebar" id="sidebar">
            <div className="level-info">
                <h2 id="levelName">Level Name</h2>
                <p id="levelDescription">Level description</p>
            </div>
            <h3>Components</h3>
            <div className="components-list">
            </div>

            <div className="delete-zone" id="deleteZone">
                <span>Drop here to delete</span>
            </div>
        </aside>

        <main className="canvas-container">
            <div id="cy"></div>
        </main>

        <aside className="controls-panel" id="controlsPanel">
            <h3>Animation</h3>
            <div className="controls">
                <button id="resetBtn" className="control-btn">⟲ Reset</button>
                <button id="forwardBtn" className="control-btn">► Forward</button>
                <button id="menuBtn" className="control-btn menu-btn">◄ Menu</button>
            </div>
            <h3>Graph</h3>
            <div className="controls">
                <button id="saveBtn" className="control-btn">💾 Save</button>
                <button id="loadBtn" className="control-btn">📂 Load</button>
                <input type="file" id="fileInput" accept=".json" style={{display: "none"}}/>
            </div>
        </aside>
    </div>
    )
}