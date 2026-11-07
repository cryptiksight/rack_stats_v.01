import { useState } from "react";
import { request, useApi } from "../api";
import PlayerRow from "../components/PlayerRow";
import type { Player } from "../types";

const SKILL_LEVELS = [2, 3, 4, 5, 6, 7];

export default function PlayersPage() {
  const { data: players, loading, error, refresh } = useApi<Player[]>("/players");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [skill, setSkill] = useState(3);
  const [apaNumber, setApaNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const teams = Array.from(new Set((players ?? []).map((player) => player.team)));

  async function addPlayer(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await request<Player>("/players", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          team: team.trim() || "Unassigned",
          skill_level: skill,
          apa_number: apaNumber.trim() || null,
        }),
      });
      setName("");
      setApaNumber("");
      refresh();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Players</h1>
          <p className="page-sub">Roster and APA skill levels. Skill level sets the race in every match.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Add a player</h2>
          <span className="panel-sub">Skill levels run 2 to 7</span>
        </div>
        <form className="form-row" onSubmit={addPlayer}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maria Alvarez"
              required
            />
          </label>
          <label className="field">
            <span>Team</span>
            <input
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              placeholder="Break & Run"
              list="team-options"
            />
            <datalist id="team-options">
              {teams.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>
          <label className="field narrow">
            <span>Skill level</span>
            <select value={skill} onChange={(event) => setSkill(Number(event.target.value))}>
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  SL{level}
                </option>
              ))}
            </select>
          </label>
          <label className="field narrow">
            <span>APA #</span>
            <input
              value={apaNumber}
              onChange={(event) => setApaNumber(event.target.value)}
              placeholder="optional"
            />
          </label>
          <button className="btn primary" type="submit" disabled={saving || !name.trim()}>
            {saving ? "Adding…" : "Add player"}
          </button>
        </form>
        {formError && <p className="error">{formError}</p>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Roster</h2>
          <span className="panel-sub">{players?.length ?? 0} players</span>
        </div>
        {loading && <p className="loading">Loading roster…</p>}
        {error && <p className="error">{error}</p>}
        {players && players.length === 0 && (
          <p className="empty">No players yet — add the first one above.</p>
        )}
        {players && players.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Team</th>
                  <th>APA #</th>
                  <th>Skill level</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <PlayerRow key={player.id} player={player} teams={teams} onChanged={refresh} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
