"use client";
import { useRef } from "react";
import { CAMERA } from "@/lib/world";
import {
  canControl,
  getState,
  input,
  openOverlay,
  update,
  useWorldState,
} from "@/lib/store";
import { interact } from "@/lib/stations";
import { setMuted, unlockAudio } from "@/lib/audio";
export default function ControlsHint() {
  const s = useWorldState(),
    stick = useRef<HTMLDivElement>(null),
    knob = useRef<HTMLSpanElement>(null),
    pointer = useRef(-1);
  function reset() {
    pointer.current = -1;
    input.stickX = input.stickY = 0;
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
  }
  function move(e: React.PointerEvent) {
    if (
      pointer.current !== e.pointerId ||
      !canControl(getState()) ||
      !stick.current
    )
      return;
    const box = stick.current.getBoundingClientRect(),
      dx = e.clientX - box.left - box.width / 2,
      dy = e.clientY - box.top - box.height / 2,
      max = box.width / 2,
      len = Math.hypot(dx, dy),
      clamp = Math.min(1, max / Math.max(1, len)),
      distance = Math.min(1, len / max),
      power = Math.max(
        0,
        (distance - CAMERA.stick.deadzone) / (1 - CAMERA.stick.deadzone),
      );
    input.stickX = len ? (dx / len) * power : 0;
    input.stickY = len ? (-dy / len) * power : 0;
    if (knob.current)
      knob.current.style.transform = `translate(${dx * clamp * 0.6}px, ${dy * clamp * 0.6}px)`;
  }
  return (
    <>
      <div className={`utility-controls ${s.mobile ? "mobile-tier" : ""}`}>
        <button
          aria-label={s.muted ? "Enable sound" : "Mute sound"}
          aria-pressed={!s.muted}
          onClick={() => {
            if (s.muted) unlockAudio(false);
            setMuted(!s.muted);
            update({ muted: !s.muted });
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            {s.muted ? (
              <path d="m16 9 6 6m0-6-6 6" />
            ) : (
              <>
                <path d="M15 8c3 2 3 6 0 8" />
                <path d="M18 5c5 4 5 10 0 14" />
              </>
            )}
          </svg>
          <span>Sound {s.muted ? "off" : "on"}</span>
        </button>
        {s.entered && (
          <button
            className="help-toggle"
            aria-label="Controls help"
            onClick={() => openOverlay("help")}
          >
            ?
          </button>
        )}
      </div>
      {s.entered && (
        <>
          <div className="world-caption">
            <span>終電</span>
            <span>LAST TRAIN</span>
          </div>
          {s.prompt && (
            <button className="interact-prompt" onClick={interact}>
              {!s.mobile && <kbd>E</kbd>}
              {s.prompt}
              <span aria-hidden="true">↗</span>
            </button>
          )}
          {s.mode === "play" && !s.mobile && (
            <div className="movement-hint">
              <span>
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd> walk
              </span>
              <i /> drag to look
            </div>
          )}
          <div
            ref={stick}
            className={`joystick ${s.mobile && s.mode === "play" ? "visible" : ""}`}
            aria-label="Walk joystick"
            role="group"
            onPointerDown={(e) => {
              if (!canControl(getState())) return;
              pointer.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              move(e);
            }}
            onPointerMove={move}
            onPointerUp={reset}
            onPointerCancel={reset}
            onLostPointerCapture={reset}
          >
            <span className="stick-cross">+</span>
            <span ref={knob} className="stick-knob" />
          </div>
          {s.mode === "locked" && !s.arrived && (
            <div className="travel-caption">
              {s.destination === "work"
                ? "The work"
                : s.destination === "about"
                  ? "The food cart"
                  : s.destination === "contact"
                    ? "The mailboxes"
                    : s.destination === "gate"
                      ? "The last train"
                      : "The alley"}
              <span>On the way</span>
            </div>
          )}
        </>
      )}
    </>
  );
}
