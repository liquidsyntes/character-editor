# Character Card Editor

A robust, full-stack Next.js web application designed for writers, role-players, and game designers to create, edit, and AI-auto-fill detailed character cards.

## Features

- **Comprehensive Character Schema**: 145+ distinct fields categorized into 24 sections, ensuring deep and nuanced character profiles.
- **AI-Powered Generation**: Automatically fill specific sections or entire character cards using LLMs. Supports 6 AI providers.
- **Deep Character Analysis**: AI assistant analyzes characters for contradictions, clichés, or gaps and suggests actionable fixes.
- **Word-Level Diffing**: Review AI-suggested changes visually before applying them to your character data.
- **Character Creation Wizard**: Step-by-step guided wizard for creating characters with AI assistance.
- **Voice & Speech Patterns**: AI-generated dialogue scenes and speech pattern analysis for characters.
- **Narrative Module**: AI-powered narrative generation from character data.
- **Public Persona**: Generate how the character is perceived by others.
- **World Elements**: Locations, factions, history, laws — building blocks for your project's world.
- **Project Organization**: Group characters by project for better structure.
- **Import**: Import characters from JSON, Markdown, and SillyTavern (Character Card V2) files.
- **Export**: Export character profiles in 5 formats — Markdown, JSON, Plain Text, Obsidian (Dataview), and SillyTavern (Character Card V2).
- **Authentication**: Built-in user authentication with NextAuth (Credentials provider with auto-registration).
- **Rate Limiting & Streaming**: Built-in SSE streaming for real-time AI responses and persistent SQLite-backed rate limiting.
- **Docker Support**: Production-ready Dockerfile and docker-compose with SQLite volume.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI**: React 19, [Tailwind CSS](https://tailwindcss.com/)
- **Database**: SQLite (via `@libsql/client`)
- **ORM**: [Prisma 7](https://www.prisma.io/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **AI Providers**: DeepSeek (Primary), xAI (Grok), OpenAI, Anthropic (Claude), Gemini (Google), OpenRouter
- **Auth**: NextAuth with Credentials provider
- **Validation**: Zod
- **Testing**: Vitest (46 tests, 9 test files)

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
   > If you are running this project on WSL (Windows Subsystem for Linux) or a native Linux environment, you must install the platform-specific packages:
   > ```bash
   > npm install @libsql/linux-x64-gnu
   > npm install @rolldown/binding-linux-x64-gnu  # for tests
   > ```

3. **Set up Environment Variables**:
   Copy the example environment file and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to add your `DEEPSEEK_API_KEY` (or keys for xAI/OpenAI/Anthropic/Gemini/OpenRouter).*

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
   Open [http://localhost:4000](http://localhost:4000) in your browser to start building characters.

### Docker

```bash
docker-compose up --build
```

## Architecture Highlights

- **Server Actions**: All CRUD operations for Characters and Projects are handled securely via Next.js Server Actions (`src/lib/actions.ts`).
- **Provider Abstraction**: Easily switch or add new AI providers. Models are managed from a single source of truth (`src/lib/ai/models.ts`).
- **Staged AI Settings**: AI configurations (models, temperatures) use a staged/apply pattern stored locally to prevent accidental misconfigurations.
- **Authentication**: NextAuth with Credentials provider and auto-registration for personal use.
- **Environment Validation**: All environment variables are validated at startup with Zod schema (`src/lib/env.ts`).

## Scripts

- `npm run dev` - Starts the development server on port 4000.
- `npm run build` - Builds the application for production.
- `npm start` - Starts the production server on port 4000.
- `npm run lint` - Runs ESLint.
- `npm test` - Runs the Vitest test suite (46 tests).
