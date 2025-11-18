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
      <div>
        <h1>{world.title}</h1>
        <h3>{world.descrption}</h3>
      </div>
      <div className="test-case-navigation">
        <button
          onClick={() => setSelectedWorldIdx((x) => x - 1)}
          className="nav-arrow"
        >
          ◄
        </button>
        <button
          onClick={() => setSelectedWorldIdx((x) => x + 1)}
          className="nav-arrow"
        >
          ►
        </button>
      </div>
      <div className="levels-grid">
        {levels.map((l: Level) => (
          <LevelCard key={l.id} level={l} />
        ))}
      </div>
    </>
  );
}
