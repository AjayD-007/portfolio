import Decimal from "decimal.js";

export interface OrbitData {
  orbitArray: Float32Array; // Interleaved [x, y, x, y, ...] or length maxIter * 2
  maxIter: number;
}

export interface FractalRefs {
  cx: React.MutableRefObject<Decimal>;
  cy: React.MutableRefObject<Decimal>;
  zoom: React.MutableRefObject<Decimal>;
  maxIter: React.MutableRefObject<number>;
  colorA: React.MutableRefObject<string>;
  colorB: React.MutableRefObject<string>;
  density: React.MutableRefObject<number>;
}
