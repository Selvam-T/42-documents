import { ParseUint16 } from "@babylonjs/core";
import { GameStateAI } from "../types";
import { PaddleInterface, BOARD_DIMENSIONS, CENTER, PADDLE_DIMENSIONS, Paddle } from "./game.js";
import { PADDLE_DEFLECTION } from "./game.js";

export class PaddleAI {
  paddle: PaddleInterface;
  gameState: GameStateAI;
  arrSize: number = Math.ceil(BOARD_DIMENSIONS.y / PADDLE_DIMENSIONS.y * 8);
  predictionData: number[][] = Array(this.arrSize).fill(null).map(() => []);

  constructor(paddle: PaddleInterface, gameState: GameStateAI) {
    this.paddle = paddle;
    this.gameState = gameState;
    this.predictionData = this.initPredictionData(); //initialize machine learning data
  }

  private initPredictionData() {
    let dataMap: number[][] = Array(this.arrSize).fill(null).map(() => []);
    let oppWallHit: number;
    let defWallHit: number;

    dataMap.forEach((row, i) => {
      oppWallHit = this.indexToTarget(i);
      defWallHit = this.naivePrediction(oppWallHit);
      row.push(defWallHit);
    });

    return dataMap;
  }

  public updateGameState(newGameState: GameStateAI) {
    this.gameState = newGameState;
  }

  /*************************/
  /**** 1. ball metrics ****/

  public ballIsIncoming(): boolean {
    if (this.paddle.player == 1 && this.gameState.ballVel.x < 0) return true;
    if (this.paddle.player == 2 && this.gameState.ballVel.x > 0) return true;
    return false;
  }

  private calculateDistanceToWall(): number {
    const x0 = this.gameState.ballPos.x;
    const xt = (this.gameState.ballVel.x > 0) ? this.gameState.p2Pos.x : this.gameState.p1Pos.x; //i.e. 480 : 10
    
    const distance = Math.abs(xt - x0);
    return distance;
  }

  /***************************/
  /**** 2. paddle metrics ****/

  public derivePaddleTarget(): number {

    //when I have 2 AI players, I need to know who is this.player vs opponent
    let defender = this.paddle.player == 1 ? 1 : 2;
    let opponent = this.paddle.player == 1 ? 2 : 1;
    let paddleTarget: number;
    
    if (this.ballIsIncoming()) /////1. moving towards Defender
    {   
      // console.log(`Snapshot taken when ball is moving towards AI player ${defender}, isAI = ${this.paddle.isAI}`); //SNAPSHOT DELETE ------   
      let hit = this.computeWallHit() ?? BOARD_DIMENSIONS.y / 2;
      paddleTarget = this.alignPaddleToWallHit(hit);
      // console.log(`AI paddle ${this.paddle.player} will be positioned from [${paddleTarget}] for Direct hit at ${hit}, cur pos is ${this.paddle.pos.y}`); //COMPUTED PADDLE TARGET DELETE -----
    }
    else /////2. moving towards Opponent
    {
      // console.log(`Snapshot taken when ball is moving towards Opp player ${opponent}, isAI = ${!this.paddle.isAI} `); //SNAPSHOT DELETE ------
      paddleTarget = this.predictWallHit() ?? (BOARD_DIMENSIONS.y / 2); //middle of paddle
      // console.log(`AI paddle ${this.paddle.player} paddleTarget chosen for Predicted hit is ${paddleTarget}, cur pos is ${this.paddle.pos.y}`); //PREDICTED PADDLE TARGET DELETE -----
    }
    return paddleTarget;
  }

  private paddleIndex(y0: number, oppPaddlePos: number) : number
  {
    //end to end paddle vertical lines, can be (p1 to p2) or (p2 to p1)
    let x0 = this.paddle.player === 1 ? this.gameState.p1Pos.x : this.gameState.p2Pos.x; 
    let xt = this.paddle.player === 1 ? this.gameState.p2Pos.x : this.gameState.p1Pos.x;
    let vx = 1;
    
    //for ball travelling end to end, in either direction, for all possible paddle deflections, where does it strile on target end?
    const possibleTargets = (): number[] => {
      return PADDLE_DEFLECTION.map(vy => this.computeWallHit(x0, xt, y0, vx, vy) ?? BOARD_DIMENSIONS.y / 2);
    };

    //opponent's known paddle position - expected ball strike positions, for all deflections from defender 
    const targetDeltas = (): number[] => {
      return possibleTargets().map(ty => Math.abs(oppPaddlePos - ty));
    };

    //select max from all distances between opponent's paddle position and ball landing points
    const deltas = targetDeltas();
    const max = Math.max(...deltas);

    //paddle segment selection Logic 
    if (max > 0.6 * BOARD_DIMENSIONS.y) // distance > 60 % wall length 
      return (deltas.indexOf(max));
    else
      return(Math.floor(Math.random() * 8));
  }

