# Wiki Quiz

A local Visual Studio Code project for exploring Wikipedia articles and generating interactive quiz content with AI assistance. The app is built as a standalone web application and is ready for local development, GitHub hosting, and future deployment.

## Features

- Search and browse Wikipedia topics directly from the app
- Generate custom quiz questions from article content
- Explore "Did You Know?" trivia cards
- Chat with an AI assistant about the selected article and quiz
- Enjoy a polished React-based experience with a local Express backend

## Technologies Used

- React + TypeScript
- Vite
- Express
- Tailwind CSS
- Google Gemini API via the official SDK

## Project Structure

- src/ — frontend React components and app state
- server.ts — local backend API routes and Gemini integration
- assets/ — static assets
- package.json — scripts and dependencies

## Prerequisites

- Node.js 18 or newer
- npm
- A Visual Studio Code editor
- A compatible Gemini API provider and API key

## Installation

1. Open the project folder in Visual Studio Code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a local environment file from the example:
   ```bash
   copy .env.example .env.local
   ```
4. Update .env.local with your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Running Locally

Start the development server:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Project Architecture & Pipeline

### Architecture Overview

This app is built as a local full-stack project with a React frontend and an Express backend.

- `src/` contains the React application, UI components, and client-side state.
- `server.ts` hosts the Express server, provides API routes, and communicates with the Gemini AI service.
- `assets/` stores static media, icons, and other front-end assets.
- `package.json` manages scripts, dependencies, and local development tasks.

### Data Flow

1. User enters a search or selects a topic in the frontend.
2. The React UI calls backend endpoints under `/api/*`.
3. The backend fetches Wikipedia content and optionally sends prompts to Gemini.
4. Gemini returns generated quiz and trivia content.
5. The backend returns the response to the frontend for display.

### Local Development Pipeline

The local pipeline is designed to be fast and easy to use in VS Code:

- `npm run dev` — runs the app in development mode with live reload.
- `npm run lint` — validates TypeScript and catches errors before runtime.
- `npm run build` — produces a production-ready frontend bundle and a bundled backend server.
- `npm run clean` — removes generated build artifacts.
- `npm run check-env` — verifies the required `GEMINI_API_KEY` is available.

### Deployment Flow

For future deployment, the app can be packaged by running:

```bash
npm run build
```

Then start the bundled server with:

```bash
npm run start
```

### Architecture Diagram

```text
[Browser] -> [Vite React App] -> [Express Server]
                        |            |
                        |            +-> [Wikipedia API]
                        |            +-> [Gemini API]
                        |
                        +-> [Local .env/.env.local]
```

## Build

To create a production build:

```bash
npm run build
```

The build output is generated in the dist/ folder.

## Troubleshooting

- If the app cannot start, confirm that Node.js and npm are installed.
- If quiz generation fails, verify that GEMINI_API_KEY is set correctly in .env.local.
- If the port is already in use, stop the conflicting process or change the port in the server configuration.
- If dependencies fail to install, remove node_modules and package-lock.json and run npm install again.

## License

No license file is included yet. Add one before publishing the project publicly.
