# SG Math Pal

A Math Study Partner designed for a gifted 9-year-old student in Singapore. The app provides interactive math practice aligned with Singapore's Primary School curriculum while keeping learning fun and engaging. Features a "Space Exploration" theme with tiered mastery progression.

## Current Implementation Status (100% Complete)

### Completed Features
| Feature | Status | Key Files |
|---------|--------|-----------|
| Multiple profiles with switching | Done | `app/profiles/`, `app/api/profile/` |
| Practice mode with questions | Done | `app/practice/[topic]/` |
| Tier/XP progression tracking | Done | `components/game/`, `app/api/attempt/` |
| Scratchpad canvas | Done | `components/practice/Scratchpad.tsx` |
| KaTeX math rendering | Done | `components/math/MathDisplay.tsx` |
| Space theme UI | Done | `tailwind.config.ts`, `globals.css` |
| Hints and solutions | Done | `components/practice/QuestionCard.tsx` |
| Planet Map dashboard | Done | `components/dashboard/PlanetMap.tsx` |
| **Tier Challenge System** | Done | `app/challenge/[topic]/`, `lib/tier-challenge.ts` |
| **Sound Effects System** | Done | `lib/sounds.ts` (Web Audio API synthesis) |
| **Badge Earning System** | Done | `lib/badges.ts`, `components/game/BadgeUnlock.tsx` |
| **PDF Question Import** | Done | `lib/pdf-extractor.ts`, `lib/question-ai-extractor.ts`, `app/import/` |
| **Daily Streak Tracking** | Done | `lib/streak.ts`, integrated in `app/api/attempt/route.ts` |
| **Spaced Repetition (SM-2)** | Done | `lib/mastery.ts`, `app/review/`, `app/api/review/` |
| **Tier 4-5 Questions** | Done | `prisma/seed.ts` (50 questions across all tiers) |
| 6 topics, 50 sample questions | Done | `prisma/seed.ts` |

### Optional Enhancements
- Add more Tier 4-5 questions from competition papers (use PDF import feature)
- Add real audio files to `/public/sounds/` if Web Audio API synthesis is insufficient

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + custom space theme
- **Database**: Prisma 6 with SQLite (local-first)
- **Math Rendering**: KaTeX via `rehype-katex` + `remark-math`
- **Scratchpad**: `react-canvas-draw` for iPad/touch drawing support
- **Animations**: Framer Motion
- **Audio**: Web Audio API for synthesized sound effects (no external files needed)
- **Icons**: Lucide React

## Key Implementation Files

### Tier Challenge System
- `lib/tier-challenge.ts` - Challenge configuration (questions needed, pass thresholds, time limits, XP bonuses)
- `app/api/challenge/start/route.ts` - Start/resume challenge API
- `app/api/challenge/submit/route.ts` - Submit individual answer API
- `app/api/challenge/complete/route.ts` - Complete and grade challenge API
- `app/challenge/[topic]/page.tsx` - Challenge page (server component)
- `app/challenge/[topic]/ChallengeSession.tsx` - Challenge session (client component with timer)
- `components/challenge/ChallengeCard.tsx` - Challenge question display
- `components/challenge/ChallengeResult.tsx` - Pass/fail celebration screen
- `components/dashboard/TopicPlanet.tsx` - Shows "Challenge Ready!" when unlocked

### Sound Effects System
- `lib/sounds.ts` - Web Audio API synthesized sounds (correct, incorrect, levelUp, streak, etc.)
- `components/audio/SoundProvider.tsx` - React context for audio state
- `components/audio/SoundToggle.tsx` - Mute/unmute button in header

### PDF Question Import System
- `lib/pdf-extractor.ts` - PDF text extraction using pdf-parse
- `lib/question-ai-extractor.ts` - Claude AI integration for question extraction
- `lib/import-types.ts` - TypeScript types for import system
- `app/api/import/upload/route.ts` - PDF upload and AI extraction API
- `app/api/import/save/route.ts` - Save extracted questions to database
- `app/import/page.tsx` - Import UI page
- `components/import/` - Import UI components (PDFUploader, ImportProgress, etc.)

### Spaced Repetition System (SM-2)
- `lib/mastery.ts` - SM-2 algorithm adapted for kid-friendly 1-3 quality rating
- `lib/streak.ts` - Daily streak tracking and milestone badges
- `app/review/page.tsx` - Review session page (shows due questions)
- `app/review/ReviewSession.tsx` - Interactive review UI
- `app/api/review/route.ts` - GET due questions, POST submit review answer
- `components/review/QualityRating.tsx` - Hard/Good/Easy rating UI

### Badge System
- `lib/badges.ts` - Badge definitions and earning logic (13 badge types)
- `app/api/attempt/route.ts` - Auto-awards badges on correct answers
- `components/game/BadgeUnlock.tsx` - Animated badge unlock modal

## Development Commands

```bash
# Start development server
npm run dev

# Database commands
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema changes to SQLite
npx prisma studio            # Open database GUI
npx prisma migrate dev       # Create migration

# Shadcn component installation
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

## Project Structure

```
sg-math-pal/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with fonts/providers
│   ├── page.tsx            # Home/dashboard
│   ├── practice/           # Practice sessions
│   ├── review/             # Spaced repetition review sessions
│   ├── questions/          # Question repository management
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Shadcn components
│   ├── math/               # Math-specific components (MDX + KaTeX)
│   ├── game/               # Gamification components (XP, badges, etc.)
│   └── scratchpad/         # Canvas drawing components
├── content/
│   └── questions/          # MDX question files organized by topic/tier
│       ├── geometry/
│       │   ├── tier-1/     # Iron - Fluency
│       │   ├── tier-2/     # Bronze - Application
│       │   ├── tier-3/     # Silver - Heuristic
│       │   ├── tier-4/     # Gold - Challenge
│       │   └── tier-5/     # Platinum - Olympiad
│       ├── fractions/
│       ├── number-patterns/
│       └── ...
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── utils.ts            # cn() helper for Tailwind
│   ├── mdx.ts              # MDX processing with KaTeX
│   ├── topics.ts           # Topic & Tier definitions
│   ├── progression.ts      # Tier advancement logic
│   ├── mastery.ts          # Spaced repetition algorithm (SM-2)
│   └── math/               # Math problem generators
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── dev.db              # SQLite database (gitignored)
└── generated/prisma/       # Generated Prisma client
```

---

## UI/UX Guidelines

### Design Philosophy

This app is for a **9-year-old child**. Every design decision should prioritize:

1. **Clarity** - Large text, obvious buttons, no ambiguity
2. **Encouragement** - Celebrate effort, not just correctness
3. **Fun** - Gamified elements, animations, rewards

### Color Palette

Use bright, cheerful colors. Suggested palette:

```css
/* Primary - Friendly Blue */
--primary: 217 91% 60%;        /* #3B82F6 */

/* Success - Celebratory Green */
--success: 142 76% 46%;        /* #22C55E */

/* Warning/Hint - Warm Orange */
--warning: 38 92% 50%;         /* #F59E0B */

/* Error - Soft Red (not scary) */
--error: 0 72% 63%;            /* #EF6363 */

/* Accent - Playful Purple */
--accent: 270 76% 60%;         /* #A855F7 */

