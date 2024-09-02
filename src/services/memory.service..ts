import { InternalServerError } from '../errors/internal-server.error';
import { MemoryRepository } from '../repository/memory.repository';

export interface ICreateCustomMemoryGame {
  leaderboard: boolean,
  collectUserDetails: boolean,
  leaderboardLimit: number,
  background: {
    backgroundColor: string,
    textColor: string,
    primaryBColor: string,
    secondaryBColor: string,
    image: string,
  },
  logo: {
    image: string,
    websiteUrl: string
  },
  favicon: string,
  title: string,
  description: string,
  fontFamily: string,
  textSize: number,
  timerInSeconds: number,
  instructions: string[],
  displayInstructions: boolean,
  colums: number,
  rows: number,
  cardsImage: string[],
  challenges: string[],
  movesLimit: number,
  soundtrack: {
    enabled: boolean,
    file?: string
  },
  cards: {
    insideColor: string,
    coverType: string,
    coverColor?: string,
    coverImage?: string
  }
}

class MemoryService {
  constructor(private readonly _memoryRepository: MemoryRepository) { }

  async createCustomMemoryGame(params: ICreateCustomMemoryGame) {
    const {
      background, cards, cardsImage, challenges, collectUserDetails, colums, description, displayInstructions, favicon, fontFamily, instructions, leaderboard, leaderboardLimit, logo, movesLimit, rows, soundtrack, textSize, timerInSeconds, title
    } = params;

    const memoryGame = await this._memoryRepository.create({ background, cards, cardsImage, challenges, collectUserDetails, colums, description, displayInstructions, favicon, fontFamily, instructions, leaderboard, leaderboardLimit, logo, movesLimit, rows, soundtrack, textSize, timerInSeconds, title });
    if (!memoryGame) throw new InternalServerError('Failed to create memory game');

    return memoryGame;
  }

  // async getMemoryGame(params: { memoryGameId: string, ip: string, country: string }) {
  //   const { country, ip, memoryGameId } = params;

  //   const cached = await gameCacheManager.get({ gameId: memoryGameId });
  //   if (!cached) {
  //     const memoryGame = (await this._memoryRepository.get(memoryGameId))[0];
  //     if (!memoryGame) throw new BadRequestError('game not found');
  //     await gameCacheManager.set({ gameId: memoryGameId }, memoryGame);
  //     analyticsService.recordImpression({ country, gameId: memoryGameId, ip });

  //     return memoryGame;
  //   }
  //   analyticsService.recordImpression({ country, gameId: memoryGameId, ip });

  //   return cached;
  // }
}

export default new MemoryService(new MemoryRepository());