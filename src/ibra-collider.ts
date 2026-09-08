import earcut from "earcut";
import type { Vec2Like } from "./unity-scene";

// PolygonCollider2D path from Ibrahimovic.prefab, in prefab-local units (before the ×2 transform scale).
const IBRA_POLYGON_PATH: readonly Vec2Like[] = [
  { x: 1.875, y: -1.175 }, { x: 1.815, y: -1.145 }, { x: 1.735, y: -1.195 }, { x: 1.395, y: -1.275 },
  { x: 1.245, y: -1.275 }, { x: 0.805, y: -1.115 }, { x: 0.705, y: -1.085 }, { x: 0.575, y: -1.025 },
  { x: 0.475, y: -0.925 }, { x: 0.395, y: -0.865 }, { x: 0.205, y: -0.775 }, { x: 0.115, y: -0.755 },
  { x: -0.155, y: -0.705 }, { x: -0.065, y: -0.505 }, { x: 0.155, y: -0.525 }, { x: 0.305, y: -0.465 },
  { x: 0.405, y: -0.545 }, { x: 0.425, y: -0.565 }, { x: 0.515, y: -0.555 }, { x: 0.575, y: -0.455 },
  { x: 0.575, y: -0.425 }, { x: 0.555, y: -0.365 }, { x: 0.455, y: -0.245 }, { x: 0.335, y: -0.115 },
  { x: 0.145, y: -0.095 }, { x: -0.045, y: -0.145 }, { x: -0.195, y: -0.175 }, { x: -0.265, y: -0.035 },
  { x: -0.395, y: -0.035 }, { x: -0.505, y: -0.065 }, { x: -0.665, y: -0.055 }, { x: -0.835, y: -0.035 },
  { x: -0.865, y: 0.055 }, { x: -0.935, y: 0.255 }, { x: -0.915, y: 0.355 }, { x: -0.905, y: 0.415 },
  { x: -0.575, y: 0.905 }, { x: -0.595, y: 1.085 }, { x: -0.665, y: 1.235 }, { x: -0.775, y: 1.485 },
  { x: -0.795, y: 1.625 }, { x: -0.905, y: 1.625 }, { x: -1.025, y: 1.555 }, { x: -1.055, y: 1.535 },
  { x: -1.065, y: 1.355 }, { x: -1.035, y: 1.305 }, { x: -0.885, y: 1.215 }, { x: -0.895, y: 0.985 },
  { x: -0.955, y: 0.845 }, { x: -1.105, y: 0.665 }, { x: -1.135, y: 0.785 }, { x: -1.145, y: 0.815 },
  { x: -1.165, y: 0.925 }, { x: -1.235, y: 0.995 }, { x: -1.455, y: 1.015 }, { x: -1.515, y: 0.995 },
  { x: -1.645, y: 0.855 }, { x: -1.865, y: 0.765 }, { x: -1.865, y: 0.655 }, { x: -1.665, y: 0.485 },
  { x: -1.695, y: 0.435 }, { x: -1.755, y: 0.205 }, { x: -1.755, y: -0.045 }, { x: -1.665, y: -0.435 },
  { x: -1.615, y: -0.515 }, { x: -1.475, y: -0.555 }, { x: -1.175, y: -0.825 }, { x: -0.925, y: -0.985 },
  { x: -0.855, y: -1.065 }, { x: -0.725, y: -1.125 }, { x: -0.535, y: -1.165 }, { x: -0.425, y: -1.165 },
  { x: 0.025, y: -1.155 }, { x: 0.025, y: -1.175 }, { x: 0.385, y: -1.235 }, { x: 0.445, y: -1.305 },
  { x: 0.535, y: -1.375 }, { x: 0.765, y: -1.445 }, { x: 1.355, y: -1.525 }, { x: 1.425, y: -1.625 },
  { x: 1.615, y: -1.625 }, { x: 1.655, y: -1.545 }, { x: 1.785, y: -1.475 }, { x: 1.875, y: -1.375 },
];

// Slivers thinner than this add no area Box2D could ever hit and would fail its polygon validation.
const MIN_TRIANGLE_AREA = 1e-5;

export type ConvexPiece = readonly Vec2Like[];

function triangleArea(a: Vec2Like, b: Vec2Like, c: Vec2Like): number {
  return Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
}

/** Unity splits a concave PolygonCollider2D into convex Box2D shapes; this does the same with ear clipping. */
export function ibraConvexPieces(scale: number): readonly ConvexPiece[] {
  const scaled = IBRA_POLYGON_PATH.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  const triangleIndices = earcut(scaled.flatMap((p) => [p.x, p.y]));
  const pieces: ConvexPiece[] = [];
  for (let i = 0; i < triangleIndices.length; i += 3) {
    const triangle = [scaled[triangleIndices[i]], scaled[triangleIndices[i + 1]], scaled[triangleIndices[i + 2]]];
    if (triangleArea(triangle[0], triangle[1], triangle[2]) >= MIN_TRIANGLE_AREA) {
      pieces.push(triangle);
    }
  }
  return pieces;
}
