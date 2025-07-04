import { Game } from "./game.js";
import { GameStateInit, GameStateUpdate } from "../types";
import { User } from "./user";

const P1 = 0;
const P2 = 1;
const UPDATES_PER_SECOND = 60;
const UPDATE_INTERVAL = 1000 / UPDATES_PER_SECOND;

export class GameLobbyManager {
  private lobbies = new Map<string, GameLobby>();

  public create(lobbyID: string) {
    if (this.lobbies.get(lobbyID)) {
      console.warn(
        `GameLobbyManager.create(): lobby \"${lobbyID}\" already exists`
      );
      return;
    }
    console.log(`GameLobbyManager.create: lobby \"${lobbyID}\" created`);
    this.lobbies.set(lobbyID, new GameLobby(lobbyID));
  }
  public delete(lobbyID: string) {
    if (this.lobbies.delete(lobbyID))
      console.log(`GameLobbyManager.delete(): Deleted lobby \"${lobbyID}\"`);
    console.warn(
      `GameLobbyManager.delete(): lobby \"${lobbyID}\" does not exist`
    );
  }
  public getLobbyByID(lobbyID: string): GameLobby | undefined {
    const lobby = this.lobbies.get(lobbyID);
    if (!lobby)
      console.warn(
        `GameLobbyManager.getLobbyByID(): Lobby \"${lobbyID}\" does not exist`
      );
    return lobby;
  }
  public getLobbyByUser(user: User): GameLobby | undefined {
    for (const lobby of this.lobbies.values()) {
      if (lobby.hasUser(user)) return lobby;
    }
    console.warn(
      `GameLobbyManager.getLobbyByUser(): ${user.debug()} does not exist in any lobby`
    );
    return undefined;
  }
}

class GameManager {
  private game: Game | null = null;
  private intervalID: NodeJS.Timeout | undefined = undefined;
  private started: boolean = false;
  constructor(
    private broadcast: (type: string, payload?: Record<string, unknown>) => void
  ) {}
  private startGameLoop() {
    this.game?.start();
    this.intervalID = setInterval(() => {
      if (!this.game) return;
      const state = this.game.getGameState();
      for (const event of state.events) {
        if (event.type == "end") {
          this.stop();
          break;
        }
      }
      this.broadcast("gamestate", state);
    }, UPDATE_INTERVAL); // 60 FPS
  }

  public init(): GameStateInit {
    if (!this.game) {
      console.log("Initializing new Game instance");
      this.game = new Game();
    }
    return this.game.getInitState();
  }

  public start(p1AI: boolean, p2AI: boolean): boolean {
    if (!this.game) return false;
    if (this.started) return false;

    //TEMPORARY TESTING: Make both players AI
    p1AI = true; //DELETE -------
    p2AI = true; //DELETE -------

    if (p1AI) this.game.enableAI(1, true);
    if (p2AI) this.game.enableAI(2, true);

    this.startGameLoop();
    this.started = true;
    return true;
  }

  public stop() {
    this.started = false;
    clearInterval(this.intervalID);
    this.intervalID = undefined;
    this.game = null;
  }

  public isStarted() {
    return this.started;
  }

  public getGame() : Game | null {
    return this.game;
  }
}

