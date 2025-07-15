'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useSettings from '@/hooks/useSettings';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import SchoolInfoUploadDialog from './SchoolInfoUploadDialog';

export default function SecuritySettings() {
  const { settings, loading, updateSetting } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showSchoolInfoDialog, setShowSchoolInfoDialog] = useState(false);
  const t = useTranslations('Settings');
  
  // Handle security toggle
  const handleSecurityToggle = async (key, value) => {
    setIsSaving(true);
    
    // Special handling for 2FA
    if (key === 'twoFactorAuth' && value === true) {
      setShowMfaSetup(true);
      setIsSaving(false);
      return;
    }
    
    await updateSetting(`security.${key}`, value);
    setIsSaving(false);
  };
  
  // Handle session timeout change
  const handleSessionTimeoutChange = async (value) => {
    setIsSaving(true);
    await updateSetting('security.sessionTimeout', parseInt(value, 10));
    setIsSaving(false);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <Card className="p-6 mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Account Security Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('accountSecurityTitle')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('twoFactorAuth')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('twoFactorAuthDesc')}</p>
            </div>
            <Switch 
              checked={settings?.security?.twoFactorAuth || false}
              onCheckedChange={(checked) => handleSecurityToggle('twoFactorAuth', checked)}
              disabled={isSaving}
            />
          </div>
          
          {showMfaSetup && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <h4 className="font-medium mb-2">{t('setupTwoFactorAuth')}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('setupTwoFactorAuthDesc')}
              </p>
              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowMfaSetup(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => {
                    // Here we would normally redirect to a 2FA setup page
                    // For now, we'll just simulate enabling 2FA
                    updateSetting('security.twoFactorAuth', true);
                    setShowMfaSetup(false);
                  }}
                >
                  {t('setupNow')}
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('loginAlerts')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('loginAlertsDesc')}</p>
            </div>
            <Switch 
              checked={settings?.security?.loginAlerts || false}
              onCheckedChange={(checked) => handleSecurityToggle('loginAlerts', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="font-medium">{t('sessionTimeout')}</label>
            <select 
              className="border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              value={settings?.security?.sessionTimeout || 30}
              onChange={(e) => handleSessionTimeoutChange(e.target.value)}
              disabled={isSaving}
            >
              <option value="1">{t('oneDay')}</option>
              <option value="7">{t('oneWeek')}</option>
              <option value="14">{t('twoWeeks')}</option>
              <option value="30">{t('oneMonth')}</option>
              <option value="90">{t('threeMonths')}</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('sessionTimeoutDesc')}</p>
          </div>
        </div>
      </Card>
      
      {/* Password Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('passwordTitle')}</h3>
        <div className="space-y-4">
          <Button variant="outline" className="w-full">
            {t('changePassword')}
          </Button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('passwordLastChanged', { date: '2023-04-15' })}
          </div>
        </div>
      </Card>
      
      {/* Academic Information Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">School Information</h3>
        <div className="space-y-4">
          {settings?.security?.academicInfo?.pendingVerification ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Under review</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your school information is under review, please wait patiently. Review usually takes 1-3 business days.
              </p>
            </div>
          ) : settings?.security?.academicInfo?.verified ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="font-medium text-green-800 dark:text-green-200">Verified</p>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="font-medium">Country/Region:</span> {settings.security.academicInfo.country}</p>
                <p><span className="font-medium">School:</span> {settings.security.academicInfo.school}</p>
                <p><span className="font-medium">Department:</span> {settings.security.academicInfo.department}</p>
              </div>
            </div>
          ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please upload documents that can prove your school and department.
                Customer service review takes 1-3 business days, and after approval, you can complete the addition/modification of school and department.
              </p>
          )}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowSchoolInfoDialog(true)}
            disabled={settings?.security?.academicInfo?.pendingVerification}
          >
            {settings?.security?.academicInfo?.verified ? 'Modify school information' : 'Upload school information'}
          </Button>
        </div>
      </Card>
      
      {/* Sessions Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('sessionsTitle')}</h3>
        <div className="space-y-4">
          <div className="p-4 border rounded-md dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{t('currentSession')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('device')}: {navigator.userAgent.includes('Windows') ? 'Windows' : 
                    navigator.userAgent.includes('Mac') ? 'Mac' : 
                    navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 'iOS' :
                    navigator.userAgent.includes('Android') ? 'Android' : 'Unknown'
                  }
                </p>
              </div>
              <div className="text-green-500 text-sm font-medium">
                {t('active')}
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            {t('logoutAllDevices')}
          </Button>
        </div>
      </Card>
      
      {/* School Info Upload Dialog */}
      <SchoolInfoUploadDialog 
        open={showSchoolInfoDialog} 
        onOpenChange={setShowSchoolInfoDialog} 
      />
    </div>
  );
} 