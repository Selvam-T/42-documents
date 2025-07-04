import {
  Vector2D,
  GameStateUpdate,
  GameEvent,
  GameStateAI,
  GameStateInit,
} from "../types";
import { PaddleAI } from "./paddleAI.js";

// FRAMES
const TARGET_FPS: number = 60;
// CONFIG
const BASE_MVT_RATE = 4;
export const GAME_SPEED: number = BASE_MVT_RATE * TARGET_FPS; // 240 pixels per second
const POINTS_TO_WIN: number = 200;
// DIMENSIONS
export const SPACE_BETWEEN = 10;
export const BOARD_DIMENSIONS: Vector2D = { x: 500, y: 500 };
export const PADDLE_DIMENSIONS: Vector2D = { x: 10, y: 50 };
export const BALL_DIMENSIONS: Vector2D = { x: 10, y: 10 };
export const CENTER: number = (BOARD_DIMENSIONS.y / 2) - (PADDLE_DIMENSIONS.y / 2);
// SPEED
const PADDLE_SPEED: number = GAME_SPEED;
const BALL_INITIAL_SPEED: number = GAME_SPEED;
const BALL_SPEED_INCREMENT: number = 0.02;
const BALL_MAX_SPEED: number = 600;
// ANGLES
const PADDLE_DEFLECTION_FACTOR = [0.2, 0.4, 0.6, 0.8]; // Center to edge
export const PADDLE_DEFLECTION = [
  ...PADDLE_DEFLECTION_FACTOR.map((v) => -v).reverse(),
  ...PADDLE_DEFLECTION_FACTOR,
];
//machine learning
//let useDataOnly: boolean = false; //use data only, not physics to predict

// --- Game Class ---

export class Game {
  private p1: Paddle = new Paddle(1, PADDLE_DIMENSIONS.x, PADDLE_DIMENSIONS.y);
  private p2: Paddle = new Paddle(2, PADDLE_DIMENSIONS.x, PADDLE_DIMENSIONS.y);
  private ball: Ball = new Ball();
  private lastTime: number = 0;
  private frameInterval: number = 1000 / TARGET_FPS;
  private isPaused: boolean = false;
  private event: GameEvent[] = []; //array of events
  private started: boolean = false;
  private useDataOnly: boolean = false; //use data only, not physics to predict --> to be turned ON by Game Controller
  private collectDataON: boolean = false; //auto turned on if AI player(s) is enabled 
  private powerUpON: boolean = true; //powerUp flag --> to be turned ON by Game Controller

  //DEBUG test prediction success rate, to be removed
  private PLOSS: number = 0;
  private PWIN: number = 0;

  public enableAI(player: 1 | 2, enabled: boolean) {
    const gameState = this.getLogicState();
    this.collectDataON = true;
    player == 1
      ? this.p1.enableAI(enabled, gameState)
      : this.p2.enableAI(enabled, gameState);
  }

  /**
   * Toggles the game's pause state.
   */
  public pause() {
    this.isPaused = !this.isPaused;
    this.event.push(this.isPaused ? { type: "pause" } : { type: "resume" });
  }

  /**
   * Returns the initial game state including positions and sizes of paddles and ball.
   */
  public getInitState(): GameStateInit {
    return {
      gameStateType: "init",
      ballPos: this.ball.pos,
      ballSize: this.ball.size,
      p1Pos: this.p1.pos,
      paddle1Size: this.p1.size,
      p2Pos: this.p2.pos,
      paddle2Size: this.p2.size,
      boardSize: BOARD_DIMENSIONS,
    };
  }

  /**
   * Returns the current game state including paddle and ball positions.
   */
  public getGameState(): GameStateUpdate {
    const payload = {
      gameStateType: "update",
      ballPos: this.ball.pos,
      p1Pos: this.p1.pos,
      p2Pos: this.p2.pos,
      events: this.event,
    };
    this.event = [];
    return payload;
  }

