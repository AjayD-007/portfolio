import { resumeData } from "@/data/resume";
import HeroAvatarWrapper from "@/components/Three/HeroAvatarWrapper";
import { Section } from "@/components/layout/Section";
import { Heading, Text, GradientText } from "@/components/ui/Typography";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { Container } from "../layout/Container";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { Link } from "@/components/ui/Link";

export const HeroSection = () => {
  return (
    <Section layout="full-padded" spacing="none">
      <Container maxWidth="7xl">
        <SplitLayout
          left={
            <>
              <Heading level={1} variant="hero">
                {resumeData.title.split(" ")[0]}<br />
                <GradientText>
                  {resumeData.title.split(" ").slice(1).join(" ")}
                </GradientText>
              </Heading>
              <Text variant="hero-subtitle">
                {resumeData.availability}
              </Text>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mt-2 mb-6 w-full">
                <ResumeButton />
                <Link 
                  href={resumeData.contact.links.linkedin}
                  variant="text"
                >
                  LinkedIn
                </Link>
                <Link 
                  href={resumeData.contact.links.github}
                  variant="text"
                >
                  GitHub
                </Link>
              </div>
            </>
          }
          right={
            <div className="container-experiment aspect-[3/4] w-full">
              <HeroAvatarWrapper />
            </div>
          }
        />
      </Container>
    </Section>
  );
};
