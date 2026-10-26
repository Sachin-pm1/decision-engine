# Project Structure

```
decision-engine/
├── app/
│   ├── components/
│   │   ├── Header.tsx              # App header with branding
│   │   ├── IntentInput.tsx         # User input screen
│   │   ├── AnalysisProgress.tsx    # Analysis loading animation
│   │   └── RecommendationPanel.tsx # Results comparison screen
│   ├── lib/
│   │   └── utils.ts                # Utility functions (cn helper)
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── globals.css                 # Global styles + Tailwind
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main page with all views
├── docs/
│   ├── ARCHITECTURE.md             # System architecture diagram
│   └── PRD.md                      # Product requirements
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── README.md
```

## Key Components

### IntentInput.tsx
- Text input for user goals
- Example suggestions
- Quick approach indicators

### AnalysisProgress.tsx
- 4-step animated analysis:
  1. Understanding Intent
  2. Analyzing Complexity
  3. Comparing Approaches
  4. Generating Recommendation

### RecommendationPanel.tsx
- Side-by-side comparison cards
- Expandable details (pros/cons)
- Confidence meter
- Step-by-step plan
- Execute button

## Views (in page.tsx)

1. **Input View** - Enter intent
2. **Analyzing View** - Show progress
3. **Recommendation View** - Show results

## Mock Logic

The demo uses keyword-based complexity detection:
- High complexity: "build", "create", "develop", "system", "app"
- Medium: "analyze", "report", "summarize", "process", "automate"
- Low: "write", "explain", "help", "what", "how"

Recommendations:
- Low → Simple Prompt
- Medium → Workflow
- High → Agent