  /**
   * Returns the current game state used for game logic, including positions
   * and velocities of relevant game objects (ball and paddles).
   * @returns {GameState} The current logic-related game state, including ball position,
   * ball velocity, and paddle positions for both players.
   */
  public getLogicState(): GameStateAI {
    return {
      gameStateType: "ai",
      ballPos: this.ball.pos,
      ballVel: this.ball.vel,
      p1Pos: this.p1.pos,
      p2Pos: this.p2.pos,
      paddle1Size: this.p1.size,
      paddle2Size: this.p2.size,
      p1DataPoint: this.p1.dataPoint,
      p2DataPoint: this.p2.dataPoint,
    };
  }

  /**
   * Handles paddle movement input for a given player via API.
   * @param player - 1 or 2 to identify the player.
   * @param direction - Direction to move the paddle ("up", "down", or "stop").
   */
  public movePaddleAPI(player: 1 | 2, direction: "up" | "down" | "stop") {
    const paddle = player == 1 ? this.p1 : this.p2;
    switch (direction) {
      case "up":
        paddle.moveUp();
        break;
      case "down":
        paddle.moveDown();
        break;
      case "stop":
        paddle.stop();
    }
  }

  public isStarted(): boolean {
    return this.started;
  }

  /**
   * Starts the game loop using a fixed frame interval.
   */
  public start() {
    this.started = true;
    this.event.push({ type: "start" });
    this.lastTime = performance.now();
    setInterval(() => {
      const currentTime = performance.now();
      let deltaTime = (currentTime - this.lastTime) / 1000;
      deltaTime = Math.min(deltaTime, 0.1);
      if (deltaTime > this.frameInterval / 1000) {
        this.update(deltaTime);
        this.lastTime = currentTime;
      }
    }, this.frameInterval);
  }

  //turn on/of useDataOnly flag for Game controller
  public flipUseDataOnly() {
    this.useDataOnly = !this.useDataOnly;
    if (this.useDataOnly)
      this.collectDataON = true; //if Game prediction is using data only, then Game must collect data
  }

  //turn on/of powerUp flag for Game controller
  public flipPowerUp() {
    this.powerUpON = !this.powerUpON;
  }

  private handleWinStreak(player: number = 1 | 2)
  {
    let winner: Paddle = (this.p1.player === player) ? this.p1 : this.p2;
    let loser: Paddle = (this.p1.player === player) ? this.p2 : this.p1;
    
    console.log(`Handle PowerUp. Powerup value for winner ${winner.player}: ${winner.powerUp}, loser ${loser.player}: ${loser.powerUp}`) //POWERUP DELETE --------
    winner.winStreak += 1; //increment 
    loser.winStreak = 0; //reset opponent

    if (winner.winStreak > 3)
    {
      winner.switchPowerUp();
      winner.winStreak = 0;
    } 
  }

  //turn on/off flag to run game prediction based solely on data
  public setUseDataOnly(flag: boolean) {
    this.useDataOnly = flag;
  }

  //send pairs of collision data to be stored
  private collectData(p: Paddle, ballPos: number) {
    let def = p === this.p1 ? this.p1 : this.p2;
    let opp = p === this.p1 ? this.p2 : this.p1;

    // console.log(`collect data is on, def is ${def.player} , opp is ${opp.player}`); // DATA DELETE --------
    def.setDataPoint(ballPos);
    if (def.isAI && def.AI && opp.hasDataPoint()) {
      console.log(`GAME: def data point is ${def.getDataPoint()} , opp data point is ${opp.getDataPoint()}`); // DATA DELETE --------
      def.AI.collectData(def.getDataPoint(), opp.getDataPoint());
    }
    opp.clearDataPoint();
  }

