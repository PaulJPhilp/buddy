'use client';

import { LucideProps, icons } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';

export type IconName = keyof typeof icons;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 16, className = '', ...props }, ref) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Ensure consistent class name order
    const baseClasses = ['lucide', `lucide-${name}`];
    if (className) {
      baseClasses.push(className);
    }

    // Show placeholder during SSR
    if (!isClient) {
      return (
        <span 
          style={{ 
            display: 'inline-block', 
            width: `${size}px`, 
            height: `${size}px`,
            backgroundColor: 'transparent'
          }} 
        />
      );
    }

    const LucideIcon = icons[name];
    
    return (
      <LucideIcon
        ref={ref}
        width={size}
        height={size}
        className={baseClasses.join(' ')}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';
