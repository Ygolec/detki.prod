Docker setup for Nuxt + Directus (SQLite)

This project uses Bun for building and running the Nuxt app inside Docker.

Quick start
1) Copy .env.example to .env and adjust values if needed.
2) Run: docker compose up -d
3) Directus: http://localhost:8055 (first run creates admin from env vars)
4) Nuxt app: http://localhost:3000

Files added
- docker-compose.yml — runs Directus (SQLite) and Nuxt.
- Dockerfile — builds and runs Nuxt using Bun and Nitro output.
- .dockerignore — reduces image size.
- .env.example — environment variables template.

SQLite database location
- The SQLite file is created at project root as directus.db and is mounted into the Directus container at /directus/database/data.db.

Environment variables
- DIRECTUS_PUBLIC_URL: URL to access Directus from browser and Nuxt.
- DIRECTUS_STATIC_TOKEN: Optional Directus static token for public reads.
- NUXT_PUBLIC_DIRECTUS_URL and NUXT_PUBLIC_DIRECTUS_TOKEN are passed to the Nuxt client runtime.

Nuxt runtime usage
In Nuxt, access via useRuntimeConfig().public.directusUrl and useRuntimeConfig().public.directusToken.

Notes about Bun
- The Dockerfile uses the official oven/bun image.
- Dependencies are installed with `bun install` using bun.lock if present.
- Build uses `bun run build` (from your package.json scripts) and falls back to `bunx nuxi build` if necessary.
- The server is started with `bun .output/server/index.mjs`. 
