import {
  DEFAULT_WEDGE_LENGTH_PX,
  createWedgeGeometry,
  focalMmToFovDeg,
  validateWedgeInvariant,
} from "./fovMath";

export function runFovInvariantChecks() {
  const cases = [
    { anchorX: 0, anchorY: 14, focalMm: 14 },
    { anchorX: 20, anchorY: 14, focalMm: 35 },
    { anchorX: 200, anchorY: 14, focalMm: 135 },
    { anchorX: 500, anchorY: 14, focalMm: 50 },
  ];

  const report = cases.map((c) => {
    const geo = createWedgeGeometry(c.anchorX, c.anchorY, c.focalMm, DEFAULT_WEDGE_LENGTH_PX, 120);
    const errors = validateWedgeInvariant(geo, DEFAULT_WEDGE_LENGTH_PX);
    return {
      ...c,
      fovDeg: focalMmToFovDeg(c.focalMm).toFixed(2),
      ok: errors.length === 0,
      errors,
    };
  });

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.table(report);
  }

  return report;
}
