# Claude Decision Engine

**AI Decision Intelligence System** — Decide how to use AI before you use it.

![Decision Engine](docs/screenshot.png)

## What It Does

When you want to use AI, should you use:
- A **Simple Prompt**? (fast, basic)
- A **Workflow**? (structured, better for multi-step)
- An **Agent**? (autonomous, best for complex)

The **Decision Engine** analyzes your goal and recommends the optimal approach with predictions for:
- ⏱️ Time required
- 🪙 Token usage  
- 📊 Output quality
- ✅ Confidence score

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Screens

### 1. Intent Input
Clean interface for entering your goal with example suggestions.

### 2. Analysis Progress
Animated step-by-step breakdown of the decision process.

### 3. Recommendation Panel
Side-by-side comparison of all 3 approaches with:
- Recommended badge
- Expandable details
- Pros/cons list
- Confidence meter

## Architecture

```
Intent → Understand → Decide → Simulate → Predict → Output
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Product Spec

See [PRD.md](docs/PRD.md) for full requirements.

## Tech Stack

- Next.js 14
- React 18 + TypeScript
- Tailwind CSS
- Lucide React Icons

## License

MIT
