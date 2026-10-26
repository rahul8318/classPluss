import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-brand-600 mb-3`} />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
}