  //convert ball hit pos on boundary line to paddle line
  private collectDataPostScore(scorer: number, yt: number) {
    const opponent: Paddle = (this.p1.player === scorer) ? this.p1 : this.p2;
    const defender: Paddle = (this.p1.player === scorer) ? this.p2 : this.p1;
    
    if (defender.isAI && defender.AI && opponent.hasDataPoint()) {
      
      const x0: number = opponent.pos.x;
      const y0: number = opponent.getDataPoint();
      
      let xt: number = (defender.player === 2) ? BOARD_DIMENSIONS.x : 0;
      let xi: number = (defender.player === 2) ? defender.pos.x : opponent.pos.x;
      let yi = () : number => {
        let slope = (yt - y0) / (xt - x0);
        return (y0 + slope * (xi - x0));
      };
      console.log(`Player ${opponent.player} scored. His y0 is ${opponent.getDataPoint()}, landing on defender yt: ${yt}, yt converted to yi is ${yi()}`);//DATA DELETE -----------
      this.collectData(defender, yi());
    }
    else
      console.log(`Player ${opponent.player} not AI or Opponent has no datapoint, therefore no data collection`); //DATA DELETE -----------

    opponent.clearDataPoint(); 
    defender.clearDataPoint();

  }

  /**
   * Detects and handles collisions between the ball and paddles.
   */
  private checkCollisions() {
    const paddleCollision = (p: Paddle, b: Ball) => {
      return (
        b.pos.x < p.pos.x + p.size.x &&
        b.pos.x + b.size.x > p.pos.x &&
        b.pos.y < p.pos.y + p.size.y &&
        b.pos.y + b.size.y > p.pos.y
      );
    };
    const handlePaddleCollision = (p: Paddle, b: Ball) => {
      if (paddleCollision(p, b)) {
        if (p.collision == true) return;
        this.event.push({ type: "hit", player: p === this.p1 ? 1 : 2 });
        
        console.log(`\n${p.player === 1 ? '\t' : ''}BALL collision at ${b.pos.y} on Player ${p.player} paddle`); //COLLISION DELETE ----------
        // Data Collection
        if (this.collectDataON)
          this.collectData(p, b.pos.y); //where did ball collide on this paddle

        p.collision = true;
        const segmentHeight = p.size.y / 8;
        const segmentIndex = Math.max(
          0,
          Math.min(
            7,
            Math.floor(
              (this.ball.pos.y + this.ball.size.y / 2 - p.pos.y) / segmentHeight 
              //(this.ball.pos.y - p.pos.y) / segmentHeight //previous design
            )
          )
        );
        b.speed += BALL_SPEED_INCREMENT;
        this.ball.vel.x =
          -Math.sign(this.ball.vel.x) *
          Math.min(BALL_MAX_SPEED, BALL_INITIAL_SPEED * b.speed);
        this.ball.vel.y =
          PADDLE_DEFLECTION[segmentIndex] * BALL_INITIAL_SPEED * b.speed;
        
      }
      if (p.collision) if (!paddleCollision(p, b)) p.collision = false;
    };
    if (this.ball.pos.y <= 0) {
      this.ball.pos.y = 0;
      this.ball.vel.y = Math.abs(this.ball.vel.y);
      this.event.push({ type: "bounce" });
    } else if (this.ball.pos.y + this.ball.size.y > BOARD_DIMENSIONS.y) {
      this.ball.pos.y = BOARD_DIMENSIONS.y - this.ball.size.y;
      this.ball.vel.y = -Math.abs(this.ball.vel.y);
      this.event.push({ type: "bounce" });
    }
    handlePaddleCollision(this.p1, this.ball);
    handlePaddleCollision(this.p2, this.ball);
  }

  private endGame(winner: 1 | 2) {
    this.pause();
    this.p1.pos.y = BOARD_DIMENSIONS.y * 0.5 - PADDLE_DIMENSIONS.y * 0.5;
    this.p2.pos.y = BOARD_DIMENSIONS.y * 0.5 - PADDLE_DIMENSIONS.y * 0.5;
    this.event.push({ type: "end", winner: winner });
    console.log(`Game over! Player ${winner} won!`);
  }

