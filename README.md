# 終電 / Last Train

A walkable 3D world, moved through in first person at eye level, that doubles as a portfolio. 3am in Tokyo — you've just missed the last train. A single back alley, forty-six metres end to end, wet asphalt reflecting neon, closed at both ends so there is no horizon to build.

Three things in the alley are lit warmer than the rest, and those three are the portfolio: a lit board at the bend showing one project at a time, a food cart that's the bio station, and a bank of mailboxes that's the contact station. Everything else is atmosphere — nothing in the surroundings carries content.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) · [React 19](https://react.dev/) · TypeScript (strict)
- [three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei) + [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)
- Tailwind CSS for the 2D overlay UI (nav, overlays, gate, hint) — never inside the Canvas
- Configured for a Next.js deployment on Vercel; this build has not been published.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run check:contract # content, movement, collisions, modes and muted audio
npm run check:vehicles # lamp mounts against the three actual vehicle meshes
```

## Source of truth

Two documents govern the implementation:

| Document | Governs |
|---|---|
| [`WORLD_BRIEF.md`](WORLD_BRIEF.md) | Every atmospheric, material, light and scale value; layout; navigation |
| [`CONTENT.md`](CONTENT.md) | The projects — name, description, tech, live URL, GitHub, screenshot |

`lib/world.ts` contains typed world settings. The remaining detailing decisions are listed in `WORLD_DETAILS_REVIEW.md`; the current preview is not yet a completed brief-compliance sign-off. Adding, removing or replacing a project in `CONTENT.md` changes the showcase without component edits.

## Structure

```
app/                      # Next.js App Router shell
components/
  world/                  # The single <Canvas> — ground, atmosphere, effects, showcase, stations
  player/                 # Movement, camera, interaction
  ui/                     # 2D overlay UI — nav, overlays, gate, controls hint
lib/
  world.ts                # Typed mirror of WORLD_BRIEF.md
  content.ts             # CONTENT.md parser
  store.ts                # Mode machine (loading / play / locked / overlay)
  textures/                # Canvas-painted textures
shaders/                  # GLSL files, read by the server shell
```

See [`AGENTS.md`](AGENTS.md) for the full build discipline and rules this project follows.

## Controls and sound

Drag to look; WASD or arrows to walk. Touch devices have an on-screen stick. The top navigation and Next stop reach the content surfaces without walking. E opens the nearest facing station; Escape closes a view. Reduced motion removes camera easing, head bob and expanding ripples.

**Sound starts off on every visit. Enter never enables audio.** The optional sound control is the only entry point to audio; remembered unmuted settings do not restart it.

## Validation

Build, lint, strict TypeScript and contract checks have been run locally. Browser walkthroughs use the Codex integrated browser. A narrow desktop viewport does not establish real-phone frame rate or touch performance; that hardware check remains outstanding. Add `?inspect=1` to the local URL for periodic renderer diagnostics in the browser console.

## Assets

### 3D models

| Model | Author | License | Source |
|---|---|---|---|
| Mazda RX-7 | IvOfficial | [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Poly Pizza](https://poly.pizza/m/SnIoWlh7S2) |
| Toyota AE86 | IvOfficial | [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Poly Pizza](https://poly.pizza/m/ZEFWmOPSgh) |
| Range Rover | IvOfficial | [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Poly Pizza](https://poly.pizza/m/8zk4o6nALW) |
| Vespa (scooter) | Jasmine Roberts | [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Poly Pizza](https://poly.pizza/m/blGLclvvdEM) |

The cars appear on the cross street; four Vespas are parked along the alley. `CrossStreet.tsx` and `StreetProps.tsx` bake transforms, preserve the cars’ source palette colors, merge geometry and normalize their scale. Everything else is generated locally: storefront shutters and awnings, windows, signs, cables, vending machines, crates, bins, pipes, poles, lanterns, condensers, drains, cones, the bio cart, mailboxes, rain, steam and ripple geometry. Canvas painters generate the world textures. No external asset service is required at runtime.

### Fonts

Geist Sans and Geist Mono are served locally from `public/fonts`, under the included SIL Open Font License. The world’s Japanese signs continue to use system canvas fonts.

### Project screenshots

The showcase surface's images (`/vibemail.jpg`, `/waypoint.jpg`, `/music.jpg`, `/scoundrel.jpg`) are screenshots of the author's own projects, listed with their sources in [`CONTENT.md`](CONTENT.md).

## License

Project code is not currently under an open license. The 3D assets above retain their original licenses as listed.

The procedural 24H convenience store has a raised shutter, tiled interior, stocked shelves, drink refrigerators, shopping baskets and a detailed checkout. Its unbranded products, shelf hardware and fixtures reuse instanced geometry; the store remains atmospheric scenery.

A second open bay is a procedural bakery with timber shelves, scored loaves, pastry trays, takeaway boxes and pendant fixtures. The other formerly ajar shutter is now closed. Both stores remain non-interactive scenery.
