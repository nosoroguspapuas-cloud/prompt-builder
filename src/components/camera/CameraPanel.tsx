import React, { useMemo, useRef, useState } from "react";
import FovWedgeControl from "./FovWedgeControl";
import { DEFAULT_FOCAL_MM, FOCAL_MAX_MM, FOCAL_MIN_MM, clamp } from "./fovMath";

type ViewMode = "front" | "back";

type CameraState = {
  distanceM: number;
  focalMm: number;
  yaw: number;
  altitude: number;
  view: ViewMode;
};

type CameraPanelProps = {
  value: CameraState;
  onChange: (next: CameraState) => void;
  uiLang?: "ru" | "en";
};

function shotFromDistance(distanceM: number, uiLang: "ru" | "en") {
  const d = clamp(distanceM, 0.6, 6);
  const labelRu =
    d < 0.9 ? "Крупный" :
    d < 1.4 ? "Погрудный" :
    d < 2.1 ? "По пояс" :
    d < 3.2 ? "3/4" : "Полный";
  const labelEn =
    d < 0.9 ? "Close-up" :
    d < 1.4 ? "Bust" :
    d < 2.1 ? "Waist-up" :
    d < 3.2 ? "3/4" : "Full";
  return uiLang === "ru" ? labelRu : labelEn;
}

function angleLabel(value: CameraState, uiLang: "ru" | "en") {
  const view = value.view === "back"
    ? (uiLang === "ru" ? "Сзади" : "Back")
    : (uiLang === "ru" ? "Спереди" : "Front");
  const altitude = value.altitude > 0.25
    ? (uiLang === "ru" ? "Сверху" : "High")
    : value.altitude < -0.25
      ? (uiLang === "ru" ? "Снизу" : "Low")
      : (uiLang === "ru" ? "Уровень глаз" : "Eye-level");
  return `${view} • ${altitude}`;
}

export function CameraPanel({ value, onChange, uiLang = "ru" }: CameraPanelProps) {
  const trackWrapRef = useRef<HTMLDivElement | null>(null);
  const [trackSize, setTrackSize] = useState({ width: 1, left: 0 });

  React.useEffect(() => {
    if (!trackWrapRef.current) return;
    const update = () => {
      const rect = trackWrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTrackSize({ width: Math.max(1, rect.width), left: rect.left });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(trackWrapRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const distanceMin = 0.6;
  const distanceMax = 6;
  const distancePercent = (clamp(value.distanceM, distanceMin, distanceMax) - distanceMin) / (distanceMax - distanceMin);
  const anchorX = distancePercent * trackSize.width;
  const anchorY = 14;

  const shotLabel = useMemo(() => shotFromDistance(value.distanceM, uiLang), [value.distanceM, uiLang]);

  return (
    <div style={{ display: "grid", rowGap: 24 }}>
      <h3 style={{ margin: 0, fontSize: 21, lineHeight: "26px", fontWeight: 600 }}>CAMERA</h3>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", columnGap: 24, rowGap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.8 }}>{uiLang === "ru" ? "Дистанция" : "Distance"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ alignSelf: "flex-end", fontSize: 14, lineHeight: "20px", opacity: 0.9 }}>{value.distanceM.toFixed(2)} {uiLang === "ru" ? "м" : "m"}</div>
          <div ref={trackWrapRef} style={{ position: "relative", height: 28, overflow: "hidden" }}>
            <input
              type="range"
              min={distanceMin}
              max={distanceMax}
              step={0.05}
              value={value.distanceM}
              onChange={(e) => onChange({ ...value, distanceM: Number(e.currentTarget.value) })}
              style={{ width: "100%" }}
            />
            <FovWedgeControl
              anchorX={anchorX}
              anchorY={anchorY}
              trackLeft={trackSize.left}
              trackWidth={trackSize.width}
              focalMm={value.focalMm}
              onChangeFocalMm={(mm) => onChange({ ...value, focalMm: clamp(mm, FOCAL_MIN_MM, FOCAL_MAX_MM) })}
              onDoubleClickReset={() => onChange({ ...value, focalMm: DEFAULT_FOCAL_MM })}
              tooltip={uiLang === "ru" ? "Фокусное: потяни вверх/вниз" : "Focal: drag up/down"}
            />
          </div>
          <div style={{ fontSize: 12, lineHeight: "16px", opacity: 0.66 }}>{uiLang === "ru" ? `Shot: ${shotLabel}` : `Shot: ${shotLabel}`}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", columnGap: 24, rowGap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.8, display: "flex", alignItems: "center", gap: 8 }}>
          {uiLang === "ru" ? "Фокусное" : "Focal length"}
          <span title={uiLang === "ru" ? "Управление на правой грани клина" : "Use wedge right edge handle"} style={{ fontSize: 12, opacity: 0.7 }}>ⓘ</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ alignSelf: "flex-end", fontSize: 14, lineHeight: "20px", opacity: 0.9 }}>
            {value.focalMm.toFixed(0)} {uiLang === "ru" ? "мм" : "mm"}
          </div>
          <div style={{ fontSize: 12, lineHeight: "16px", opacity: 0.6 }}>
            {uiLang === "ru"
              ? "Тяни край клина вверх/вниз • dbl-click: 35 мм"
              : "Drag wedge edge up/down • dbl-click: 35mm"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", columnGap: 24, rowGap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.8 }}>{uiLang === "ru" ? "Ракурс" : "Camera angle"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ alignSelf: "flex-end", fontSize: 14, lineHeight: "20px", opacity: 0.9 }}>{angleLabel(value, uiLang)}</div>
          <div style={{ width: 160, aspectRatio: "1 / 1", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: `calc(50% + ${value.yaw * 65}px)`,
                top: `calc(50% - ${value.altitude * 65}px)`,
                width: 12,
                height: 12,
                borderRadius: 9999,
                background: "#E2F539",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => onChange({ ...value, view: "front" })}>{uiLang === "ru" ? "Спереди" : "Front"}</button>
            <button type="button" onClick={() => onChange({ ...value, view: "back" })}>{uiLang === "ru" ? "Сзади" : "Back"}</button>
            <button type="button" onClick={() => onChange({ ...value, yaw: 0, altitude: 0, view: "front" })}>{uiLang === "ru" ? "Сброс" : "Reset"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraPanel;