  /**
   * Checks whether a player has scored and resets the ball accordingly.
   */
  private checkForScore() {
    if (this.ball.pos.x >= BOARD_DIMENSIONS.x) {
      console.log(`The ball hit P2 wall at ${this.ball.pos.y}, p2 pos ${this.p2.pos.y}`); //HIT DELETE -----
      // Data Collection
      if (this.collectDataON)
        this.collectDataPostScore(this.p1.player, this.ball.pos.y); //player 1 scored
      
      this.ball.pause();
      this.ball.reset("left");
      this.p1.score++;
      this.event.push({
        type: "score",
        player: 1,
        p1: this.p1.score,
        p2: this.p2.score,
      });
      console.log(`Player 1 scored!\n ${this.p1.score} : ${this.p2.score}`);
      // console.log(`player 2 success rate of prediction logic: win: ${this.PWIN} , loss: ${this.PLOSS}`); //SUCCESS RATE DELETE ---------
      if (this.p1.score === POINTS_TO_WIN) this.endGame(1);
      
      if (this.powerUpON)
        this.handleWinStreak(this.p1.player);

      setTimeout(() => this.ball.resume(), 1000);
    } else if (this.ball.pos.x <= 0) {
      console.log(`The ball hit P1 wall at ${this.ball.pos.y}, p1 pos ${this.p1.pos.y}`); //HIT DELETE -----
      // Data Collection
      if (this.collectDataON)
        this.collectDataPostScore(this.p2.player, this.ball.pos.y); //player 2 scored

      this.ball.pause();
      this.ball.reset("right");
      this.p2.score++;
      this.event.push({
        type: "score",
        player: 2,
        p1: this.p1.score,
        p2: this.p2.score,
      });
      console.log(`Player 2 scored!\n ${this.p1.score} : ${this.p2.score}`);
      if (this.p2.score === POINTS_TO_WIN) this.endGame(2);
      
      if (this.powerUpON)
        this.handleWinStreak(this.p2.player);
      setTimeout(() => this.ball.resume(), 1000);
    }
    
  }

  /**
   * Updates game objects' positions and checks for collisions or scoring.
   * @param deltaTime - Time since the last update in seconds.
   */
  private update(deltaTime: number) {
    if (this.isPaused) return;
    // Update paddle location, if AI, send the logicState
    [this.p1, this.p2].forEach((paddle) => {
      if (paddle.isAI) paddle.update(deltaTime, this.getLogicState());
      //if (paddle.isAI && !this.useDataOnly) paddle.updatePaddle(deltaTime, this.getLogicState()); //DELETE ------
      //else if (paddle.isAI && this.useDataOnly) paddle.updatePaddle2(deltaTime, this.getLogicState()); //DELETE --------
      else paddle.update(deltaTime);
    });
    this.ball.update(deltaTime);
    this.checkCollisions();
    this.checkForScore();
  }
}

// --- Paddle Class ---

export interface PaddleInterface {
  readonly player: 1 | 2;
  readonly pos: Readonly<Vector2D>;
  readonly dy: number;
  readonly isAI: boolean; //DELETE ----------
}

export class Paddle {
  player: 1 | 2;
  pos: Vector2D = { x: 0, y: 0 };
  size: Vector2D = { x: 0, y: 0 };
 
  speedMultiplier: number = PADDLE_SPEED;// this reflects direction not speed? 
  dy: number = 0;
  collision: boolean = false;// no concurrent collision, make it global?
  score: number = 0;

  // AI logic
  isAI: boolean = false;
  aiUpdateTimer: number = 1; //initialized to 1 ,so we get GameState right away
  aiGameState?: GameStateAI;
  AI: PaddleAI | null = null;
  derivedTarget: number = BOARD_DIMENSIONS.y / 2; //derived paddle top position, aligning paddle segment to collision point
  paddleTarget: number = BOARD_DIMENSIONS.y / 2; //where paddle should move to conditional on ball direction

  // DATA COLLECTION
  dataPoint: number = -1; //-1 indicates no value is assigned (CONSIDER BOARD_DIMENSIONS.x /2 - PADDLE_DIMENSIONS.x /2 )

  // Power Up
  powerUp: 1 | 3 = 1; //powerUp multiplier
  winStreak: number = 0; //count winning streak
  powerUpTimer: number = 0;

