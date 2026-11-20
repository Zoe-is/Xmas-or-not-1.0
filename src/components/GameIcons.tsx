export function TitleEmblemSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 88"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* Festive Wreath Crest */}
      <circle
        cx="44"
        cy="46"
        r="34"
        fill="#0F3D2E"
        stroke="#FBBF24"
        strokeWidth="3.5"
      />
      <circle
        cx="44"
        cy="46"
        r="27"
        stroke="#22C55E"
        strokeWidth="3"
        strokeDasharray="6 4"
      />
      {/* Santa Hat Icon */}
      <path
        d="M25 50C25 35 37 22 53 20C50 29 53 38 61 44L25 50Z"
        fill="#DC2626"
        stroke="#7F1D1D"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect
        x="21"
        y="47"
        width="44"
        height="10"
        rx="5"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      <circle
        cx="60"
        cy="23"
        r="6.5"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      {/* Golden Star Crest Top */}
      <path
        d="M44 6L46.9 12.2L53.6 13.1L48.7 17.8L49.9 24.5L44 21.3L38.1 24.5L39.3 17.8L34.4 13.1L41.1 12.2L44 6Z"
        fill="#FACC15"
        stroke="#B45309"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function CookieIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="#D99B52"
        stroke="#78350F"
        strokeWidth="1.8"
      />
      <circle cx="8.5" cy="9" r="1.4" fill="#451A03" />
      <circle cx="14.5" cy="8.5" r="1.3" fill="#451A03" />
      <circle cx="11" cy="14" r="1.5" fill="#451A03" />
      <circle cx="16" cy="14.5" r="1.2" fill="#451A03" />
    </svg>
  );
}

export function PresentIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="4"
        y="9"
        width="16"
        height="11.5"
        rx="2"
        fill="#E11D48"
        stroke="#881337"
        strokeWidth="1.8"
      />
      <rect x="10.5" y="9" width="3" height="11.5" fill="#4ADE80" />
      <rect
        x="3"
        y="6.5"
        width="18"
        height="3.5"
        rx="1.2"
        fill="#F43F5E"
        stroke="#881337"
        strokeWidth="1.6"
      />
      <path
        d="M12 6.5C10 3.5 7 4 7.5 6.5H12ZM12 6.5C14 3.5 17 4 16.5 6.5H12Z"
        fill="#4ADE80"
        stroke="#14532D"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function HouseIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M3.5 11.5L12 4L20.5 11.5V20C20.5 20.6 20 21 19.5 21H4.5C4 21 3.5 20.6 3.5 20V11.5Z"
        fill="#FEF3C7"
        stroke="#78350F"
        strokeWidth="1.8"
      />
      <path
        d="M2.5 11.5L12 3.2L21.5 11.5"
        stroke="#DC2626"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="10" y="14" width="4" height="7" rx="0.8" fill="#92400E" />
    </svg>
  );
}

export function KeyIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle
        cx="8"
        cy="12"
        r="4.5"
        fill="#FACC15"
        stroke="#92400E"
        strokeWidth="1.8"
      />
      <circle cx="8" cy="12" r="1.5" fill="#78350F" />
      <path
        d="M12.5 12H21M18 12V15.5M20.5 12V14.5"
        stroke="#FACC15"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarIcon({
  filled = true,
  className = 'w-5 h-5',
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 2.8L14.8 8.6L21.2 9.5L16.5 14L17.6 20.4L12 17.3L6.4 20.4L7.5 14L2.8 9.5L9.2 8.6L12 2.8Z"
        fill={filled ? '#FACC15' : 'transparent'}
        stroke={filled ? '#B45309' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 20.4C12 20.4 4 15.1 4 9.2C4 6.5 6.1 4.5 8.6 4.5C10.2 4.5 11.4 5.3 12 6.4C12.6 5.3 13.8 4.5 15.4 4.5C17.9 4.5 20 6.5 20 9.2C20 15.1 12 20.4 12 20.4Z"
        fill="#EF4444"
        stroke="#991B1B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GateIcon({
  open = false,
  className = 'w-4 h-4',
}: {
  open?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 20V8C4 5 8 3 12 3C16 3 20 5 20 8V20"
        stroke={open ? '#10B981' : '#F59E0B'}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {!open && (
        <>
          <path d="M9 6V20M12 5V20M15 6V20" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 13H19" stroke="currentColor" strokeWidth="1.8" />
        </>
      )}
    </svg>
  );
}