export class GameLobby {
  private id: string;
  private players: [User | null, User | null] = [null, null];
  private playerReady: [boolean, boolean] = [false, false];
  private spectators: User[] = [];
  private gameManager: GameManager = new GameManager(this.broadcast.bind(this));
  constructor(id: string) {
    this.id = id;
  }
  public getReadyStatus(): [boolean, boolean] {
    return this.playerReady;
  }
  public toggleReady(user: User) {
    if (user === this.players[P1]) {
      this.playerReady[P1] = !this.playerReady[P1];
      console.log(
        `${this.debug()}: Player 1 (${user.debug()}) is ${
          this.playerReady[P1] ? "ready" : "not ready"
        }`
      );
      return this.playerReady[P1];
    } else if (user === this.players[P2]) {
      this.playerReady[P2] = !this.playerReady[P2];
      console.log(
        `${this.debug()}: Player 2 (${user.debug()}) is ${
          this.playerReady[P2] ? "ready" : "not ready"
        }`
      );
    }
  }
  public getID() {
    return this.id;
  }
  public addUser(user: User) {
    if (this.spectators.includes(user)) {
      console.log(`${this.debug()}: User is already in this lobby`);
      return;
    }
    this.spectators.push(user);
    const initState = this.gameManager.init();
    user.send("gamestate", initState);
    console.log(`${this.debug()}: added ${user.debug()}`);
  }
  public removeUser(user: User) {
    if (user === this.players[P1]) this.players[P1] = null;
    else if (user === this.players[P2]) this.players[P2] = null;
    this.spectators = this.spectators.filter((p) => p.getID() !== user.getID());
    console.log(`${this.debug()}: removed ${user.debug()}`);
  }
  public assignUserToPlayer(user: User, slot: 1 | 2): boolean {
    const targetSlot = slot == 1 ? P1 : P2;

    if (this.players[targetSlot]) {
      console.warn(`${this.debug()}: Slot ${slot} is already occupied`);
      return false;
    }

    if (user === this.players[P1]) this.players[P1] = null;
    if (user === this.players[P2]) this.players[P2] = null;

    this.spectators = this.spectators.filter((u) => u !== user);

    this.players[targetSlot] = user;

    console.log(
      `${this.debug()}: User \"${user.debug()}\" is now Player ${slot}`
    );
    return true;
  }
  public playerToSpectator(user: User) {
    if (user === this.players[P1]) this.players[P1] = null;
    else if (user === this.players[P2]) this.players[P2] = null;
    this.addUser(user);
    console.log(`${this.debug()}: User \"${user.debug()}\" is now a spectator`);
  }
  public startGame(user: User): boolean {
    if (!this.getPlayers().some((player) => player === user)) {
      return false; // return if user is not a player
    }

    const p1Exists = this.players[P1] !== null;
    const p2Exists = this.players[P2] !== null;
    const p1Ready = p1Exists && this.playerReady[P1];
    const p2Ready = p2Exists && this.playerReady[P2];

    // Both human players must be ready
    if (p1Exists && p2Exists) {
      if (!p1Ready || !p2Ready) {
        return false;
      }
    } else {
      // One human, they must be ready to start
      if ((p1Exists && !p1Ready) || (p2Exists && !p2Ready)) {
        return false;
      }
    }

    if (!this.gameManager.start(!p1Exists, !p2Exists)) {
      return false;
    }

    console.log(`${this.debug()}: Game started`);
    return true;
  }
  public hasUser(user: User) {
    return (
      this.players.some((u) => u?.getID() === user.getID()) ||
      this.spectators.some((u) => u.getID() === user.getID())
    );
  }
  public getPlayers() {
    return this.players;
  }
  public getSpectators() {
    return this.spectators;
  }
  public handlePlayerMove(user: User, direction: "up" | "down" | "stop") {
    const game = this.gameManager.getGame();
    if (!game) return;
    if (user === this.players[P1]) game.movePaddleAPI(1, direction);
    else if (user === this.players[P2]) game.movePaddleAPI(2, direction);
  }
  public handlePlayerPause(user: User) {
    const game = this.gameManager.getGame();
    if (!game) return;
    game.pause();
  }
  public broadcast(type: string, payload?: Record<string, unknown>) {
    for (const player of this.players) {
      player?.send(type, payload);
    }
    for (const spectator of this.spectators) {
      spectator.send(type, payload);
    }
  }
  public started(): boolean {
    return this.gameManager.isStarted();
  }
  public debug() {
    return `GameLobby(name=\"${this.id}\")`;
  }
}
