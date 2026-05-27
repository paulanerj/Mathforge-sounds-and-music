────────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import CombineGridGame from "../games/combine-grid/CombineGridGame";
import SpeedGridGame from "../games/speed-grid/SpeedGridGame";
import MathMagicGame from "../games/math-magic/MathMagicGame";
import { GameErrorBoundary } from "../games/combine-grid/components/GameErrorBoundary";
type GameType = "splash" | "combine-grid" | "speed-grid" | "math-magic";

export default function GameSelector() {
  const [game, setGame] = useState<GameType>("splash");

  if (game === "splash") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#141416",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 4,
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          CombineGrid
        </div>

        <button
          onClick={() => setGame("combine-grid")}
          style={{
            width: 240,
            padding: "20px 0",
            borderRadius: 20,
            border: "none",
            background: "#e67e22",
            color: "#fff",
            fontSize: 17,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 1,
            boxShadow: "0 6px 0 rgba(154,52,18,1)",
            marginBottom: 10
          }}
        >
          CombineGrid
        </button>

        <button
          onClick={() => setGame("speed-grid")}
          style={{
            width: 240,
            padding: "16px 0",
            borderRadius: 20,
            border: "2px solid #5865f2",
            background: "transparent",
            color: "#5865f2",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          SpeedGrid (Proof)
        </button>
        
        <button
          onClick={() => setGame("math-magic")}
          style={{
            width: 240,
            padding: "16px 0",
            borderRadius: 20,
            border: "2px solid #8ec5ae",
            background: "transparent",
            color: "#8ec5ae",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
            marginTop: 10
          }}
        >
          Matchgrid
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {game === "combine-grid" && (
        <GameErrorBoundary>
          <CombineGridGame onBack={() => setGame("splash")} />
        </GameErrorBoundary>
      )}
      {game === "speed-grid" && (
        <SpeedGridGame onBack={() => setGame("splash")} />
      )}
      {game === "math-magic" && (
        <MathMagicGame onBack={() => setGame("splash")} />
      )}
    </div>
  );
}
────────────────────────────────────────────────────────────────────────────────
