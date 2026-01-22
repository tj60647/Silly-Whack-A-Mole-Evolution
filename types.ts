
export enum GameState {
  START = 'START',
  LEVEL_LOADING = 'LEVEL_LOADING',
  LEVEL_INTRO = 'LEVEL_INTRO',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION'
}

export interface LevelData {
  id: number;
  theme: string;
  moleName: string;
  catchphrase: string;
  moleImageUrl: string;
  difficulty: {
    spawnInterval: number;
    moleStayDuration: number;
    targetScore: number;
    activeMoleCount: number;
  };
}

export interface ScoreEntry {
  level: number;
  score: number;
  date: string;
}