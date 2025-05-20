// Frontend debug script for profile fetching
import axios from 'axios';

/**
 * Debug function to test profile fetching from the frontend
 */
const debugProfileFetch = async () => {
  console.log('Frontend Debug: Testing profile fetch...');
  
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Frontend Debug: No token found in localStorage. User is not logged in.');
    return;
  }
  
  // Get the current user from localStorage
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    console.error('Frontend Debug: No user data found in localStorage.');
    return;
  }
  
  const user = JSON.parse(userJson);
  console.log('Frontend Debug: Current user from localStorage:', user);
  
  // Get API URL
  const apiUrl = process.env.REACT_APP_API_URL || 'https://resource-pulse-backend.onrender.com/api';
  console.log('Frontend Debug: Using API URL:', apiUrl);
  
  try {
    // Make a direct request to the profile endpoint
    console.log('Frontend Debug: Making direct request to profile endpoint...');
    const response = await axios.get(`${apiUrl}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: { _t: new Date().getTime() } // Add cache buster
    });
    
    console.log('Frontend Debug: Profile API Response:', response.data);
    
    // Compare with the stored user data
    const storedUser = user;
    const apiUser = response.data;
    
    console.log('Frontend Debug: Comparison of stored user vs API response:');
    console.log('ID match:', storedUser.id === apiUser.id);
    console.log('Username match:', storedUser.username === apiUser.username);
    console.log('Email match:', storedUser.email === apiUser.email);
    console.log('First Name match:', storedUser.firstName === apiUser.firstName);
    console.log('Last Name match:', storedUser.lastName === apiUser.lastName);
    console.log('Role match:', storedUser.role === apiUser.role);
    
    console.log('Frontend Debug: Test completed successfully');
    return response.data;
  } catch (error) {
    console.error('Frontend Debug: Error fetching profile:', error);
    
    // Log more details about the error
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error('Frontend Debug: Response data:', error.response.data);
      console.error('Frontend Debug: Response status:', error.response.status);
      console.error('Frontend Debug: Response headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response was received
      console.error('Frontend Debug: No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Frontend Debug: Error setting up request:', error.message);
    }
    
    return null;
  }
};

export default debugProfileFetch;