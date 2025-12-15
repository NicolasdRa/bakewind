/**
 * Date utility functions using date-fns v4
 * Provides consistent date formatting and parsing across the application
 * Following date-fns v4 best practices with @date-fns/utc for timezone handling
 */

import { format, parseISO, parse } from 'date-fns';
import { UTCDate } from '@date-fns/utc';

/**
 * Format a date string (YYYY-MM-DD) to a readable local date
 * Uses UTCDate to avoid timezone interpretation issues
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Monday, January 15, 2024")
 */
export const formatLocalDate = (dateString: string): string => {
  // Split the date string to get year, month, day components
  const [year, month, day] = dateString.split('-').map(Number);
  // Create a date using UTCDate to avoid timezone shifts
  // Note: month is 0-indexed in JavaScript Date
  const date = new UTCDate(year, month - 1, day);
  return format(date, 'EEEE, MMMM d, yyyy');
};

/**
 * Format a date string to a short date format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatShortDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new UTCDate(year, month - 1, day);
  return format(date, 'MMM d, yyyy');
};

/**
 * Format an ISO timestamp to time only (in user's local timezone)
 * @param dateString - ISO timestamp string
 * @returns Formatted time string (e.g., "02:30 PM")
 */
export const formatTime = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  // parseISO correctly handles ISO 8601 timestamps with timezone info
  return format(parseISO(dateString), 'hh:mm a');
};

/**
 * Format an ISO timestamp to date and time (in user's local timezone)
 * @param dateString - ISO timestamp string
 * @returns Formatted datetime string (e.g., "Jan 15, 2024 02:30 PM")
 */
export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return format(parseISO(dateString), 'MMM d, yyyy hh:mm a');
};

/**
 * Format an ISO timestamp to long date and time (in user's local timezone)
 * @param dateString - ISO timestamp string
 * @returns Formatted datetime string (e.g., "Monday, January 15, 2024 at 02:30 PM")
 */
export const formatLongDateTime = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return format(parseISO(dateString), 'EEEE, MMMM d, yyyy \'at\' hh:mm a');
};

/**
 * Format an ISO timestamp in UTC timezone using UTCDate (date-fns v4)
 * Useful when displaying times in UTC (e.g., for consistent server times)
 * @param dateString - ISO timestamp string
 * @param formatString - date-fns format string
 * @returns Formatted datetime string in UTC
 */
export const formatInUTC = (
  dateString: string,
  formatString: string = 'MMM d, yyyy hh:mm a'
): string => {
  const date = parseISO(dateString);
  const utcDate = new UTCDate(date);
  return format(utcDate, formatString);
};

/**
 * Get current date in YYYY-MM-DD format for date inputs
 * @returns Current date string in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Parse a YYYY-MM-DD date string to a Date object (local timezone)
 * Uses parse() with explicit format (recommended by date-fns)
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object
 */
export const parseLocalDate = (dateString: string): Date => {
  return parse(dateString, 'yyyy-MM-dd', new Date());
};

/**
 * Format a Date object to YYYY-MM-DD format for API/database
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForApi = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Convert an ISO timestamp to UTC using UTCDate (date-fns v4)
 * @param dateString - ISO timestamp string
 * @returns UTCDate object
 */
export const toUTC = (dateString: string): UTCDate => {
  const date = parseISO(dateString);
  return new UTCDate(date);
};
