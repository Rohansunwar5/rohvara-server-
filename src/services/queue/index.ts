import { CommandQueueRepository } from '../../repository/commandQueue.repository';
import { DeviceRepository } from '../../repository/device.repository';
import { PlayerRepository } from '../../repository/player.repository';
import { SessionRepository } from '../../repository/session.repository';
import { TransactionRepository } from '../../repository/transaction.repository';
import logger from '../../utils/logger';
import SessionQueueService from './sessionQueue.service';

let sessionQueueService: InstanceType<typeof SessionQueueService> | null = null;

export const initializeQueueServices = async (repositories: {
  sessionRepository: SessionRepository;
  deviceRepository: DeviceRepository;
  commandQueueRepository: CommandQueueRepository;
  transactionRepository: TransactionRepository;
  playerRepository: PlayerRepository;
}): Promise<InstanceType<typeof SessionQueueService>> => {
  try {
    if (sessionQueueService) {
      logger.warn('Queue services already initialized');
      return sessionQueueService;
    }

    const {
      sessionRepository,
      deviceRepository,
      commandQueueRepository,
      transactionRepository,
      playerRepository
    } = repositories;

    // Create queue service instance
    sessionQueueService = new SessionQueueService(
      sessionRepository,
      deviceRepository,
      commandQueueRepository,
      transactionRepository,
      playerRepository
    );

    // Initialize in a non-blocking way
    setImmediate(async () => {
      try {
        await sessionQueueService!.initialize();
        logger.info('Queue services initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize queue services:', error);
      }
    });

    return sessionQueueService;
  } catch (error) {
    logger.error('Error creating queue services:', error);
    throw error;
  }
};

export const getSessionQueueService = (): InstanceType<typeof SessionQueueService> => {
  if (!sessionQueueService) {
    throw new Error('SessionQueueService not initialized. Call initializeQueueServices first.');
  }
  return sessionQueueService;
};

export const shutdownQueueServices = async (): Promise<void> => {
  if (sessionQueueService) {
    await sessionQueueService.shutdown();
    sessionQueueService = null;
  }
};