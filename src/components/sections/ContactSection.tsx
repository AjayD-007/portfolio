import { resumeData } from "@/data/resume";
import { Section } from "@/components/layout/Section";
import { Heading, Text } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Link } from "@/components/ui/Link";
import { ActionGroup } from "@/components/ui/ActionGroup";

export const ContactSection = () => {
  return (
    <Section spacing="default">
      <Card variant="cta" delay={0.2}>
        <Heading level={4} variant="section-card">{resumeData.contact.title}</Heading>
        <Text variant="muted">
          {resumeData.contact.description}
        </Text>
        
        <ActionGroup>
          <Link href={resumeData.contact.links.linkedin} variant="button" buttonVariant="primary" aria-label={`Visit ${resumeData.title}'s LinkedIn Profile`}>
            {resumeData.contact.buttons.primary}
          </Link>
          <Link href={resumeData.contact.links.github} variant="button" buttonVariant="secondary" aria-label={`Visit ${resumeData.title}'s GitHub Profile`}>
            {resumeData.contact.buttons.secondary}
          </Link>
        </ActionGroup>
      </Card>
    </Section>
  );
};
