'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/contexts/profile-context';
import { ProfileField } from './profile-field';
import { ProfileSkeleton } from './profile-skeleton';
import { User, Camera, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProfileForm() {
  const t = useTranslations('Profile');
  const { profile, loading, error, updateProfile, updateField } = useProfile();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();


  const handleFieldUpdate = async (field, value) => {
    // Update local state immediately for better UX
    updateField(field, value);
    
    // Update the entire profile
    const updatedProfile = { ...profile, [field]: value };
    await updateProfile(updatedProfile);
  };

  const handleSaveAll = async () => {
    const result = await updateProfile(profile);
    if (result.success) {
      toast.success('Profile saved successfully!');
    }
  };

  // Handle profile picture click
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Update profile with new avatar URL
      const updatedProfile = { ...profile, avatarUrl: data.url };
      updateField('avatarUrl', data.url);
      await updateProfile(updatedProfile);
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Card Self-Introduction</h1>
        <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
          <div className="text-center py-8">
            <p className="text-red-400">Error loading profile: {error}</p>
            <Button 
              variant="orange" 
              onClick={() => router.refresh()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Card Self-Introduction</h1>
      
      {/* Profile Header Card */}
      <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
        <div className="flex flex-col items-center py-4">
          {/* Avatar - Clickable for upload */}
          <div 
            className="relative w-24 h-24 bg-gray-600 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
            onClick={handleProfilePictureClick}
          >
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt="Profile Picture" 
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-12 h-12 bg-[#FF7D00] rounded-full flex items-center justify-center ${profile.avatarUrl ? 'hidden' : ''}`}>
              <User className="w-6 h-6 text-white" />
            </div>
            
            {/* Upload overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {/* Upload hint */}
          <p className="text-xs text-gray-400 mb-2">Click to upload profile picture</p>
          
          {/* User info */}
          <h2 className="text-2xl font-semibold text-white mb-1">
            {profile.displayName || 'Your Name'}
          </h2>
          <p className="text-gray-300 text-sm">
            {profile.university || 'School name'}
            {profile.department && profile.university && ' - '}
            {profile.department || ''}
          </p>
        </div>
      </Card>

      {/* Profile Fields Card */}
      <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
        <div className="space-y-2">
          <ProfileField 
            label="Display Name" 
            value={profile.displayName}
            field="displayName"
            placeholder="Enter your display name"
            onUpdate={handleFieldUpdate}
          />
          
          <ProfileField 
            label="Bio" 
            value={profile.bio}
            field="bio"
            type="textarea"
            placeholder="Tell us about yourself..."
            onUpdate={handleFieldUpdate}
          />
          
          <ProfileField 
            label="Birth Year" 
            value={profile.birthday}
            field="birthday"
            type="text"
            placeholder="Enter your birth year (e.g., 1995)"
            onUpdate={handleFieldUpdate}
          />
          
          <ProfileField 
            label="Interests & Hobbies" 
            value={profile.interests}
            field="interests"
            type="textarea"
            placeholder="Your interests are managed through hashtags and topics..."
            disabled={true}
            onUpdate={handleFieldUpdate}
          />
          
          <ProfileField 
            label="School/Organization" 
            value={profile.university}
            field="university"
            placeholder="Enter your school or organization"
            onUpdate={handleFieldUpdate}
          />
          
          <ProfileField 
            label="Department" 
            value={profile.department}
            field="department"
            placeholder="Enter your department"
            onUpdate={handleFieldUpdate}
          />
          
          <ProfileField 
            label="Country" 
            value={profile.country}
            field="country"
            placeholder="Enter your country"
            onUpdate={handleFieldUpdate}
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center pb-6">
        <Button 
          variant="orange"
          onClick={handleSaveAll}
          className="px-8 py-3 rounded-full shadow-lg"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}