  constructor(player: 1 | 2, width: number, height: number) {
    this.size = { x: width, y: height };
    if (player == 1) {
      this.player = player;
      this.pos.x = SPACE_BETWEEN;
    } else {
      this.player = player;
      this.pos.x = BOARD_DIMENSIONS.x - PADDLE_DIMENSIONS.x - SPACE_BETWEEN;
    }
    this.pos.y = BOARD_DIMENSIONS.y * 0.5 - PADDLE_DIMENSIONS.y * 0.5;
  }

  public enableAI(enabled: boolean, gameState: GameStateAI) {
    this.isAI = enabled;
    if (enabled) {
      if (!this.AI) this.AI = new PaddleAI(this, gameState);
    }
  }

  //power Up
  public switchPowerUp()
  {
    this.powerUp = (this.powerUp == 1) ? 3 : 1;
    if (this.powerUp === 1)
      this.powerUpTimer = 0;
    console.log(`Player ${this.player} powerup turned on to ${this.powerUp}`); //POWERUP DELETE ----------
  }

  // data collection helper functions.
  // Why not place dataPoint functions in paddleAI ? Because I need data points from both AI and Human.
  public setDataPoint(hit: number) {
    this.dataPoint = hit;
  }

  public clearDataPoint() {
    this.dataPoint = -1;
    // console.log(`data point cleared`); //DATA POINT DELETE ---------
  }
  
  public hasDataPoint() {
    return (this.dataPoint < 0 ? false : true);
  }

  public getDataPoint() {
    return this.dataPoint;
  }

  public moveDirectionAI(paddleTarget: number) {
    if (paddleTarget < this.pos.y)
      this.moveUp();
    else if (paddleTarget >this.pos.y) //remember paddleTarget is the hit point, adjusted for paddleSegment
      this.moveDown();
    else // =
      this.stop();
  }

  //work in progress: for useDataOnly
  public updatePaddle2(deltaTime: number, aiGameState?: GameStateAI) {
    if (this.isAI && this.AI && aiGameState) {
      this.AI.updateGameState(aiGameState);
      this.aiUpdateTimer += deltaTime;

      //move towards target if ball is incoming
      if (this.AI.ballIsIncoming())
      {
        console.log(`Incoming ball is ${this.AI.ballIsIncoming()} move towards paddle target ${this.derivedTarget}`);
        this.paddleTarget = this.AI.predictFromData();
        //flagON --> turn off on Paddle Collision or Score
      }
      else //move to center
      {
        console.log(`Incoming ball is ${this.AI.ballIsIncoming()} move towards CENTER ${CENTER}`);
        this.paddleTarget = CENTER;
      }
      this.moveDirectionAI(this.paddleTarget);
    }
    if (this.isAI && this.AI && aiGameState)
      console.log(`AI paddle ${this.player} before moving ${this.pos.y}, + ${this.dy} * ${deltaTime}`); // BEFORE DELETE ---------
    
    if (this.powerUp === 3 && (this.powerUpTimer += deltaTime) > 10) //keep powerup for 5 secs only
      this.switchPowerUp();

    this.pos.y = this.pos.y + (this.dy * this.powerUp) * deltaTime ; //GAME_SPEED x powerUp ---> can be 1 or 3 times GAME_SPEED
    // this.clampPaddlePos(this.dy, aiGameState);

    if (this.isAI && this.AI && aiGameState)
     console.log(`AI paddle ${this.player} after moving ${this.pos.y}`); // AFTER DELETE ---------
  }

