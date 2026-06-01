# Mafia - Social Deduction Game

Play Mafia online with friends at **[https://mafia-role.vercel.app/](https://mafia-role.vercel.app/)**

A real-time multiplayer game built with Next.js where players take on roles like Mafia, Citizen, Police, Doctor, and Lady to outwit each other.

## Features

- Create or join game lobbies
- Real-time player synchronization
- Random or chosen narrator mode
- Support for 7-13 players
- Automatic cleanup of empty rooms
- Responsive design

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Storage**: Upstash Redis (production), In-memory (development)
- **Deployment**: Vercel

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables (Production)

For production deployments, set these in your Vercel project:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

For local development, these are optional - the app uses in-memory storage as fallback.

