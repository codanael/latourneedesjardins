## Relevant Files

### Core Application Files
- `src/main.ts` - Application entry point with database initialization and seeding
- `src/fresh.config.ts` - Fresh framework configuration with Tailwind plugin
- `src/deno.json` - Deno configuration with dependencies and tasks including testing
- `src/.env` - Environment variables for database and API configurations

### Database Layer
- `src/utils/database.ts` - SQLite database connection singleton
- `src/utils/schema.ts` - Database schema initialization for all tables
- `src/utils/migrations.ts` - Database migration system with version tracking
- `src/utils/db-operations.ts` - Complete CRUD operations for users, events, RSVPs, potluck items
- `src/utils/seed-data.ts` - Sample data seeding for development
- `src/utils/env.ts` - Environment variable validation utilities
- `src/utils/weather.ts` - Weather API integration with OpenWeatherMap

### Security Layer
- `src/utils/security.ts` - Security headers, XSS protection, rate limiting, input sanitization
- `src/routes/_middleware.ts` - Global security middleware for all routes
- `src/routes/admin/security.tsx` - Security monitoring dashboard for administrators

### Routes and Pages
- `src/routes/index.tsx` - Homepage with upcoming events display
- `src/routes/events/index.tsx` - All events listing page with RSVP counts
- `src/routes/events/[id].tsx` - Event detail page with integrated RSVP functionality
- `src/routes/events/[id]/edit.tsx` - Event editing form with validation and success handling
- `src/routes/calendar.tsx` - Calendar view of events by month
- `src/routes/host.tsx` - Host sign-up form for creating events
- `src/routes/host/dashboard.tsx` - Host dashboard to view event statistics and attendee responses
- `src/routes/host/attendees/[id].tsx` - Detailed attendee view for hosts with participant management
- `src/routes/api/events/[id]/rsvp.ts` - RSVP API endpoint with full CRUD operations
- `src/routes/api/events/[id]/potluck.ts` - Potluck items API endpoint for adding and listing items
- `src/routes/api/events/[id]/potluck/[itemId].ts` - Individual potluck item API endpoint for deletion

### Components and Islands
- `src/components/Navigation.tsx` - Main navigation component
- `src/components/EventCard.tsx` - Reusable event display card
- `src/components/PageHeader.tsx` - Page header component
- `src/components/Button.tsx` - Styled button component
- `src/components/PotluckList.tsx` - Shared potluck list component for displaying items
- `src/components/Weather.tsx` - Weather display component with current and forecast data
- `src/islands/RSVPButton.tsx` - Interactive RSVP component with API integration
- `src/islands/PotluckManager.tsx` - Interactive potluck management component with add/remove functionality

### Testing
- `src/tests/db-operations.test.ts` - Comprehensive database operations tests
- `src/tests/env.test.ts` - Environment configuration tests
- `src/tests/api-rsvp.test.ts` - Complete RSVP API endpoint testing with all scenarios

### Styling
- `src/static/styles.css` - Global CSS styles
- `src/tailwind.config.ts` - Tailwind CSS configuration

### Notes
- Use environment variables for sensitive configurations and API keys.
- Follow responsive design principles in the CSS framework chosen for mobile optimization.
- Regularly run tests and ensure the application starts correctly after changes.
- Update this tasklist as you go
- When running the server, remember that the shell can't be used anymore. Run the server in the background, and output its console to a file to see errors.

## Tasks
- [x] 1.0 Set Up Development Environment
  - [x] 1.1 Install Deno and verify installation.
  - [x] 1.2 Install SQLite and set up a local database file.
  - [x] 1.3 Initialize Git repository and configure remote on GitHub/GitLab.
  - [x] 1.4 Create `.env` file for environment variables, including SQLite configurations.

- [x] 2.0 Initialize Project
  - [x] 2.1 Create a new Fresh project using Deno.
  - [x] 2.2 Set up the basic project structure following Deno Fresh conventions.
  - [x] 2.3 Configure Fresh settings and dependencies in `deno.json`.

- [x] 3.0 Database Setup
  - [x] 3.1 Create SQLite database and configure connection in project.
  - [x] 3.2 Define and execute database schema for users, events, RSVPs, and potluck items.
  - [x] 3.3 Implement SQLite schema migration handling.

- [x] 4.0 Environment Configuration
  - [x] 4.1 Set environment variables for development in `.env`.
  - [x] 4.2 Securely add necessary API keys for external services like weather data.

- [x] 5.0 Basic UI Layout
  - [x] 5.1 Define Fresh routes for navigation within the app.
  - [x] 5.2 Create main components and pages using Fresh’s island architecture.
  - [x] 5.3 Implement responsive design using a CSS framework compatible with Fresh.

- [x] 6.0 Event Information
  - [x] 6.1 Develop `EventDetail.tsx` component for event details display.
  - [x] 6.2 Implement backend route handlers in Fresh for event operations.
  - [x] 6.3 Add frontend functionality to edit and update event details.

- [x] 7.0 RSVP System
  - [x] 7.1 Design RSVP UI elements in event detail page.
  - [x] 7.2 Implement backend handlers for RSVP storage and retrieval in SQLite.
  - [x] 7.3 Develop feature for hosts to view attendee responses.

- [x] 8.0 Calendar Integration
  - [x] 8.1 Implement calendar component to show events.
  - [x] 8.2 Add date range filtering capabilities in calendar view.

- [x] 9.0 Host Sign-Up
  - [x] 9.1 Create host sign-up form component.
  - [x] 9.2 Implement backend handlers for host sign-up submissions.
  - [x] 9.3 Configure admin review or automatic confirmation process for hosts.

- [x] 10.0 Security Measures
   - [x] 10.1 Implement user authentication with OAuth 2.0.
   - [x] 10.2 Implement a role authorization model
   - [x] 10.3 Ensure secure data handling and transmission.

- [x] 11.0 Potluck Coordination
   - [x] 11.1 Design shared list component for potluck items.

- [x] 12.0 Weather Updates
   - [x] 12.1 Integrate OpenWeatherMap API into event pages.
   - [x] 12.2 Display weather forecast data for events.

- [ ] 13.0 Performance Optimization
   - [x] 13.1 Optimize resources for mobile viewing.
   - [x] 13.2 Implement client-side caching for performance enhancement.
   - [x] 13.3 Implement server-side caching for weather forecast data to reduce costs.

- [ ] 14.0 Testing and Quality Assurance
   - [ ] 14.1 Set up and configure Deno tests for components and routes.
   - [ ] 14.2 Implement continuous checks to ensure app functionality after changes.
   - [ ] 14.3 Conduct regular usability and performance tests on mobile devices.

- [ ] 15.0 Deployment and Monitoring
   - [ ] 15.1 Configure deployment pipeline for Deno Fresh application on a suitable platform.
   - [ ] 15.2 Implement monitoring and logging in production for performance tracking.

