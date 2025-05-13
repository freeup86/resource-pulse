import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import EditProfileForm from './EditProfileForm';
import ChangePasswordForm from './ChangePasswordForm';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Fetch profile data on component mount only
  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        
        // Call the API service directly with a cache buster
        const profileData = await authService.getProfile();
        
        if (!isMounted) return;
        setProfile(profileData);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run once on mount

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      ...updatedProfile
    }));
  };

  const handleRefreshProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const refreshedProfile = await authService.getProfile();
      setProfile(refreshedProfile);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError('Failed to refresh profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
        <button 
          onClick={handleRefreshProfile} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (showEditProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EditProfileForm 
          profile={profile} 
          onUpdate={handleProfileUpdate} 
          onCancel={() => setShowEditProfile(false)} 
        />
      </div>
    );
  }

  if (showChangePassword) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ChangePasswordForm 
          onCancel={() => setShowChangePassword(false)} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-6 md:mb-0">
            <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              {currentUser?.firstName && currentUser?.lastName ? (
                <span className="text-3xl font-bold text-gray-600">
                  {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                </span>
              ) : (
                <span className="text-3xl font-bold text-gray-600">
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-center">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-gray-500 text-center">{profile?.role || currentUser?.role || 'User'}</p>
          </div>
          
          <div className="md:w-2/3 md:pl-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-medium mb-1">Username</label>
                <p className="text-gray-800">{profile?.username || 'N/A'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
                <p className="text-gray-800">{profile?.email || 'N/A'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-medium mb-1">First Name</label>
                <p className="text-gray-800">{profile?.firstName || 'N/A'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-medium mb-1">Last Name</label>
                <p className="text-gray-800">{profile?.lastName || 'N/A'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-medium mb-1">Role</label>
                <p className="text-gray-800">{profile?.role || 'User'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-medium mb-1">Last Login</label>
                <p className="text-gray-800">
                  {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-medium mb-1">Account Created</label>
                <p className="text-gray-800">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-x-4">
              <button 
                onClick={() => setShowEditProfile(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setShowChangePassword(true)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;