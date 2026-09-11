"use client";
import { useEffect, useRef } from "react";
import type { Content } from "@/lib/content";
import { BOARD } from "@/lib/world";
import {
  getState,
  pageProject,
  release,
  update,
  useWorldState,
} from "@/lib/store";
export default function ProjectControls({ content }: { content: Content }) {
  const s = useWorldState(),
    start = useRef(0),
    fromStops = useRef(false),
    stops = useRef<HTMLDivElement>(null);
  const project = content.projects[s.project];
  useEffect(() => {
    if (
      !s.entered ||
      s.reduced ||
      s.manualPaging ||
      content.projects.length < 2
    )
      return;
    const timer = setInterval(() => {
      const current = getState();
      update({ project: (current.project + 1) % content.projects.length });
    }, BOARD.dwell);
    return () => clearInterval(timer);
  }, [s.entered, s.reduced, s.manualPaging, content.projects.length]);
  useEffect(() => {
    const track = stops.current;
    const current = track?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!track || !current) return;
    const left = current.offsetLeft - (track.clientWidth - current.offsetWidth) / 2;
    track.scrollTo({
      left: Math.max(0, left),
      behavior: getState().reduced ? "auto" : "smooth",
    });
  }, [s.project]);
  if (!project || s.mode !== "locked" || s.destination !== "work" || !s.arrived)
    return null;
  return (
    <section
      className="project-controls"
      aria-label="Project showcase"
      onTouchStart={(e) => {
        start.current = e.touches[0].clientX;
        fromStops.current = Boolean(
          (e.target as HTMLElement).closest(".project-stops"),
        );
      }}
      onTouchEnd={(e) => {
        if (fromStops.current) return;
        const dx = e.changedTouches[0].clientX - start.current;
        if (Math.abs(dx) > 50)
          pageProject(dx < 0 ? 1 : -1, content.projects.length);
      }}
    >
      <div className="project-copy" aria-live="polite">
        <p className="eyebrow">{project.tags.join(" / ")}</p>
        <h2>{project.name}</h2>
        <p>{project.description}</p>
      </div>
      <div className="project-toolbar">
        <div className="pager">
          <button
            aria-label="Previous project"
            onClick={() => pageProject(-1, content.projects.length)}
          >
            ‹
          </button>
          <div className="project-stops" ref={stops}>
            {content.projects.map((p, i) => (
              <button
                key={p.name}
                aria-label={`Show ${p.name}`}
                aria-current={i === s.project ? "true" : undefined}
                onClick={() => update({ project: i, manualPaging: true })}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <button
            aria-label="Next project"
            onClick={() => pageProject(1, content.projects.length)}
          >
            ›
          </button>
        </div>
        <div className="project-actions">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => update({ manualPaging: true })}
          >
            GitHub ↗
          </a>
          <a
            className="open-project"
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => update({ manualPaging: true })}
          >
            Open project ↗
          </a>
          <button aria-label="Close project view" onClick={release}>
            ×
          </button>
        </div>
      </div>
    </section>
  );
}
