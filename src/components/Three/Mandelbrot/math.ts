import Decimal from "decimal.js";
import { OrbitData } from "./types";

// Set high precision for deep zooms. 
// 100 decimal places is enough for ~1e50 zoom.
Decimal.set({ precision: 100 });

/**
 * Calculates the reference orbit for the center of the screen.
 * Z_0 = 0
 * Z_{n+1} = Z_n^2 + C
 * @param cx Center X coordinate (Decimal)
 * @param cy Center Y coordinate (Decimal)
 * @param maxIter Maximum iterations
 * @returns Float32Array containing interleaved [x, y, x, y...] of the orbit
 */
export function calculateReferenceOrbit(cx: Decimal, cy: Decimal, maxIter: number) {
  const orbitArray = new Float32Array(maxIter * 4);

  let zx = new Decimal(0);
  let zy = new Decimal(0);
  let zxSq = new Decimal(0);
  let zySq = new Decimal(0);

  let escapedAt = -1;

  for (let i = 0; i < maxIter; i++) {
    orbitArray[i * 4] = zx.toNumber();
    orbitArray[i * 4 + 1] = zy.toNumber();

    const newZx = zxSq.minus(zySq).plus(cx);
    const newZy = zx.times(zy).times(2).plus(cy);

    zx = newZx;
    zy = newZy;

    zxSq = zx.times(zx);
    zySq = zy.times(zy);

    if (zxSq.plus(zySq).gt(256)) {
      escapedAt = i;
      for (let j = i + 1; j < maxIter; j++) {
        orbitArray[j * 4] = zx.toNumber();
        orbitArray[j * 4 + 1] = zy.toNumber();
      }
      break;
    }
  }

  return { orbitArray, maxIter, escapedAt };
}

export function findBestReference(cx: Decimal, cy: Decimal, zoom: Decimal, asp: number, maxIter: number) {
  // World space width/height of the screen
  const w = new Decimal(asp).div(zoom);
  const h = new Decimal(1.0).div(zoom);

  const offsets = [{ dx: new Decimal(0), dy: new Decimal(0) }];
  for (let rad = 0.1; rad <= 0.45; rad += 0.1) {
    offsets.push({ dx: w.times(-rad), dy: h.times(rad) });
    offsets.push({ dx: w.times(0),    dy: h.times(rad) });
    offsets.push({ dx: w.times(rad),  dy: h.times(rad) });
    offsets.push({ dx: w.times(-rad), dy: h.times(0) });
    offsets.push({ dx: w.times(rad),  dy: h.times(0) });
    offsets.push({ dx: w.times(-rad), dy: h.times(-rad) });
    offsets.push({ dx: w.times(0),    dy: h.times(-rad) });
    offsets.push({ dx: w.times(rad),  dy: h.times(-rad) });
  }

  let bestOrbitArray = new Float32Array(maxIter * 4);
  let bestEscapedAt = -2;
  let bestCx = cx;
  let bestCy = cy;

  for (const offset of offsets) {
    const testCx = cx.plus(offset.dx);
    const testCy = cy.plus(offset.dy);
    
    const { orbitArray, escapedAt } = calculateReferenceOrbit(testCx, testCy, maxIter);
    
    if (escapedAt === -1) {
      // It never escaped! Perfect reference point found immediately.
      return { refCx: testCx, refCy: testCy, orbitArray };
    }
    
    if (escapedAt > bestEscapedAt) {
      bestEscapedAt = escapedAt;
      bestOrbitArray = orbitArray;
      bestCx = testCx;
      bestCy = testCy;
    }
  }

  return { refCx: bestCx, refCy: bestCy, orbitArray: bestOrbitArray };
}
export function calculateReferenceOrbitFloat64(cx: number, cy: number, maxIter: number) {
  const orbitArray = new Float32Array(maxIter * 4);

  let zx = 0;
  let zy = 0;
  let zxSq = 0;
  let zySq = 0;
  let escapedAt = -1;

  for (let i = 0; i < maxIter; i++) {
    orbitArray[i * 4] = zx;
    orbitArray[i * 4 + 1] = zy;

    const newZx = zxSq - zySq + cx;
    const newZy = 2 * zx * zy + cy;

    zx = newZx;
    zy = newZy;

    zxSq = zx * zx;
    zySq = zy * zy;

    if (zxSq + zySq > 256) {
      escapedAt = i;
      for (let j = i + 1; j < maxIter; j++) {
        orbitArray[j * 4] = zx;
        orbitArray[j * 4 + 1] = zy;
      }
      break;
    }
  }

  return { orbitArray, maxIter, escapedAt };
}

export function findBestReferenceFloat64(cx: number, cy: number, zoom: number, asp: number, maxIter: number) {
  const w = asp / zoom;
  const h = 1.0 / zoom;

  const offsets = [{ dx: 0, dy: 0 }];
  for (let rad = 0.1; rad <= 0.45; rad += 0.1) {
    offsets.push({ dx: w * -rad, dy: h * rad });
    offsets.push({ dx: w * 0,    dy: h * rad });
    offsets.push({ dx: w * rad,  dy: h * rad });
    offsets.push({ dx: w * -rad, dy: h * 0 });
    offsets.push({ dx: w * rad,  dy: h * 0 });
    offsets.push({ dx: w * -rad, dy: h * -rad });
    offsets.push({ dx: w * 0,    dy: h * -rad });
    offsets.push({ dx: w * rad,  dy: h * -rad });
  }

  let bestOrbitArray = new Float32Array(maxIter * 4);
  let bestEscapedAt = -2;
  let bestCx = cx;
  let bestCy = cy;

  for (const offset of offsets) {
    const testCx = cx + offset.dx;
    const testCy = cy + offset.dy;
    
    const { orbitArray, escapedAt } = calculateReferenceOrbitFloat64(testCx, testCy, maxIter);
    
    if (escapedAt === -1) {
      return { refCx: testCx, refCy: testCy, orbitArray };
    }
    
    if (escapedAt > bestEscapedAt) {
      bestEscapedAt = escapedAt;
      bestOrbitArray = orbitArray;
      bestCx = testCx;
      bestCy = testCy;
    }
  }

  return { refCx: bestCx, refCy: bestCy, orbitArray: bestOrbitArray };
}
