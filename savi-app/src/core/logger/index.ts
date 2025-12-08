import { logger, consoleTransport } from 'react-native-logs';

// Simple console-based logging for now
// File logging can be added later when needed
const config = {
  severity: __DEV__ ? 'debug' : 'info',
  transport: consoleTransport,
  transportOptions: {
    colors: {
      debug: 'white' as const,
      info: 'blueBright' as const,
      warn: 'yellowBright' as const,
      error: 'redBright' as const,
    },
  },
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  async: true,
  dateFormat: 'time' as const,
  printLevel: true,
  printDate: true,
  enabled: true,
};

const log = logger.createLogger(config);

// Create namespaced loggers for different parts of the app
export const appLogger = log.extend('app');
export const navLogger = log.extend('nav');
export const authLogger = log.extend('auth');
export const apiLogger = log.extend('api');
export const storeLogger = log.extend('store');

// Global error handler wrapper
export const logError = (context: string, error: unknown): void => {
  if (error instanceof Error) {
    appLogger.error(`[${context}] ${error.message}`, {
      stack: error.stack,
      name: error.name,
    });
  } else {
    appLogger.error(`[${context}]`, error);
  }
};

export default log;
