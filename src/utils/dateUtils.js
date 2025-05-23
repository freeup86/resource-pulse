import { format, differenceInDays, isValid, parseISO, addDays } from 'date-fns';

// Adjust date to local timezone at start of day and add a day
const adjustToLocalStartOfDay = (dateInput) => {
  if (!dateInput) return null;

  const date = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);

  if (!isValid(date)) return null;

  // Create a new date object at local midnight using UTC components
  const adjustedDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  // Add a day to compensate for timezone issues
  return addDays(adjustedDate, 1);
};

// Format a currency value with the specified currency code
export const formatCurrency = (value, currencyCode = 'USD') => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  try {
    // Format using Intl.NumberFormat for localized currency formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${value.toFixed(2)} ${currencyCode}`;
  }
};

// Format a date to display format
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';

  try {
    // If the input is already a Date object
    if (dateInput instanceof Date) {
      if (!isValid(dateInput)) return 'Invalid Date';
      
      // Create a new date object using UTC components to avoid timezone issues
      const utcDate = new Date(
        dateInput.getFullYear(),
        dateInput.getMonth(),
        dateInput.getDate(),
        12 // Set to noon to avoid any potential day boundary issues
      );
      
      return format(utcDate, 'MMM dd, yyyy');
    }
    
    // If the input is a string
    if (typeof dateInput === 'string') {
      // Parse ISO date string
      const parsedDate = parseISO(dateInput);

      if (!isValid(parsedDate)) {
        // Fallback to regular Date constructor if parseISO fails
        const fallbackDate = new Date(dateInput);
        if (!isValid(fallbackDate)) return 'Invalid Date';
        return format(fallbackDate, 'MMM dd, yyyy');
      }

      // Create a new date object using UTC components to avoid timezone issues
      const utcDate = new Date(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
        12 // Set to noon to avoid any potential day boundary issues
      );

      return format(utcDate, 'MMM dd, yyyy');
    }
    
    // If it's a number (timestamp)
    if (typeof dateInput === 'number') {
      const dateFromTimestamp = new Date(dateInput);
      if (!isValid(dateFromTimestamp)) return 'Invalid Date';
      return format(dateFromTimestamp, 'MMM dd, yyyy');
    }
    
    // If we get here, the input is of an unsupported type
    return 'Invalid Date Format';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Calculate days until a date
export const calculateDaysUntilEnd = (endDateStr) => {
  if (!endDateStr) return 0;

  try {
    // Parse the date using date-fns to handle ISO dates properly
    const endDate = parseISO(endDateStr);

    // Get current date (only the date part, without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create date without time component to avoid timezone issues
    // Use UTC components to ensure consistent date handling
    const endDateWithoutTime = new Date(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate()
    );
    endDateWithoutTime.setHours(0, 0, 0, 0);

    // Add 1 to include the end date itself in the count
    return differenceInDays(endDateWithoutTime, today) + 1;
  } catch (error) {
    console.error('Error calculating days until end:', error);
    // Try fallback method if parseISO fails
    try {
      const fallbackDate = new Date(endDateStr);
      // Use UTC components to ensure consistent date handling
      const fixedDate = new Date(
        fallbackDate.getUTCFullYear(),
        fallbackDate.getUTCMonth(),
        fallbackDate.getUTCDate()
      );
      fixedDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return differenceInDays(fixedDate, today) + 1;
    } catch {
      return 0;
    }
  }
};

// Determine if a date is within the next N days
export const isEndingSoon = (endDateStr, daysThreshold = 14) => {
  const daysLeft = calculateDaysUntilEnd(endDateStr);
  return daysLeft <= daysThreshold && daysLeft >= 0;
};