import { resumeData } from "@/data/resume";
import { Section } from "@/components/layout/Section";
import { Heading, Text } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Grid } from "@/components/layout/Grid";

export const ProjectsSection = () => {
  return (
    <Section spacing="default">
      <Heading level={2} variant="section">{resumeData.projects.title}</Heading>
      <Grid>
        {resumeData.projects.list.map((proj, i) => (
          <Card key={i} variant="interactive" delay={0.1 * i}>
            <Heading level={3} variant="card-interactive">{proj.name}</Heading>
            <Text variant="body">
              {proj.description}
            </Text>
          </Card>
        ))}
      </Grid>
    </Section>
  );
};
