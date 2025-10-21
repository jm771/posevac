import React from 'react';
import { LEVELS, Level } from './levels';
import { useNavigate } from 'react-router';

function LevelCard({level}: {level: Level}) {
    const navigate = useNavigate();
    return (
        <div className='level-card' data-level-id={level.id}>
            <h3>
                {level.name}
            </h3>
            <p>
                {level.description}
            </p>
            <button className='play-button' onClick={() => navigate(`/level/${level.id}`)}>Play</button>
        </div>
    )
}

export function LevelSelector() {
    return (
        <div className='levels-grid'>
            {LEVELS.map((l: Level) => (<LevelCard key={l.id} level={l}/>))}
        </div>
    )
}

