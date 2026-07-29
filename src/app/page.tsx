import { resumeData } from "@/data/resume";
import SceneWrapper from "@/components/Three/SceneWrapper";
import { Container } from "@/components/layout/Container";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: resumeData.title,
    jobTitle: 'Software Engineer',
    url: 'https://ajay-dharmaraj.vercel.app',
    sameAs: [
      resumeData.contact.links.linkedin,
      resumeData.contact.links.github,
    ]
  };

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SceneWrapper />
      
      {/* Mega Container Wrapper (Automatically constrains children to max-w-4xl and centers them) */}
      <Container maxWidth="5xl" className="pb-12 md:pb-24">
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection />
        <EducationSection />
        <ContactSection />
      </Container>
    </div>
  );
}
