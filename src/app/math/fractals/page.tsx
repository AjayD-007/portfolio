import type { Metadata } from "next";
import MandelbrotClient from "./MandelbrotClient";

export const metadata: Metadata = {
  title: "Mandelbrot Fractal Explorer | Interactive Math",
  description: "Explore the Mandelbrot set infinitely. A high-performance, GPU-accelerated fractal explorer featuring Perturbation Theory for deep zooming.",
  keywords: ["Mandelbrot", "Fractal", "WebGL", "GLSL", "React Three Fiber", "Math Explorer", "Perturbation Theory", "Infinite Zoom"],
  openGraph: {
    title: "Mandelbrot Fractal Explorer",
    description: "Experience infinite zoom into the Mandelbrot set with this GPU-accelerated WebGL explorer.",
    type: "website",
  }
};

export default function FractalsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Mandelbrot Fractal Explorer",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "description": "An interactive, GPU-accelerated Mandelbrot set explorer featuring infinite zoom powered by Perturbation Theory and high-precision Float64 emulation.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MandelbrotClient />
    </>
  );
}
