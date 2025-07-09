# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `deno task start` - Start development server with hot reload
- `deno task check` - Run formatting, linting, and type checking
- `deno task test` - Run tests with proper environment setup
- `deno task build` - Build for production
- `deno task preview` - Preview production build

### Additional Commands
- `deno task cli` - Access Fresh CLI tools
- `deno task manifest` - Generate Fresh manifest
- `deno task update` - Update Fresh framework

### Code Quality
- `deno fmt` - Format code
- `deno lint` - Lint code
- `deno check **/*.ts && deno check **/*.tsx` - Type check

## Architecture Overview

### Framework and Stack
- **Fresh Framework**: Deno-native full-stack web framework (v1.7.3)
- **Preact**: React-compatible UI library (v10.22.0)
- **SQLite**: Database with migration system
- **Tailwind CSS**: Styling with plugin support
- **OAuth**: Google authentication (Apple OAuth conditional)

### Key Directories
- `src/` - Main source directory
- `src/routes/` - File-based routing with API endpoints
- `src/islands/` - Client-side interactive components
- `src/components/` - Server-side components
- `src/utils/` - Shared utilities and business logic
- `src/static/` - Static assets
- `src/tests/` - Test files

### Database Architecture
The application uses SQLite with the following core tables:
- `users` - User accounts with OAuth integration, host approval system, and roles
- `events` - Garden tour events with location, weather, coordinates, and capacity
- `rsvps` - Event attendance tracking
- `potluck_items` - Potluck item coordination
- `sessions` - OAuth session management

Enhanced user features:
- `host_status` - Host approval workflow ('pending', 'approved', 'rejected')
- `admin_notes` - Administrative notes for user management
- `confirmed_at` - Email confirmation tracking
- `role` - User role system ('user', 'admin', 'host')

### Authentication Flow
OAuth-based authentication supporting Google and optionally Apple:
1. OAuth providers configured in `utils/oauth.ts`
2. Authentication routes in `routes/auth/`
3. Session management with secure cookies
4. Middleware-based security headers and rate limiting
5. Apple OAuth conditionally enabled based on environment variables

### Security Features
- **Rate Limiting**: Built into middleware
- **CSP Headers**: Different policies for development vs production
- **HTTPS Enforcement**: Production redirect and security headers
- **Environment Validation**: Required variables checked at startup with detailed error messages

### Environment Configuration
Required environment variables:
- `DATABASE_URL` - SQLite database path (defaults to "./database.sqlite")
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `SESSION_SECRET` - Session encryption key
- `WEATHER_API_KEY` - OpenWeatherMap API key

Optional environment variables:
- `PORT` - Server port (default: 8000)
- `HOSTNAME` - Server hostname (default: "0.0.0.0")
- `APP_URL` - Application base URL (default: "http://localhost:8000")
- `WEATHER_API_URL` - OpenWeatherMap API URL (default: "https://api.openweathermap.org/data/2.5")
- `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` - Apple OAuth (optional, enables Apple login when both are set)

### Caching Strategy
- **CacheProvider**: Global caching system with TTL
- **Weather Caching**: Location-based weather data caching
- **Event Caching**: Cached event data with invalidation

### Testing Strategy
- Tests located in `src/tests/` directory
- Use `DENO_ENV=test` environment
- Comprehensive test coverage:
  - API endpoint testing (events, RSVP)
  - Authentication flow testing
  - Database operations testing
  - Cache functionality testing
  - Environment validation testing

## Development Notes

### Fresh Framework Patterns
- Use `src/islands/` for client-side interactivity
- Server-side components in `src/components/`
- API routes follow `/api/` pattern
- Middleware applies globally via `_middleware.ts`
- Build target: Chrome 88+, Firefox 78+, Safari 14+, Edge 88+

### Database Operations
- Schema initialization in `utils/schema.ts`
- Migration system with try-catch for existing columns
- Database operations abstracted in `utils/db-operations.ts`
- Connection management in `utils/database.ts`
- Proper indexing for query performance

### Security Best Practices
- Environment validation on startup with production-specific checks
- OAuth configuration validation with format warnings
- Rate limiting on API endpoints
- Secure cookie management
- HTTPS enforcement in production

### Code Organization
- Utility functions grouped by domain in `src/utils/`
- Route handlers follow RESTful patterns
- Component composition with proper TypeScript typing
- Consistent error handling and validation
- Proper separation of concerns between islands and components

### Docker Support
- Dockerfile included for containerization
- GitHub Actions workflow for Docker image building