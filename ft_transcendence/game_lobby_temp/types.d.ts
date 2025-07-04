export interface Vector2D {
  x: number;
  y: number;
}

export type GameEvent =
  | { type: "score"; player: 1 | 2; p1: number; p2: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "start" }
  | { type: "end"; winner: 1 | 2 }
  | { type: "hit"; player: 1 | 2 }
  | { type: "bounce" }
  | { type: "reset"; direction: "left" | "right" };

export type LobbyEvent =
  | { eventType: "player_sit"; player: string; slot: 1 | 2 }
  | { eventType: "player_stand"; player: string; slot: 1 | 2 }
  | { eventType: "lobby_update"; players: (string | null)[]; playersReady: [boolean, boolean]; isStarted: boolean; spectators: string[]}
  | { eventType: "lobby_user_join"; user: string; spectators: string[]}
  | { eventType: "lobby_user_part"; user: string; spectators: string[]}
  | { eventType: "lobby_user_ready", p1Ready: boolean, p2Ready: boolean }

export type GameState = {
  gameStateType: string;
  ballPos: Vector2D;
  ballSize: Vector2D;
  ballVel: Vector2D;
  p1Pos: Vector2D;
  paddle1Size: Vector2D;
  p2Pos: Vector2D;
  paddle2Size: Vector2D;
  score1: number;
  score2: number;
  p1DataPoint: number;
  p2DataPoint: number;
  boardSize: Vector2D;
  events: GameEvent[];
};

export type GameStateInit = Pick<
  GameState,
  | "gameStateType"
  | "ballPos"
  | "ballSize"
  | "p1Pos"
  | "paddle1Size"
  | "p2Pos"
  | "paddle2Size"
  | "boardSize"
>;

export type GameStateUpdate = Pick<
  GameState,
  "gameStateType" | "ballPos" | "p1Pos" | "p2Pos" | "events"
>;

export type GameStateAI = Pick<
  GameState,
  "gameStateType" | "ballPos" | "ballVel" | "p1Pos" | "p2Pos" | "paddle1Size" | "paddle2Size" | "p1DataPoint" | "p2DataPoint"
>;
