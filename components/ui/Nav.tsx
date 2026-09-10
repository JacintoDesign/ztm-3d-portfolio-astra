"use client";
import {
  nextStop,
  openOverlay,
  release,
  travel,
  useWorldState,
} from "@/lib/store";
export default function Nav() {
  const s = useWorldState();
  if (!s.entered) return null;
  return (
    <header className="navigation">
      <div className="wordmark">
        <span>JACINTO</span> <span>DESIGN</span>
      </div>
      <nav aria-label="Portfolio navigation">
        {(["about", "work", "contact"] as const).map((item) => (
          <button
            key={item}
            className={
              s.destination === item || s.overlay === item ? "active" : ""
            }
            onClick={() =>
              s.failed
                ? openOverlay(item === "work" ? "help" : item)
                : travel(item)
            }
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
        <span className="nav-divider" />
        <button className="next-stop" onClick={nextStop}>
          Next stop <span aria-hidden="true">↗</span>
        </button>
      </nav>
      {s.mode === "locked" && (
        <button className="return-button" onClick={release}>
          <span aria-hidden="true">←</span> Return to freeroam
        </button>
      )}
    </header>
  );
}
