import { useEffect, useRef, useState } from 'react';
import { computeJoystickOutput } from '../game/joystick';

interface VirtualJoystickProps {
  onChange: (moveX: number, moveZ: number) => void;
  className?: string;
}

export function VirtualJoystick({ onChange, className = '' }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [active, setActive] = useState(false);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const resetStick = () => {
      activePointerIdRef.current = null;
      setActive(false);
      setKnobOffset({ x: 0, y: 0 });
      onChangeRef.current(0, 0);
    };
    window.addEventListener('blur', resetStick);
    return () => {
      window.removeEventListener('blur', resetStick);
      onChangeRef.current(0, 0);
    };
  }, []);

  const updateFromClientPos = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = Math.max(24, rect.width * 0.34);

    const sample = computeJoystickOutput(clientX - centerX, clientY - centerY, maxRadius);
    setKnobOffset({ x: sample.knobX, y: sample.knobY });
    onChangeRef.current(sample.moveX, sample.moveZ);
  };

  const releaseStick = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (
      e &&
      activePointerIdRef.current !== null &&
      e.pointerId !== activePointerIdRef.current
    ) {
      return;
    }
    if (e && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    activePointerIdRef.current = null;
    setActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onChangeRef.current(0, 0);
  };

  return (
    <div
      ref={baseRef}
      data-testid="mobile-joystick"
      data-active={active ? 'true' : 'false'}
      data-knob-x={Math.round(knobOffset.x)}
      data-knob-y={Math.round(knobOffset.y)}
      role="application"
      aria-label="Movement Joystick"
      onPointerDown={(e) => {
        if (activePointerIdRef.current !== null) return;
        e.preventDefault();
        activePointerIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setActive(true);
        updateFromClientPos(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        e.preventDefault();
        updateFromClientPos(e.clientX, e.clientY);
      }}
      onPointerUp={releaseStick}
      onPointerCancel={releaseStick}
      onLostPointerCapture={releaseStick}
      className={`pointer-events-auto relative flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 select-none touch-none shadow-lg transition-opacity ${
        active
          ? 'opacity-100 duration-100 border-rose-500 dark:border-amber-400 bg-white/85 dark:bg-slate-900/85'
          : 'opacity-25 duration-300 border-slate-300 dark:border-slate-600 bg-white/75 dark:bg-slate-900/75'
      } ${className}`}
    >
      {/* Subtle inner guide ring */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-4 rounded-full border border-dashed transition-colors ${
          active
            ? 'border-rose-400/70 dark:border-amber-400/60'
            : 'border-slate-400/45 dark:border-slate-500/45'
        }`}
      />

      {/* Cardinal guide ticks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-400/70 dark:bg-slate-500/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-400/70 dark:bg-slate-500/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400/70 dark:bg-slate-500/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400/70 dark:bg-slate-500/70"
      />

      {/* Draggable / Snap-back Thumb Knob */}
      <div
        data-testid="mobile-joystick-knob"
        aria-hidden="true"
        style={{
          transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
        }}
        className={`pointer-events-none w-14 h-14 rounded-full border-2 shadow-xl flex items-center justify-center ${
          active
            ? 'duration-0 bg-rose-600 border-amber-300 scale-105'
            : 'transition-transform duration-150 ease-out bg-slate-800 dark:bg-slate-200 border-white/80 dark:border-slate-700'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full ${
            active
              ? 'bg-white/90'
              : 'bg-white/70 dark:bg-slate-800/70'
          }`}
        />
      </div>
    </div>
  );
}
