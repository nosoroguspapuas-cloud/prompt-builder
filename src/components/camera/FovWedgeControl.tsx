import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_FOCAL_MM,
  DEFAULT_WEDGE_LENGTH_PX,
  FOCAL_MAX_MM,
  FOCAL_MIN_MM,
  clamp,
  createWedgeGeometry,
  focalFromVerticalDrag,
  focalMmToFovDeg,
  validateWedgeInvariant,
} from "./fovMath";

type FovWedgeControlProps = {
  anchorX: number;
  anchorY: number;
  trackLeft: number;
  trackWidth: number;
  focalMm: number;
  onChangeFocalMm: (mm: number) => void;
  onDoubleClickReset?: () => void;
  className?: string;
  wedgeLengthPx?: number;
  maxHalfHeightPx?: number;
  tooltip?: string;
};

type DragState = {
  pointerId: number;
  startY: number;
  startMm: number;
} | null;

export function FovWedgeControl({
  anchorX,
  anchorY,
  trackLeft,
  trackWidth,
  focalMm,
  onChangeFocalMm,
  onDoubleClickReset,
  className,
  wedgeLengthPx = DEFAULT_WEDGE_LENGTH_PX,
  maxHalfHeightPx = 120,
  tooltip,
}: FovWedgeControlProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [drag, setDrag] = useState<DragState>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const safeFocal = clamp(focalMm, FOCAL_MIN_MM, FOCAL_MAX_MM);

  const geometry = useMemo(() => {
    const raw = createWedgeGeometry(anchorX, anchorY, safeFocal, wedgeLengthPx, maxHalfHeightPx);
    if (process.env.NODE_ENV !== "production") {
      const errors = validateWedgeInvariant(raw, wedgeLengthPx);
      if (errors.length) {
        const fallback = createWedgeGeometry(anchorX, anchorY, DEFAULT_FOCAL_MM, wedgeLengthPx, maxHalfHeightPx);
        // eslint-disable-next-line no-console
        console.warn("[FovWedgeControl] invariant violation, using fallback", errors);
        return fallback;
      }
    }
    return raw;
  }, [anchorX, anchorY, safeFocal, wedgeLengthPx, maxHalfHeightPx]);

  const fovDeg = focalMmToFovDeg(safeFocal);
  const isDragging = drag !== null;

  const handleLeftPx = geometry.x1;
  const handleTopPx = geometry.y0;

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ pointerId: e.pointerId, startY: e.clientY, startMm: safeFocal });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    const nextMm = focalFromVerticalDrag(drag.startMm, drag.startY, e.clientY, 0.01, true);
    onChangeFocalMm(nextMm);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDrag(null);
  };

  const onWheel = (e: React.WheelEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1;
    const delta = e.deltaY < 0 ? step : -step;
    onChangeFocalMm(clamp(safeFocal + delta, FOCAL_MIN_MM, FOCAL_MAX_MM));
  };

  const onDoubleClick = () => {
    if (onDoubleClickReset) {
      onDoubleClickReset();
      return;
    }
    onChangeFocalMm(DEFAULT_FOCAL_MM);
  };

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
      aria-hidden={false}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${Math.max(1, size.width)} ${Math.max(1, size.height)}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <polygon
          points={geometry.points}
          fill={isDragging ? "rgba(226,245,57,0.28)" : "rgba(226,245,57,0.18)"}
        />
        <line
          x1={geometry.x1}
          y1={geometry.y0 - geometry.h}
          x2={geometry.x1}
          y2={geometry.y0 + geometry.h}
          stroke={isDragging ? "rgba(226,245,57,0.95)" : "rgba(226,245,57,0.65)"}
          strokeWidth={2}
        />
      </svg>

      <button
        ref={handleRef}
        type="button"
        title={tooltip}
        aria-label="Adjust focal length"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        style={{
          position: "absolute",
          left: handleLeftPx - 12,
          top: handleTopPx - 12,
          width: 24,
          height: 24,
          borderRadius: 9999,
          border: 0,
          padding: 0,
          margin: 0,
          background: isDragging ? "rgba(226,245,57,0.22)" : "rgba(226,245,57,0.12)",
          cursor: isDragging ? "grabbing" : "ns-resize",
          pointerEvents: "auto",
          touchAction: "none",
          transform: "translate3d(0,0,0)",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 3,
            height: 18,
            borderRadius: 9999,
            background: "rgba(226,245,57,0.9)",
            transform: "translate(-50%, -50%)",
          }}
        />
      </button>

      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          fontSize: 14,
          lineHeight: "20px",
          fontWeight: 500,
          color: "rgba(255,255,255,0.88)",
          pointerEvents: "none",
          textAlign: "right",
          minWidth: 120,
        }}
      >
        {safeFocal.toFixed(0)} mm • {fovDeg.toFixed(1)}°
      </div>

      {/* trackLeft is intentionally accepted to keep API explicit for host geometry sync */}
      <span style={{ display: "none" }}>{trackLeft + trackWidth}</span>
    </div>
  );
}

export default FovWedgeControl;
