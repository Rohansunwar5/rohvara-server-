import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { QuizUserSessionRepository } from '../repository/quiz-user-session.repository';
import { ICreateQuizParams, IUpdateQuizParams, QuizRepository } from '../repository/quiz.repository';
import { UserRepository } from '../repository/user.repository';
import analyticsService from './analytics.service';
import { gameCacheManager } from './cache/entities';
import mailService from './mail.service';

class QuizService {
  constructor(private readonly _quizRepository: QuizRepository, private readonly _quizUserSessionRepository: QuizUserSessionRepository, private readonly _userRepository: UserRepository) {
  }

  async createCustomQuiz(params: ICreateQuizParams) {
    const {
      leaderboard, leaderboardLimit, questions, background, description, fontFamily,
      textSize, title, timerInSeconds, instructions, displayInstructions, logo
    } = params;
    const quiz = await this._quizRepository.create({ leaderboard, leaderboardLimit, questions, background, description, fontFamily, textSize, title, timerInSeconds, instructions, displayInstructions, logo });
    if (!quiz) throw new InternalServerError('Failed to create quiz');

    return quiz;
  }

  async updateCustomQuiz(params: IUpdateQuizParams) {
    const {
      leaderboard, leaderboardLimit, questions, background, quizId, userId,
      description, fontFamily, textSize, title, timerInSeconds, instructions, displayInstructions, logo
    } = params;
    const existingQuiz = (await this._quizRepository.get(quizId))[0];
    if (!existingQuiz || String(existingQuiz?.userId) !== userId) throw new BadRequestError('Invalid gameId or Unauthorized');

    const quiz = await this._quizRepository.update({ leaderboard, leaderboardLimit, questions, background, quizId, userId, description, fontFamily, textSize, title, timerInSeconds, instructions, displayInstructions, logo });
    if (!quiz) throw new InternalServerError('Failed to update quiz');

    await gameCacheManager.remove({ gameId: quizId });

    return quiz;
  }

  async getQuiz(params: { quizId: string, ip: string, country: string }) {
    const { country, ip, quizId } = params;

    const cached = await gameCacheManager.get({ gameId: quizId });
    if (!cached) {
      const quiz = (await this._quizRepository.get(quizId))[0];
      if (!quiz) throw new BadRequestError('Quiz not found');
      await gameCacheManager.set({ gameId: quizId }, quiz);
      analyticsService.recordImpression({ country, gameId: quizId, ip });

      return quiz;
    }
    analyticsService.recordImpression({ country, gameId: quizId, ip });

    return cached;
  }

  async addQuizToUserDashboard(userId: string, quizId: string) {
    const user = await this._userRepository.getUserById(userId);
    if (!user) throw new BadRequestError('No user found');

    const existingQuiz = (await this._quizRepository.get(quizId))[0];
    if (!existingQuiz) throw new BadRequestError('Quiz not found');
    if (existingQuiz.userId) {
      return existingQuiz;
    }

    const quiz = await this._quizRepository.addUserId(quizId, userId);
    if (!quiz) throw new InternalServerError('Failed to add game to user dashboard');

    mailService.sendEmail(user.email, 'quiz-user-linked.ejs', { firstName: user.firstName, quizId }, 'Extend your link access now! - WorkPlay Studio Pvt Ltd.');
    mailService.sendEmail(config.NOTIFY_TO, 'lead.ejs', { firstName: user.firstName, lastName: user.lastName, isdCode: user?.isdCode || 'NaN', phoneNumber: user?.phoneNumber || 'NaN', email: user.email, gameType: 'Custom Quiz', gameLink: `https://custom-quiz.workplay.digital/play?campaignId=${quizId}` }, 'New Lead');

    return quiz;
  }


  async quizUserSession(params: { quizId: string, fullName: string, email: string, score: number, duration: number }) {
    const { duration, email, fullName, quizId, score } = params;
    const session = await this._quizUserSessionRepository.create({ duration, email, fullName, quizId, score });
    if (!session) throw new InternalServerError('Failed to save');

    return session;
  }

  async quizLeaderboard(quizId: string) {
    const session = await this._quizUserSessionRepository.getLeaderboard(quizId);
    if (!session) throw new InternalServerError('Failed to save');

    return session;
  }

  async checkUserSessionExists(quizId: string, email: string) {
    const session = await this._quizUserSessionRepository.checkUserSessionExists(quizId, email);
    if (session) throw new BadRequestError('You\'ve already played the game');

    return true;
  }

  async getQuizSessions(quizId: string) {
    const sessions = await this._quizUserSessionRepository.getQuizSessions(quizId);

    return sessions;
  }
}


export default new QuizService(new QuizRepository(), new QuizUserSessionRepository(), new UserRepository());