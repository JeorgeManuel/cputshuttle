create extension if not exists pgcrypto;

create type user_role as enum ('viewer', 'reporter', 'admin');
create type reporter_status as enum ('none', 'pending', 'approved', 'rejected');
create type path_type as enum ('main', 'alternate');
create type shuttle_direction as enum ('to_bellville', 'to_d6');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  role user_role not null default 'viewer',
  reporter_status reporter_status not null default 'none',
  created_at timestamptz not null default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Auth sessions (used by lib/auth.ts for bearer tokens)
create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null,
  expires_at timestamptz not null
);


create table if not exists route_paths (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  path_type path_type not null,
  polyline_geojson jsonb not null,
  corridor_buffer_m integer not null default 100,
  created_at timestamptz not null default now(),
  unique(route_id, path_type)
);

create table if not exists stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  stop_code text not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  sequence integer not null,
  created_at timestamptz not null default now(),
  unique(route_id, stop_code),
  unique(route_id, sequence)
);

create table if not exists reporter_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  motivation text,
  status reporter_status not null default 'pending',
  reviewed_by_admin_id uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reporter_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  route_id uuid not null references routes(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  is_muted boolean not null default false,
  is_flagged boolean not null default false
);

create table if not exists location_pings (
  id uuid primary key default gen_random_uuid(),
  reporter_session_id uuid not null references reporter_sessions(id) on delete cascade,
  route_id uuid not null references routes(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision not null,
  speed_mps double precision,
  heading_deg double precision,
  captured_at_client timestamptz not null,
  received_at_server timestamptz not null default now(),
  matched_path_id uuid references route_paths(id),
  accepted boolean not null,
  rejection_reason text
);

create table if not exists shuttle_estimates (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  shuttle_slot text not null check (shuttle_slot in ('A', 'B')),
  direction shuttle_direction not null,
  est_lat double precision not null,
  est_lng double precision not null,
  reliability_score numeric(4, 3) not null check (reliability_score >= 0 and reliability_score <= 1),
  reporter_count integer not null check (reporter_count >= 1),
  generated_at timestamptz not null default now()
);

create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id),
  action_type text not null,
  target_user_id uuid references users(id),
  target_session_id uuid references reporter_sessions(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_location_pings_route_time
  on location_pings(route_id, received_at_server desc);

create index if not exists idx_shuttle_estimates_route_time
  on shuttle_estimates(route_id, generated_at desc);
