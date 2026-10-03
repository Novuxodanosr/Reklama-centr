// Набор иконок (контурные, 24×24). Цвет берётся из currentColor.
type IconProps = { className?: string };

const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export function TelegramIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
}

export function PhoneIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
}

export function ArrowIcon({ className = "h-4 w-4" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function ArrowUpRightIcon({ className = "h-4 w-4" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M7 17L17 7M8 7h9v9" /></svg>;
}

export function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>;
}

export function MenuIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

export function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M5 12l5 5L20 7" /></svg>;
}

export function PaperclipIcon({ className = "h-4 w-4" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} {...base}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>;
}

export function GlobeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M2.8 12h18.4M12 2.8c2.6 2.5 3.9 5.6 3.9 9.2s-1.3 6.7-3.9 9.2c-2.6-2.5-3.9-5.6-3.9-9.2s1.3-6.7 3.9-9.2ZM4.6 7.2h14.8M4.6 16.8h14.8" />
    </svg>
  );
}

export function ColumnsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M4.5 6h15M5.5 6v15M10 6v15M14 6v15M18.5 6v15M12 2.5 3.5 6h17L12 2.5Z" />
    </svg>
  );
}

export function InfinityIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 12c-2-2.6-3.8-4-5.6-4a4 4 0 0 0 0 8c1.8 0 3.6-1.4 5.6-4Zm0 0c2 2.6 3.8 4 5.6 4a4 4 0 0 0 0-8c-1.8 0-3.6 1.4-5.6 4Z" />
    </svg>
  );
}

export function GearIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
      <circle cx="12" cy="12" r="6.6" />
    </svg>
  );
}

export function CheckBadgeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.8 14.3 4.6l2.9-.3.9 2.8 2.5 1.5-.9 2.8.9 2.8-2.5 1.5-.9 2.8-2.9-.3L12 21.2l-2.3-1.8-2.9.3-.9-2.8-2.5-1.5.9-2.8-.9-2.8 2.5-1.5.9-2.8 2.9.3L12 2.8Z" />
      <path d="m8.6 12.2 2.3 2.3 4.5-4.7" />
    </svg>
  );
}
