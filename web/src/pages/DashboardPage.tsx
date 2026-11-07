import { useApi } from "../api";
import type { PlayerStat, Summary, TeamStat } from "../types";

export default function DashboardPage() {
  const summary = useApi<Summary>("/stats/summary");
  const players = useApi<PlayerStat[]>("/stats/players");
  const teams = useApi<TeamStat[]>("/stats/teams");

  const error = summary.error ?? players.error ?? teams.error;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">League standings</h1>
          <p className="page-sub">Every race your league has played, tallied by player and by team.</p>
        </div>
      </div>

      {error && <p className="error">Couldn't load standings: {error}</p>}

      <section className="card-grid">
        <div className="card">
          <span className="card-label">Players</span>
          <span className="card-value">{summary.data?.players ?? "—"}</span>
          <span className="card-hint">on {summary.data?.teams ?? "—"} teams</span>
        </div>
        <div className="card">
          <span className="card-label">Races played</span>
          <span className="card-value">{summary.data?.matches ?? "—"}</span>
          <span className="card-hint">all divisions</span>
        </div>
        <div className="card">
          <span className="card-label">Total points</span>
          <span className="card-value">{summary.data?.points ?? "—"}</span>
          <span className="card-hint">games won by the league</span>
        </div>
        <div className="card">
          <span className="card-label">Avg points / race</span>
          <span className="card-value">{summary.data?.avg_points_per_match ?? "—"}</span>
          <span className="card-hint">both players combined</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Player standings</h2>
          <span className="panel-sub">Sorted by wins, then points</span>
        </div>
        {players.loading && <p className="loading">Loading players…</p>}
        {players.data && players.data.length === 0 && (
          <p className="empty">No players yet. Add a roster on the Players page.</p>
        )}
        {players.data && players.data.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Team</th>
                  <th className="num">SL</th>
                  <th className="num">Races</th>
                  <th className="num">W</th>
                  <th className="num">L</th>
                  <th className="num">Win %</th>
                  <th className="num">Pts</th>
                  <th className="num">Avg</th>
                </tr>
              </thead>
              <tbody>
                {players.data.map((player, index) => (
                  <tr key={player.player_id}>
                    <td className="num muted">{index + 1}</td>
                    <td className="strong">{player.name}</td>
                    <td className="muted">{player.team}</td>
                    <td className="num">
                      <span className="tag">SL{player.skill_level}</span>
                    </td>
                    <td className="num">{player.matches}</td>
                    <td className="num win">{player.wins}</td>
                    <td className="num loss">{player.losses}</td>
                    <td className="num">{player.matches ? `${player.win_rate}%` : "—"}</td>
                    <td className="num">{player.points_for}</td>
                    <td className="num muted">{player.matches ? player.avg_points : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Team standings</h2>
          <span className="panel-sub">Team points are the games its players have won</span>
        </div>
        {teams.data && teams.data.length > 0 ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Team</th>
                  <th className="num">Players</th>
                  <th className="num">Races</th>
                  <th className="num">Win %</th>
                  <th className="num">Pts for</th>
                  <th className="num">Pts against</th>
                </tr>
              </thead>
              <tbody>
                {teams.data.map((team) => (
                  <tr key={team.team}>
                    <td className="strong">{team.team}</td>
                    <td className="num">{team.players}</td>
                    <td className="num">{team.matches}</td>
                    <td className="num">{team.matches ? `${team.win_rate}%` : "—"}</td>
                    <td className="num win">{team.points_for}</td>
                    <td className="num muted">{team.points_against}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !teams.loading && <p className="empty">No teams yet.</p>
        )}
      </section>
    </>
  );
}
