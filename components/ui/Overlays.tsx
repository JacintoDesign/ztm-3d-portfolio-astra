"use client";
import { useEffect, useRef } from "react";
import type { Content } from "@/lib/content";
import { closeTop, getState, openOverlay, useWorldState } from "@/lib/store";
export default function Overlays({ content }: { content: Content }) {
  const s = useWorldState(),
    card = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!s.overlay) return;
    const previous = document.activeElement as HTMLElement | null;
    card.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [s.overlay]);
  if (!s.overlay) return null;
  const about = content.about;
  return (
    <div
      className="overlay-layer"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) closeTop();
      }}
    >
      <section
        className={`overlay-card ${s.overlay === "about" ? "about-card" : ""}`}
        role="dialog"
        aria-labelledby="overlay-heading"
        tabIndex={-1}
        ref={card}
      >
        <button
          className="close-card"
          onClick={closeTop}
          aria-label="Close overlay"
        >
          ×
        </button>
        {s.overlay === "about" ? (
          <>
            <p className="eyebrow">01 / {about.eyebrow}</p>
            <h2 id="overlay-heading">{about.heading}</h2>
            <p className="role-line">{about.role}</p>
            <div className="stats">
              {about.stats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="stories">
              {about.stories.map((story) => (
                <article key={story.title}>
                  <h3>{story.title}</h3>
                  <p>{story.text}</p>
                </article>
              ))}
            </div>
            <div className="course-panels">
              {[about.course, about.now].map((panel) => (
                <article key={panel.label}>
                  <p className="eyebrow">{panel.label}</p>
                  <h3>{panel.title}</h3>
                  <p>{panel.blurb}</p>
                  {panel.url && (
                    <a
                      href={panel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {panel.linkLabel} ↗
                    </a>
                  )}
                </article>
              ))}
            </div>
            <footer className="overlay-footer">
              {about.location}
              <span>{about.tagline}</span>
            </footer>
          </>
        ) : s.overlay === "contact" ? (
          <>
            <p className="eyebrow">03 / Contact</p>
            <h2 id="overlay-heading">{content.contact.heading}</h2>
            <p className="supporting">{content.contact.supporting}</p>
            <div className="contact-channels">
              {content.channels.map((channel, i) => (
                <a
                  href={channel.url}
                  key={channel.url}
                  target={
                    channel.url.startsWith("mailto:") ? undefined : "_blank"
                  }
                  rel={
                    channel.url.startsWith("mailto:")
                      ? undefined
                      : "noopener noreferrer"
                  }
                >
                  <span className="channel-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{channel.name}</strong>
                    <span>{channel.label}</span>
                  </div>
                  <span className="channel-arrow">↗</span>
                </a>
              ))}
            </div>
            <footer className="overlay-footer">
              {content.contact.location}
              <span>{about.tagline}</span>
            </footer>
          </>
        ) : (
          <>
            <p className="eyebrow">A little orientation</p>
            <h2 id="overlay-heading">Take the long way.</h2>
            <div className="help-grid">
              <article>
                <h3>Look</h3>
                <p>
                  Drag anywhere {s.mobile ? "on screen " : ""}to look around.
                </p>
              </article>
              <article>
                <h3>Move</h3>
                <p>
                  {s.mobile
                    ? "Use the on-screen stick, bottom left, to walk."
                    : "WASD or the arrow keys to walk."}
                </p>
              </article>
              <article>
                <h3>Interact</h3>
                <p>
                  {s.mobile
                    ? "Tap the prompt that appears near a station."
                    : "Press E near a station."}
                </p>
              </article>
              <article>
                <h3>Tour</h3>
                <p>“Next stop” in the nav glides you to every stop for you.</p>
              </article>
            </div>
            <p className="supporting">
              Or use About, Work and Contact above. Escape closes any open view.
            </p>
            <button
              className="text-button"
              onClick={() => {
                if (getState().failed) openOverlay("contact");
                else closeTop();
              }}
            >
              {s.failed ? "Find my contact details" : "Back to the alley"} ↗
            </button>
          </>
        )}
      </section>
    </div>
  );
}
