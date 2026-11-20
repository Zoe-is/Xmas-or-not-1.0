import { useEffect, useRef, useState } from 'react';
import { sharedPreviewRenderer, type PreviewTarget } from '../game/previewRenderer';

interface ModelPreview3DProps {
  target: PreviewTarget;
  className?: string;
  autoSpin?: boolean;
  interactive?: boolean;
  label?: string;
}

export function ModelPreview3D({
  target,
  className = '',
  autoSpin = false,
  interactive = false,
  label,
}: ModelPreview3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const yawRef = useRef<number>(sharedPreviewRenderer.getDefaultYaw(target));
  const dragRef = useRef<{ active: boolean; lastX: number }>({ active: false, lastX: 0 });
  const [hovered, setHovered] = useState(false);

  const targetRef = useRef<PreviewTarget>(target);
  targetRef.current = target;

  const kind = target.kind;
  const id = target.id;

  // Draw initial resting 3D pose whenever target changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const t = targetRef.current;
    yawRef.current = sharedPreviewRenderer.getDefaultYaw(t);
    sharedPreviewRenderer.drawRestingToCanvas(t, canvas);
  }, [kind, id]);

  // Turntable rotation when hovered or autoSpin is enabled (GPU only to protect software WebGL)
  useEffect(() => {
    if (!autoSpin && !hovered) return;
    if (sharedPreviewRenderer.getIsSoftwareGl()) return;

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (!dragRef.current.active && canvasRef.current) {
        yawRef.current += dt * 0.85;
        sharedPreviewRenderer.drawAngleToCanvas(
          targetRef.current,
          yawRef.current,
          canvasRef.current,
        );
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [autoSpin, hovered, kind, id]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={210}
      data-testid={`preview-3d-${kind}-${id}`}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        dragRef.current.active = false;
      }}
      onPointerDown={
        interactive
          ? (e) => {
              dragRef.current = { active: true, lastX: e.clientX };
              e.currentTarget.setPointerCapture(e.pointerId);
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (e) => {
              if (!dragRef.current.active || !canvasRef.current) return;
              const dx = e.clientX - dragRef.current.lastX;
              dragRef.current.lastX = e.clientX;
              yawRef.current += dx * 0.025;
              sharedPreviewRenderer.drawAngleToCanvas(
                targetRef.current,
                yawRef.current,
                canvasRef.current,
              );
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (e) => {
              dragRef.current.active = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }
          : undefined
      }
      onPointerCancel={
        interactive
          ? () => {
              dragRef.current.active = false;
            }
          : undefined
      }
      className={`block object-contain select-none ${
        interactive ? 'cursor-grab active:cursor-grabbing touch-none' : 'pointer-events-none'
      } ${className}`}
    />
  );
}
