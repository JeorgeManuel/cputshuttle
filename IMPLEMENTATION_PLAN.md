# Crowdsourced Shuttle Tracker (Web Beta) - Implementation Documentation

## 1. Product Vision

Build a crowdsourced shuttle tracking web application where approved participants share live location updates from their phones, reducing or eliminating onboard hardware GPS requirements.

## 2. Problem Statement

Traditional shuttle tracking usually depends on dedicated hardware devices in each vehicle. This creates cost, setup delays, maintenance overhead, and hardware failure risk.

This project tests a hardware-light approach:
- People on a shuttle become temporary location beacons.
- Reporter data is only counted if it matches a preprogrammed route path.
- Riders see real-time shuttle position and confidence in a browser map.

## 3. Beta Decisions Locked In

- Route scope is Bellville <-> D6 only.
- Include the main route path and one known alternative path.
- This is a one-shot shuttle for this beta, with no scheduled intermediate stops.
- Two shuttles operate this corridor and are expected to depart every hour from both ends.
- Public live status is shown even with a single active reporter.
- Reliability must still be weighted, and higher reporter agreement increases trust.
- Account creation and login are required.
- Anyone can request to be a reporter, but admin approval is required before reporting is enabled.
- Admins can promote other users to admin.
- Static average speed is acceptable for initial ETA behavior.

## 4. Beta Goals (What Success Looks Like)

### Primary Goals
- Validate whether crowdsourced phone location can produce useful shuttle tracking accuracy.
- Verify operational feasibility for Bellville <-> D6 with two active shuttles.
- Test whether users are willing to share location to help solve a known transport visibility problem.

### Success Metrics
- At least 70% of active trips have at least one approved reporter online.
- Median location freshness under 20 seconds during active trips.
- Median map error under 100 meters compared to destination arrival timing references.
- Reliability score remains stable during peak windows despite participant variability.

## 5. Non-Goals for Beta

- Native mobile apps (iOS/Android).
- Automated integration with shuttle scheduling systems.
- Financial incentives or gamification.
- Perfect anti-spoofing guarantees.

## 6. Users and Permissions

### Public Viewer
- Can open the map and view Bellville <-> D6 live status.

### Registered User
- Can create an account and sign in.
- Can request reporter access.

### Approved Reporter
- Can start and stop active location sharing.
- Pings count only when aligned to allowed corridor geometry.

### Admin / Moderator
- Approves or rejects reporter requests.
- Can flag, mute, or terminate suspicious reporter sessions.
- Can promote another user to admin.

## 7. Core User Flows

### A) Account Creation and Login
1. User opens landing page.
2. User creates account and verifies login.
3. User reads experiment details and consent language.

### B) Request Reporter Access
1. Logged-in user taps "Request Reporter Access".
2. Admin receives pending approval in admin panel.
3. Admin approves or rejects.
4. Approved user gains reporter controls.

### C) View Live Shuttle
1. User opens map.
2. Map shows Bellville <-> D6 route and current estimated shuttle positions.
3. UI shows reliability indicator (for example, low, medium, high).
4. UI always shows live status even with one reporter, with lower confidence where appropriate.

### D) Share Location (Reporter)
1. Approved reporter taps "Start Sharing".
2. Browser requests geolocation permission.
3. App sends periodic pings with session token while active.
4. Reporter taps "Stop Sharing" to end session.

### E) Admin Moderation
1. Admin views active sessions and reliability telemetry.
2. Admin reviews pending reporter requests.
3. Admin can demote/disable reporter, mute session, or promote new admin.

## 8. High-Level System Architecture

### Frontend (Web App)
- Framework: Next.js (React + TypeScript).
- Map UI: Mapbox GL JS or Leaflet.
- Real-time stream: WebSocket updates for estimate and reliability.

### Backend API
- Runtime: Node.js + TypeScript.
- REST for auth, moderation, route metadata, and session lifecycle.
- WebSocket for live map updates.

### Data Layer
- PostgreSQL for canonical entities.
- Redis optional for stream fan-out and short-lived state.

### Processing Layer
- Ping validator enforces route-corridor rules.
- Aggregator computes shuttle estimates and reliability.
- Direction/cluster logic supports two shuttles on the same corridor.

## 9. Data Model (Beta)

### users
- id (uuid)
- email (unique)
- password_hash or external_auth_id
- display_name
- role (viewer, reporter, admin)
- reporter_status (none, pending, approved, rejected)
- created_at

### routes
- id (uuid)
- name (Bellville <-> D6)
- active

### route_paths
- id (uuid)
- route_id
- path_type (main, alternate)
- polyline_geojson
- corridor_buffer_m

### stops
- id (uuid)
- route_id
- name
- lat
- lng
- sequence

### reporter_sessions
- id (uuid)
- user_id
- route_id
- started_at
- ended_at
- is_muted
- is_flagged

### location_pings
- id (uuid)
- reporter_session_id
- route_id
- lat
- lng
- accuracy_m
- speed_mps
- heading_deg
- captured_at_client
- received_at_server
- matched_path_id (nullable)
- accepted (boolean)
- rejection_reason (nullable)

### shuttle_estimates
- id (uuid)
- route_id
- shuttle_slot (A_or_B)
- est_lat
- est_lng
- direction (to_bellville, to_d6)
- reliability_score (0-1)
- reporter_count
- generated_at

### admin_actions
- id (uuid)
- admin_user_id
- action_type (approve_reporter, reject_reporter, mute_session, promote_admin, demote_admin)
- target_user_id (nullable)
- target_session_id (nullable)
- notes (nullable)
- created_at

## 10. Location Validation and Reliability Strategy

