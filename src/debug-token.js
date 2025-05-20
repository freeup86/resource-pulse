// Debug JWT token
import jwt_decode from 'jwt-decode';

/**
 * Debug function to check JWT token
 */
const debugToken = () => {
  console.log('Token Debug: Examining stored JWT token...');
  
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token Debug: No token found in localStorage. User is not logged in.');
    return null;
  }
  
  try {
    // Decode the token (without verification)
    const decoded = jwt_decode(token);
    console.log('Token Debug: Decoded token:', decoded);
    
    // Check token expiration
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      console.error('Token Debug: Token has expired!');
      console.log('Token Debug: Expiration time:', new Date(decoded.exp * 1000).toLocaleString());
      console.log('Token Debug: Current time:', new Date().toLocaleString());
    } else {
      console.log('Token Debug: Token is valid (not expired)');
      console.log('Token Debug: Expiration time:', new Date(decoded.exp * 1000).toLocaleString());
      console.log('Token Debug: Current time:', new Date().toLocaleString());
      console.log('Token Debug: Time remaining:', Math.round((decoded.exp - currentTime) / 60), 'minutes');
    }
    
    // Check if token has required fields
    const requiredFields = ['userId', 'username', 'email', 'role'];
    const missingFields = requiredFields.filter(field => !decoded[field]);
    
    if (missingFields.length > 0) {
      console.error('Token Debug: Token is missing required fields:', missingFields);
    } else {
      console.log('Token Debug: Token contains all required fields');
    }
    
    return decoded;
  } catch (error) {
    console.error('Token Debug: Error decoding token:', error);
    console.error('Token Debug: Invalid token format');
    return null;
  }
};

export default debugToken;