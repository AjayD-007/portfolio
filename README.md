# Ajay Dharmaraj — Senior Software Engineer

Welcome to the open-source repository for my personal portfolio. Designed to be a high-performance, immersive showcase of my engineering capabilities, this portfolio blends 3D web technologies, modern React paradigms, and offline-first PWA architecture.

---

## 🚀 Tech Stack

This project leverages a cutting-edge frontend stack:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **3D Graphics**: [Three.js](https://threejs.org/) & [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- **PWA / Offline**: [Serwist](https://serwist.build/) (Service Workers)
- **Rate Limiting**: [Upstash Redis](https://upstash.com/) for API routes

---

## ✨ Key Features

- **Immersive 3D Integrations**: Features interactive Three.js components using `@react-three/fiber` to create engaging visual experiences (e.g., interactive avatars, non-euclidean math visualizations).
- **Offline Capabilities**: Configured as a Progressive Web App (PWA) using Serwist, ensuring the site loads quickly and functions even without an internet connection.
- **Dynamic View Counter**: Uses a serverless API integrated with a Redis store to track unique visits.
- **Rate-Limited Downloads**: Includes a secure, rate-limited endpoint for resume downloads to prevent abuse.
- **Dark/Light Mode**: Full theme support with seamless transitions and a customized UI design system.

---

## 📸 Screenshots & Performance

> [!NOTE]
> Screenshots and Lighthouse scores will be added here once the final build is deployed.

### UI Overview
![UI Screenshot placeholder](https://via.placeholder.com/800x450?text=Portfolio+UI+Screenshot)

### Lighthouse Score
![Lighthouse Score placeholder](https://via.placeholder.com/800x200?text=Lighthouse+100+Performance)

---

## 🛠️ Getting Started

To run this project locally, follow these steps:

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm`, `yarn`, or `pnpm` installed.

### 1. Clone the repository

```bash
git clone https://github.com/AjayD-007/portfolio.git
cd portfolio
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and add your Upstash Redis credentials for the view counter and resume rate-limiting to work:

```env
UPSTASH_REDIS_REST_URL="your_upstash_redis_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The application supports hot-reloading.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
