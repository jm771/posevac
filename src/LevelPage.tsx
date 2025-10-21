import React, { useEffect } from "react";
import { getLevelById } from "./levels";
import { useNavigate, useParams } from "react-router";
import { startLevel } from "./app";
import { EditorSidebar } from "./Sidebar";


export function LevelPage() {
    const { levelId } = useParams<{levelId: string}>();
    if (levelId === undefined) {
        throw Error("missing level id");
    }
    const level = getLevelById(levelId);
    console.log(level);

    useEffect(() => {const levelContext = startLevel(level); return () => levelContext.destroy();}, []);
    const navigate = useNavigate();

    return (
        <div className="container" id="graphEditor">
        <aside className="sidebar" id="sidebar">
            <div className="level-info">
                <h2 id="levelName">{level.name}</h2>
                <p id="levelDescription">{level.description}</p>
            </div>
            <h3>Components</h3>
            <EditorSidebar level={level}/>

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
                <button id="menuBtn" className="control-btn menu-btn" onClick={() => navigate(`/level/${level.id}`)}>◄ Menu</button>
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