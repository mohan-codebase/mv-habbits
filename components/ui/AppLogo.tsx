import Image from 'next/image';

export default function AppLogo({
  width = 32,
  height = 32,
  className = '',
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div className={`hf-app-logo relative shrink-0 ${className}`} style={{ width, height }}>
      <Image
        src="/logo/logo-dark.png"
        alt="Productivity Master"
        fill
        className="hf-logo-dark object-contain"
        sizes={`${width}px`}
        priority
      />
      <Image
        src="/logo/logo-light.png"
        alt="Productivity Master"
        fill
        className="hf-logo-light object-contain"
        sizes={`${width}px`}
        priority
      />
    </div>
  );
}
