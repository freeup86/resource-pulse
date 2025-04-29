import { format, differenceInDays, isValid, parseISO, addDays } from 'date-fns';

// Adjust date to local timezone at start of day and add a day
const adjustToLocalStartOfDay = (dateInput) => {
  if (!dateInput) return null;
  
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
  
  if (!isValid(date)) return null;
  
  // Create a new date object at local midnight and add a day
  const adjustedDate = new Date(
    date.getFullYear(), 
    date.getMonth(), 
    date.getDate()
  );
  
  return addDays(adjustedDate, 1);
};

// Format a date to display format
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    
    if (!isValid(date)) return 'Invalid Date';
    
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
    // Reset time to start of day to avoid partial day calculations
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endDateStr);
    // Reset time to start of day to avoid partial day calculations 
    endDate.setHours(0, 0, 0, 0);
    
    // Add 1 to include the end date itself in the count
    return differenceInDays(endDate, today) + 1;
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