// Level selector logic - handles level selection and navigation
import React from 'react';
import { LEVELS, Level } from './levels';
import { startLevel } from './app';

function LevelCard({level}: {level: Level}) {
    return (
        <div className='level-card' data-level-id={level.id}>
            <h3>
                {level.name}
            </h3>
            <p>
                {level.description}
            </p>
            <button className='play-button' onClick={() => startLevel(level)}>Play</button>
        </div>
    )
}

export function LevelSelector() {
    return (
        <div className='levels-grid'>
            {LEVELS.map((l) => (<LevelCard key={l.id} level={l}/>))}
        </div>
    )
}


export function showGraphEditor(): void {
    const levelSelector = document.getElementById('levelSelector');
    const graphEditor = document.getElementById('graphEditor');

    if (levelSelector) {
        levelSelector.style.display = 'none';
    }
    if (graphEditor) {
        graphEditor.style.display = 'flex';
    }
}

/**
 * Update the level info display in the editor
 */
export function updateLevelInfo(level: Level): void {
    const levelName = document.getElementById('levelName');
    const levelDescription = document.getElementById('levelDescription');

    if (levelName) {
        levelName.textContent = level.name;
    }
    if (levelDescription) {
        levelDescription.textContent = level.description;
    }
}
