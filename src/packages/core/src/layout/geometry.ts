// Geometry tokens from visual design 5 (docs/02-ux-design/04-visual-design.md).
// Themes never change these (visual design principle 6), so they live with the layout.

/** Dimension tokens in px, named as in visual design 5. Only the ones the MVP layout uses. */
export const geometry = {
  'space.pad-x': 10,
  'space.pad-y': 7,
  'space.line': 18,
  'size.block-min-w': 52,
  'size.loop-strip': 22,
  'size.if-label': 16,
  'size.case-label': 28,
  'size.if-head-extra': 70,
  'size.case-head-extra': 90,
  'size.label-room': 18,
  'size.label-inset': 6,
  'size.call-bar': 7,
  'size.diagram-min-w': 160,
  'size.text-halo': 3,
  'space.diagram': 44,
  'space.paper': 24,
} as const;