### Route-Constrained Ping Acceptance (Hard Rule)
Only pings that fall within a preprogrammed corridor around either allowed path (main or alternate) are counted.

Recommended initial limits:
- Accuracy must be <= 100m.
- Ping must map to either route path buffer (for example, 80m to 120m configurable).
- Reject impossible movement jumps using speed and delta-time checks.

### Aggregation Logic
1. Keep recent accepted pings (last 30 to 45 seconds).
2. Group pings by likely shuttle slot and direction.
3. Weight pings by recency, reported accuracy, and reporter trust baseline.
4. Compute weighted estimate projected to nearest valid route path segment.

### Reliability Score Behavior
- Starts low for single reporter situations but is still displayed publicly.
- Increases when multiple reporters are spatially consistent.
- Decreases when reporters disagree or data freshness drops.

Example scoring inputs:
- reporter_count factor
- recency factor
- inter-reporter distance agreement
- average GPS accuracy

## 11. Privacy, Consent, and Policy Language (Beta)

### Required Consent Copy Themes
- "This system depends on participants sharing live location while riding."
- "You can stop sharing at any time."
- "Your location is used to estimate shuttle position for Bellville <-> D6."

### Data Handling
- Collect only data needed for live tracking and reliability estimation.
- No background tracking when reporter session is stopped.
- Provide delete request path for account and associated data.

### Abuse Controls
- Auth required for reporting.
- Reporter approval gate by admins.
- Moderation actions logged in admin audit table.

## 12. Web Beta MVP Scope

### Must-Have
- Account creation and login.
- Bellville <-> D6 map display.
- Route and alternative path rendering.
- Reporter application and admin approval flow.
- Start/stop sharing for approved reporters.
- Route-constrained ping validation.
- Live estimate with reliability score visible to public viewers.
- Admin moderation panel with admin promotion.

### Nice-to-Have
- ETA to destination using static average speed.
- Session replay for debugging and quality checks.
- Reliability trend chart by hour.

## 13. Suggested API Contracts (Initial)

### POST /api/v1/auth/register
Creates account.

### POST /api/v1/auth/login
Returns auth session.

### POST /api/v1/reporter-requests
Creates pending reporter approval request for logged-in user.

### POST /api/v1/admin/reporter-requests/{id}/approve
Approves reporter request (admin only).

### POST /api/v1/admin/users/{id}/promote
Promotes user to admin (admin only).

### POST /api/v1/admin/users/{id}/demote
Demotes admin to user.

### POST /api/v1/reporter-sessions
Starts reporter session (approved reporters only).

### POST /api/v1/location-pings
Accepts ping batch, validates corridor, stores accepted and rejected status.

### POST /api/v1/reporter-sessions/{id}/stop
Stops reporter session.

### GET /api/v1/routes
Returns Bellville <-> D6 route, main path, alternate path, and stops.

### GET /api/v1/routes/{id}/live
Returns latest estimate(s) and reliability score(s).

### WS /ws/routes/{id}
Streams shuttle estimate and reliability updates.

## 14. Frontend Pages (Initial)

- / : landing, account actions, experiment overview
- /login : sign in
- /register : account creation
- /map : Bellville <-> D6 live map and reliability indicators
- /consent : policy and location-sharing explanation
- /reporter : request approval and sharing controls
- /admin : reporter approvals, active sessions, moderation, admin promotion

## 15. Bellville <-> D6 Operations Model (Beta)

- Single corridor launch: Bellville <-> D6 only.
- Non-stop operational model: endpoint-to-endpoint one-shot service.
- Two shuttle service assumption, hourly departure target from both ends.
- Main and alternate path are both valid for accepted pings.
- If only one active participant is available, still render status with lower reliability.

## 16. Risks and Mitigations

### Risk: Single-reporter periods reduce trust
Mitigation: always show reliability score and freshness timestamp alongside location.

### Risk: Off-route or spoofed pings
Mitigation: strict route-corridor validation and rejection logging.

### Risk: Admin abuse or mistakes
Mitigation: role-change confirmations and audit logging for all admin actions.

### Risk: User privacy concerns
Mitigation: explicit location-sharing consent language and immediate stop control.

## 17. Implementation Roadmap (Engineering)

### Sprint 1
- Project scaffold, auth, core tables, Bellville <-> D6 route/path seed.

### Sprint 2
- Reporter request + admin approval flow.
- Reporter session lifecycle and ping ingestion.

### Sprint 3
- Route-corridor validator and reliability engine.
- Live map stream updates.

### Sprint 4
- Admin moderation tools and admin promotion.
- Basic ETA and ops dashboards.

### Sprint 5
- Beta hardening, policy finalization, reliability tuning.

## 18. Observability and QA

Track:
- accepted_ping_rate and rejected_ping_rate by rejection_reason
- end_to_end_latency_ms (capture to map render)
- reporter_count and reliability_score over time
- admin moderation actions

Test:
- account creation and login flows
- reporter pending/approved/rejected transitions
- off-route ping rejection on both main and alternate boundaries
- one reporter vs many reporters reliability behavior
- mobile browser compatibility (iOS Safari, Android Chrome)

## 19. Remaining Open Questions

- Confirm exact endpoint coordinates and route geometry for Bellville and D6.
- Confirm corridor buffer size defaults for main and alternate paths.
- Confirm wording for final consent text and retention durations.

## 20. Immediate Next Build Steps

1. Finalize Bellville <-> D6 route geometry JSON (main and alternate).
2. Confirm endpoint metadata and hourly timetable assumptions.
3. Scaffold auth and role tables with reporter approval workflow.
4. Build map page with route layers and live estimate marker.
5. Implement ping validator and reliability score endpoint.
