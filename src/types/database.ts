export interface Player {
  id: string; // Using string for UUIDs from Supabase
  name: string;
  position?: string; // Player's position, e.g., Forward, Midfielder
  team_id?: string; // Optional foreign key
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  primary_shirt_color: string;
  team_type?: 'club' | 'external' | 'internal'; // New field for team type
  created_at?: string;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string; // ISO 8601 date string
  home_score?: number;
  away_score?: number;
  venue: string; // Location of the match - now required
  match_type?: 'internal_friendly' | 'external_game'; // New field for match type
  created_at?: string;
}

export interface PlayerMatchStats {
  id: string;
  player_id: string;
  match_id: string;
  goals: number;
  assists: number;
  own_goals: number;
  minutes_played?: number;
  created_at?: string;
}

export interface PlayerMatchAssignment {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  created_at?: string;
}

export enum PlayerPositionValue {
  DEFENDER = 'Defender',
  FORWARD = 'Forward',
  GOALKEEPER = 'Goalkeeper',
  MIDFIELDER = 'Midfielder',
}

export interface PlayerPosition {
  id: string;
  name: PlayerPositionValue;
  created_at?: string;
}

// Enum for predefined team names, specifically for 'Internal United'
export enum PredefinedTeam {
  FCB_UNITED = 'FCB United',
}