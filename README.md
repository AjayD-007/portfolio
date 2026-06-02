This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
The Quantitative Pitch for the RAG Engine
​In a large enterprise, the cost of "seeking information" is staggering. Industry data shows that the average engineer spends roughly 1.5 to 2 hours per day searching for documentation, looking for code snippets, or waiting for a colleague to reply to a question.
​You can pitch the quantitative benefit using two core metrics:
​Metric A: Engineering Hours Reclaimed (The Search Tax)
​The Calculation: If your engineering org has roughly 100 developers, and this tool saves each developer just 15 minutes a day by giving instant, cited answers instead of forcing them to dig through 30 repos and stale Confluence pages.
​The Math: 0.25\text{ hours} \times 100\text{ devs} = 25\text{ hours saved per day}. Over a standard working year (~250 days), that is 6,250 developer hours reclaimed annually.
​The Punchline: "This isn't just a convenience tool; it directly reclaims thousands of engineering hours currently lost to internal information discovery, accelerating our sprint velocity."
​Metric B: Onboarding Time to First Commit (TTFC)
​The Calculation: Measure how long it takes a new hire to set up their environment and make their first pull request. Currently, it might take 5 to 7 days due to broken READMEs or missing Confluence links.
​The Punchline: "By providing an absolute source of truth that indexes code and context together, we aim to compress developer onboarding time by 20%, getting new hires shipped to production faster."
​2. Fleshing out the Architecture
​Since your company heavily utilizes the Microsoft ecosystem (Teams, Copilot, etc.), your architecture should leverage enterprise-grade components that security compliance teams will love. You are not sending data to a public OpenAI API; you are keeping it within your cloud perimeter.
​Here is the technical blueprint for the RAG pipeline:
​Step 1: The Ingestion & Sync Pipeline (Cron Job)
​You don't just index data once; it has to stay fresh.
​Confluence: Use the Confluence REST API to pull page spaces.
​Code Repos: A script clones the target repositories, filters for documentation (.md files, architecture diagrams, package.json for tech stack discovery, and high-level configuration files), and discards the actual heavy logic code lines to keep the index clean.
​Orchestration: A simple Node.js or Python script run via a scheduled cron job (e.g., every night at midnight) to capture updates.
​Step 2: Processing & Vector Storage
​Chunking: The script breaks long Confluence pages and READMEs into smaller, readable paragraphs (e.g., chunks of 500 tokens with a 50-token overlap so context isn't split in half).
​Embedding Model: Pass these chunks through an enterprise embedding model (like Azure OpenAI's text-embedding-3-small).
​Vector Database: Store these embeddings alongside metadata (e.g., source_url: confluence..., repo_name: app-backend, last_updated: 2026-06-01) in an enterprise-ready vector store. If your team uses PostgreSQL, you can use the pgvector extension. If you want something managed, Pinecone Enterprise or Azure AI Search works perfectly.
​Step 3: The Query & LLM Layer
​When a user asks: "How do I set up the local Docker environment for the payment service?"
​The system converts the question into a vector embedding.
​It queries the Vector DB for the top 3 or 4 closest matching chunks of documentation.
​It constructs a prompt for the LLM:
​"You are Guardian's internal tech assistant. Answer the user's question strictly using the following corporate context. If the answer isn't in the context, say you don't know. Always provide the source URLs from the metadata."
​The LLM (e.g., Azure OpenAI GPT-4o) generates a clean, concise response with markdown links back to the original Confluence pages or GitHub repos.
​Step 4: The Interface (Where the User Sees It)
​Since leadership likes visible, polished things, propose two interfaces:
​The Web Dashboard: A clean, minimalist web portal built with Next.js, TypeScript, and TailwindCSS. It features a simple search/chat bar and a history panel.
​The Teams Bot: A Microsoft Teams app integration. Developers can just tag @TechContextBot directly in a channel or chat to ask a question without leaving their workspace.
​3. Anticipating Leadership's Concerns (The Guardrails)
​Because this is the company's first user-facing LLM project, leadership will immediately worry about two things. If you answer these before they ask, your pitch will stand out:
​Data Security & Privacy: Ensure them that by using Azure OpenAI Service, the data is completely isolated. The models are not trained on your data, and no corporate knowledge leaves the secure enterprise cloud environment.
​Hallucination Control: Explain that because it is a RAG system, the LLM is restricted only to the text provided by your Vector DB. If a developer asks for something unrelated, the system is hard-coded to reply, "I cannot find that in our documentation," preventing the AI from fabricating code or policies.
