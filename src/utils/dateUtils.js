import { format, differenceInDays } from 'date-fns';

// Format a date to display format
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return format(date, 'MMM dd, yyyy');
};

// Calculate days until a date
export const calculateDaysUntilEnd = (endDateStr) => {
  const today = new Date();
  const endDate = new Date(endDateStr);
  return differenceInDays(endDate, today);
};

// Determine if a date is within the next N days
export const isEndingSoon = (endDateStr, daysThreshold = 14) => {
  const daysLeft = calculateDaysUntilEnd(endDateStr);
  return daysLeft <= daysThreshold && daysLeft >= 0;
};