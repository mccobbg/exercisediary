# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Documentation-First Development

**BEFORE generating ANY code, you MUST:**
1. **Check the `/docs` directory** for relevant documentation files
2. **Read and understand** the appropriate documentation for the technology/feature you're implementing
3. **Follow the patterns and best practices** outlined in those docs
4. **Reference the documentation** when making architectural decisions

The `/docs` directory contains authoritative reference material for all major technologies and features used in this project. Consulting these docs FIRST ensures consistency, correctness, and adherence to current best practices:

- /docs/ui.md
- /docs/data-fetching.md
- /docs/data-mutations.md
- /docs/auth.md

**Never generate code without first consulting the relevant documentation.**

## Project Overview

Exercise Diary is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS 4. The project uses the Next.js App Router architecture with TypeScript strict mode enabled.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Technology Stack

- **Framework:** Next.js 16.0.3 (App Router)
- **React:** 19.2.0
- **TypeScript:** 5.x with strict mode
- **Styling:** Tailwind CSS 4 with PostCSS
- **Fonts:** Geist Sans and Geist Mono (loaded via next/font)
- **Linting:** ESLint with Next.js configuration

## Project Structure

```
src/
├── app/              # Next.js App Router directory
│   ├── layout.tsx    # Root layout with Geist fonts
│   ├── page.tsx      # Home page
│   ├── globals.css   # Global styles with Tailwind imports
│   └── favicon.ico   # Site favicon
```

## Key Architectural Decisions

### Next.js Configuration

- Uses App Router (not Pages Router)
- Path alias `@/*` maps to `./src/*` for cleaner imports
- TypeScript `jsx` mode set to `react-jsx` (React 19 automatic JSX runtime)
- Module resolution uses `bundler` strategy

### Styling System

- Tailwind CSS 4 is imported via `@import "tailwindcss"` in globals.css
- Uses inline `@theme` directive for defining custom Tailwind design tokens
- CSS variables for light/dark mode theming:
  - `--background` and `--foreground` toggle via `prefers-color-scheme`
  - Font variables injected from Geist font instances
- Font setup uses Next.js `next/font/google` for optimal loading

### TypeScript Configuration

- Strict mode enabled for type safety
- Target ES2017 with ESNext modules
- `noEmit: true` (Next.js handles compilation)
- Path mapping: `@/*` resolves to `src/*`

## ESLint Configuration

The project uses ESLint flat config format (`eslint.config.mjs`):
- Extends `eslint-config-next/core-web-vitals`
- Extends `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Component Patterns

All React components in the app directory should:
- Use TypeScript with proper type annotations
- Be server components by default (add `"use client"` when client-side features needed)
- Use the `Metadata` export for SEO configuration
- Follow Next.js 16 App Router conventions
