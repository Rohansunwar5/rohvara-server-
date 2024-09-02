import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { ISpinTheWheelCreateParams, IUpdateSpinTheWheelParams, SpinTheWheelRepository } from '../repository/spin.repository';
import { UserRepository } from '../repository/user.repository';
import analyticsService from './analytics.service';
import { gameCacheManager } from './cache/entities';
import mailService from './mail.service';

class SpinTheWheelService {
  constructor(private readonly _spinTheWheelRepository: SpinTheWheelRepository, private readonly _userRepository: UserRepository) {
  }

  async createSpinTheWheel(params: ISpinTheWheelCreateParams) {
    const {
      segments, background, winnersOnly, instructions, description,
      title, displayInstructions, secondaryColor, textColor, logo, favicon
    } = params;
    const spinTheWheel = await this._spinTheWheelRepository.create({ segments, background, winnersOnly, instructions, description, title, displayInstructions, secondaryColor, textColor, logo, favicon });
    if (!spinTheWheel) throw new InternalServerError('Failed to create game');

    return spinTheWheel;
  }

  async updateCustomSpinTheWheel(params: IUpdateSpinTheWheelParams) {
    const {
      segments, background, winnersOnly, userId, spinTheWheelId, instructions,
      description, title, displayInstructions, secondaryColor, textColor, logo, favicon
    } = params;
    const existingSpinTheWheel = (await this._spinTheWheelRepository.get(spinTheWheelId))[0];
    if (!existingSpinTheWheel || String(existingSpinTheWheel?.userId) !== userId) throw new BadRequestError('Invalid gameId or Unauthorized');

    const spinTheWheel = await this._spinTheWheelRepository.update({ segments, background, winnersOnly, userId, spinTheWheelId, instructions, description, title, displayInstructions, secondaryColor, textColor, logo, favicon });
    if (!spinTheWheel) throw new InternalServerError('Failed to update game');

    await gameCacheManager.remove({ gameId: spinTheWheelId });

    return spinTheWheel;
  }

  async getSpinTheWheel(params: { spinTheWheelId: string, ip: string, country: string }) {
    const { country, ip, spinTheWheelId } = params;

    const cached = await gameCacheManager.get({ gameId: spinTheWheelId });
    if (!cached) {
      const spinTheWheel = (await this._spinTheWheelRepository.get(spinTheWheelId))[0];
      if (!spinTheWheel) throw new BadRequestError('game not found');
      await gameCacheManager.set({ gameId: spinTheWheelId }, spinTheWheel);
      analyticsService.recordImpression({ country, gameId: spinTheWheelId, ip });

      return spinTheWheel;
    }
    analyticsService.recordImpression({ country, gameId: spinTheWheelId, ip });

    return cached;
  }

  async addSpinTheWheelToUserDashboard(userId: string, spinTheWheelId: string) {
    const user = await this._userRepository.getUserById(userId);
    if (!user) throw new BadRequestError('No user found');

    const existingSpinTheWheel = (await this._spinTheWheelRepository.get(spinTheWheelId))[0];
    if (!existingSpinTheWheel) throw new BadRequestError('game not found');
    if (existingSpinTheWheel.userId) {
      return existingSpinTheWheel;
    }

    const spinTheWheel = await this._spinTheWheelRepository.addUserId(userId, spinTheWheelId);
    if (!spinTheWheel) throw new BadRequestError('game not found');

    mailService.sendEmail(user.email, 'spin-user-linked.ejs', { firstName: user.firstName, spinTheWheelId }, 'Extend your link access now! - WorkPlay Studio Pvt Ltd.');
    mailService.sendEmail(config.NOTIFY_TO, 'lead.ejs', { firstName: user.firstName, lastName: user.lastName, isdCode: user?.isdCode || 'NaN', phoneNumber: user?.phoneNumber || 'NaN', email: user.email, gameType: 'Custom Spin The Wheel', gameLink: `https://dev-custom-spin.workplay.digital/play?campaignId=${spinTheWheelId}` }, 'New Lead');

    return spinTheWheel;
  }

  async spinTheWheelUserSession(params: { email: string, spinTheWheelId: string, prize: string, fullName?: string, isWinner: boolean }) {
    const { prize, spinTheWheelId, email, fullName, isWinner } = params;
    const userSessionExists = await this._spinTheWheelRepository.spinTheWheelUserSessionExists(email, spinTheWheelId);
    if (userSessionExists) throw new BadRequestError('Can\'t participate again');

    const newSession = await this._spinTheWheelRepository.spinTheWheelUserSession({ email, isWinner, prize, spinTheWheelId, fullName });
    if (!newSession) throw new InternalServerError('Failed to create session');

    return newSession;
  }

  async getSpinSessions(spinTheWheelId: string) {
    const sessions = await this._spinTheWheelRepository.getSpinSessions(spinTheWheelId);

    return sessions;
  }


  async checkSpinTheWheelUserSessionExists(spinTheWheelId: string, email: string) {
    const session = await this._spinTheWheelRepository.spinTheWheelUserSessionExists(email, spinTheWheelId);
    if (session) throw new BadRequestError('You\'ve already played the game');

    return true;
  }

}

export default new SpinTheWheelService(new SpinTheWheelRepository(), new UserRepository());