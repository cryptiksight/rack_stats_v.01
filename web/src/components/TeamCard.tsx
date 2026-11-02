import { useState } from "react";
import { request } from "../api";
import type { Team, TeamStat } from "../types";

const IMAGE_LOGO = /^(https?:\/\/|\/)/i;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function TeamLogo({ team }: { team: Team }) {
  const logo = team.logo?.trim();
  if (logo && IMAGE_LOGO.test(logo)) {
    return <img className="team-logo" src={logo} alt={`${team.name} logo`} />;
  }
  return <span className="team-logo badge-logo">{logo ? logo.slice(0, 3) : initials(team.name)}</span>;
}

interface Props {
  team: Team;
  stat?: TeamStat;
  onChanged: () => void;
}

export default function TeamCard({ team, stat, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [logo, setLogo] = useState(team.logo ?? "");
  const [description, setDescription] = useState(team.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setName(team.name);
    setLogo(team.logo ?? "");
    setDescription(team.description ?? "");
    setError(null);
    setEditing(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await request<Team>(`/teams/${team.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          logo: logo.trim() || null,
          description: description.trim() || null,
        }),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete ${team.name}?`)) return;
    setError(null);
    try {
      await request<void>(`/teams/${team.id}`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (editing) {
    return (
      <form className="team-card team-edit" onSubmit={save}>
        <label className="field">
          <span>Team name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          <span>Logo</span>
          <input
            value={logo}
            onChange={(event) => setLogo(event.target.value)}
            placeholder="https://… or a short badge"
          />
        </label>
        <label className="field">
          <span>Description</span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tuesday nights at the Break Room"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="team-card-actions">
          <button className="btn primary small" type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="btn small" type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="team-card">
      <div className="team-card-head">
        <TeamLogo team={team} />
        <div className="team-card-title">
          <h3 className="team-name">{team.name}</h3>
          <p className="team-meta">
            {team.players} {team.players === 1 ? "player" : "players"}
            {stat && stat.matches > 0
              ? ` · ${stat.wins}–${stat.matches - stat.wins} · ${stat.win_rate}% wins`
              : ""}
          </p>
        </div>
      </div>
      <p className={`team-desc${team.description ? "" : " muted"}`}>
        {team.description ?? "No description yet."}
      </p>
      {error && <p className="error">{error}</p>}
      <div className="team-card-actions">
        <button className="btn small" type="button" onClick={startEdit}>
          Edit
        </button>
        <button className="btn danger small" type="button" onClick={remove}>
          Delete
        </button>
      </div>
    </article>
  );
}