/* Background - Light & airy */
--background: 210 40% 98%;     /* Near white with slight blue */
```

### Typography

- **Headings**: Bold, large, friendly (consider rounded fonts like `Nunito` or `Poppins`)
- **Body**: Minimum 16px, preferably 18px for readability
- **Math expressions**: Render at larger size (1.2-1.5em)

### Component Styling Patterns

```tsx
// Button variants for different actions
<Button variant="default" size="lg">Start Practice</Button>  // Primary action
<Button variant="success">Submit Answer</Button>             // Correct/positive
<Button variant="outline">Show Hint</Button>                 // Secondary action

// Cards should be rounded and have subtle shadows
<Card className="rounded-2xl shadow-lg border-2 border-primary/20">

// Use generous padding for touch-friendly targets
className="p-6 min-h-[48px]"
```

### Gamification Elements

Include these to maintain engagement:

- **XP Points**: Earn for completing problems (bonus for streaks)
- **Levels**: Visual progression (Level 1 Mathematician -> Math Wizard)
- **Streaks**: Consecutive correct answers with fire emoji
- **Badges**: Achievement unlocks for milestones
- **Progress bars**: Visual completion tracking

```tsx
// Example XP display
<div className="flex items-center gap-2 bg-accent/10 rounded-full px-4 py-2">
  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
  <span className="font-bold">1,250 XP</span>
</div>
```

### Animations

Use Framer Motion for delightful micro-interactions:

```tsx
// Correct answer celebration
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", bounce: 0.5 }}
>
  <CheckCircle className="w-16 h-16 text-success" />
</motion.div>

// Subtle hover on cards
<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
  <Card>...</Card>
</motion.div>
```

### Feedback Patterns

- **Correct answer**: Green flash, celebratory animation, encouraging message
- **Incorrect answer**: Gentle orange/yellow (not harsh red), supportive message like "Almost! Try again"
- **Hints**: Progressive hints, never give away answer immediately
- **Streaks**: Special celebration at 5, 10, 20 correct in a row

---

## Math Rendering with rehype-katex

Using `rehype-katex` with `remark-math` allows math rendering in Server Components and MDX content.

### Installation

```bash
npm install remark-math rehype-katex katex @next/mdx @mdx-js/loader @mdx-js/react
```

### Next.js Configuration

```js
// next.config.mjs
import createMDX from '@next/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});

export default withMDX({
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
});
```

### Import KaTeX CSS Globally

```tsx
// app/layout.tsx
import 'katex/dist/katex.min.css';
```

### Writing Math in MDX

```mdx
<!-- content/questions/nmos/2023-q1.mdx -->
---
title: "NMOS 2023 Question 1"
source: "nmos"
year: 2023
topic: "fractions"
difficulty: 3
---

# Question

Solve for $x$: $2x + 5 = 13$

The answer involves computing:

$$
\frac{3}{4} + \frac{1}{2} = \frac{5}{4}
$$
```

### MDX Processing Utility

```tsx
// lib/mdx.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const questionsDir = path.join(process.cwd(), 'content/questions');

