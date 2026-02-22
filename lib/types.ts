export type Direction = 1 | 2; // 1=UP, 2=DOWN
export type RoundStatus = "pending" | "active" | "ended" | "settled";

export interface Round {
  id: string;
  round_id: number;
  coin_symbol: string;
  start_time: number;
  end_time: number;
  entry_fee: number;
  price_start: number;
  price_end: number;
  total_pool: number;
  yield_pool: number;
  winner_direction: 0 | 1 | 2;
  up_count: number;
  down_count: number;
  total_participants: number;
  status: RoundStatus;
  admin: string;
}

export interface Prediction {
  player: string;
  round_id: number;
  direction: Direction;
  stake_amount: number;
  prediction_time: number;
  is_early: boolean;
  is_correct: boolean;
  rank: 0 | 1 | 2 | 3;
}

export interface PlayerStats {
  player: string;
  total_score: number;
  wins: number;
  losses: number;
  current_streak: number;
  best_streak: number;
  total_rounds_played: number;
  early_predictions: number;
}

export interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  wins: number;
  streak: number;
  winRate: number;
}

export interface GameSession {
  id: string;
  round_id: number;
  season_id: number;
  early_prediction_window_minutes: number;
}

export interface RoundCardProps {
  round: Round;
  userPrediction?: Prediction | null;
  onPredict?: (roundId: string, direction: Direction, amount: number) => void;
  isLoading?: boolean;
}

export interface MockRound extends Round {
  priceChangePercent: number;
  currentPrice: number;
  timeLeftSeconds: number;
}
