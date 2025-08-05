import Bull from 'bull';
import { SessionRepository } from '../../repository/session.repository';
import { DeviceRepository } from '../../repository/device.repository';
import { CommandQueueRepository } from '../../repository/commandQueue.repository';
import { TransactionRepository } from '../../repository/transaction.repository';
import { PlayerRepository } from '../../repository/player.repository';
import { SessionStatus, EndedBy } from '../../models/session.model';
import { DeviceStatus } from '../../models/device.model';
import { CommandType } from '../../models/commandQueue.model';
import logger from '../../utils/logger';

interface SessionExpiryJobData {
    sessionId: string;
    loungeId: string;
    playerId: string;
    deviceId: string;
    pcId: string;
    playerUsername: string;
    allocatedMinutes: number;
}

interface SessionWarningJobData {
    sessionId: string;
    loungeId: string;
    pcId: string;
    remainingMinutes: number;
    playerUsername: string;
}

class SessionQueueService {
    private sessionExpiryQueue: Bull.Queue<SessionExpiryJobData>;
    private sessionWarningQueue: Bull.Queue<SessionWarningJobData>;
    private isInitialized = false;

    constructor(
        private readonly _sessionRepository: SessionRepository,
        private readonly _deviceRepository: DeviceRepository,
        private readonly _commandQueueRepository: CommandQueueRepository,
        private readonly _transactionRepository: TransactionRepository,
        private readonly _playerRepository: PlayerRepository
    ) {
        const redisConfig = {
            redis: {
                host: 'redis-13142.c62.us-east-1-4.ec2.redns.redis-cloud.com',
                port: 13142,
                password: 'Hie2Ze4t6SYBnozINBsJS2yeWWuURTz6',
                username: 'default'
            }
        };

        this.sessionExpiryQueue = new Bull('session-expiry', redisConfig);
        this.sessionWarningQueue = new Bull('session-warning', redisConfig);
    }

