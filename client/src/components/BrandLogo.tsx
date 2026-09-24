import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
}) => {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Minimal Geometric Brand Icon */}
      <div 
        className="relative flex items-center justify-center rounded-xl bg-[#151A25] border border-[rgba(99,102,241,0.20)] shadow-[0_0_20px_rgba(99,102,241,0.15)] shrink-0 transition-transform duration-200 hover:scale-105"
        style={{
          width: iconSize + 12,
          height: iconSize + 12,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Synchronized brackets glyph */}
          <path
            d="M8 6L3.5 12L8 18"
            stroke="#A5B4FC"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 6L20.5 12L16 18"
            stroke="#6366F1"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Central synchronization core */}
          <circle cx="12" cy="12" r="2.2" fill="#22D3EE" />
          <circle cx="12" cy="12" r="4.2" stroke="#22D3EE" strokeOpacity="0.3" strokeWidth="1" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-[#F8FAFC] ${
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
            }`}>
              SyncCode
            </span>
          </div>
          {showTagline && (
            <span className="text-[11px] text-[#94A3B8] -mt-0.5 font-normal tracking-wide">
              Build together. In real time.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
