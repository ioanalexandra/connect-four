# Connect Four

A real-time multiplayer Connect Four game built with React Native (Expo) and a Node.js backend. Challenge friends online, track your stats, and climb the leaderboard.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue) ![Expo](https://img.shields.io/badge/Expo-54-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express_5-green)

---

## Features

- **Real-time multiplayer** — Socket.io-powered gameplay with live board updates
- **Challenge system** — See who's online and send direct challenges
- **Authentication** — Register/login with JWT, tokens stored securely via Expo Secure Store
- **Leaderboard** — Top players ranked by wins
- **Game history** — Review past games move-by-move
- **Animated UI** — Piece-drop animations, pulsing timers, dark theme

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81, Expo 54, TypeScript |
| Navigation | React Navigation 7 (native stack) |
| Forms | React Hook Form + Zod |
| Real-time | Socket.io-client 4.8 |
| HTTP | Axios |
| Backend | Express 5, Node.js, TypeScript |
| WebSockets | Socket.io 4.8 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |

---

## Project Structure

```
connect-four/
├── src/
│   ├── components/       # ConnectFourBoard, AppTextInput, etc.
│   ├── context/          # AuthContext, SocketContext
│   ├── navigation/       # Root, Main, and Auth navigators
│   ├── screens/          # HomeScreen, GameScreen, LobbyScreen, etc.
│   ├── services/         # API calls and game service
│   └── utils/            # Core game logic (win detection, board helpers)
├── server/
│   ├── src/
│   │   ├── controllers/  # Auth, game, leaderboard business logic
│   │   ├── routes/       # REST API routes
│   │   ├── socket/       # WebSocket event handlers
│   │   └── middleware/   # JWT auth middleware
│   └── prisma/
│       └── schema.prisma # Database models
├── assets/               # App icons and splash screen
├── App.tsx               # Entry point and provider hierarchy
└── app.json              # Expo configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Expo CLI (`npm install -g expo-cli`) or the [Expo Go](https://expo.dev/go) app on your device

### 1. Clone and install

```bash
git clone <repo-url>
cd connect-four
npm install
cd server && npm install && cd ..
```

### 2. Configure the backend

Create `server/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/connectfour"
JWT_SECRET="your-secret-key"
PORT=3000
```

### 3. Set up the database

```bash
cd server
npm run db:push       # Apply schema to your database
npm run db:generate   # Generate Prisma client
```

### 4. Start the backend

```bash
cd server
npm run dev
```

The API server starts on `http://localhost:3000`.

### 5. Start the mobile app

```bash
# From the project root
npm start
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

---

## Available Scripts

### Mobile (project root)

| Script | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in browser |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |

### Backend (`server/`)

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled output |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## Game Rules

Connect Four is played on a 6-row × 7-column grid. Two players take turns dropping pieces into columns. The first player to connect **four pieces in a row** — horizontally, vertically, or diagonally — wins. If the board fills with no winner, the game is a draw.

---

## Database Schema

```
User       id, email, username, passwordHash, wins, losses, draws
Game       id, status, board (JSON), player1Id, player2Id, currentTurnId, winnerId
Move       id, gameId, playerId, column, row, moveNumber
```

Game statuses: `WAITING` → `IN_PROGRESS` → `COMPLETED | DRAW | ABANDONED`