  /**
   * Updates the paddle's vertical position based on current velocity.
   * @param deltaTime - Time since the last update in seconds.
   */
  public update(deltaTime: number, aiGameState?: GameStateAI) {
    if (this.isAI && this.AI && aiGameState) {
      this.AI.updateGameState(aiGameState);
      this.aiUpdateTimer += deltaTime;
      
      //Update paddle Target value based on new Snapshot information
      if (this.aiUpdateTimer > 1) { 
        this.AI.updateGameState(aiGameState);      
        // console.log(`\nTime to derive PaddleTarget (Update Timer > 1): AI paddle is ${this.player}, paddle pos ${this.pos.y}.`); //TIMER DELETE --------
        this.derivedTarget = this.AI.derivePaddleTarget(); //1) new paddleTarget in AI object is updated
        this.aiUpdateTimer = 0;
      }
      //move towards target if ball is incoming
      if (this.AI.ballIsIncoming())
      {
        console.log(`Incoming ball is ${this.AI.ballIsIncoming()} move towards paddle target ${this.derivedTarget}`);
        this.paddleTarget = this.derivedTarget;
      }
      else //move to center
      {
        console.log(`Incoming ball is ${this.AI.ballIsIncoming()} move towards CENTER ${CENTER}`);
        this.paddleTarget = CENTER;
      }
      this.moveDirectionAI(this.paddleTarget);
    }

    if (this.isAI && this.AI && aiGameState)
      console.log(`AI paddle ${this.player} before moving ${this.pos.y}, + ${this.dy} * ${deltaTime}`); // BEFORE DELETE ---------
    
    if (this.powerUp === 3 && (this.powerUpTimer += deltaTime) > 10) //keep powerup for 5 secs only
      this.switchPowerUp();

    this.pos.y = this.pos.y + (this.dy * this.powerUp) * deltaTime ; //GAME_SPEED x powerUp ---> can be 1 or 3 times GAME_SPEED
    this.clampPaddlePos(this.dy, aiGameState);  

    if (this.isAI && this.AI && aiGameState)
     console.log(`AI paddle ${this.player} after moving ${this.pos.y}`); // AFTER DELETE ---------
  }

  private clampPaddlePos( dy: number, aiGameState?: GameStateAI) {

    // clamp AI Paddle to paddleTarget. prevent paddle jitter
    if (this.isAI && this.AI && aiGameState) {
      if ((dy < 0 && this.pos.y < this.paddleTarget) || (dy > 0 && this.pos.y > this.paddleTarget))
        this.pos.y = this.paddleTarget; 
    }
    
    //clamp both paddles to canvas vertical bounds
    if (this.pos.y < 0) this.pos.y = 0;
    else if (this.pos.y + this.size.y > BOARD_DIMENSIONS.y)
      this.pos.y = BOARD_DIMENSIONS.y - this.size.y;
  }

  public moveUp() {
    this.dy = -this.speedMultiplier;
  }
  public moveDown() {
    this.dy = this.speedMultiplier;
  }
  public stop() {
    this.dy = 0;
  }

} //end paddle

// --- Ball Class ---

class Ball {
  size: Vector2D = BALL_DIMENSIONS;
  pos: Vector2D = { x: BOARD_DIMENSIONS.y / 2 - BALL_DIMENSIONS.x / 2, y: BOARD_DIMENSIONS.y / 2 - BALL_DIMENSIONS.y / 2 };
  vel: Vector2D = { x: BALL_INITIAL_SPEED, y: 0 };
  speed: number = 1;
  isPaused: boolean = false;

  /**
   * Updates the ball's position and handles wall collisions.
   * @param deltaTime - Time since the last update in seconds.
   */
  public update(deltaTime: number) {
    if (this.isPaused) return;
    this.pos.x += this.vel.x * deltaTime;
    this.pos.y += this.vel.y * deltaTime;
  }

  /**
   * Resets the ball to the center with initial velocity towards a direction.
   * @param direction - "left" or "right"
   */
  public reset(direction: "left" | "right") {
    this.pos = { x: BOARD_DIMENSIONS.x / 2 - BALL_DIMENSIONS.x / 2, y: BOARD_DIMENSIONS.y / 2 - BALL_DIMENSIONS.y / 2 };
    this.vel.x =
      direction === "left" ? BALL_INITIAL_SPEED : -BALL_INITIAL_SPEED;
    this.vel.y = 0;
    this.speed = 1;
  }
  public pause() {
    this.isPaused = true;
  }
  public resume() {
    this.isPaused = false;
  }
}
