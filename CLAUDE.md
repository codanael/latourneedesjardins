# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `deno task start` - Start development server with hot reload
- `deno task check` - Run formatting, linting, and type checking
- `deno task test` - Run tests with proper environment setup
- `deno task build` - Build for production
- `deno task preview` - Preview production build

### Code Quality
- `deno fmt` - Format code
- `deno lint` - Lint code
- `deno check **/*.ts && deno check **/*.tsx` - Type check

## Architecture Overview

### Framework and Stack
- **Fresh Framework**: Deno-native full-stack web framework
- **Preact**: React-compatible UI library
- **SQLite**: Database with migration system
- **Tailwind CSS**: Styling
- **OAuth**: Google and Apple authentication

### Key Directories
- `routes/` - File-based routing with API endpoints
- `islands/` - Client-side interactive components
- `components/` - Server-side components
- `utils/` - Shared utilities and business logic
- `static/` - Static assets
- `tests/` - Test files

### Database Architecture
The application uses SQLite with the following core tables:
- `users` - User accounts with OAuth integration and host approval system
- `events` - Garden tour events with location, weather, and capacity
- `rsvps` - Event attendance tracking
- `potluck_items` - Potluck item coordination
- `sessions` - OAuth session management

### Authentication Flow
OAuth-based authentication supporting Google and Apple:
1. OAuth providers configured in `utils/oauth.ts`
2. Authentication routes in `routes/auth/`
3. Session management with secure cookies
4. Middleware-based security headers and rate limiting

### Security Features
- **Rate Limiting**: 100 requests per 15 minutes for API endpoints
- **CSP Headers**: Different policies for development vs production
- **HTTPS Enforcement**: Production redirect and security headers
- **Environment Validation**: Required variables checked at startup

### Environment Configuration
Required environment variables:
- `DATABASE_URL` - SQLite database path
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` - Apple OAuth
- `SESSION_SECRET` - Session encryption key
- `WEATHER_API_KEY` - OpenWeatherMap API key
- `APP_URL` - Application base URL

### Caching Strategy
- **CacheProvider**: Global caching system with TTL
- **Weather Caching**: Location-based weather data caching
- **Event Caching**: Cached event data with invalidation

### Testing Strategy
- Tests located in `tests/` directory
- Use `DENO_ENV=test` environment
- API endpoint testing with auth helpers
- Database operation testing with migrations

## Development Notes

### Fresh Framework Patterns
- Use `islands/` for client-side interactivity
- Server-side components in `components/`
- API routes follow `/api/` pattern
- Middleware applies globally via `_middleware.ts`

### Database Operations
- Schema initialization in `utils/schema.ts`
- Migration system with try-catch for existing columns
- Database operations abstracted in `utils/db-operations.ts`
- Connection management in `utils/database.ts`

### Security Best Practices
- Environment validation on startup
- OAuth configuration validation
- Rate limiting on API endpoints
- Secure cookie management
- HTTPS enforcement in production

### Code Organization
- Utility functions grouped by domain in `utils/`
- Route handlers follow RESTful patterns
- Component composition with proper TypeScript typing
- Consistent error handling and validation