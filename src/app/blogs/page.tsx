import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Heading, Text } from "@/components/ui/Typography";
import { Grid } from "@/components/layout/Grid";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Writings | Ajay - Frontend & Design",
  description: "Thoughts, tutorials, and experiments exploring frontend engineering and design.",
};

const DEV_TO_USERNAME = "ajay_dharmaraj";

export const revalidate = 3600;

async function getPosts() {
  try {
    const res = await fetch(`https://dev.to/api/articles?username=${DEV_TO_USERNAME}&state=all`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching Dev.to articles:", error);
    return [];
  }
}

export default async function BlogsPage() {
  const blogs = await getPosts();

  return (
    <Container maxWidth="7xl" className="py-4 md:py-8 z-10 flex-grow">
      <Section spacing="none" className="mb-16">
        <Heading level={1} variant="section">
          Writings
        </Heading>
        <Text variant="body">
          Thoughts, tutorials, and experiments exploring frontend engineering and design.
        </Text>
      </Section>

      {blogs.length === 0 ? (
        <Text variant="muted">No articles found for @{DEV_TO_USERNAME} yet...</Text>
      ) : (
        <Grid columns={3}>
          {blogs.map((blog: any, i: number) => (
            <Link key={blog.id} href={`/blogs/${blog.slug}`} className="h-full">
              <Card variant="interactive" delay={0.1 * i} className="hover:scale-105 transition-transform duration-500 flex flex-col h-full">
                <Text variant="label" className="mb-4 text-[var(--text-muted)]">
                  {new Date(blog.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                <Heading level={3} variant="card-interactive">
                  {blog.title}
                </Heading>
                <Text variant="muted" className="mt-auto mb-6">
                  {blog.description}
                </Text>
                <div className="mt-auto flex flex-wrap gap-2">
                  {blog.tag_list.slice(0, 3).map((tag: string) => (
                    <Badge key={tag}>
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </Grid>
      )}
    </Container>
  );
}
