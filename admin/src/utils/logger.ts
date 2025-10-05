// Enhanced logging utility with multiple levels and features - Functional implementation
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableStackTrace: boolean;
  enableColors: boolean;
}

// Logger state - using module-level variables for functional approach
let loggerConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  enableTimestamps: true,
  enableStackTrace: false,
  enableColors: true,
};

// Initialize logger
const initializeLogger = (config: Partial<LoggerConfig> = {}) => {
  loggerConfig = {
    ...loggerConfig,
    ...config,
  };
};

// Helper functions
const formatMessage = (level: LogLevel, message: string): string => {
  let formatted = "";

  // Add timestamp if enabled
  if (loggerConfig.enableTimestamps) {
    const timestamp = new Date().toISOString();
    formatted += `[${timestamp}] `;
  }

  // Add log level
  const levelName = LogLevel[level];
  formatted += `[${levelName}] `;

  // Add message
  formatted += message;

  return formatted;
};

const getColorForLevel = (level: LogLevel): string => {
  if (!loggerConfig.enableColors) return "";

  switch (level) {
    case LogLevel.DEBUG:
      return "color: #f8f8f8;"; // Gray
    case LogLevel.INFO:
      return "color: #2196F3;"; // Blue
    case LogLevel.WARN:
      return "color: #FF9800;"; // Orange
    case LogLevel.ERROR:
      return "color: #F44336;"; // Red
    default:
      return "";
  }
};

const logInternal = (
  level: LogLevel,
  message: string,
  data?: any,
  stackTrace?: string,
): void => {
  // Check if this log level should be output
  if (level < loggerConfig.level) return;

  const formattedMessage = formatMessage(level, message);

  // Output to console based on level
  const color = getColorForLevel(level);

  // Prepare console arguments - if we have data, pass it as separate argument for expandability
  let consoleArgs: any[];
  if (color) {
    consoleArgs =
      data !== undefined
        ? [`%c${formattedMessage}`, color, data]
        : [`%c${formattedMessage}`, color];
  } else {
    consoleArgs =
      data !== undefined ? [formattedMessage, data] : [formattedMessage];
  }

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(...consoleArgs);
      break;
    case LogLevel.INFO:
      console.info(...consoleArgs);
      break;
    case LogLevel.WARN:
      console.warn(...consoleArgs);
      break;
    case LogLevel.ERROR:
      console.error(...consoleArgs);
      if (loggerConfig.enableStackTrace && stackTrace) {
        console.error("Stack trace:", stackTrace);
      }
      break;
  }
};

// Core logging functions
const debug = (message: string, data?: any): void => {
  logInternal(LogLevel.DEBUG, message, data);
};

const info = (message: string, data?: any): void => {
  logInternal(LogLevel.INFO, message, data);
};

const warn = (message: string, data?: any): void => {
  const stackTrace = loggerConfig.enableStackTrace
    ? new Error().stack
    : undefined;
  logInternal(LogLevel.WARN, message, data, stackTrace);
};

const error = (message: string, data?: any): void => {
  const stackTrace = loggerConfig.enableStackTrace
    ? new Error().stack
    : undefined;
  logInternal(LogLevel.ERROR, message, data, stackTrace);
};

// Convenience methods for specific use cases
const websocketLog = (message: string, data?: any): void => {
  debug(`🔌 WebSocket: ${message}`, data);
};

const audioLog = (message: string, data?: any): void => {
  debug(`🔊 Audio: ${message}`, data);
};

const navigationLog = (message: string, data?: any): void => {
  debug(`🧭 Navigation: ${message}`, data);
};

const metadataLog = (message: string, data?: any): void => {
  debug(`📊 Metadata: ${message}`, data);
};

const authLog = (message: string, data?: any): void => {
  info(`🔐 Auth: ${message}`, data);
};

const apiLog = (message: string, data?: any): void => {
  debug(`🌐 API: ${message}`, data);
};

const realtimeLog = (message: string, data?: any): void => {
  debug(`⚡ Realtime: ${message}`, data);
};

const uiLog = (message: string, data?: any): void => {
  debug(`🎨 UI: ${message}`, data);
};

const storeLog = (message: string, data?: any): void => {
  debug(`📦 Store: ${message}`, data);
};

// Utility functions
const setLevel = (level: LogLevel): void => {
  loggerConfig.level = level;
};

const getLevel = (): LogLevel => {
  return loggerConfig.level;
};

// Performance measurement utilities
const time = (label: string): void => {
  console.time(label);
};

const timeEnd = (label: string): void => {
  console.timeEnd(label);
};

// Group logging for better organization
const group = (label: string): void => {
  console.group(label);
};

const groupEnd = (): void => {
  console.groupEnd();
};

// Main logger object - this is the primary export
export const logger = {
  debug,
  info,
  warn,
  error,
  websocket: websocketLog,
  audio: audioLog,
  navigation: navigationLog,
  metadata: metadataLog,
  auth: authLog,
  api: apiLog,
  realtime: realtimeLog,
  ui: uiLog,
  store: storeLog,
  setLevel,
  getLevel,
  time,
  timeEnd,
  group,
  groupEnd,
};

// Backward compatibility - keep the original log function
export const log = (...args: any[]) => {
  if (args.length === 1 && typeof args[0] === "string") {
    logger.info(args[0]);
  } else {
    logger.info(args.join(" "));
  }
};

// Configuration functions
export const configureLogger = (config: Partial<LoggerConfig>) => {
  initializeLogger(config);
};

// Initialize with default config
initializeLogger();
