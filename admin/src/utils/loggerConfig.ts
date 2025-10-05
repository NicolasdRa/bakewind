/**
 * Logging configuration for different environments
 * This file should be imported early in the application startup
 */

// Helper functions for conditional logging based on feature flags
import { configureLogger, LogLevel } from "./logger";

export function configureLogging() {
  // Use import.meta.env for Vite environment detection
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  const isTest = import.meta.env.MODE === "test";
  const debugEnabled = import.meta.env.VITE_DEBUG_ENABLED === 'true';

  if (isDevelopment) {
    // Development: Show all logs with full features
    configureLogger({
      level: LogLevel.DEBUG,
      enableTimestamps: true,
      enableStackTrace: true, // Show stack traces for errors in development
      enableColors: true,
    });

    console.info("🔧 Logging configured for development environment");
    console.info("📊 Log level: DEBUG (all logs will be shown)");
  } else if (isProduction) {
    // Production: Check if debug mode is explicitly enabled
    const logLevel = debugEnabled ? LogLevel.DEBUG : LogLevel.WARN;

    configureLogger({
      level: logLevel,
      enableTimestamps: true,
      enableStackTrace: debugEnabled, // Enable stack traces if debug is enabled
      enableColors: debugEnabled, // Enable colors if debug is enabled
    });

    console.info("🚀 Logging configured for production environment");
    if (debugEnabled) {
      console.warn("🔍 DEBUG MODE ENABLED IN PRODUCTION - All logs will be shown");
      console.warn("⚠️ This should only be used for troubleshooting production issues");
    } else {
      console.info("⚠️ Log level: WARN (only warnings and errors will be shown)");
    }
  } else if (isTest) {
    // Test: Minimal logging to avoid test output pollution
    configureLogger({
      level: LogLevel.ERROR,
      enableTimestamps: false,
      enableStackTrace: false,
      enableColors: false,
    });

    console.info("🧪 Logging configured for test environment");
    console.info("❌ Log level: ERROR (only errors will be shown)");
  } else {
    // Unknown environment: Use production-safe defaults
    configureLogger({
      level: LogLevel.WARN, // Changed from INFO to WARN for production safety
      enableTimestamps: true,
      enableStackTrace: false,
      enableColors: false,
    });
    console.warn(
      "⚠️ Unknown environment, using production-safe logging configuration",
    );
  }
}
