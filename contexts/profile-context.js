'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

// Profile context
const ProfileContext = createContext();

// Profile reducer
const profileReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_FIELD':
      return {
        ...state,
        profile: { ...state.profile, [action.field]: action.value }
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

// Initial state
const initialState = {
  profile: {
    displayName: '',
    email: '',
    gender: '',
    bio: '',
    birthday: null,
    relationshipStatus: 'prefer_not_to_say',
    interests: '',
    university: '',
    department: '',
    favoriteQuotes: '',
    favoriteCountry: '',
    dailyActiveTime: 'varies',
    studyAbroad: 'no',
    leisureActivities: '',
    avatarUrl: '',
    country: ''
  },
  loading: true,
  error: null
};

// Profile provider component
export function ProfileProvider({ children }) {
  const [state, dispatch] = useReducer(profileReducer, initialState);
  const { user, status } = useAuth();
  const pathname = usePathname();
  const isAdminRoute = pathname.includes('/admin');
  const isBusinessRoute = pathname.includes('/business');

  // Fetch profile data
  const fetchProfile = async () => {
    if (status !== 'authenticated' || !user?.id) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      if (isAdminRoute) {
        const adminResponse = await fetch(`/api/admin/${user.id}/profile`);
        if (!adminResponse.ok) {
          throw new Error(`HTTP error! status: ${adminResponse.status}`);
        }
        const adminData = await adminResponse.json();
        dispatch({ type: 'SET_PROFILE', payload: adminData.profile });
      } else if (isBusinessRoute) {
        const businessResponse = await fetch(`/api/business/${user.id}/profile`);
        if (!businessResponse.ok) {
          throw new Error(`HTTP error! status: ${businessResponse.status}`);
        }
        const businessData = await businessResponse.json();
        dispatch({ type: 'SET_PROFILE', payload: businessData.profile });
      } else {
        const response = await fetch(`/api/users/${user.id}/profile`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        dispatch({ type: 'SET_PROFILE', payload: userData.profile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error('Failed to load profile data');
    }
  };

  // Update profile data
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      if (isAdminRoute) {
        const adminResponse = await fetch(`/api/admin/${user.id}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });

        if (!adminResponse.ok) {
          throw new Error(`HTTP error! status: ${adminResponse.status}`);
        }

        const adminData = await adminResponse.json();
        dispatch({ type: 'SET_PROFILE', payload: adminData.profile });
      } else if (isBusinessRoute) {
        const businessResponse = await fetch(`/api/business/${user.id}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });

        if (!businessResponse.ok) {
          throw new Error(`HTTP error! status: ${businessResponse.status}`);
        }

        const businessData = await businessResponse.json();
        dispatch({ type: 'SET_PROFILE', payload: businessData.profile });
      } else {
        const response = await fetch(`/api/users/${user.id}/profile`, {
          method: 'PUT',
          headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        dispatch({ type: 'SET_PROFILE', payload: userData.profile });
      }

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error(error.message || 'Failed to update profile');
      return { success: false, error: error.message };
    }
  };

  // Update single field
  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  // Fetch profile on mount and when session changes
  useEffect(() => {
    if (status !== 'loading') {
      fetchProfile();
    }
  }, [status, user?.id]);

  // Reset state when user logs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      dispatch({ type: 'RESET' });
    }
  }, [status]);

  const value = {
    ...state,
    updateProfile,
    updateField,
    refetch: fetchProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

// Custom hook to use profile context
export function useProfile() {
  const context = useContext(ProfileContext);
  
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  
  return context;
}