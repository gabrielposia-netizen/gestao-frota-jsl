export default function JslLogo({ compact = false, className = '', banner = false }) {
  return (
    <img
      src="/jsl-logo.png"
      alt="JSL — Entender para atender"
      className={[
        'object-contain object-left',
        banner ? 'w-full h-14' : compact ? 'h-9 w-auto max-w-[150px]' : 'h-11 w-auto max-w-[190px]',
        className,
      ].join(' ')}
    />
  );
}
