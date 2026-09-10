"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useSyncExternalStore } from "react";
import type { WeatherShaders } from "@/lib/shaders";
import type { Content } from "@/lib/content";
import { PERFORMANCE } from "@/lib/world";
import { closeTop, update, useWorldState } from "@/lib/store";
import { setMuted } from "@/lib/audio";
import Gate from "./Gate";
import Nav from "./Nav";
import Overlays from "./Overlays";
import ProjectControls from "./ProjectControls";
import ControlsHint from "./ControlsHint";
const World = dynamic(() => import("@/components/world/World"), { ssr: false });
class WorldBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    update({ failed: true, ready: true });
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
const subscribeMounted = () => () => {};
export default function Portfolio({
  content,
  shaders,
}: {
  content: Content;
  shaders: WeatherShaders;
}) {
  const s = useWorldState(),
    mounted = useSyncExternalStore(
      subscribeMounted,
      () => true,
      () => false,
    );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      touch = matchMedia("(pointer: coarse)");
    const muted = true;
    const sync = () => update({ reduced: media.matches });
    sync();
    update({ muted, mobile: touch.matches || innerWidth <= PERFORMANCE.mobileWidth });
    setMuted(true);
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeTop();
    };
    window.addEventListener("keydown", escape);
    const timer = setTimeout(
      () => update({ ready: true }),
      PERFORMANCE.readyTimeout,
    );
    media.addEventListener("change", sync);
    return () => {
      clearTimeout(timer);
      media.removeEventListener("change", sync);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <main className="portfolio">
      <div
        className="canvas-stage"
        inert={s.mode === "overlay" || s.mode === "loading"}
      >
        {mounted && (
          <WorldBoundary>
            <World content={content} mobile={s.mobile} shaders={shaders} />
          </WorldBoundary>
        )}
      </div>
      <Nav />
      <ProjectControls content={content} />
      <Overlays content={content} />
      <Gate />
      {mounted && <ControlsHint />}
      {s.entered && s.failed && (
        <section className="fallback-work">
          <h2>Selected work</h2>
          {content.projects.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {p.name} ↗
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
