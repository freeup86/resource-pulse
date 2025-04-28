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
    const date = adjustToLocalStartOfDay(dateStr);
    
    if (!date) return 'Invalid Date';
    
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
    const today = adjustToLocalStartOfDay(new Date());
    const endDate = adjustToLocalStartOfDay(endDateStr);
    
    if (!today || !endDate) return 0;
    
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