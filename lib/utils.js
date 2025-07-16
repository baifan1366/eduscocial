import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getQueryParams(searchParams) {
  // Check for both 'settings' and 'showSettings' parameters
  const showSettings = searchParams.get('settings') === 'true' || searchParams.get('showSettings') === 'true';
  
  // Check for both 'tab' and 'activeTab' parameters, with proper default for settings
  const activeTab = searchParams.get('tab') || searchParams.get('activeTab') || 'general';
  
  return {
    showSettings,
    activeTab
  };
}
