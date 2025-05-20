// Debug CORS configuration
import axios from 'axios';

/**
 * Debug function to test CORS configuration
 */
const debugCORS = async () => {
  console.log('CORS Debug: Testing API access...');
  
  // Get API URL
  const apiUrl = process.env.REACT_APP_API_URL || 'https://resource-pulse-backend.onrender.com/api';
  console.log('CORS Debug: Using API URL:', apiUrl);
  
  try {
    // Make a simple request to the API root endpoint (which doesn't require auth)
    console.log('CORS Debug: Making request to API root...');
    const response = await axios.get(`${apiUrl.replace(/\/api$/, '')}/`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('CORS Debug: API Response:', response.data);
    console.log('CORS Debug: No CORS issues detected with the API root');
    
    return response.data;
  } catch (error) {
    console.error('CORS Debug: Error accessing API:', error);
    
    // Check if it's a CORS error
    if (error.message && error.message.includes('CORS')) {
      console.error('CORS Debug: CORS issue detected!');
    }
    
    // Log more details about the error
    if (error.response) {
      console.error('CORS Debug: Response data:', error.response.data);
      console.error('CORS Debug: Response status:', error.response.status);
      console.error('CORS Debug: Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('CORS Debug: No response received from server');
    } else {
      console.error('CORS Debug: Error setting up request:', error.message);
    }
    
    return null;
  }
};

export default debugCORS;