  //find a strategic paddle Segment number 0 to  7 representing a paddle deflection factor
  private alignPaddleToWallHit(wallHit: number)
  {
    let playerPaddleSize = this.paddle.player === 1 ? this.gameState.paddle1Size!.y : this.gameState.paddle2Size!.y; //assume p1 and p2 paddles could have different sizes
    let oppPaddlePos = this.paddle.player === 1 ? this.gameState.p2Pos!.y : this.gameState.p1Pos!.y;
    
    let segmentHeight: number =  playerPaddleSize / 8;
    
    let paddleTarget = wallHit - Math.round(segmentHeight * this.paddleIndex(wallHit, oppPaddlePos) + segmentHeight / 2);
    // console.log(`Inside alignPaddleToWallHit, defender is ${this.paddle.player}, wallHit ${wallHit}, paddleTarget is ${paddleTarget}`);//PADDLE TARGET DELETE -----------
    return paddleTarget;
  }

  /*******************************************/
  /**** 3. prediction & computation logic ****/

  //used to initialize predictionMap
  private naivePrediction(oppWallHit: number)
  {
    //both defender and opponent could be AI
    let defender_xt = this.paddle.player == 1 ? this.gameState.p1Pos.x : this.gameState.p2Pos.x;
    let opponent_xt = this.paddle.player == 1 ? this.gameState.p2Pos.x : this.gameState.p1Pos.x;
    let paddleSize = this.paddle.player == 1 ? this.gameState.paddle1Size.y : this.gameState.paddle2Size.y; 
    
    //1. threshold index corresponds to paddle segment. 
    //2. Assign paddle segment to wall section in the same order 
    //i.e [0, 1, 2, 3, 4, 5 , 6 7]  to  [50, 100, 150, 250, 350, 400, 450, Infinity]. 
    //Thus if ball lands in 50 - 100, paddle segment 1 is assumed to be used
    const thresholds = [0.1 * BOARD_DIMENSIONS.y, 
                        0.2 * BOARD_DIMENSIONS.y, 
                        0.3 * BOARD_DIMENSIONS.y, 
                        0.5 * BOARD_DIMENSIONS.y, 
                        0.7 * BOARD_DIMENSIONS.y, 
                        0.8 * BOARD_DIMENSIONS.y, 
                        0.9 * BOARD_DIMENSIONS.y, 
                        Infinity];
    
    //identify threshhold index that corresponds to wall section where ball land's on opponent's wall
    let index = -1;
    for (let i = 0; i < thresholds.length; i++) {
      if (oppWallHit <= thresholds[i]) {
        index = i;
        break;
      }
    }
    // console.log(`Ball will strike opp Wall at: ${oppWallHit}, we think opponent will use paddle index: ${index}`);
    
    //If opponent deflected ball with defelection at [index], where will ball land on defender's wall?
    let predictedAIwall = this.computeWallHit(
      opponent_xt,                //xo: wall of opponent
      defender_xt,                //xt: wall of AI player
      oppWallHit,                 //yo: ball origin pos.y
      1,                          //vx: normalized ball vel.x
      PADDLE_DEFLECTION[index]    //vy: normalized ball vel.y, index = [0, 1, ...] corresponds to [0.8, 0.6 ...]
    ) ?? (BOARD_DIMENSIONS.y/ 2 - PADDLE_DIMENSIONS.y / 2);
    
    //console.log(`oppWallHit is ${oppWallHit}, threshold index is ${index}, prediction is ${predictedAIwall - (paddleSize / 2)}`); //NAIVE PREDICTION DELETE ----------
    return predictedAIwall - (paddleSize / 2);
  }

  public predictFromData() { //I need defender paddle to access predictionMap, opponent's datapoint
    let hit = (this.paddle.player === 1) ? this.gameState.p1DataPoint : this.gameState.p2DataPoint;
    console.log(`opponent dataPoint ${hit}`);//FROM DATA DELETE -----
    if (hit === -1)
      return CENTER;
    let index = this.getArrayIndex(hit);
    console.log(`opponent dataPoint ${hit} converted to index ${index}, `); //FROM DATA DELETE -----
    return this.dataBasedWallHit(index) ?? (BOARD_DIMENSIONS.y / 2);  //paddleAI , this is defender
  }

