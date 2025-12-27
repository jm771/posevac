import Cookies from "js-cookie";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router";

interface LevelCompleteOverlayProps {
  score: number;
  highScore: number;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function HiScoresBox({
  scoreType,
  name,
  score,
  scores,
}: {
  scoreType: string;
  name: string;
  score: number;
  scores: [string, number][];
}) {
  //score-highlight for highlight

  return (
    <>
      <h3 className="score-type">{scoreType}</h3>
      <div className="level-complete-scores">
        <div className="score-item">
          <span className="score-label">{name}:</span>
          <span className="score-value">{score}</span>
        </div>

        {scores.map(([name, score], idx) => (
          <div key={idx} className="score-item">
            <span className="score-label">{name}</span>
            <span className="score-value ">{score}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function LevelCompleteOverlay({
  score,
  highScore,
  onClose,
  onSubmit,
}: LevelCompleteOverlayProps) {
  const [playerName, setPlayerNameState] = useState(
    Cookies.get("name") ?? "Anon"
  );

  const setPlayerName = useCallback(
    (s: string) => {
      Cookies.set("name", s);
      setPlayerNameState(s);
    },
    [setPlayerNameState]
  );

  const navigate = useNavigate();

  const handleSubmit = () => {
    if (playerName.trim()) {
      onSubmit(playerName.trim());
    }
  };

  const handleBackToMenu = () => {
    navigate("/");
  };

  return (
    <div className="level-complete-overlay">
      <div className="level-complete-modal">
        <button className="level-complete-close" onClick={onClose}>
          ×
        </button>

        <h2 className="level-complete-title">Level Complete!</h2>

        <div className="level-complete-name-section">
          <input
            type="text"
            className="level-complete-name-input"
            placeholder="Anon"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            maxLength={20}
          />
          <button
            className="level-complete-submit-btn"
            onClick={handleSubmit}
            disabled={!playerName.trim()}
          >
            Submit
          </button>
        </div>
        <div className="hiscores">
          <span style={{ width: "50%" }}>
            <HiScoresBox
              scoreType={"Nodes"}
              name={playerName}
              score={123}
              scores={[
                ["Peter", 17],
                ["Andrew", 33],
              ]}
            ></HiScoresBox>
          </span>
          <span style={{ width: "50%" }}>
            <HiScoresBox
              scoreType={"Time"}
              name={playerName}
              score={456}
              scores={[
                ["Peter", 37],
                ["Andrew", 48],
              ]}
            ></HiScoresBox>
          </span>
        </div>
        <button className="level-complete-back-btn" onClick={handleBackToMenu}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
