import { useState } from "react";
import { request, useApi } from "../api";
import TeamCard from "../components/TeamCard";
import type { Team, TeamStat } from "../types";

export default function TeamsPage() {
  const { data: teams, loading, error, refresh } = useApi<Team[]>("/teams");
  const { data: stats, refresh: refreshStats } = useApi<TeamStat[]>("/stats/teams");
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const statByName = new Map((stats ?? []).map((row) => [row.team, row]));

  function refreshAll() {
    refresh();
    refreshStats();
  }

  async function addTeam(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await request<Team>("/teams", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          logo: logo.trim() || null,
          description: description.trim() || null,
        }),
      });
      setName("");
      setLogo("");
      setDescription("");
      refreshAll();
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
          <h1 className="page-title">Teams</h1>
          <p className="page-sub">
            Logos, descriptions and the league record for every team on the roster.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Add a team</h2>
          <span className="panel-sub">Logo takes an image URL or a short badge</span>
        </div>
        <form className="form-row" onSubmit={addTeam}>
          <label className="field">
            <span>Team name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Break & Run"
              required
            />
          </label>
          <label className="field">
            <span>Logo</span>
            <input
              value={logo}
              onChange={(event) => setLogo(event.target.value)}
              placeholder="https://… or 🎱"
            />
          </label>
          <label className="field wide">
            <span>Description</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tuesday nights at the Break Room"
            />
          </label>
          <button className="btn primary" type="submit" disabled={saving || !name.trim()}>
            {saving ? "Adding…" : "Add team"}
          </button>
        </form>
        {formError && <p className="error">{formError}</p>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Teams</h2>
          <span className="panel-sub">{teams?.length ?? 0} teams</span>
        </div>
        {loading && <p className="loading">Loading teams…</p>}
        {error && <p className="error">{error}</p>}
        {teams && teams.length === 0 && (
          <p className="empty">No teams yet — add the first one above.</p>
        )}
        {teams && teams.length > 0 && (
          <div className="team-grid">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                stat={statByName.get(team.name)}
                onChanged={refreshAll}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
