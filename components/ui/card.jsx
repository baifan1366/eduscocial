'use client';

export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-[#132F4C] shadow-md rounded-lg p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 
      className={`text-xl font-bold text-white ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div 
      className={`mb-4 pb-4 border-b border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div 
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div 
      className={`mt-4 pt-4 border-t border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
} 