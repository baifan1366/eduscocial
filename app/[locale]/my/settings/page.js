'use client';

import { useSearchParams } from 'next/navigation';
import SettingsPanel from '@/components/my/SettingsPanel';

export default function MySettingsPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">设置</h1>
      <SettingsPanel activeTab={activeTab} />
    </div>
  );
} 