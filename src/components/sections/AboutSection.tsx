import { resumeData } from "@/data/resume";
import { Section } from "@/components/layout/Section";
import { Heading, Text } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";

export const AboutSection = () => {
  return (
    <Section spacing="default">
      <Heading level={2} variant="section">{resumeData.about.title}</Heading>
      <Card variant="default" delay={0.2}>
        <Text variant="body">
          {resumeData.about.description}
        </Text>
      </Card>
    </Section>
  );
};