    async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('SessionQueueService already initialized');
      return;
    }

    try {
      // Set up job processors
      this.setupSessionExpiryProcessor();
      this.setupSessionWarningProcessor();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('SessionQueueService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SessionQueueService:', error);
      throw error;
    }
  }

    private setupSessionExpiryProcessor(): void {
        this.sessionExpiryQueue.process(async (job) => {
            const { sessionId, loungeId, deviceId, pcId } = job.data;

            try {
                logger.info(`Processing session expiry for session: ${sessionId}`);

                const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
                if (!session || session.status !== SessionStatus.ACTIVE) {
                    logger.info(`Session ${sessionId} is no longer active, skipping expiry`);
                    return;
                }

                await this._sessionRepository.endSession(
                    loungeId,
                    sessionId,
                    EndedBy.TIMEOUT,
                    'Session expired - time limit reached'
                );

                await this._deviceRepository.updateDeviceStatus(loungeId, {
                    device_id: deviceId,
                    status: DeviceStatus.AVAILABLE,
                    current_user_id: null,
                    current_session_id: null
                });

                await this._commandQueueRepository.createCommand(loungeId, {
                    pc_id: pcId,
                    command: CommandType.END_SESSION,
                    data: {
                        session_id: sessionId,
                        message: 'Session expired - time limit reached'
                    },
                    created_by_id: 'system'
                });

                await this._commandQueueRepository.createCommand(loungeId, {
                    pc_id: pcId,
                    command: CommandType.LOCK_PC,
                    data: {
                        message: 'Session time expired'
                    },
                    created_by_id: 'system'
                });

                logger.info(`Successfully processed session expiry for session: ${sessionId}`);

            } catch (error) {
                logger.error(`Error processing session expiry for session ${sessionId}:`, error);
                throw error;
            }
        });
    }

    private setupSessionWarningProcessor(): void {
        this.sessionWarningQueue.process(async (job) => {
        const { sessionId, loungeId, pcId, remainingMinutes } = job.data;

        try {
            logger.info(`Processing session warning for session: ${sessionId}`);

            // Check if session is still active
            const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
            if (!session || session.status !== SessionStatus.ACTIVE) {
            logger.info(`Session ${sessionId} is no longer active, skipping warning`);
            return;
            }

            // Send warning announcement to PC
            await this._commandQueueRepository.createCommand(loungeId, {
            pc_id: pcId,
            command: CommandType.ANNOUNCEMENT,
            data: {
                message: `Warning: Your session will expire in ${remainingMinutes} minutes. Please save your work or add more credits.`
            },
            created_by_id: 'system'
            });

            logger.info(`Successfully sent warning for session: ${sessionId}`);
        } catch (error) {
            logger.error(`Error processing session warning for session ${sessionId}:`, error);
            throw error;
        }
        });
    }

    private setupEventListeners(): void {
        this.sessionExpiryQueue.on('completed', (job) => {
        logger.info(`Session expiry job completed for session: ${job.data.sessionId}`);
        });

        this.sessionExpiryQueue.on('failed', (job, err) => {
        logger.error(`Session expiry job failed for session: ${job.data.sessionId}`, err);
        });

        this.sessionWarningQueue.on('completed', (job) => {
        logger.info(`Session warning job completed for session: ${job.data.sessionId}`);
        });

        this.sessionWarningQueue.on('failed', (job, err) => {
        logger.error(`Session warning job failed for session: ${job.data.sessionId}`, err);
        });
    }

    async scheduleSessionExpiry(params: {
        sessionId: string;
        loungeId: string;
        playerId: string;
        deviceId: string;
        pcId: string;
        playerUsername: string;
        allocatedMinutes: number;
        warningMinutes?: number;
    }): Promise<void> {
        const { sessionId, loungeId, playerId, deviceId, pcId, playerUsername, allocatedMinutes, warningMinutes = 5 } = params;

        try {
            const expiryDelay = allocatedMinutes * 60 * 1000;
            await this.sessionExpiryQueue.add(
                {
                    sessionId,
                    loungeId,
                    playerId,
                    deviceId,
                    pcId,
                    playerUsername,
                    allocatedMinutes
                    },
                    {
                    delay: expiryDelay,
                    jobId: `expiry-${sessionId}`,
                    removeOnComplete: true,
                    removeOnFail: false,
                    attempts: 3,
                    backoff: {
                        type: 'fixed',
                        delay: 5000
                    }
                }
            );

            if (warningMinutes < allocatedMinutes) {
                const warningDelay = (allocatedMinutes - warningMinutes) * 60 * 1000;
                await this.sessionWarningQueue.add(
                {
                    sessionId,
                    loungeId,
                    pcId,
                    remainingMinutes: warningMinutes,
                    playerUsername
                },
                {
                    delay: warningDelay,
                    jobId: `warning-${sessionId}`,
                    removeOnComplete: true,
                    removeOnFail: false,
                    attempts: 3,
                    backoff: {
                    type: 'fixed',
                    delay: 5000
                    }
                }
                );
            }

            logger.info(`Scheduled session expiry for session ${sessionId} in ${allocatedMinutes} minutes`);

        } catch (error) {
            logger.error(`Failed to schedule session expiry for session ${sessionId}:`, error);
            throw error;
        }

    }

    async cancelSessionJobs(sessionId: string): Promise<void> {
        try {
            const expiryJob = await this.sessionExpiryQueue.getJob(`expiry-${sessionId}`);
            if (expiryJob) {
                await expiryJob.remove();
                logger.info(`Cancelled expiry job for session: ${sessionId}`);
            }

            // Cancel warning job
            const warningJob = await this.sessionWarningQueue.getJob(`warning-${sessionId}`);
            if (warningJob) {
                await warningJob.remove();
                logger.info(`Cancelled warning job for session: ${sessionId}`);
            }
        } catch (error) {
            logger.error(`Failed to cancel jobs for session ${sessionId}:`, error);
            throw error;
        }
    }

    async extendSessionSchedule(params: {
        sessionId: string;
        loungeId: string;
        additionalMinutes: number;
        totalRemainingMinutes: number;
        pcId: string;
        playerUsername: string;
        warningMinutes?: number;
    }) : Promise<void> {
        const { sessionId, loungeId, additionalMinutes, totalRemainingMinutes, pcId, playerUsername, warningMinutes = 5 } = params;

        try {
            await this.cancelSessionJobs(sessionId);

            const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
            if (!session) throw new Error('Session not found');

            await this.scheduleSessionExpiry({ sessionId, loungeId, playerId: session.player_id, deviceId: session.device_id, pcId, playerUsername, allocatedMinutes: totalRemainingMinutes, warningMinutes });

            logger.info(`Extended session ${sessionId} by ${additionalMinutes} minutes`);
        } catch (error) {
            logger.error(`Failed to extend session schedule for session ${sessionId}:`, error);
            throw error;
        }
    }

    async shutdown(): Promise <void> {
        try {
            logger.info('Shutting down SessionQueueService......');

            await Promise.all([
                this.sessionExpiryQueue.close(),
                this.sessionWarningQueue.close()
            ]);

            this.isInitialized = false;
            logger.info('SessionQueueService shutdown complete');
        } catch (error) {
            logger.error('Error during SessionQueueService shutdown:', error);
            throw error;
        }
    }

    async getQueueStats(): Promise <{
        expiryQueue: { active: number; waiting: number; delayed: number };
        warningQueue: { active: number; waiting: number; delayed: number };
    }> {
        const [expiryActive, expiryWaiting, expiryDelayed] = await Promise.all([
        this.sessionExpiryQueue.getActiveCount(),
        this.sessionExpiryQueue.getWaitingCount(),
        this.sessionExpiryQueue.getDelayedCount()
        ]);

        const [warningActive, warningWaiting, warningDelayed] = await Promise.all([
        this.sessionWarningQueue.getActiveCount(),
        this.sessionWarningQueue.getWaitingCount(),
        this.sessionWarningQueue.getDelayedCount()
        ]);

        return {
            expiryQueue: {
                active: expiryActive,
                waiting: expiryWaiting,
                delayed: expiryDelayed
            },
            warningQueue: {
                active: warningActive,
                waiting: warningWaiting,
                delayed: warningDelayed
            }
        };
    }
}

export default SessionQueueService;