export async function getQuestion(source: string, slug: string) {
  const filePath = path.join(questionsDir, source, `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, content } = await compileMDX<QuestionFrontmatter>({
    source: fileContent,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return { frontmatter, content };
}

export async function getAllQuestions(source?: string) {
  const sources = source ? [source] : ['nmos', 'smo', 'psle', 'school'];
  const questions = [];

  for (const src of sources) {
    const srcDir = path.join(questionsDir, src);
    if (!fs.existsSync(srcDir)) continue;

    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.mdx'));
    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
      questions.push({
        slug: file.replace('.mdx', ''),
        source: src,
        ...data,
      });
    }
  }

  return questions;
}

interface QuestionFrontmatter {
  title: string;
  source: 'nmos' | 'smo' | 'psle' | 'school';
  year: number;
  topic: string;
  difficulty: 1 | 2 | 3;
  answer?: string;
  hints?: string[];
}
```

### Server Component for Rendering Questions

```tsx
// app/questions/[source]/[slug]/page.tsx
import { getQuestion } from '@/lib/mdx';

export default async function QuestionPage({
  params,
}: {
  params: { source: string; slug: string };
}) {
  const { frontmatter, content } = await getQuestion(params.source, params.slug);

  return (
    <article className="prose prose-lg max-w-none">
      <h1>{frontmatter.title}</h1>
      <div className="text-sm text-muted-foreground">
        Source: {frontmatter.source.toUpperCase()} {frontmatter.year}
      </div>
      {content}
    </article>
  );
}
```

### Common Math Expressions for Primary School

```latex
% Fractions
\frac{numerator}{denominator}

% Mixed numbers
2\frac{3}{4}

% Decimals with alignment
12.5 + 3.75 = 16.25

% Long division (vertical)
\require{enclose} 13 \enclose{longdiv}{156}

% Multiplication
24 \times 15 = 360

% Comparison
0.75 > \frac{2}{3}

% Percentages
25\% = \frac{1}{4} = 0.25

% Geometry
\text{Area} = l \times w

% Ratios
3 : 5 = 6 : 10
```

---

## Singapore Math Curriculum Context

### Singapore Math Philosophy

Singapore Math emphasizes **mastery-based learning** - students must demonstrate solid understanding before progressing. This aligns perfectly with our tier system where advancement is based on demonstrated competency, not age or grade.

### Key Singapore Math Heuristics (Tier 3 Focus)

These problem-solving strategies are core to Singapore Math and appear heavily in Tier 3 (Silver):

| Heuristic | Description | Example Application |
|-----------|-------------|---------------------|
| **Model Method** | Visual bar representation of quantities | "Ali has 3 times as many marbles as Ben..." |
| **Gap & Difference** | Find relationships between unknowns | "After giving away 15, they have equal amounts" |
| **Work Backwards** | Start from end result | "After spending 1/3, she had $24 left" |
| **Before-After** | Compare states before and after change | "After transfer, ratio changed from 3:5 to 1:2" |
| **Units & Parts** | Assign unit values to bar segments | Complex ratio problems |
| **Make a List** | Systematic enumeration | Combinatorics, logic puzzles |
| **Guess & Check** | Systematic trial with adjustment | When algebra isn't appropriate |

### Problem Generation Patterns (by Tier)

```tsx
// lib/math/generators/fractions.ts
export function generateFractionProblem(tier: Tier) {
  switch (tier) {
    case 1: // Iron - Fluency
      // Direct computation: "Calculate 3/4 + 1/2"
      return generateDirectComputation();

    case 2: // Bronze - Application
      // Simple word problem: "Mary ate 1/3 of a cake..."
      return generateSimpleWordProblem();

    case 3: // Silver - Heuristic
      // Model method: "After giving 2/5 of his stickers..."
      return generateModelMethodProblem();

    case 4: // Gold - Challenge
      // Multi-concept: "The ratio was 3:5. After 2/3 of..."
      return generateMultiConceptProblem();

    case 5: // Platinum - Olympiad
      // Proof/generalization: "Find all fractions where..."
      return generateOlympiadProblem();
  }
}
```

### Word Problem Templates

Singapore Math emphasizes bar model visualization:

```tsx
// Example word problem structure
interface WordProblem {
  story: string;          // The problem narrative
  question: string;       // What to find
  latex: string;          // Mathematical expression
  barModel?: string;      // SVG or component for visualization
  answer: number | string;
  unit?: string;          // cm, kg, $, etc.
}
```

---

## Topic Mastery Tier System

Questions are organized by **Topic** and **Tier**, not by school grade. Students climb through 5 tiers within each topic based on demonstrated mastery, regardless of their current grade level.

### The 5 Tiers of Mastery

| Tier | Name | Icon | Focus | Typical Sources |
|------|------|------|-------|-----------------|
| 1 | **Fluency** | Iron | Basic computation, definitions, direct application | P3/P4 Textbooks |
| 2 | **Application** | Bronze | Standard word problems (1-2 steps) | School Papers (Section B) |
| 3 | **Heuristic** | Silver | Singapore heuristics (Model Method, Gap & Difference) | Top School Papers (Section C), SASMO |
| 4 | **Challenge** | Gold | Non-routine, multi-concept problems | NMOS, AMC 8 |
| 5 | **Olympiad** | Platinum | Pure logic, proofs, extreme visualization | RIPMWC, SMO Junior |

**Note**: Tier 3 (Silver) is the sweet spot for a high-ability P4 student.

### Topic Categories

```typescript
// lib/topics.ts
export const TOPICS = {
  // Number & Operations
  'whole-numbers': 'Whole Numbers',
  'fractions': 'Fractions',
  'decimals': 'Decimals',
  'percentages': 'Percentages',
  'ratios': 'Ratios',

  // Patterns & Algebra
  'number-patterns': 'Number Patterns',
  'sequences': 'Sequences',
  'algebra': 'Algebra',

  // Geometry & Measurement
  'geometry': 'Geometry',
  'area-perimeter': 'Area & Perimeter',
  'angles': 'Angles',
  'symmetry': 'Symmetry',
  'measurement': 'Measurement',

  // Data & Logic
  'data-analysis': 'Data Analysis',
  'combinatorics': 'Combinatorics',
  'logic': 'Logic Puzzles',

  // Problem Solving
  'word-problems': 'Word Problems',
  'speed-distance-time': 'Speed, Distance & Time',
} as const;

export type Topic = keyof typeof TOPICS;

export const TIERS = {
  1: { name: 'Fluency', icon: 'iron', color: '#71717a' },
  2: { name: 'Application', icon: 'bronze', color: '#cd7f32' },
  3: { name: 'Heuristic', icon: 'silver', color: '#c0c0c0' },
  4: { name: 'Challenge', icon: 'gold', color: '#ffd700' },
  5: { name: 'Olympiad', icon: 'platinum', color: '#e5e4e2' },
} as const;

export type Tier = 1 | 2 | 3 | 4 | 5;
```

### Tier Examples by Topic

#### Geometry (Area & Perimeter)

| Tier | Example Problem |
|------|-----------------|
| 1 - Iron | "Find the area of a rectangle with sides 5cm and 8cm." |
| 2 - Bronze | "Find the area of an L-shaped figure" (composite shapes) |
| 3 - Silver | "If I cut 4 squares from the corners of a rectangle..." |
| 4 - Gold | "A rectangle is divided into regions. Given these area ratios, find..." |
| 5 - Platinum | "Prove that the area of the shaded region equals..." |

#### Fractions

| Tier | Example Problem |
|------|-----------------|
| 1 - Iron | "Calculate: $\frac{3}{4} + \frac{1}{2}$" |
| 2 - Bronze | "Mary ate $\frac{1}{3}$ of a pizza. John ate $\frac{1}{4}$. How much is left?" |
| 3 - Silver | "After giving away $\frac{2}{5}$ of his marbles, Ali had 36 left. How many did he have at first?" (Model Method) |
| 4 - Gold | "The ratio of boys to girls is 3:5. If $\frac{2}{3}$ of the boys and $\frac{3}{5}$ of the girls wear glasses..." |
| 5 - Platinum | "Find all fractions $\frac{a}{b}$ where $a,b < 100$ such that..." |

---

## Question Repository

Store past year questions as MDX files organized by topic and tier.

### Directory Structure

```
content/questions/
├── geometry/
│   ├── tier-1/
│   │   └── basic-rectangle-area-001.mdx
│   ├── tier-2/
│   │   └── composite-l-shape-001.mdx
│   ├── tier-3/
│   │   ├── corner-cut-001.mdx
│   │   └── sasmo-2023-q5.mdx
│   ├── tier-4/
│   │   ├── nmos-2023-q12.mdx
│   │   └── amc8-2022-q15.mdx
│   └── tier-5/
│       └── smo-junior-2023-q3.mdx
├── fractions/
│   ├── tier-1/
│   ├── tier-2/
│   └── ...
└── ...
```

### Supported Sources (mapped to typical tiers)

| Code | Full Name | Typical Tier(s) |
|------|-----------|-----------------|
| `textbook` | P3-P6 Textbook exercises | 1-2 |
| `school` | School exam papers | 2-3 |
| `top-school` | Top school papers (RGS, RI, Nanyang) | 3-4 |
| `sasmo` | Singapore & Asian Schools Math Olympiad | 3-4 |
| `nmos` | National Mathematical Olympiad of Singapore | 4 |
| `amc8` | American Mathematics Competition 8 | 4 |
| `ripmwc` | RI Primary Mathematics World Contest | 5 |
| `smo` | Singapore Mathematical Olympiad (Junior) | 5 |

### Question File Format

```mdx
<!-- content/questions/geometry/tier-3/corner-cut-001.mdx -->
---
id: "geo-t3-001"
title: "Corner Cut Rectangle"
topic: "geometry"
tier: 3
source: "sasmo"
year: 2023
questionNumber: 5
tags: ["area", "composite-shapes", "subtraction"]
answer: "84"
answerType: "exact"
hints:
  - "Draw the original rectangle first"
  - "What is the total area of the 4 corners removed?"
  - "Each corner is a square - what size?"
solution: |
  Original rectangle: $12 \times 10 = 120$ cm²
  Each corner square: $3 \times 3 = 9$ cm²
  4 corners removed: $4 \times 9 = 36$ cm²
  Remaining area: $120 - 36 = 84$ cm²
---

# Question

A rectangle measures 12 cm by 10 cm. A square of side 3 cm is cut from each corner. Find the area of the remaining figure.

$$
\text{Area} = (12 \times 10) - 4(3 \times 3)
$$
```

### Question Frontmatter Schema

```typescript
interface QuestionFrontmatter {
  id: string;                    // Unique identifier
  title: string;                 // Display title
  topic: Topic;                  // From TOPICS constant
  tier: 1 | 2 | 3 | 4 | 5;      // Mastery tier
  source: string;                // Origin (sasmo, nmos, school, etc.)
  year?: number;                 // Year of the paper
  questionNumber?: number;       // Original question number
  tags: string[];                // Searchable tags
  answer: string;                // Correct answer
  answerType: 'exact' | 'multiple-choice' | 'range' | 'expression';
  acceptedAnswers?: string[];    // Alternative correct forms
  hints: string[];               // Progressive hints (max 3)
  solution: string;              // Full worked solution (LaTeX supported)
  prerequisiteTopics?: Topic[];  // Topics student should know first
  relatedQuestions?: string[];   // IDs of similar questions
}
```

### Tier Progression Logic

```typescript
// lib/progression.ts

interface TopicProgress {
  topic: Topic;
  currentTier: Tier;
  tierProgress: number;  // 0-100% within current tier
  questionsAttempted: number;
  questionsCorrect: number;
  readyToAdvance: boolean;
}

export function calculateTierProgress(
  attempts: QuestionAttempt[],
  topic: Topic
): TopicProgress {
  // Group attempts by tier
  const byTier = groupBy(attempts, a => a.question.tier);

  // Student advances when:
  // 1. 80%+ accuracy on current tier (min 5 questions)
  // 2. Demonstrated fluency (low hint usage, reasonable time)

  const currentTier = findHighestMasteredTier(byTier);
  const tierAttempts = byTier[currentTier] || [];

  const accuracy = tierAttempts.filter(a => a.correct).length / tierAttempts.length;
  const avgHints = average(tierAttempts.map(a => a.hintsUsed));

  return {
    topic,
    currentTier,
    tierProgress: Math.min(100, (tierAttempts.length / 10) * 100),
    questionsAttempted: attempts.length,
    questionsCorrect: attempts.filter(a => a.correct).length,
    readyToAdvance: accuracy >= 0.8 && tierAttempts.length >= 5 && avgHints < 1.5,
  };
}
```

### Adding Questions via Admin Interface

```tsx
// app/questions/new/page.tsx
'use client';

import { useState } from 'react';
import { TOPICS, TIERS } from '@/lib/topics';

export default function AddQuestionPage() {
  const [formData, setFormData] = useState({
    topic: 'geometry',
    tier: 3,
    source: 'sasmo',
    content: '',
  });

  // Live preview with KaTeX rendering
  // Validates tier assignment based on source
  // Auto-generates slug from topic + tier + sequence
}
```

### Importing Questions in Bulk

```typescript
// scripts/import-questions.ts

interface QuestionImport {
  topic: Topic;
  tier: Tier;
  source: string;
  year?: number;
  content: string;       // Question text with LaTeX
  answer: string;
  hints: string[];
  solution: string;
  tags: string[];
}

// Converts to MDX files in correct directory structure
// Validates tier assignment
// Generates unique IDs
```

---

## Mastery Model & Spaced Repetition

Track question mastery using the SM-2 algorithm for optimal review scheduling.

### Core Concepts

- **Ease Factor (EF)**: How easy a question is for the student (starts at 2.5)
- **Interval**: Days until next review
- **Repetitions**: Consecutive correct answers
- **Quality**: Self-rated difficulty (0-5 scale, simplified to 1-3 for kids)

### SM-2 Algorithm Implementation

```tsx
// lib/mastery.ts

export interface MasteryState {
  easeFactor: number;      // 1.3 to 2.5+
  interval: number;        // days until next review
  repetitions: number;     // consecutive correct answers
  nextReviewDate: Date;
  lastQuality: number;     // last performance rating
}

export function calculateNextReview(
  current: MasteryState,
  quality: 1 | 2 | 3  // 1=Hard, 2=Good, 3=Easy (kid-friendly scale)
): MasteryState {
  // Convert kid-friendly scale to SM-2 scale (0-5)
  const q = quality === 1 ? 2 : quality === 2 ? 4 : 5;

  let { easeFactor, interval, repetitions } = current;

  if (q < 3) {
    // Failed - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastQuality: quality,
  };
}

export function getInitialMasteryState(): MasteryState {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    lastQuality: 0,
  };
}
```

### Review Queue Logic

```tsx
// lib/mastery.ts (continued)

export async function getDueQuestions(studentId: string, limit = 10) {
  const now = new Date();

  return prisma.questionMastery.findMany({
    where: {
      studentId,
      nextReviewDate: { lte: now },
    },
    orderBy: [
      { nextReviewDate: 'asc' },  // Most overdue first
      { easeFactor: 'asc' },       // Harder questions first
    ],
    take: limit,
    include: {
      question: true,
    },
  });
}

export async function getNewQuestionsForTopic(
  studentId: string,
  topic: string,
  limit = 5
) {
  // Get questions the student hasn't attempted yet
  const attempted = await prisma.questionMastery.findMany({
    where: { studentId },
    select: { questionId: true },
  });

  const attemptedIds = attempted.map(a => a.questionId);

  return prisma.question.findMany({
    where: {
      topic,
      id: { notIn: attemptedIds },
    },
    orderBy: { difficulty: 'asc' },  // Start with easier questions
    take: limit,
  });
}
```

### Kid-Friendly Rating UI

```tsx
// components/game/DifficultyRating.tsx
'use client';

import { motion } from 'framer-motion';
import { Frown, Meh, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DifficultyRatingProps {
  onRate: (quality: 1 | 2 | 3) => void;
}

export function DifficultyRating({ onRate }: DifficultyRatingProps) {
  const options = [
    { quality: 1, icon: Frown, label: 'Hard', color: 'text-orange-500' },
    { quality: 2, icon: Meh, label: 'Okay', color: 'text-blue-500' },
    { quality: 3, icon: Smile, label: 'Easy!', color: 'text-green-500' },
  ] as const;

  return (
    <div className="space-y-3">
      <p className="text-center text-lg font-medium">How was that question?</p>
      <div className="flex justify-center gap-4">
        {options.map(({ quality, icon: Icon, label, color }) => (
          <motion.div key={quality} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 px-6 rounded-xl"
              onClick={() => onRate(quality)}
            >
              <Icon className={`w-10 h-10 ${color}`} />
              <span className="mt-2 font-medium">{label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

### Mastery Dashboard

```tsx
// Display mastery levels by topic
interface TopicMastery {
  topic: string;
  totalQuestions: number;
  mastered: number;        // repetitions >= 3
  learning: number;        // 0 < repetitions < 3
  notStarted: number;
  averageEaseFactor: number;
  dueForReview: number;
}
```

---

## Scratchpad (Canvas Drawing)

iPad-friendly drawing canvas for working out problems. Uses `react-canvas-draw` for touch support.

### Installation

```bash
npm install react-canvas-draw
```

### Toggleable Scratchpad Component

```tsx
// components/scratchpad/Scratchpad.tsx
'use client';

import { useRef, useState } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Pencil, Eraser, Trash2, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScratchpadProps {
  className?: string;
}

export function Scratchpad({ className }: ScratchpadProps) {
  const canvasRef = useRef<CanvasDraw>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [brushColor, setBrushColor] = useState('#1e40af');
  const [brushRadius, setBrushRadius] = useState(3);

  const colors = [
    '#1e40af', // Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#9333ea', // Purple
    '#000000', // Black
  ];

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Button
        variant="outline"
        size="lg"
        className={cn(
          'fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-40',
          isOpen && 'bg-primary text-primary-foreground'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Pencil className="w-6 h-6" />
      </Button>

      {/* Scratchpad Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 60 : 400,
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={cn(
              'fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl border-2 border-primary/20 overflow-hidden z-50',
              isMinimized ? 'w-48' : 'w-[500px]',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
              <span className="font-medium text-sm">Scratchpad</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Canvas and Tools */}
            {!isMinimized && (
              <>
                {/* Toolbar */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 border-b">
                  {/* Color picker */}
                  <div className="flex gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-transform',
                          brushColor === color ? 'border-slate-400 scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setBrushColor(color)}
                      />
                    ))}
                  </div>

                  <div className="w-px h-6 bg-slate-300 mx-2" />

                  {/* Brush size */}
                  <div className="flex gap-1">
                    {[2, 4, 8].map((size) => (
                      <button
                        key={size}
                        className={cn(
                          'w-8 h-8 rounded flex items-center justify-center',
                          brushRadius === size ? 'bg-slate-200' : 'hover:bg-slate-100'
                        )}
                        onClick={() => setBrushRadius(size)}
                      >
                        <div
                          className="rounded-full bg-current"
                          style={{ width: size * 2, height: size * 2 }}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex-1" />

                  {/* Actions */}
                  <Button variant="ghost" size="sm" onClick={handleUndo}>
                    <Eraser className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Canvas */}
                <div className="bg-white">
                  <CanvasDraw
                    ref={canvasRef}
                    brushColor={brushColor}
                    brushRadius={brushRadius}
                    lazyRadius={0}
                    canvasWidth={496}
                    canvasHeight={280}
                    hideGrid
                    className="touch-none"
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### Global Scratchpad Provider

```tsx
// components/scratchpad/ScratchpadProvider.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Scratchpad } from './Scratchpad';

interface ScratchpadContextType {
  isEnabled: boolean;
  toggle: () => void;
}

const ScratchpadContext = createContext<ScratchpadContextType | null>(null);

export function ScratchpadProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(true);

  return (
    <ScratchpadContext.Provider value={{ isEnabled, toggle: () => setIsEnabled(!isEnabled) }}>
      {children}
      {isEnabled && <Scratchpad />}
    </ScratchpadContext.Provider>
  );
}

export function useScratchpad() {
  const context = useContext(ScratchpadContext);
  if (!context) throw new Error('useScratchpad must be used within ScratchpadProvider');
  return context;
}
```

### Settings Toggle

```tsx
// In settings or header component
import { useScratchpad } from '@/components/scratchpad/ScratchpadProvider';
import { Switch } from '@/components/ui/switch';

function ScratchpadToggle() {
  const { isEnabled, toggle } = useScratchpad();

  return (
    <div className="flex items-center gap-2">
      <Switch checked={isEnabled} onCheckedChange={toggle} />
      <span>Scratchpad</span>
    </div>
  );
}
```

### iPad Optimization Tips

- Use `touch-none` class on canvas to prevent scroll interference
- Set `lazyRadius={0}` for immediate drawing response
- Consider larger brush sizes for finger drawing
- Add palm rejection if needed (detect large touch areas)
- Save canvas state to localStorage for persistence across page navigations

---

## Database Schema (Prisma/SQLite)

### Core Models

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model Student {
  id            String   @id @default(cuid())
  name          String
  totalXp       Int      @default(0)      // Lifetime XP earned
  currentStreak Int      @default(0)      // Current daily streak
  bestStreak    Int      @default(0)      // Best streak ever
  createdAt     DateTime @default(now())

  topicProgress    TopicProgress[]
  sessions         PracticeSession[]
  badges           Badge[]
  questionMastery  QuestionMastery[]
  tierChallenges   TierChallenge[]
}

// ==========================================
// QUESTION REPOSITORY (Tier-Based)
// ==========================================

model Question {
  id              String   @id @default(cuid())
  slug            String   @unique  // e.g., "geo-t3-corner-cut-001"
  topic           String   // "geometry", "fractions", etc. (from TOPICS)
  tier            Int      // 1-5 (Iron, Bronze, Silver, Gold, Platinum)
  source          String   // "textbook", "school", "sasmo", "nmos", "smo", etc.
  year            Int?
  questionNumber  Int?
  title           String
  tags            String   // JSON array: '["area","composite-shapes"]'
  answer          String
  answerType      String   @default("exact")  // "exact", "multiple-choice", "range", "expression"
  acceptedAnswers String?  // JSON array of alternative correct answers
  hints           String?  // JSON array of progressive hints (max 3)
  solution        String?  // Full worked solution (supports LaTeX)
  mdxPath         String   // Path: "geometry/tier-3/corner-cut-001.mdx"
  isChallengeQuestion Boolean @default(false)  // Used for tier promotion challenges
  xpValue         Int      @default(10)  // Base XP for this question (modified by tier)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  mastery            QuestionMastery[]
  attempts           QuestionAttempt[]
  challengeQuestions TierChallengeQuestion[]

  @@index([topic, tier])
  @@index([topic, tier, isChallengeQuestion])
  @@index([source])
}

// ==========================================
// TOPIC TIER PROGRESS
// ==========================================

model TopicProgress {
  id                 String   @id @default(cuid())
  studentId          String
  topic              String   // "geometry", "fractions", etc.

  // Current Tier Status
  currentTier        Int      @default(1)  // 1=Iron, 2=Bronze, 3=Silver, 4=Gold, 5=Platinum
  tierXp             Int      @default(0)  // XP accumulated in current tier
  tierXpRequired     Int      @default(100) // XP needed to unlock promotion challenge

  // Promotion Readiness
  canAttemptPromotion Boolean @default(false)  // True when tierXp >= tierXpRequired
  promotionAttempts   Int     @default(0)       // Times attempted current tier's promotion
  lastPromotionAttempt DateTime?

  // Statistics for current tier
  questionsAttempted Int      @default(0)
  questionsCorrect   Int      @default(0)
  perfectAnswers     Int      @default(0)  // Correct without hints
  averageTime        Int?     // Average seconds per question
  accuracy           Float    @default(0)  // questionsCorrect / questionsAttempted

  // Timestamps
  tierUnlockedAt     DateTime @default(now())  // When current tier was reached
  lastPracticed      DateTime @default(now())
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  student            Student  @relation(fields: [studentId], references: [id])
  tierChallenges     TierChallenge[]

  @@unique([studentId, topic])
  @@index([studentId])
  @@index([studentId, currentTier])
}

// ==========================================
// TIER PROMOTION CHALLENGES
// ==========================================

model TierChallenge {
  id              String   @id @default(cuid())
  studentId       String
  topicProgressId String
  topic           String
  fromTier        Int      // Tier being challenged from (1-4)
  toTier          Int      // Tier being promoted to (2-5)

  // Challenge Configuration
  requiredCorrect Int      // Number of correct answers needed to pass
  totalQuestions  Int      // Total questions in challenge
  timeLimit       Int?     // Optional time limit in seconds
  allowHints      Boolean  @default(false)  // Whether hints are allowed

  // Results
  status          String   @default("in_progress")  // "in_progress", "passed", "failed"
  correctAnswers  Int      @default(0)
  incorrectAnswers Int     @default(0)
  hintsUsed       Int      @default(0)
  totalTime       Int      @default(0)  // Seconds spent
  xpEarned        Int      @default(0)

  // Timestamps
  startedAt       DateTime @default(now())
  completedAt     DateTime?

  student         Student        @relation(fields: [studentId], references: [id])
  topicProgress   TopicProgress  @relation(fields: [topicProgressId], references: [id])
  questions       TierChallengeQuestion[]

  @@index([studentId, status])
  @@index([topicProgressId])
}

model TierChallengeQuestion {
  id            String   @id @default(cuid())
  challengeId   String
  questionId    String
  orderIndex    Int      // Order in the challenge
  userAnswer    String?
  correct       Boolean?
  hintsUsed     Int      @default(0)
  timeSpent     Int      @default(0)
  answeredAt    DateTime?

  challenge     TierChallenge @relation(fields: [challengeId], references: [id])
  question      Question      @relation(fields: [questionId], references: [id])

  @@index([challengeId])
}

// ==========================================
// MASTERY & SPACED REPETITION
// ==========================================

model QuestionMastery {
  id             String   @id @default(cuid())
  studentId      String
  questionId     String
  easeFactor     Float    @default(2.5)
  interval       Int      @default(0)
  repetitions    Int      @default(0)
  nextReviewDate DateTime @default(now())
  lastQuality    Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  student        Student  @relation(fields: [studentId], references: [id])
  question       Question @relation(fields: [questionId], references: [id])

  @@unique([studentId, questionId])
  @@index([studentId, nextReviewDate])
}

model QuestionAttempt {
  id          String   @id @default(cuid())
  studentId   String
  questionId  String
  sessionId   String?
  userAnswer  String
  correct     Boolean
  quality     Int?
  hintsUsed   Int      @default(0)
  timeSpent   Int
  xpEarned    Int      @default(0)  // XP earned for this attempt
  createdAt   DateTime @default(now())

  question    Question         @relation(fields: [questionId], references: [id])
  session     PracticeSession? @relation(fields: [sessionId], references: [id])

  @@index([studentId, questionId])
  @@index([studentId, createdAt])
}

// ==========================================
// PRACTICE SESSIONS
// ==========================================

model PracticeSession {
  id             String   @id @default(cuid())
  studentId      String
  sessionType    String   // "practice", "review", "tier_challenge"
  topic          String?
  tier           Int?     // Tier being practiced
  totalQuestions Int
  correct        Int
  timeSpent      Int
  xpEarned       Int
  createdAt      DateTime @default(now())

  student           Student           @relation(fields: [studentId], references: [id])
  questionAttempts  QuestionAttempt[]

  @@index([studentId, createdAt])
}

// ==========================================
// GAMIFICATION & ACHIEVEMENTS
// ==========================================

model Badge {
  id          String   @id @default(cuid())
  studentId   String
  type        String   // Badge type (see Badge Types below)
  topic       String?  // For topic-specific badges
  tier        Int?     // For tier-specific badges
  metadata    String?  // JSON - Additional badge data (e.g., which topic mastered)
  earnedAt    DateTime @default(now())

  student     Student  @relation(fields: [studentId], references: [id])

  @@index([studentId])
}
```

### Prisma Client Singleton

```tsx
// lib/db.ts
import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Badge Types

```typescript
// lib/badges.ts
export const BADGE_TYPES = {
  // Tier Promotions
  'tier_iron': 'Reached Iron tier',
  'tier_bronze': 'Reached Bronze tier',
  'tier_silver': 'Reached Silver tier',
  'tier_gold': 'Reached Gold tier',
  'tier_platinum': 'Reached Platinum tier',

  // Topic Mastery
  'topic_first_tier': 'First topic tier unlocked',
  'topic_silver_master': 'Reached Silver in any topic',
  'topic_gold_master': 'Reached Gold in any topic',
  'topic_platinum_master': 'Reached Platinum in any topic',

  // Streaks
  'streak_3': '3-day streak',
  'streak_7': '7-day streak',
  'streak_30': '30-day streak',

  // Challenges
  'perfect_challenge': 'Passed a tier challenge with 100%',
  'first_challenge': 'Completed first tier challenge',
  'challenge_streak': '3 challenges passed in a row',

  // Practice
  'questions_100': 'Answered 100 questions',
  'questions_500': 'Answered 500 questions',
  'perfect_session': 'Perfect practice session (10+ questions)',
} as const;
```

---

## Tier Promotion System

The tier promotion system uses **XP accumulation** to unlock **Tier Challenge** opportunities. Students must pass a challenge to advance to the next tier.

### XP System

#### XP Earning Rules

```typescript
// lib/xp.ts

export const XP_CONFIG = {
  // Base XP by tier (higher tiers = more XP)
  baseXpByTier: {
    1: 10,   // Iron
    2: 15,   // Bronze
    3: 25,   // Silver
    4: 40,   // Gold
    5: 60,   // Platinum
  },

  // Multipliers
  multipliers: {
    correct: 1.0,           // Base for correct answer
    correctNoHints: 1.5,    // No hints used
    correctFast: 1.25,      // Under 50% of average time
    incorrect: 0.2,         // Participation XP for trying
    streak3: 1.1,           // 3 correct in a row
    streak5: 1.25,          // 5 correct in a row
    streak10: 1.5,          // 10 correct in a row
  },

  // XP required to unlock tier promotion challenge
  xpToUnlockChallenge: {
    1: 100,   // Iron → Bronze
    2: 200,   // Bronze → Silver
    3: 400,   // Silver → Gold
    4: 800,   // Gold → Platinum
  },

  // Bonus XP for passing tier challenge
  challengePassBonus: {
    2: 50,    // Promoted to Bronze
    3: 100,   // Promoted to Silver
    4: 200,   // Promoted to Gold
    5: 500,   // Promoted to Platinum
  },
};

export type Tier = 1 | 2 | 3 | 4 | 5;
```

#### XP Calculation

```typescript
// lib/xp.ts

interface XpCalculationInput {
  tier: Tier;
  correct: boolean;
  hintsUsed: number;
  timeSpent: number;
  averageTime: number;
  currentStreak: number;
}

export function calculateXp(input: XpCalculationInput): number {
  const { tier, correct, hintsUsed, timeSpent, averageTime, currentStreak } = input;

  let xp = XP_CONFIG.baseXpByTier[tier];

  if (!correct) {
    // Participation XP for attempting
    return Math.floor(xp * XP_CONFIG.multipliers.incorrect);
  }

  // Correct answer multipliers
  if (hintsUsed === 0) {
    xp *= XP_CONFIG.multipliers.correctNoHints;
  }

  if (averageTime && timeSpent < averageTime * 0.5) {
    xp *= XP_CONFIG.multipliers.correctFast;
  }

  // Streak bonus
  if (currentStreak >= 10) {
    xp *= XP_CONFIG.multipliers.streak10;
  } else if (currentStreak >= 5) {
    xp *= XP_CONFIG.multipliers.streak5;
  } else if (currentStreak >= 3) {
    xp *= XP_CONFIG.multipliers.streak3;
  }

  return Math.floor(xp);
}
```

### Tier Challenge Configuration

```typescript
// lib/tier-challenge.ts

export const TIER_CHALLENGE_CONFIG = {
  // Questions required per tier promotion
  questionsRequired: {
    1: 5,   // Iron → Bronze: 5 questions
    2: 7,   // Bronze → Silver: 7 questions
    3: 8,   // Silver → Gold: 8 questions
    4: 10,  // Gold → Platinum: 10 questions
  },

  // Minimum correct to pass (percentage)
  passThreshold: {
    1: 0.6,   // 60% (3/5) for Iron → Bronze
    2: 0.7,   // ~70% (5/7) for Bronze → Silver
    3: 0.75,  // 75% (6/8) for Silver → Gold
    4: 0.8,   // 80% (8/10) for Gold → Platinum
  },

  // Time limits (optional, in seconds)
  timeLimit: {
    1: null,      // No time limit for first promotion
    2: null,      // No time limit
    3: 20 * 60,   // 20 minutes for Silver → Gold
    4: 30 * 60,   // 30 minutes for Gold → Platinum
  },

  // Hints allowed?
  hintsAllowed: {
    1: true,   // Hints allowed
    2: true,   // Hints allowed
    3: false,  // No hints for Silver → Gold
    4: false,  // No hints for Gold → Platinum
  },

  // Cooldown between failed attempts (hours)
  cooldownHours: {
    1: 0,    // No cooldown
    2: 2,    // 2 hours
    3: 6,    // 6 hours
    4: 24,   // 24 hours
  },
};
```

### Promotion Flow

```typescript
// lib/promotion.ts
'use server';

import { prisma } from '@/lib/db';
import { XP_CONFIG, calculateXp } from '@/lib/xp';
import { TIER_CHALLENGE_CONFIG } from '@/lib/tier-challenge';

// ============================================
// STEP 1: Record question attempt and award XP
// ============================================

export async function recordAttempt(
  studentId: string,
  questionId: string,
  correct: boolean,
  hintsUsed: number,
  timeSpent: number
) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  const topicProgress = await prisma.topicProgress.findUnique({
    where: { studentId_topic: { studentId, topic: question.topic } },
  });

  // Calculate XP
  const xpEarned = calculateXp({
    tier: question.tier,
    correct,
    hintsUsed,
    timeSpent,
    averageTime: topicProgress?.averageTime || 60,
    currentStreak: correct ? (topicProgress?.questionsCorrect || 0) : 0,
  });

  // Update topic progress
  const updatedProgress = await prisma.topicProgress.update({
    where: { id: topicProgress.id },
    data: {
      tierXp: { increment: xpEarned },
      questionsAttempted: { increment: 1 },
      questionsCorrect: correct ? { increment: 1 } : undefined,
      perfectAnswers: correct && hintsUsed === 0 ? { increment: 1 } : undefined,
      accuracy: {
        set: (topicProgress.questionsCorrect + (correct ? 1 : 0)) /
             (topicProgress.questionsAttempted + 1),
      },
      lastPracticed: new Date(),
    },
  });

  // Update student total XP
  await prisma.student.update({
    where: { id: studentId },
    data: { totalXp: { increment: xpEarned } },
  });

  // Check if promotion challenge is now unlocked
  const xpRequired = XP_CONFIG.xpToUnlockChallenge[updatedProgress.currentTier];
  if (xpRequired && updatedProgress.tierXp >= xpRequired && !updatedProgress.canAttemptPromotion) {
    await prisma.topicProgress.update({
      where: { id: topicProgress.id },
      data: { canAttemptPromotion: true },
    });

    return {
      xpEarned,
      promotionUnlocked: true,
      currentTier: updatedProgress.currentTier,
      topic: question.topic,
    };
  }

  return { xpEarned, promotionUnlocked: false };
}

// ============================================
// STEP 2: Start a tier promotion challenge
// ============================================

export async function startTierChallenge(studentId: string, topic: string) {
  const topicProgress = await prisma.topicProgress.findUnique({
    where: { studentId_topic: { studentId, topic } },
  });

  if (!topicProgress.canAttemptPromotion) {
    throw new Error('Not enough XP to attempt promotion');
  }

  if (topicProgress.currentTier >= 5) {
    throw new Error('Already at maximum tier');
  }

  const fromTier = topicProgress.currentTier;
  const toTier = fromTier + 1;
  const config = TIER_CHALLENGE_CONFIG;

  // Check cooldown
  if (topicProgress.lastPromotionAttempt) {
    const cooldownMs = config.cooldownHours[fromTier] * 60 * 60 * 1000;
    const timeSince = Date.now() - topicProgress.lastPromotionAttempt.getTime();
    if (timeSince < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - timeSince) / (60 * 60 * 1000));
      throw new Error(`Please wait ${remainingHours} hour(s) before retrying`);
    }
  }

  // Select challenge questions from the NEXT tier
  const challengeQuestions = await prisma.question.findMany({
    where: {
      topic,
      tier: toTier,  // Questions from the tier being promoted TO
      isChallengeQuestion: true,
    },
    take: config.questionsRequired[fromTier],
    orderBy: { id: 'asc' },  // Randomize in production
  });

  if (challengeQuestions.length < config.questionsRequired[fromTier]) {
    // Fallback to any questions at that tier
    const additionalQuestions = await prisma.question.findMany({
      where: {
        topic,
        tier: toTier,
        id: { notIn: challengeQuestions.map(q => q.id) },
      },
      take: config.questionsRequired[fromTier] - challengeQuestions.length,
    });
    challengeQuestions.push(...additionalQuestions);
  }

  // Create the challenge
  const challenge = await prisma.tierChallenge.create({
    data: {
      studentId,
      topicProgressId: topicProgress.id,
      topic,
      fromTier,
      toTier,
      requiredCorrect: Math.ceil(
        config.questionsRequired[fromTier] * config.passThreshold[fromTier]
      ),
      totalQuestions: config.questionsRequired[fromTier],
      timeLimit: config.timeLimit[fromTier],
      allowHints: config.hintsAllowed[fromTier],
      questions: {
        create: challengeQuestions.map((q, index) => ({
          questionId: q.id,
          orderIndex: index,
        })),
      },
    },
    include: { questions: { include: { question: true } } },
  });

  return challenge;
}

// ============================================
// STEP 3: Submit challenge answer
// ============================================

export async function submitChallengeAnswer(
  challengeQuestionId: string,
  userAnswer: string,
  hintsUsed: number,
  timeSpent: number
) {
  const challengeQuestion = await prisma.tierChallengeQuestion.findUnique({
    where: { id: challengeQuestionId },
    include: { question: true, challenge: true },
  });

  const correct = checkAnswer(userAnswer, challengeQuestion.question);

  await prisma.tierChallengeQuestion.update({
    where: { id: challengeQuestionId },
    data: {
      userAnswer,
      correct,
      hintsUsed,
      timeSpent,
      answeredAt: new Date(),
    },
  });

  // Update challenge totals
  await prisma.tierChallenge.update({
    where: { id: challengeQuestion.challengeId },
    data: {
      correctAnswers: correct ? { increment: 1 } : undefined,
      incorrectAnswers: !correct ? { increment: 1 } : undefined,
      hintsUsed: { increment: hintsUsed },
      totalTime: { increment: timeSpent },
    },
  });

  return { correct };
}

// ============================================
// STEP 4: Complete the challenge
// ============================================

export async function completeTierChallenge(challengeId: string) {
  const challenge = await prisma.tierChallenge.findUnique({
    where: { id: challengeId },
    include: { topicProgress: true },
  });

  const passed = challenge.correctAnswers >= challenge.requiredCorrect;

  // Calculate XP earned during challenge
  const xpEarned = passed
    ? XP_CONFIG.challengePassBonus[challenge.toTier]
    : Math.floor(challenge.correctAnswers * 5);  // Consolation XP

  // Update challenge status
  await prisma.tierChallenge.update({
    where: { id: challengeId },
    data: {
      status: passed ? 'passed' : 'failed',
      completedAt: new Date(),
      xpEarned,
    },
  });

  // Update topic progress
  if (passed) {
    // PROMOTION SUCCESS!
    await prisma.topicProgress.update({
      where: { id: challenge.topicProgressId },
      data: {
        currentTier: challenge.toTier,
        tierXp: 0,  // Reset XP for new tier
        tierXpRequired: XP_CONFIG.xpToUnlockChallenge[challenge.toTier] || 9999,
        canAttemptPromotion: false,
        promotionAttempts: 0,
        questionsAttempted: 0,
        questionsCorrect: 0,
        perfectAnswers: 0,
        tierUnlockedAt: new Date(),
      },
    });

    // Award badge
    await prisma.badge.create({
      data: {
        studentId: challenge.studentId,
        type: `tier_${getTierName(challenge.toTier).toLowerCase()}`,
        topic: challenge.topic,
        tier: challenge.toTier,
      },
    });
  } else {
    // Challenge failed
    await prisma.topicProgress.update({
      where: { id: challenge.topicProgressId },
      data: {
        promotionAttempts: { increment: 1 },
        lastPromotionAttempt: new Date(),
        // Keep XP - don't reset on failure
      },
    });
  }

  // Update student total XP
  await prisma.student.update({
    where: { id: challenge.studentId },
    data: { totalXp: { increment: xpEarned } },
  });

  return {
    passed,
    xpEarned,
    newTier: passed ? challenge.toTier : null,
    correctAnswers: challenge.correctAnswers,
    requiredCorrect: challenge.requiredCorrect,
  };
}

function getTierName(tier: number): string {
  const names = { 1: 'Iron', 2: 'Bronze', 3: 'Silver', 4: 'Gold', 5: 'Platinum' };
  return names[tier] || 'Unknown';
}

function checkAnswer(userAnswer: string, question: Question): boolean {
  // Normalize and compare
  const normalized = userAnswer.trim().toLowerCase();
  const correct = question.answer.trim().toLowerCase();

  if (normalized === correct) return true;

  // Check accepted alternatives
  if (question.acceptedAnswers) {
    const alternatives = JSON.parse(question.acceptedAnswers) as string[];
    return alternatives.some(alt => alt.trim().toLowerCase() === normalized);
  }

  return false;
}
```

### Promotion UI Components

```tsx
// components/game/PromotionUnlocked.tsx
'use client';

import { motion } from 'framer-motion';
import { Trophy, Zap, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TIERS } from '@/lib/topics';

interface PromotionUnlockedProps {
  topic: string;
  currentTier: 1 | 2 | 3 | 4;
  onStartChallenge: () => void;
  onLater: () => void;
}

export function PromotionUnlocked({
  topic,
  currentTier,
  onStartChallenge,
  onLater,
}: PromotionUnlockedProps) {
  const nextTier = currentTier + 1;
  const currentTierInfo = TIERS[currentTier];
  const nextTierInfo = TIERS[nextTier];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
        </motion.div>

        <h2 className="text-2xl font-bold mt-4">Challenge Unlocked!</h2>

        <p className="text-gray-600 mt-2">
          You've earned enough XP in <strong>{topic}</strong> to attempt the
        </p>

        <div className="flex items-center justify-center gap-3 my-6">
          <div
            className="px-4 py-2 rounded-full font-bold"
            style={{ backgroundColor: currentTierInfo.color + '30', color: currentTierInfo.color }}
          >
            {currentTierInfo.name}
          </div>
          <ArrowUp className="w-6 h-6 text-gray-400" />
          <div
            className="px-4 py-2 rounded-full font-bold"
            style={{ backgroundColor: nextTierInfo.color + '30', color: nextTierInfo.color }}
          >
            {nextTierInfo.name}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Pass the challenge to advance to the next tier!
        </p>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full rounded-xl"
            onClick={onStartChallenge}
          >
            <Zap className="w-5 h-5 mr-2" />
            Start Challenge Now
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onLater}
          >
            Maybe Later
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

```tsx
// components/game/TierProgressBar.tsx
'use client';

import { cn } from '@/lib/utils';
import { TIERS } from '@/lib/topics';
import { XP_CONFIG } from '@/lib/xp';

interface TierProgressBarProps {
  topic: string;
  currentTier: 1 | 2 | 3 | 4 | 5;
  tierXp: number;
  canAttemptPromotion: boolean;
}

export function TierProgressBar({
  topic,
  currentTier,
  tierXp,
  canAttemptPromotion,
}: TierProgressBarProps) {
  const tierInfo = TIERS[currentTier];
  const xpRequired = XP_CONFIG.xpToUnlockChallenge[currentTier] || 0;
  const progress = xpRequired > 0 ? Math.min(100, (tierXp / xpRequired) * 100) : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: tierInfo.color }}
          />
          <span className="font-medium">{tierInfo.name}</span>
        </div>
        <span className="text-gray-500">
          {canAttemptPromotion ? (
            <span className="text-green-600 font-medium">Challenge Ready!</span>
          ) : (
            `${tierXp} / ${xpRequired} XP`
          )}
        </span>
      </div>

      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            canAttemptPromotion ? 'animate-pulse' : ''
          )}
          style={{
            width: `${progress}%`,
            backgroundColor: tierInfo.color,
          }}
        />
      </div>
    </div>
  );
}
```

---

## Component Patterns

### Utility Function

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Question Card Component

```tsx
// components/game/QuestionCard.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MathDisplay } from '@/components/math/MathDisplay';
import { Lightbulb, Send } from 'lucide-react';

interface QuestionCardProps {
  question: string;        // LaTeX string
  onSubmit: (answer: string) => void;
  onHint: () => void;
  hintsAvailable: number;
}

export function QuestionCard({
  question,
  onSubmit,
  onHint,
  hintsAvailable
}: QuestionCardProps) {
  const [answer, setAnswer] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="rounded-2xl shadow-lg border-2 border-primary/20 p-6">
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <MathDisplay math={question} block size="xl" />
          </div>

          {/* Answer input */}
          <div className="flex gap-3">
            <Input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="text-lg h-14 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit(answer)}
            />
            <Button
              size="lg"
              className="h-14 px-6 rounded-xl"
              onClick={() => onSubmit(answer)}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Hint button */}
          {hintsAvailable > 0 && (
            <Button
              variant="outline"
              onClick={onHint}
              className="w-full rounded-xl"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Get a hint ({hintsAvailable} left)
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

---

## Important Notes

1. **Age-appropriate language**: Use simple, encouraging words. "Great job!" not "Correct!"

2. **No time pressure by default**: Timed modes should be optional and framed as "challenge mode"

3. **Error tolerance**: Accept equivalent answers (e.g., "0.5" and "1/2" for the same value)

4. **Keyboard support**: Full keyboard navigation for faster input

5. **Progress persistence**: All progress saves locally via SQLite - no cloud account needed

6. **Offline-first**: App should work completely offline once loaded

7. **Parent mode**: Consider a simple stats view for parents (protected by simple code, not full auth)