  private predictWallHit()
  {
    let opponent_xt = this.paddle.player == 1 ? this.gameState.p2Pos.x : this.gameState.p1Pos.x;
    
    if (!this.gameState.ballPos || !this.gameState.ballVel)
      return undefined;
    
    //1) where will ball strike on opponent wall?
    const oppWallHit = this.computeWallHit(
      this.gameState.ballPos.x,                         //x0: current ball pos.x on canvas
      opponent_xt,                                      //xt: wall of opponent
      this.gameState.ballPos.y,                         //y0: current ball pos.y on canvas
      this.gameState.ballVel.x,                         //vx: known ball vel.x
      this.gameState.ballVel.y                          //vy: known ball vel.y
    ) ?? (BOARD_DIMENSIONS.y/ 2) - (PADDLE_DIMENSIONS.y / 2);
    
    // console.log(`Computed wall hit on Player ${this.paddle.player}'s opponent wall ${oppWallHit}`); //OPPONENT WALLHIT DELETE ---------
    let index = this.getArrayIndex(oppWallHit);
    return this.dataBasedWallHit(index);
  }

  private computeWallHit(): number | undefined;
  private computeWallHit(x0: number, xt: number, y0: number, vx: number, vy: number): number | undefined;
  private computeWallHit(...args: any[]): number | undefined
  {
    let x0, xt, y0, yt, vx, vy;
    let dist = 0;

    if (args.length === 0) {
      if (!this.gameState.ballPos || !this.gameState.ballVel) return undefined;
      dist = this.calculateDistanceToWall();
      y0 = this.gameState.ballPos.y; //ball pos.y on canvas
      vx = this.gameState.ballVel.x; 
      vy = this.gameState.ballVel.y;
    } 
    else {
      [x0, xt, y0, vx, vy] = args;
      dist =  Math.abs(xt - x0); //if (vx > 0) then xt = 500 else 0
    }
    if (vx === 0) return undefined;
    yt = y0 + (dist * vy / Math.abs(vx));
    
    //account for bounces off ceiling and floor
    const bounces = Math.floor(Math.abs(yt) / BOARD_DIMENSIONS.y);
    const remainder = Math.abs(yt) % BOARD_DIMENSIONS.y;
    const hit = (bounces % 2 === 0) ? remainder : BOARD_DIMENSIONS.y - remainder;
    //console.log(`Inside computeWallHit(). ballpos.y ${y0}, ballvel.x ${vx}, ballvel.y ${vy}, yt ${yt}, dist ${dist}, hit ${hit}`); //DELETE -----
    return Math.round(hit);
  }

  //predictWall() will call this function
  private dataBasedWallHit(index: number) 
  {
    if (this.arrSize === 0)
      return undefined;
    
    let arr = this.predictionData[index]; //get array of targets for index, i.e. for hit on opponents wall
    // console.log(`Opp wall section index ${index} has defender targets-  ${arr}`); //DATA TARGETS DELETE -------------
    const countMap: {[key: number] : number} = {};
    let maxCount = 0;
    let maxValue: number | undefined = undefined;
    
    for (const num of arr) {
      countMap[num] = (countMap[num] || 0 ) + 1;
      if (countMap[num] > maxCount) {
        maxCount = countMap[num];
        maxValue = num;
      }
    }
    return maxValue;
  }


  /****************************/
  /**** 4. data collection ****/

  public collectData(defDataPoint: number, oppDataPoint: number) {
    let index = this.getArrayIndex(oppDataPoint);
    let data = this.getArrayIndex(defDataPoint);

    this.predictionData[index].push(data);
    // console.log(`PADDLE AI : def data point is ${defDataPoint} --> data is ${data}, opp data point is ${oppDataPoint} -> index is ${index}`); //DATA DELETE -----
  }

  //return wall section [sectioned into paddle segment sizes] where ball is expected to strike
  //remember wall is sectioned into paddle segment sizes, from 0 to 80
  private getArrayIndex(hit: number)
  {
    let wallSegmentHeight = PADDLE_DIMENSIONS.y / 8;
    let index = Math.floor(hit / wallSegmentHeight);
    return index;
  }

  //return point on wall determined by midpoint of wall section for given index
  private indexToTarget(index: number | undefined)
  {
    //console.log(`is the index undefined ${index}`); //DELETE ----------
    if (index === undefined)
      return (BOARD_DIMENSIONS.y/ 2 - PADDLE_DIMENSIONS.y / 2);
    let wallSegmentHeight = PADDLE_DIMENSIONS.y / 8;
    let target = Math.floor(wallSegmentHeight * (index + 0.5)); //0.5 for middle of wall section
    return target;
  }

//Game {}
//1) if scored on opponent side clear tempdata, --> checkForScore()
//2) if scored on defender side then capture data --> checkForScore()

}
