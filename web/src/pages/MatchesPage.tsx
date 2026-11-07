import { request, useApi } from "../api";
import type { Match } from "../types";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MatchesPage() {
  const { data: matches, loading, error, refresh } = useApi<Match[]>("/matches?limit=100");

  async function removeMatch(match: Match) {
    if (!confirm(`Delete ${match.player_a_name} vs ${match.player_b_name}?`)) return;
    await request<void>(`/matches/${match.id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Match log</h1>
          <p className="page-sub">Every race, newest first. Scores read winner's games first.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Races</h2>
          <span className="panel-sub">{matches?.length ?? 0} on record</span>
        </div>
        {loading && <p className="loading">Loading matches…</p>}
        {error && <p className="error">{error}</p>}
        {matches && matches.length === 0 && (
          <p className="empty">No races logged yet — score one on the Scorekeeper page.</p>
        )}
        {matches && matches.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Matchup</th>
                  <th className="num">Score</th>
                  <th>Winner</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const aWon = match.winner_id === match.player_a_id;
                  return (
                    <tr key={match.id}>
                      <td className="muted nowrap">{formatDate(match.played_on)}</td>
                      <td>
                        <span className="strong">{match.player_a_name}</span>
                        <span className="muted"> ({match.player_a_team}) vs </span>
                        <span className="strong">{match.player_b_name}</span>
                        <span className="muted"> ({match.player_b_team})</span>
                      </td>
                      <td className={`num strong ${aWon ? "win" : "loss"}`}>
                        {match.player_a_score}–{match.player_b_score}
                      </td>
                      <td>
                        <span className="tag">{aWon ? match.player_a_name : match.player_b_name}</span>
                      </td>
                      <td className="num">
                        <button className="btn danger small" onClick={() => removeMatch(match)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
