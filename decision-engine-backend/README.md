# Claude Decision Engine Backend

NestJS backend with WebSocket support for real-time AI decision analysis.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NESTJS BACKEND                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Intent     │  │   Analysis   │  │Recommendation│         │
│  │   Module     │  │   Module     │  │   Module     │         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ • Entity     │  │ • Entity     │  │ • Entity     │         │
│  │ • Repository │  │ • Repository │  │ • Repository │         │
│  │ • Service    │  │ • Service    │  │ • Service    │         │
│  │ • Controller │  │ • Controller │  │ • Controller │         │
│  │ • DTOs       │  │ • DTOs       │  │ • DTOs       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│          │                │                  │                  │
│          └────────────────┴──────────────────┘                  │
│                       │                                          │
│            ┌──────────────┐                                     │
│            │   WebSocket  │ ◄── Real-time Progress Updates       │
│            │   Gateway    │     (analysis_progress)            │
│            └──────────────┘                                     │
│                       │                                          │
│            ┌──────────────┐                                     │
│            │   SQLite DB  │                                     │
│            │   (TypeORM)  │                                     │
│            └──────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **REST API** for CRUD operations
- **WebSocket Gateway** for real-time analysis progress
- **SQLite Database** with TypeORM
- **Modular Architecture** (Intent, Analysis, Recommendation modules)
- **Complexity Analysis** using keyword detection
- **Automatic Approach Recommendation** (Simple, Workflow, Agent)

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run start:dev

# API will be available at http://localhost:3001
# WebSocket at ws://localhost:3001/analysis
```

## API Endpoints

### Intents
- `POST /intents` - Create new intent
- `GET /intents/:id` - Get intent by ID
- `GET /intents/session/:sessionId` - Get intents by session

### Analysis
- `POST /analysis/start` - Start analysis for intent
- `GET /analysis/:id` - Get analysis by ID
- `GET /analysis/intent/:intentId` - Get analysis by intent

### Recommendations
- `GET /recommendations/analysis/:analysisId` - Get recommendations

## WebSocket Events

### Client → Server
- `subscribe` - Subscribe to analysis updates
- `unsubscribe` - Unsubscribe from analysis
- `start_analysis` - Start analysis via WebSocket
- `ping` - Health check

### Server → Client
- `connected` - Connection established
- `analysis_progress` - Progress update (0-100%)
- `analysis_complete` - Analysis finished with results
- `analysis_error` - Error occurred
- `pong` - Health check response

## Example WebSocket Usage

```javascript
const socket = io('ws://localhost:3001/analysis');

socket.on('analysis_progress', (data) => {
  console.log(`Progress: ${data.percentage}%`);
  console.log(`Step: ${data.stepName}`);
});

socket.on('analysis_complete', (data) => {
  console.log('Analysis complete:', data.result);
});

// Start analysis
socket.emit('start_analysis', { intentId: 'abc-123' });
```

## Data Flow

1. Client creates intent via `POST /intents`
2. Client starts analysis via `POST /analysis/start` or WebSocket
3. Server broadcasts progress via WebSocket every 800ms
4. Server saves results to database
5. Server broadcasts `analysis_complete` with recommendations

## Project Structure

```
src/
├── modules/
│   ├── intent/           # Intent module
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── dto/
│   ├── analysis/         # Analysis module
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── dto/
│   ├── recommendation/   # Recommendation module
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── dto/
│   └── realtime/         # WebSocket gateway
│       └── gateways/
├── app.module.ts
└── main.ts
```
