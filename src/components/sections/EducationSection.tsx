import { resumeData } from "@/data/resume";
import { Section } from "@/components/layout/Section";
import { Heading } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Badge } from "@/components/ui/Badge";

export const EducationSection = () => {
  return (
    <Section spacing="default">
      <Heading level={2} variant="section">{resumeData.education.title}</Heading>
      <Card variant="default" delay={0.2}>
        <CardHeader 
          title={resumeData.education.degree}
          subtitle={resumeData.education.school}
          badges={
            <>
              <Badge>{resumeData.education.period}</Badge>
              <Badge>{resumeData.education.details}</Badge>
            </>
          }
        />
      </Card>
    </Section>
  );
};
