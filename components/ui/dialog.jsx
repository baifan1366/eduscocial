'use client';

import React, { Fragment } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Dialog({ children, open, onOpenChange, ...props }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogTrigger({ children, className = '', ...props }) {
  return (
    <DialogPrimitive.Trigger 
      className={className} 
      {...props}
    >
      {children}
    </DialogPrimitive.Trigger>
  );
}

export function DialogPortal({ children, ...props }) {
  return (
    <DialogPrimitive.Portal {...props}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {children}
      </div>
    </DialogPrimitive.Portal>
  );
}

export function DialogOverlay({ className = '', ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all ${className}`}
      {...props}
    />
  );
}

export function DialogContent({ children, className = '', ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={`fixed z-50 w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 text-gray-900 dark:text-white shadow-xl transition-all ${className}`}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 mt-4 border-t border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = '', ...props }) {
  return (
    <DialogPrimitive.Title
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({ children, className = '', ...props }) {
  return (
    <DialogPrimitive.Description
      className={`text-sm text-gray-400 ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  );
} 