import React from 'react';

interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

export function Avatar({ className, children }: AvatarProps) {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`}>
      {children}
    </div>
  );
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
}

export function AvatarImage({ src, alt }: AvatarImageProps) {
  if (!src) return null;
  
  return (
    <img 
      src={src} 
      alt={alt || "Avatar"} 
      className="aspect-square h-full w-full object-cover"
    />
  );
}

interface AvatarFallbackProps {
  className?: string;
  children?: React.ReactNode;
}

export function AvatarFallback({ className, children }: AvatarFallbackProps) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full ${className || 'bg-gray-200'}`}>
      {children}
    </div>
  );
}