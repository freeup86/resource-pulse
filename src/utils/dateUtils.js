import { format, differenceInDays, isValid, parseISO } from 'date-fns';

// Format a date to display format
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    
    // Check if the date is valid
    if (!isValid(date)) {
      return 'Invalid Date';
    }
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Calculate days until a date
export const calculateDaysUntilEnd = (endDateStr) => {
  if (!endDateStr) return 0;
  
  try {
    const today = new Date();
    const endDate = typeof endDateStr === 'string' ? parseISO(endDateStr) : endDateStr;
    
    // Check if the date is valid
    if (!isValid(endDate)) {
      return 0;
    }
    
    return differenceInDays(endDate, today);
  } catch (error) {
    console.error('Error calculating days until end:', error);
    return 0;
  }
};

// Determine if a date is within the next N days
export const isEndingSoon = (endDateStr, daysThreshold = 14) => {
  const daysLeft = calculateDaysUntilEnd(endDateStr);
  return daysLeft <= daysThreshold && daysLeft >= 0;
};