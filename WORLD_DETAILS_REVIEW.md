# Procedural detailing — review required

The local preview is implemented, but is not yet a final sign-off against the brief. `AGENTS.md` requires stopping when a needed atmospheric or scale value is absent from `WORLD_BRIEF.md`. These decisions need an explicit addendum before the remaining visual refinement can be treated as authoritative.

## Proposed placement schedule

Positions below describe the current procedural preview, in metres. They use the brief's existing dimensions, colours and materials.

| Population | Proposed placement |
|---|---|
| Four unlit vending machines | west z −16.8; east −7.2; west 7.2; east 12.6 |
| Four parked scooters | east z −17.6; west −8.0; east 4.6; west 18.6 |
| Nine crate stacks | z = −20 + index × 4.6, alternating walls; 2, 3, 4 crates repeating |
| Two bins | east z −12.6; west 19.8 |
| Three steam grates | z −12, 2, 16; first two on mobile |
| Wall-prop backing plane | abs(x) = 4.30; the centre is inset by half the prop depth |

Storefront segmentation needs one correction before approval: the final west/east spans in the preview exceed §3.4's 6.2 m maximum. Proposed final spans are west `[15.4, 21.6]` and east `[14.2, 20.4]`; the short remaining sections become plain wall beside the bend. All earlier spans remain as shown in `lib/world.ts`'s `STORE_RUNS`.

## Proposed puddle construction

The brief already authors the mask size, 60% coverage, roughness endpoints, 3–6 ellipses per blob, 0.8–4.5 m major axes and the two measurement regions. The preview currently uses a simpler ellipse scatter; it does not establish 60% measured coverage.

The missing construction choices proposed for the addendum are:

- Ellipse minor axis: 0.5–1.0 times its major axis.
- Blob member-centre displacement: at most one quarter of the blob's major axis.
- Centre bias: Gaussian width 1.0 m; gutter bias uses the authored 0.22 m gutter width, centred at x = ±3.02.
- Measure wet coverage at the midpoint between authored wet/dry roughness, in each authored region independently; stop adding blobs when both regions reach 60%.
- Keep the existing deterministic seeds. This is a reproducible construction decision, not runtime randomness.

## Further work already specified by the brief

Painted vehicle-light pools, contact shadows, decorative-sign flicker, shared grain and normal textures, ripple centre jitter, size variation and carriageway emitters are implemented. The ripple emitters still use the current unmeasured puddle mask. The final source-token audit remains open alongside the decisions above. The portfolio content and navigation are implemented. Physical-phone performance and touch walking still require a connected real phone.

Approving this sheet would authorize incorporating its concrete placements and puddle construction into `WORLD_BRIEF.md`, then moving their corresponding settings into `lib/world.ts`. It would not change project content, palette, fog, eye height, reflection gain or the sound-off override.
