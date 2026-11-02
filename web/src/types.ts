export interface Player {
  id: number;
  name: string;
  team: string;
  skill_level: number;
  apa_number: string | null;
}

export interface Team {
  id: number;
  name: string;
  logo: string | null;
  description: string | null;
  players: number;
}

export interface Match {
  id: number;
  played_on: string;
  player_a_id: number;
  player_b_id: number;
  player_a_name: string;
  player_b_name: string;
  player_a_team: string;
  player_b_team: string;
  player_a_score: number;
  player_b_score: number;
  player_a_skill: number;
  player_b_skill: number;
  winner_id: number;
}

export interface PlayerStat {
  player_id: number;
  name: string;
  team: string;
  skill_level: number;
  matches: number;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  win_rate: number;
  avg_points: number;
}

export interface TeamStat {
  team: string;
  players: number;
  matches: number;
  wins: number;
  points_for: number;
  points_against: number;
  win_rate: number;
}

export interface Summary {
  players: number;
  teams: number;
  matches: number;
  points: number;
  avg_points_per_match: number;
}
