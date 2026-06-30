CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "groups" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "invite_code" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "group_members" (
  "id" text PRIMARY KEY NOT NULL,
  "group_id" text NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "role" text DEFAULT 'member' NOT NULL,
  "joined_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "group_members_group_user_idx" ON "group_members" ("group_id", "user_id");
CREATE INDEX IF NOT EXISTS "group_members_user_idx" ON "group_members" ("user_id");

CREATE TABLE IF NOT EXISTS "linked_players" (
  "id" text PRIMARY KEY NOT NULL,
  "group_id" text NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "ign" text NOT NULL,
  "uuid" text NOT NULL,
  "profile_id" text,
  "profile_name" text,
  "game_mode" text,
  "last_synced_at" timestamp,
  "last_manual_refresh_at" timestamp,
  "sync_error" text,
  "api_disabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "linked_players_group_user_idx" ON "linked_players" ("group_id", "user_id");
CREATE INDEX IF NOT EXISTS "linked_players_group_idx" ON "linked_players" ("group_id");

CREATE TABLE IF NOT EXISTS "profile_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "linked_player_id" text NOT NULL UNIQUE REFERENCES "linked_players"("id") ON DELETE cascade,
  "senither_weight" double precision DEFAULT 0 NOT NULL,
  "skill_average" double precision DEFAULT 0 NOT NULL,
  "catacombs_level" double precision DEFAULT 0 NOT NULL,
  "networth" double precision DEFAULT 0 NOT NULL,
  "non_cosmetic_networth" double precision DEFAULT 0 NOT NULL,
  "overall_completion_pct" double precision DEFAULT 0 NOT NULL,
  "skyblock_level" double precision DEFAULT 0 NOT NULL,
  "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "raw_profile" jsonb,
  "synced_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "snapshots_weight_idx" ON "profile_snapshots" ("senither_weight");
CREATE INDEX IF NOT EXISTS "snapshots_sa_idx" ON "profile_snapshots" ("skill_average");
CREATE INDEX IF NOT EXISTS "snapshots_networth_idx" ON "profile_snapshots" ("networth");
CREATE INDEX IF NOT EXISTS "snapshots_overall_idx" ON "profile_snapshots" ("overall_completion_pct");

CREATE TABLE IF NOT EXISTS "snapshot_history" (
  "id" text PRIMARY KEY NOT NULL,
  "linked_player_id" text NOT NULL REFERENCES "linked_players"("id") ON DELETE cascade,
  "senither_weight" double precision DEFAULT 0 NOT NULL,
  "skill_average" double precision DEFAULT 0 NOT NULL,
  "networth" double precision DEFAULT 0 NOT NULL,
  "overall_completion_pct" double precision DEFAULT 0 NOT NULL,
  "recorded_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "history_player_date_idx" ON "snapshot_history" ("linked_player_id", "recorded_at");

CREATE TABLE IF NOT EXISTS "sync_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "status" text NOT NULL,
  "players_processed" integer DEFAULT 0 NOT NULL,
  "players_failed" integer DEFAULT 0 NOT NULL,
  "error" text,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "hypixel_cache" (
  "id" text PRIMARY KEY NOT NULL,
  "cache_key" text NOT NULL UNIQUE,
  "data" jsonb NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hypixel_cache_expires_idx" ON "hypixel_cache" ("expires_at");
