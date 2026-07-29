"use client";

import { resumeData } from "@/data/resume";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Text } from "@/components/ui/Typography";

export function Footer() {
  const pathname = usePathname();

  if (pathname === '/math/geodesic') {
    return null;
  }

  return (
    <footer className="w-full text-center py-8 z-20 relative pointer-events-auto mt-auto">
      <Container maxWidth="4xl">
        <Text variant="label" className="text-[var(--text-main)]">
          &copy; {new Date().getFullYear()} {resumeData.title}
        </Text>
      </Container>
    </footer>
  );
}
