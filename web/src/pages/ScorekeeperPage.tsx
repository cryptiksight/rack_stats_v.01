import { useEffect, useState } from "react";
import { request, useApi } from "../api";
import type { Match, Player } from "../types";

function RaceDots({ target, score }: { target: number; score: number }) {
  return (
    <div className="race-dots" aria-hidden="true">
      {Array.from({ length: target }, (_, index) => (
        <span key={index} className={index < score ? "dot filled" : "dot"} />
      ))}
    </div>
  );
}

export default function ScorekeeperPage() {
  const { data: players, loading, error } = useApi<Player[]>("/players");
  const [aId, setAId] = useState<number | "">("");
  const [bId, setBId] = useState<number | "">("");
  const [aScore, setAScore] = useState(0);
  const [bScore, setBScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Match | null>(null);

  const playerA = players?.find((player) => player.id === aId);
  const playerB = players?.find((player) => player.id === bId);

  useEffect(() => {
    setAScore(0);
    setBScore(0);
    setSaveError(null);
    setSaved(null);
  }, [aId, bId]);

  const targetA = playerA?.skill_level ?? 0;
  const targetB = playerB?.skill_level ?? 0;
  const aWon = Boolean(playerA) && aScore === targetA;
  const bWon = Boolean(playerB) && bScore === targetB;
  const bothPicked = Boolean(playerA && playerB);
  const ready = bothPicked && aWon !== bWon;

  const status = (() => {
    if (!bothPicked) return { tone: "idle", text: "Pick both players to start the race." };
    if (aId === bId) return { tone: "warn", text: "A player can't race themselves — pick a different opponent." };
    if (aWon && bWon) return { tone: "warn", text: "Only one player can reach their race first." };
    if (aScore > targetA || bScore > targetB)
      return { tone: "warn", text: "A score can't pass the player's skill level." };
    if (aWon) return { tone: "ok", text: `${playerA!.name} takes the race ${aScore}–${bScore}.` };
    if (bWon) return { tone: "ok", text: `${playerB!.name} takes the race ${bScore}–${aScore}.` };
    return {
      tone: "idle",
      text: `${playerA!.name} needs ${targetA - aScore}, ${playerB!.name} needs ${targetB - bScore}.`,
    };
  })();

  function adjust(side: "a" | "b", delta: number) {
    if (side === "a") setAScore((value) => Math.min(targetA, Math.max(0, value + delta)));
    else setBScore((value) => Math.min(targetB, Math.max(0, value + delta)));
  }

  async function saveRace(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const match = await request<Match>("/matches", {
        method: "POST",
        body: JSON.stringify({
          player_a_id: aId,
          player_b_id: bId,
          player_a_score: aScore,
          player_b_score: bScore,
        }),
      });
      setSaved(match);
      setAScore(0);
      setBScore(0);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const teams = Array.from(new Set((players ?? []).map((player) => player.team)));

  function playerOptions(exclude: number | "") {
    return teams.map((team) => (
      <optgroup key={team} label={team}>
        {(players ?? [])
          .filter((player) => player.team === team && player.id !== exclude)
          .map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} · SL{player.skill_level}
            </option>
          ))}
      </optgroup>
    ));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Scorekeeper</h1>
          <p className="page-sub">
            Each player races to their skill level. Mark games as they're won — the first to their number takes it.
          </p>
        </div>
      </div>

      {loading && <p className="loading">Loading roster…</p>}
      {error && <p className="error">{error}</p>}
      {players && players.length < 2 && (
        <p className="empty">You need at least two players. Add them on the Players page first.</p>
      )}

      {saved && (
        <p className="banner">
          Saved: {saved.player_a_name} {saved.player_a_score}–{saved.player_b_score}{" "}
          {saved.player_b_name}
        </p>
      )}

      {players && players.length >= 2 && (
        <form className="scorekeeper" onSubmit={saveRace}>
          <div className={`side${aWon ? " winner" : ""}`}>
            <label className="field">
              <span>Player 1</span>
              <select value={aId} onChange={(event) => setAId(Number(event.target.value) || "")}>
                <option value="">Select a player…</option>
                {playerOptions(bId)}
              </select>
            </label>
            <div className="race-info">
              <span className="target">Race to {targetA || "—"}</span>
              <RaceDots target={targetA} score={aScore} />
            </div>
            <div className="score-block">
              <button
                type="button"
                className="step-btn"
                onClick={() => adjust("a", -1)}
                disabled={!playerA || aScore === 0}
                aria-label="Remove a game from player 1"
              >
                −
              </button>
              <span className="score-value">{aScore}</span>
              <button
                type="button"
                className="step-btn"
                onClick={() => adjust("a", 1)}
                disabled={!playerA || aScore >= targetA}
                aria-label="Add a game to player 1"
              >
                +
              </button>
            </div>
            <p className="need">
              {playerA ? `${Math.max(targetA - aScore, 0)} games to go` : "Waiting for a player"}
            </p>
          </div>

          <div className="vs">vs</div>

          <div className={`side${bWon ? " winner" : ""}`}>
            <label className="field">
              <span>Player 2</span>
              <select value={bId} onChange={(event) => setBId(Number(event.target.value) || "")}>
                <option value="">Select a player…</option>
                {playerOptions(aId)}
              </select>
            </label>
            <div className="race-info">
              <span className="target">Race to {targetB || "—"}</span>
              <RaceDots target={targetB} score={bScore} />
            </div>
            <div className="score-block">
              <button
                type="button"
                className="step-btn"
                onClick={() => adjust("b", -1)}
                disabled={!playerB || bScore === 0}
                aria-label="Remove a game from player 2"
              >
                −
              </button>
              <span className="score-value">{bScore}</span>
              <button
                type="button"
                className="step-btn"
                onClick={() => adjust("b", 1)}
                disabled={!playerB || bScore >= targetB}
                aria-label="Add a game to player 2"
              >
                +
              </button>
            </div>
            <p className="need">
              {playerB ? `${Math.max(targetB - bScore, 0)} games to go` : "Waiting for a player"}
            </p>
          </div>

          <div className="match-footer">
            <p className={`status ${status.tone}`}>{status.text}</p>
            {saveError && <p className="error">{saveError}</p>}
            <button className="btn primary" type="submit" disabled={!ready || saving}>
              {saving ? "Saving…" : "Save race"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
