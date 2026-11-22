// Hover-to-zoom only makes sense with a mouse or trackpad. Touch browsers fire a synthetic
// mouseenter on tap but no mouseleave, which would leave the product image stuck at 2.5x.
export const canHoverZoom =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;
