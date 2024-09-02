import memoryModel from '../models/memory.model';
import { ICreateCustomMemoryGame } from '../services/memory.service.';

export class MemoryRepository {
  private _model = memoryModel;

  async create(params: ICreateCustomMemoryGame) {
    const { background, cards, cardsImage, challenges, collectUserDetails, colums, description, displayInstructions, favicon, fontFamily, instructions, leaderboard, leaderboardLimit, logo, movesLimit, rows, soundtrack, textSize, timerInSeconds, title } = params;

    return this._model.create({ background, cards, cardsImage, challenges, collectUserDetails, colums, description, displayInstructions, favicon, fontFamily, instructions, leaderboard, leaderboardLimit, logo, movesLimit, rows, soundtrack, textSize, timerInSeconds, title });
  }
}