"use client";

import dynamic from "next/dynamic";

const MandelbrotExplorer = dynamic(
  () => import("@/components/Three/Mandelbrot").then(m => m.MandelbrotExplorer),
  { ssr: false }
);

export default function MandelbrotClient() {
  return <MandelbrotExplorer />;
}
