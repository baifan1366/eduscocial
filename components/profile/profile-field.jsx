'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Check, X } from 'lucide-react';

export function ProfileField({ 
  label, 
  value, 
  placeholder = "No content yet.", 
  isRequired = false,
  field,
  type = 'text',
  options = [],
  onUpdate,
  disabled = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setEditValue(value || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (isRequired && !editValue.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(field, editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating field:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-700 dark:bg-gray-800 border-gray-600 dark:border-gray-700 text-white"
          rows={3}
        />
      );
    }

    if (type === 'select' && options.length > 0) {
      return (
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger className="bg-gray-700 dark:bg-gray-800 border-gray-600 dark:border-gray-700 text-white">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === 'date') {
      return (
        <Input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="bg-gray-700 dark:bg-gray-800 border-gray-600 dark:border-gray-700 text-white"
        />
      );
    }

    return (
      <Input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-700 dark:bg-gray-800 border-gray-600 dark:border-gray-700 text-white"
      />
    );
  };

  return (
    <div className="border-b border-gray-600 dark:border-gray-700 py-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-[#FF7D00] text-sm font-medium">{label}</span>
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              {renderInput()}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="orange"
                  onClick={handleSave}
                  disabled={isLoading || (isRequired && !editValue.trim())}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-300 dark:text-gray-300">
              {value || <span className="text-gray-500 dark:text-gray-500">{placeholder}</span>}
            </div>
          )}
        </div>
        
        {!isEditing && !disabled && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="text-gray-400 hover:text-[#FF7D00] ml-4 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}