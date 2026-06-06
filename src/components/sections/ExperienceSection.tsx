import { resumeData } from "@/data/resume";
import { Section } from "@/components/layout/Section";
import { Heading } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { List, ListItem } from "@/components/ui/List";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/Badge";

export const ExperienceSection = () => {
  return (
    <Section spacing="default">
      <Heading level={2} variant="section">{resumeData.experience.title}</Heading>
      
      <Stack>
        {resumeData.experience.list.map((exp, i) => (
          <Card key={i} variant="default" delay={0.2 + i * 0.1}>
            <CardHeader 
              title={exp.company}
              subtitle={exp.role}
              badges={<Badge>{exp.period}</Badge>}
            />
            <List>
              {exp.achievements.map((item, j) => (
                <ListItem key={j}>
                  {item}
                </ListItem>
              ))}
            </List>
          </Card>
        ))}
      </Stack>
    </Section>
  );
};
