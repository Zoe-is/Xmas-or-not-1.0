export interface JoystickSample {
  knobX: number;
  knobY: number;
  moveX: number;
  moveZ: number;
}

export function computeJoystickOutput(
  dx: number,
  dy: number,
  maxRadius: number,
  deadzoneRatio = 0.14,
): JoystickSample {
  if (maxRadius <= 0) {
    return { knobX: 0, knobY: 0, moveX: 0, moveZ: 0 };
  }

  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) {
    return { knobX: 0, knobY: 0, moveX: 0, moveZ: 0 };
  }

  const clampedDist = Math.min(dist, maxRadius);
  const scale = clampedDist / dist;
  const knobX = dx * scale;
  const knobY = dy * scale;

  const normRatio = clampedDist / maxRadius;
  if (normRatio <= deadzoneRatio) {
    return { knobX, knobY, moveX: 0, moveZ: 0 };
  }

  const adjustedMag = (normRatio - deadzoneRatio) / (1 - deadzoneRatio);
  const dirX = dx / dist;
  const dirY = dy / dist;

  return {
    knobX,
    knobY,
    moveX: dirX * adjustedMag,
    moveZ: dirY * adjustedMag,
  };
}
