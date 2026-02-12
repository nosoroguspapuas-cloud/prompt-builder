export const FOCAL_MIN_MM = 14;
export const FOCAL_MAX_MM = 135;
export const SENSOR_WIDTH_MM = 36;

export const DEFAULT_FOCAL_MM = 35;
export const DEFAULT_WEDGE_LENGTH_PX = 140;

const SNAP_STEPS = [14, 20, 24, 35, 50, 70, 85, 135] as const;

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

// Horizontal full-frame field-of-view from focal length.
export function focalMmToFovDeg(mm: number, sensorWidthMm: number = SENSOR_WIDTH_MM): number {
  const focal = clamp(mm, FOCAL_MIN_MM, FOCAL_MAX_MM);
  const fovRad = 2 * Math.atan(sensorWidthMm / (2 * focal));
  return (fovRad * 180) / Math.PI;
}

export function fovDegToHalfHeightPx(fovDeg: number, wedgeLengthPx: number): number {
  const fovRad = (fovDeg * Math.PI) / 180;
  return wedgeLengthPx * Math.tan(fovRad / 2);
}

export function snapOptional(mm: number, threshold = 1.2): number {
  for (const step of SNAP_STEPS) {
    if (Math.abs(step - mm) <= threshold) return step;
  }
  return mm;
}

export function focalFromVerticalDrag(
  startMm: number,
  startY: number,
  currentY: number,
  k = 0.01,
  useSnap = true,
): number {
  const deltaY = currentY - startY;
  const raw = startMm * Math.exp(-deltaY * k);
  const clamped = clamp(raw, FOCAL_MIN_MM, FOCAL_MAX_MM);
  return useSnap ? clamp(snapOptional(clamped), FOCAL_MIN_MM, FOCAL_MAX_MM) : clamped;
}

export type WedgeGeometry = {
  x0: number;
  y0: number;
  x1: number;
  h: number;
  points: string;
};

export function createWedgeGeometry(
  anchorX: number,
  anchorY: number,
  focalMm: number,
  wedgeLengthPx: number,
  maxHalfHeightPx: number,
): WedgeGeometry {
  const focal = clamp(focalMm, FOCAL_MIN_MM, FOCAL_MAX_MM);
  const fov = focalMmToFovDeg(focal);
  const hRaw = fovDegToHalfHeightPx(fov, wedgeLengthPx);
  const h = clamp(hRaw, 0, maxHalfHeightPx);

  const L = Math.max(1, wedgeLengthPx);
  const x0 = anchorX;
  const y0 = anchorY;
  const x1 = anchorX + L;
  const points = `${x0},${y0} ${x1},${y0 - h} ${x1},${y0 + h}`;

  return { x0, y0, x1, h, points };
}

export function validateWedgeInvariant(geo: WedgeGeometry, wedgeLengthPx: number): string[] {
  const errors: string[] = [];
  if (!(wedgeLengthPx > 0)) errors.push("wedgeLengthPx must be > 0");
  if (!(geo.h >= 0)) errors.push("half-height must be >= 0");
  if (!(geo.x1 > geo.x0)) errors.push("wedge must always point right");

  const expectedX1 = geo.x0 + wedgeLengthPx;
  if (Math.abs(geo.x1 - expectedX1) > 0.001) errors.push("right edge X must be fixed at x0 + wedgeLengthPx");

  const pointsCount = geo.points.trim().split(/\s+/).length;
  if (pointsCount !== 3) errors.push("polygon must have exactly 3 points");
  return errors;
}
