interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const fallbackSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl', 
  xl: 'text-5xl'
};

export default function Logo({ size = 'md', className = '', showFallback = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="https://trevalune.com/wp-content/uploads/2025/06/Ativo-2.svg" 
        alt="DomusFinance Logo" 
        className={sizeClasses[size]}
        onError={(e) => {
          if (showFallback) {
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = 'inline';
            }
          }
        }}
      />
      {showFallback && (
        <span className={`${fallbackSizeClasses[size]} hidden`}>🏠</span>
      )}
    </div>
  );
}
