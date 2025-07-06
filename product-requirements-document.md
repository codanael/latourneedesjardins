### Product Requirements Document

#### Overview
The "la tournée des jardins" website will serve as a centralized platform for managing and coordinating garden parties among friends. The primary goal is to facilitate communication, planning, and coordination for these events. The web app will be optimized for use on smartphones, given the primary usage context.

#### Scope

**In Scope:**
- Event Information
- RSVP System
- Calendar Integration
- Host Sign-Up
- Potluck Coordination

**Secondary Features:**
- Weather Updates

**Out of Scope:**
- Photo Gallery
- Discussion Forum/Chat
- User Profiles
- Notifications
- Feedback and Reviews
- Accessibility Information
- Event History (for now)

#### User Stories

1. As a group member, I want to view details about upcoming garden parties so that I can plan my attendance.
2. As a host, I want to sign up to host a party so that I can invite everyone to my garden.
3. As an attendee, I want to RSVP to parties so that hosts can plan accordingly.
4. As a member, I want to coordinate potluck items so that we have a variety of food at each party.
5. As a user, I want to see a calendar of events so that I can keep track of all upcoming parties.
6. As a member, I want to check the weather for event dates so that I can prepare appropriately.

#### Functional Requirements

1. **Event Information**
   - Each event will have a dedicated page showing date, time, location, host information, and special instructions.
   - Ability to edit and update event details.

2. **RSVP System**
   - Attendees can RSVP 'Yes,' 'No,' or 'Maybe.'
   - Hosts receive a list of attendees and their responses.

3. **Calendar Integration**
   - Display all upcoming events in a calendar view.
   - Ability to filter events by date range.

4. **Host Sign-Up**
   - Form for members to sign up as hosts, including fields for garden details, preferred dates, and themes.
   - Host requests are reviewed and confirmed by an admin or automatically added upon submission.

5. **Potluck Coordination**
   - A shared list where attendees can sign up to bring specific dishes.
   - Ability to view and manage the potluck list.

6. **Weather Updates**
   - Integrate weather forecast data for event dates and locations.
   - Display weather information on the event page.

#### Non-Functional Requirements

- Performance: The website should load quickly, even with multiple users accessing it simultaneously. Special attention should be given to mobile optimization.
- Security: Secure handling of user data, especially personal information and login credentials.
- Usability: The interface should be intuitive and accessible to users of varying technical abilities, with a focus on mobile usability.
- Compatibility: The website should be accessible on various devices and browsers, with primary focus on smartphones.

#### User Interface

Basic layout ideas include:
- Homepage with a summary of upcoming events.
- Event detail pages with RSVP options.
- Host sign-up form.
- Potluck coordination section on event pages.
- Calendar view of all events.
- Weather forecast widget on event pages.
