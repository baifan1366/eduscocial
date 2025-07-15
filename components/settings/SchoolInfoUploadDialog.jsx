'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import useSettings from '@/hooks/useSettings';

export default function SchoolInfoUploadDialog({ open, onOpenChange }) {
  const [country, setCountry] = useState('');
  const [school, setSchool] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { settings, updateSetting } = useSettings();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size cannot exceed 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only JPG, PNG, GIF, and PDF files are supported');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!country || !school || !department || !file) {
      setError('Please fill in all required fields and upload proof documents');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `school-verification/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);
        
      if (uploadError) {
        throw new Error('File upload failed');
      }
      
      // Update user settings
      await updateSetting('security.academicInfo', {
        country,
        school,
        department,
        verified: false,
        pendingVerification: true,
        documentPath: filePath,
        submittedAt: new Date().toISOString()
      });
      
      // Close dialog
      onOpenChange(false);
      
    } catch (err) {
      console.error('Error submitting school info:', err);
      setError('Submission failed, please try again later');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">上传学校资料</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-5">
          <p className="text-sm text-gray-500">
            Please upload documents that can prove your school and department.
            Customer service review takes 1-3 business days, and after approval, you can complete the addition/modification of school and department.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">School Location</label>
              <select
                className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isSubmitting}
              >
             <option value="">Select a country/region</option>
             <option value="Malaysia">Malaysia</option>
             <option value="China">China</option>
             <option value="Hong Kong">Hong Kong</option>
             <option value="Singapore">Singapore</option>
             <option value="USA">USA</option>
             <option value="UK">UK</option>
             <option value="Australia">Australia</option>
             <option value="Canada">Canada</option>
             <option value="Japan">Japan</option>
             <option value="Korea">Korea</option>
             <option value="Others">Others</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">学校</label>
              <select
                className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                disabled={isSubmitting || !country}
              >
                <option value="">Select a school</option>
                {country && (
                  <>
                    <option value="Please contact customer service to add school">Please contact customer service to add school</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">系所</label>
              <select
                className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={isSubmitting || !school}
              >
                <option value="">Select a department</option>
                {school && (
                  <>
                    <option value="Please contact customer service to add department">Please contact customer service to add department</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Upload documents</label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('school-doc-upload').click()}
                  disabled={isSubmitting}
                  className="w-32"
                >
                  Upload photo
                </Button>
                <input
                  id="school-doc-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-500">
                  {file ? file.name : 'No file selected'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Support JPG, PNG, GIF, PDF format, up to 5MB
              </p>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 