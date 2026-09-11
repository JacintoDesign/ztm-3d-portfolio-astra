import fs from "node:fs";
import path from "node:path";
export type Project = {
  name: string;
  description: string;
  tags: string[];
  tech: string[];
  url: string;
  github: string;
  screenshot: string;
};
export type Channel = { name: string; label: string; url: string };
export type Panel = {
  label: string;
  title: string;
  blurb: string;
  url: string;
  linkLabel: string;
};
export type Content = {
  projects: Project[];
  channels: Channel[];
  about: {
    eyebrow: string;
    heading: string;
    role: string;
    tagline: string;
    location: string;
    stats: { value: string; label: string }[];
    stories: { title: string; text: string }[];
    course: Panel;
    now: Panel;
  };
  contact: { heading: string; supporting: string; location: string };
};
function field(text: string, key: string) {
  return (
    text.match(
      new RegExp(
        "\\*\\*" +
          key +
          ":\\*\\*\\s*([\\s\\S]*?)(?=\\n(?:- \\*\\*|\\*\\*|#|---)|$)",
      ),
    )?.[1] ?? ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^`|`$/g, "");
}
function section(text: string, start: string, end?: string) {
  return (
    text
      .split(start)[1]
      ?.split(end ?? "\u0000")[0]
      ?.trim() ?? ""
  );
}
function panel(text: string): Panel {
  return {
    label: field(text, "Label"),
    title: field(text, "Title"),
    blurb: field(text, "Blurb"),
    url: field(text, "URL"),
    linkLabel: field(text, "Link label"),
  };
}
export function getContent(): Content {
  const text = fs.readFileSync(path.join(process.cwd(), "CONTENT.md"), "utf8");
  return parseContent(text);
}
export function parseContent(text: string): Content {
  const projects = Array.from(
    section(text, "## Projects", "## Contact").matchAll(
      /### \d+ — (.+)\n([\s\S]*?)(?=### |$)/g,
    ),
    (m) => ({
      name: m[1],
      description: field(m[2], "Description"),
      tags: field(m[2], "Tags").split(" · "),
      tech: field(m[2], "Tech").split(", "),
      url: field(m[2], "URL"),
      github: field(m[2], "GitHub"),
      screenshot: field(m[2], "Screenshot"),
    }),
  );
  const intro = section(text, "## Intro", "## Story Panels");
  const contact = section(text, "## Contact");
  const channels = Array.from(
    contact.matchAll(/- \*\*(.+?)\*\* — (.+?) — (\S+)/g),
    (m) => ({ name: m[1], label: m[2], url: m[3] }),
  );
  const stories = Array.from(
    section(text, "## Story Panels", "## Foundational Course Panel").matchAll(
      /### (.+)\n([\s\S]*?)(?=### |---|$)/g,
    ),
    (m) => ({ title: m[1], text: m[2].trim() }),
  );
  return {
    projects,
    channels,
    about: {
      eyebrow: field(intro, "Eyebrow"),
      heading: field(intro, "Heading"),
      role: field(intro, "Role"),
      tagline: field(intro, "Tagline"),
      location: field(intro, "Location"),
      stats: Array.from(intro.matchAll(/- \*\*(.+?)\*\* — (.+)/g), (m) => ({
        value: m[1],
        label: m[2],
      })),
      stories,
      course: panel(section(text, "## Foundational Course Panel", "## Now Panel")),
      now: panel(section(text, "## Now Panel", "## Projects")),
    },
    contact: {
      heading: field(contact, "Heading"),
      supporting: field(contact, "Supporting"),
      location: field(contact, "Location"),
    },
  };
}
