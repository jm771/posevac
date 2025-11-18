import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Level, WORLDS, WorldMap } from "../levels";
import { NotNull } from "../util";

function LevelCard({ level }: { level: Level }) {
  const navigate = useNavigate();
  return (
    <div className="level-card" data-level-id={level.id}>
      <h3>{level.name}</h3>
      <p>{level.description}</p>
      <button
        className="play-button"
        onClick={() => navigate(`/level/${level.id}`)}
      >
        Play
      </button>
    </div>
  );
}

export function LevelSelector() {
  const [selectedWorldIdx, setSelectedWorldIdx] = useState(0);
  console.log(selectedWorldIdx, WORLDS);
  const posMod =
    ((selectedWorldIdx % WORLDS.length) + WORLDS.length) % WORLDS.length;
  const world = WORLDS[posMod];
  const levels = NotNull(WorldMap.get(world.key));

  return (
    <>
      <div className="world-header">
        <div className="world-info">
          <h1 className="world-title">{world.title}</h1>
          <p className="world-description">{world.descrption}</p>
        </div>
        <div className="world-navigation">
          <button
            onClick={() => setSelectedWorldIdx((x) => x - 1)}
            className="world-nav-arrow"
            aria-label="Previous world"
          >
            ◄
          </button>
          <span className="world-counter">
            {posMod + 1} / {WORLDS.length}
          </span>
          <button
            onClick={() => setSelectedWorldIdx((x) => x + 1)}
            className="world-nav-arrow"
            aria-label="Next world"
          >
            ►
          </button>
        </div>
      </div>
      <div className="levels-grid">
        {levels.map((l: Level) => (
          <LevelCard key={l.id} level={l} />
        ))}
      </div>
    </>
  );
}
