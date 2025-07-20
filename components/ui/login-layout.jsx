'use client';

import React from 'react';

export function LoginLayout({ children, leftSection, rightSection }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Section */}
      <div className="w-1/2 flex flex-col items-center justify-center p-8 bg-[#0A1929] text-white">
        {leftSection}
      </div>
      
      {/* Right Section */}
      <div className="w-1/2 bg-[#0A1929] border-l border-[#132F4C] p-8 text-white flex items-center justify-center">
        <div className="max-w-sm w-full">
          {rightSection || children}
        </div>
      </div>
    </div>
  );
}

export default LoginLayout;
