import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Better Auth tables ─────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── App tables ─────────────────────────────────────────────────────────────

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("group_members_group_user_idx").on(table.groupId, table.userId),
    index("group_members_user_idx").on(table.userId),
  ],
);

export const linkedPlayers = pgTable(
  "linked_players",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ign: text("ign").notNull(),
    uuid: text("uuid").notNull(),
    profileId: text("profile_id"),
    profileName: text("profile_name"),
    gameMode: text("game_mode"),
    lastSyncedAt: timestamp("last_synced_at"),
    lastManualRefreshAt: timestamp("last_manual_refresh_at"),
    syncError: text("sync_error"),
    apiDisabled: boolean("api_disabled").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("linked_players_group_user_idx").on(table.groupId, table.userId),
    index("linked_players_group_idx").on(table.groupId),
  ],
);

export const profileSnapshots = pgTable(
  "profile_snapshots",
  {
    id: text("id").primaryKey(),
    linkedPlayerId: text("linked_player_id")
      .notNull()
      .references(() => linkedPlayers.id, { onDelete: "cascade" })
      .unique(),
    senitherWeight: doublePrecision("senither_weight").notNull().default(0),
    skillAverage: doublePrecision("skill_average").notNull().default(0),
    catacombsLevel: doublePrecision("catacombs_level").notNull().default(0),
    networth: doublePrecision("networth").notNull().default(0),
    nonCosmeticNetworth: doublePrecision("non_cosmetic_networth").notNull().default(0),
    overallCompletionPct: doublePrecision("overall_completion_pct").notNull().default(0),
    skyblockLevel: doublePrecision("skyblock_level").notNull().default(0),
    metrics: jsonb("metrics").notNull().default({}),
    rawProfile: jsonb("raw_profile"),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
  },
  (table) => [
    index("snapshots_weight_idx").on(table.senitherWeight),
    index("snapshots_sa_idx").on(table.skillAverage),
    index("snapshots_networth_idx").on(table.networth),
    index("snapshots_overall_idx").on(table.overallCompletionPct),
  ],
);

export const snapshotHistory = pgTable(
  "snapshot_history",
  {
    id: text("id").primaryKey(),
    linkedPlayerId: text("linked_player_id")
      .notNull()
      .references(() => linkedPlayers.id, { onDelete: "cascade" }),
    senitherWeight: doublePrecision("senither_weight").notNull().default(0),
    skillAverage: doublePrecision("skill_average").notNull().default(0),
    networth: doublePrecision("networth").notNull().default(0),
    overallCompletionPct: doublePrecision("overall_completion_pct").notNull().default(0),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (table) => [
    index("history_player_date_idx").on(table.linkedPlayerId, table.recordedAt),
  ],
);

export const syncJobs = pgTable("sync_jobs", {
  id: text("id").primaryKey(),
  status: text("status", { enum: ["running", "completed", "failed"] }).notNull(),
  playersProcessed: integer("players_processed").notNull().default(0),
  playersFailed: integer("players_failed").notNull().default(0),
  error: text("error"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const hypixelCache = pgTable(
  "hypixel_cache",
  {
    id: text("id").primaryKey(),
    cacheKey: text("cache_key").notNull().unique(),
    data: jsonb("data").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("hypixel_cache_expires_idx").on(table.expiresAt)],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  groupMemberships: many(groupMembers),
  linkedPlayers: many(linkedPlayers),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(user, { fields: [groups.ownerId], references: [user.id] }),
  members: many(groupMembers),
  linkedPlayers: many(linkedPlayers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(user, { fields: [groupMembers.userId], references: [user.id] }),
}));

export const linkedPlayersRelations = relations(linkedPlayers, ({ one }) => ({
  group: one(groups, { fields: [linkedPlayers.groupId], references: [groups.id] }),
  user: one(user, { fields: [linkedPlayers.userId], references: [user.id] }),
  snapshot: one(profileSnapshots, {
    fields: [linkedPlayers.id],
    references: [profileSnapshots.linkedPlayerId],
  }),
}));

export const profileSnapshotsRelations = relations(profileSnapshots, ({ one }) => ({
  linkedPlayer: one(linkedPlayers, {
    fields: [profileSnapshots.linkedPlayerId],
    references: [linkedPlayers.id],
  }),
}));

export const snapshotHistoryRelations = relations(snapshotHistory, ({ one }) => ({
  linkedPlayer: one(linkedPlayers, {
    fields: [snapshotHistory.linkedPlayerId],
    references: [linkedPlayers.id],
  }),
}));
