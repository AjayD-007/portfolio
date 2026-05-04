import type { Metadata } from "next";
import MandelbrotClient from "./MandelbrotClient";

export const metadata: Metadata = {
  title: "Mandelbrot Explorer | Math",
  description: "GPU-accelerated Mandelbrot fractal explorer rendered entirely in a GLSL fragment shader with smooth coloring, zoom, and pan.",
};

export default function MandelbrotPage() {
  return <MandelbrotClient />;
}
