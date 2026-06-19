# Shuttle Tracker Beta Sprint Backlog

## Sprint 1 - Foundation and Route Seed

### T1.1: Bootstrap web app and API shell
- Description: Establish Next.js codebase with page routes and API namespace.
- Acceptance Criteria:
1. App boots with navigation links for Home, Map, Reporter, and Admin.
2. API namespace exists under /api/v1.
3. Base lint and build commands are present in package scripts.

### T1.2: Implement Bellville <-> D6 route seed
- Description: Store first release route geometry (main and alternate) and endpoint metadata.
- Acceptance Criteria:
1. Route seed file includes id, name, mainPath, alternatePath, and stops.
2. GET /api/v1/routes returns Bellville <-> D6 route data.
3. Map page can render route and endpoint points from API response.

### T1.3: Define core database schema
- Description: Create SQL schema for users, roles, route paths, sessions, pings, and admin actions.
- Acceptance Criteria:
1. Schema includes reporter_status and role fields.
2. Schema supports corridor validation result capture (accepted/rejection_reason).
3. Schema supports admin action audit logging.

## Sprint 2 - Accounts and Reporter Approval

### T2.1: Account creation and login
- Description: Add registration and login endpoints and UI forms.
- Acceptance Criteria:
1. POST /api/v1/auth/register validates required fields.
2. POST /api/v1/auth/login issues session token.
3. Frontend login/register forms call APIs and show success/error states.

### T2.2: Reporter request workflow
- Description: Allow logged-in users to request reporter access.
- Acceptance Criteria:
1. POST /api/v1/reporter-requests creates pending request.
2. Reporter status remains pending until admin review.
3. Reporter page reflects pending and approved states.

### T2.3: Admin approval and promotion
- Description: Admins approve reporter requests and promote users to admin.
- Acceptance Criteria:
1. POST /api/v1/admin/reporter-requests/{id}/approve updates requester role/status.
2. POST /api/v1/admin/users/{id}/promote grants admin role.
3. admin_actions records both actions.

## Sprint 3 - Ping Validation and Reliability Engine

### T3.1: Reporter session lifecycle
- Description: Start and stop reporting sessions tied to approved reporters.
- Acceptance Criteria:
1. POST /api/v1/reporter-sessions creates active session.
2. POST /api/v1/reporter-sessions/{id}/stop closes session.
3. Muted/flagged session controls are available for admin moderation.

### T3.2: Route-constrained ping validation
- Description: Enforce hard corridor rules for incoming pings.
- Acceptance Criteria:
1. POST /api/v1/location-pings rejects pings with accuracy > 100m.
2. Pings outside main/alternate corridor are rejected with off_route reason.
3. Accepted and rejected outcomes are stored for observability.

### T3.3: Reliability scoring
- Description: Generate reliability score based on reporter count and quality signals.
- Acceptance Criteria:
1. Single reporter estimates are visible with lower reliability.
2. Reliability score increases with consistent multi-reporter agreement.
3. GET /api/v1/routes/{id}/live returns reliability and reporter count per shuttle slot.

## Sprint 4 - Map UX and Operations Dashboard

### T4.1: Live map visualization
- Description: Show both shuttle slots with route overlays and confidence indicators.
- Acceptance Criteria:
1. Main path and alternate path are visually distinct.
2. Shuttle markers display direction, reporter count, and reliability label.
3. Map refreshes live data at least every 10 seconds.

### T4.2: Admin moderation dashboard
- Description: Provide queue and controls for approvals and active sessions.
- Acceptance Criteria:
1. Admin can see pending reporter requests and active sessions.
2. Admin can mute/flag sessions and view recent rejections.
3. Role changes and moderation actions are traceable.

## Sprint 5 - Hardening and Beta Readiness

### T5.1: Consent and policy finalization
- Description: Convert consent placeholders into final approved copy.
- Acceptance Criteria:
1. Consent page clearly states location sharing requirement.
2. Data retention summary is visible before reporting starts.
3. Stop-sharing control is one interaction away.

### T5.2: Operational telemetry
- Description: Add baseline metrics and quality dashboards.
- Acceptance Criteria:
1. Metrics include accepted/rejected ping rates by reason.
2. End-to-end latency metric is captured.
3. Reliability trend reporting is available by hour.

### T5.3: Beta launch checklist
- Description: Validate route data, auth, moderation, and map reliability before onboarding participants.
- Acceptance Criteria:
1. Bellville <-> D6 route seed reviewed and signed off.
2. Reporter approval workflow tested end-to-end.
3. Demo run confirms live status with one and multiple reporters.
