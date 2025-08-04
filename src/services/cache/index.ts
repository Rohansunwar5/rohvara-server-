import * as redis from 'redis';
import logger from '../../utils/logger';

// Replace these with your actual Redis Cloud credentials
const REDIS_URL = 'redis://default:Hie2Ze4t6SYBnozINBsJS2yeWWuURTz6@redis-13142.c62.us-east-1-4.ec2.redns.redis-cloud.com:13142';

const redisClient = redis.createClient({
  url: REDIS_URL,
  disableOfflineQueue: true,
});

redisClient.on('ready', () => {
  logger.info('Redis connected...');
});

redisClient.on('error', (err) => {
  logger.error('Failed to connect with redis ', err);
});

export default redisClient;
