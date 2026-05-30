# Character Card Editor

A robust, full-stack Next.js web application designed for writers, role-players, and game designers to create, edit, and AI-auto-fill detailed character cards.

## Features

- **Comprehensive Character Schema**: 145 distinct fields categorized into 24 sections, ensuring deep and nuanced character profiles.
- **AI-Powered Generation**: Automatically fill specific sections or entire character cards using LLMs.
- **Deep Character Analysis**: AI assistant analyzes characters for contradictions, clichés, or gaps and suggests actionable fixes.
- **Word-Level Diffing**: Review AI-suggested changes visually before applying them to your character data.
- **Project Organization**: Group characters by project for better structure.
- **Markdown Export**: Export character profiles into readable Markdown format.
- **Rate Limiting & Streaming**: Built-in SSE streaming for real-time AI responses and rate limiting to prevent API abuse.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI**: React 19, [Tailwind CSS](https://tailwindcss.com/)
- **Database**: SQLite (via `@libsql/client`)
- **ORM**: [Prisma 7](https://www.prisma.io/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **AI Providers**: DeepSeek (Primary), xAI (Grok), OpenAI
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd character-editor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   > **⚠️ Important note for WSL / Linux users:**
   > If you are running this project on WSL (Windows Subsystem for Linux) или a native Linux environment, you must install the platform-specific `libsql` package to avoid database connectivity errors during Prisma operations:
   > ```bash
   > npm install @libsql/linux-x64-gnu
   > ```

3. **Set up Environment Variables**:
   Copy the example environment file and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to add your `DEEPSEEK_API_KEY` (or keys for xAI/OpenAI).*

4. **Initialize the Database**:
   Apply Prisma migrations to create the local SQLite database (`dev.db`):
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to start building characters.

## Architecture Highlights

- **Server Actions**: All CRUD operations for Characters and Projects are handled securely via Next.js Server Actions (`src/lib/actions.ts`).
- **Provider Abstraction**: Easily switch or add new AI providers in `src/lib/ai/provider.ts`.
- **Staged AI Settings**: AI configurations (models, temperatures) use a staged/apply pattern stored locally to prevent accidental misconfigurations.

## Scripts

- `npm run dev` - Starts the development server.
- `npm run build` - Builds the application for production.
- `npm start` - Starts the production server.
- `npm run lint` - Runs ESLint.
- `npm test` - Runs the Vitest test suite.
