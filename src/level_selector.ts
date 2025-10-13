// Level selector logic - handles level selection and navigation
import { LEVELS, Level } from './levels';

export type LevelSelectCallback = (level: Level) => void;

/**
 * Initialize the level selector UI
 */
export function initializeLevelSelector(onLevelSelect: LevelSelectCallback): void {
    const levelsGrid = document.getElementById('levelsGrid');
    if (!levelsGrid) {
        console.error('Level selector grid not found');
        return;
    }

    // Clear existing content
    levelsGrid.innerHTML = '';

    // Create a card for each level
    LEVELS.forEach((level) => {
        const card = createLevelCard(level, onLevelSelect);
        levelsGrid.appendChild(card);
    });
}

/**
 * Create a level card element
 */
function createLevelCard(level: Level, onLevelSelect: LevelSelectCallback): HTMLElement {
    const card = document.createElement('div');
    card.className = 'level-card';
    card.setAttribute('data-level-id', level.id);

    const title = document.createElement('h3');
    title.textContent = level.name;

    const description = document.createElement('p');
    description.textContent = level.description;

    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.textContent = 'Play';
    playButton.addEventListener('click', () => {
        onLevelSelect(level);
    });

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(playButton);

    return card;
}

/**
 * Show the level selector screen
 */
export function showLevelSelector(): void {
    const levelSelector = document.getElementById('levelSelector');
    const graphEditor = document.getElementById('graphEditor');

    if (levelSelector) {
        levelSelector.style.display = 'flex';
    }
    if (graphEditor) {
        graphEditor.style.display = 'none';
    }
}

/**
 * Show the graph editor screen
 */
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
