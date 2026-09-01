import pino from 'pino';

// Configuration du logger Pino
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // En prod, pino écrit en JSON brut pour l'agrégation
});

// Middleware de logging des requêtes HTTP
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logData = { method, url: originalUrl, status: statusCode, duration_ms: ms };

    if (statusCode >= 500) {
      logger.error(logData, `[HTTP] ${method} ${originalUrl} -> ${statusCode} (${ms}ms)`);
    } else if (statusCode >= 400) {
      logger.warn(logData, `[HTTP] ${method} ${originalUrl} -> ${statusCode} (${ms}ms)`);
    } else {
      logger.info(logData, `[HTTP] ${method} ${originalUrl} -> ${statusCode} (${ms}ms)`);
    }
  });
  next();
};

export default logger;
