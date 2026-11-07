import { useState } from "react";
import { request } from "../api";
import type { Player } from "../types";

const SKILL_LEVELS = [2, 3, 4, 5, 6, 7];

interface Props {
  player: Player;
  teams: string[];
  onChanged: () => void;
}

export default function PlayerRow({ player, teams, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [team, setTeam] = useState(player.team);
  const [skill, setSkill] = useState(player.skill_level);
  const [apaNumber, setApaNumber] = useState(player.apa_number ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setName(player.name);
    setTeam(player.team);
    setSkill(player.skill_level);
    setApaNumber(player.apa_number ?? "");
    setError(null);
    setEditing(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await request<Player>(`/players/${player.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          team: team.trim() || "Unassigned",
          skill_level: skill,
          apa_number: apaNumber.trim() || null,
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

  async function changeSkill(skillLevel: number) {
    await request<Player>(`/players/${player.id}`, {
      method: "PATCH",
      body: JSON.stringify({ skill_level: skillLevel }),
    });
    onChanged();
  }

  async function remove() {
    if (!confirm(`Remove ${player.name}? Their races will be deleted too.`)) return;
    await request<void>(`/players/${player.id}`, { method: "DELETE" });
    onChanged();
  }

  if (editing) {
    return (
      <tr className="row-edit">
        <td colSpan={5}>
          <form className="row-edit-form" onSubmit={save}>
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="field">
              <span>Team</span>
              <input
                value={team}
                onChange={(event) => setTeam(event.target.value)}
                list={`team-options-${player.id}`}
              />
              <datalist id={`team-options-${player.id}`}>
                {teams.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>
            <label className="field narrow">
              <span>APA #</span>
              <input
                value={apaNumber}
                onChange={(event) => setApaNumber(event.target.value)}
                placeholder="optional"
              />
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
            <div className="row-edit-actions">
              <button className="btn primary small" type="submit" disabled={saving || !name.trim()}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn small" type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
          {error && <p className="error">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="strong">{player.name}</td>
      <td className="muted">{player.team}</td>
      <td className="muted">{player.apa_number ?? "—"}</td>
      <td>
        <select
          className="inline-select"
          value={player.skill_level}
          aria-label={`Skill level for ${player.name}`}
          onChange={(event) => changeSkill(Number(event.target.value))}
        >
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              SL{level}
            </option>
          ))}
        </select>
      </td>
      <td className="num">
        <div className="row-actions">
          <button className="btn small" type="button" onClick={startEdit}>
            Edit
          </button>
          <button className="btn danger small" type="button" onClick={remove}>
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}
