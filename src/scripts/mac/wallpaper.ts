// The Mac's wallpaper: Pine with topo contour rings, same language as the hero.
// Used for the full-screen home screen and the small texture on the 3D laptop.
import { rng, ring } from '../contours';

export const PINE = { deep: '#1f3d2f', base: '#2f5d46', line: 'rgba(238,237,229,0.16)', paper: '#eeede5', ink: '#1d221e' };

export function drawWallpaper(g: CanvasRenderingContext2D, w: number, h: number) {
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, PINE.base);
  grad.addColorStop(1, PINE.deep);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // Contour rings in a 100 x 56 space, scaled to the canvas.
  const sx = w / 100, sy = h / 56;
  const R = rng(31);
  const shape = [0.09, R() * 6, 0.06, R() * 6, 0.035, R() * 6];
  g.lineWidth = Math.max(1, w / 900);
  g.strokeStyle = PINE.line;
  for (let i = 0; i < 12; i++) {
    const rx = 5 + i * 3.6;
    const sh = shape.map((v, k) => (k % 2 ? v + i * 0.1 : v * (1 + i * 0.08)));
    const pts = ring(64 - i * 0.6, 34 + i * 0.3, rx, rx * 0.72, sh, R, 0, Math.PI * 2, 160);
    g.beginPath();
    pts.forEach(([x, y], j) => (j ? g.lineTo(x * sx, y * sy) : g.moveTo(x * sx, y * sy)));
    g.closePath();
    g.stroke();
  }
}

/** Home screen preview for the 3D laptop: wallpaper, menu bar, two icons. */
export function drawHomeTexture(g: CanvasRenderingContext2D, w: number, h: number, labels: [string, string]) {
  drawWallpaper(g, w, h);
  g.fillStyle = 'rgba(238,237,229,0.9)';
  g.fillRect(0, 0, w, h * 0.045);
  const s = h * 0.09;
  const x = w - s * 1.9;
  // Photoshop-style app icon (our own glyph) and a folder.
  g.fillStyle = PINE.paper;
  roundRect(g, x, h * 0.12, s, s, s * 0.22);
  g.fill();
  g.fillStyle = PINE.base;
  g.fillRect(x + s * 0.22, h * 0.12 + s * 0.22, s * 0.38, s * 0.38);
  g.globalAlpha = 0.6;
  g.fillRect(x + s * 0.4, h * 0.12 + s * 0.4, s * 0.38, s * 0.38);
  g.globalAlpha = 1;
  g.fillStyle = '#d9c79a';
  roundRect(g, x, h * 0.12 + s * 1.7, s, s * 0.78, s * 0.12);
  g.fill();
  g.fillStyle = PINE.paper;
  g.font = `500 ${Math.round(h * 0.026)}px "DM Mono", monospace`;
  g.textAlign = 'center';
  g.fillText(labels[0], x + s / 2, h * 0.12 + s * 1.32);
  g.fillText(labels[1], x + s / 2, h * 0.12 + s * 2.85);
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
