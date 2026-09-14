# Artemis Esports maintenance page

A static Astro maintenance page prepared for deployment on Vercel.

## Local setup

```bash
npm install
npm run dev
```

Open the local URL printed by Astro.

## Production build

```bash
npm run build
```

Astro writes the production site to `dist/`.

## Vercel

Import the repository into Vercel. It should detect Astro automatically. If you
need to enter the settings manually, use:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

This project is fully static, so it does not require `@astrojs/vercel`.
