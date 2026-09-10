"use client";
import { GATE } from "@/lib/world";
import { openOverlay, pose, update, useWorldState } from "@/lib/store";
export default function Gate() {
  const s = useWorldState();
  if (s.entered) return null;
  return (
    <section className="gate" aria-label="Welcome to Jacinto Design">
      <div className="gate-content">
        <p className="gate-story">
          <span>{GATE.kicker[0]}</span> <span>{GATE.kicker[1]}</span>
        </p>
        <h1>
          <span>{GATE.name[0]}</span>
          <span>{GATE.name[1]}</span>
        </h1>
        <button
          className="enter-button"
          disabled={!s.ready}
          onClick={() => {
            pose.entryTime = -1;
            update({ entered: true, mode: "play" });
            try {
              if (!localStorage.getItem("last-train-controls-seen")) {
                localStorage.setItem("last-train-controls-seen", "true");
                openOverlay("help");
              }
            } catch {
              openOverlay("help");
            }
          }}
        >
          {GATE.button}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}
