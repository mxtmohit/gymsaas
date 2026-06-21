import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className = '', iconOnly = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Neo-brutalist Icon Box */}
      <div className="relative flex items-center justify-center w-10 h-10 bg-brutal-yellow border-3 border-black shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] rounded-lg transition-all">
        <svg 
          className="w-6 h-6 text-black rotate-12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="m6.5 6.5 11 11" />
          <path d="m21 21-1-1" />
          <path d="m3 3 1 1" />
          <path d="m18.5 5.5 3 3" />
          <path d="m15.5 2.5 6 6" />
          <path d="m2.5 15.5 6 6" />
          <path d="m5.5 18.5 3 3" />
          <path d="M10 14.828V10h4.828" />
        </svg>
      </div>
      
      {!iconOnly && (
        <span className="font-extrabold text-xl tracking-tight text-black uppercase">
          Flex<span className="text-black font-normal underline decoration-3 decoration-brutal-orange">Flow</span>
        </span>
      )}
    </div>
  );
}
