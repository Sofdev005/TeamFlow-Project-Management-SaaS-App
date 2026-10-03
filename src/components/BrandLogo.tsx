import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sidebar' | 'auth';
  className?: string;
}

export default function BrandLogo({ size = 'auth', className = '' }: BrandLogoProps) {
  const dimensions = size === 'sidebar' ? 'h-14 w-14' : 'h-32 w-32';

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-lg ${dimensions} ${className}`}
    >
      <Image
        src="/Logo/TeamFlow.png"
        alt="TeamFlow"
        fill
        priority
        unoptimized
        sizes={size === 'sidebar' ? '56px' : '128px'}
        className="object-contain"
      />
    </span>
  );
}