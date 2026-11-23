import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  ACTIVITY_STATUS_OPTIONS,
  LOL_PLAYER_OPTIONS,
  TRI_STATE_OPTIONS,
  WORK_STATUS_OPTIONS,
} from "@/types/game";

export const activityStatusEnum = pgEnum(
  "activity_status",
  ACTIVITY_STATUS_OPTIONS
);
export const workStatusEnum = pgEnum("work_status", WORK_STATUS_OPTIONS);
export const triStateEnum = pgEnum("tri_state_status", TRI_STATE_OPTIONS);
export const lolPlayerEnum = pgEnum("lol_player_status", LOL_PLAYER_OPTIONS);

export const friends = pgTable("friends", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  isActiveInPool: boolean("is_active_in_pool").notNull().default(true),
  entryYear: integer("entry_year").notNull(),
  activityStatus: activityStatusEnum("activity_status").notNull(),
  workStatus: workStatusEnum("work_status").notNull(),
  weightKg: integer("weight_kg").notNull(),
  heightCm: integer("height_cm").notNull(),
  neighborhood: text("neighborhood").notNull(),
  debtorStatus: triStateEnum("debtor_status").notNull(),
  badFriendStatus: triStateEnum("bad_friend_status").notNull(),
  lolPlayerStatus: lolPlayerEnum("lol_player_status").notNull(),
  isKuka: boolean("is_kuka").notNull(),
  gameKnowledge: triStateEnum("game_knowledge").notNull(),
  canDrive: boolean("can_drive").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dailyChallenges = pgTable(
  "daily_challenges",
  {
    id: serial("id").primaryKey(),
    dateKey: varchar("date_key", { length: 10 }).notNull(),
    mode: varchar("mode", { length: 32 }).notNull().default("classic"),
    friendId: uuid("friend_id")
      .notNull()
      .references(() => friends.id, { onDelete: "restrict" }),
    totalSolves: integer("total_solves").notNull().default(0),
    totalAttemptsOnSolve: integer("total_attempts_on_solve")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("daily_challenges_date_mode_idx").on(table.dateKey, table.mode),
  ]
);

export const gameSettings = pgTable("game_settings", {
  id: integer("id").primaryKey().default(1),
  title: text("title").notNull().default("Paladle"),
  subtitle: text("subtitle").notNull().default("¡Adiviná el amigo del día!"),
  themePreset: varchar("theme_preset", { length: 32 })
    .notNull()
    .default("pokedle"),
  retroFont: varchar("retro_font", { length: 32 })
    .notNull()
    .default("pixelify"),
  primaryColor: varchar("primary_color", { length: 16 })
    .notNull()
    .default("#facc15"),
  backgroundColor: varchar("background_color", { length: 16 })
    .notNull()
    .default("#0c4a6e"),
  surfaceColor: varchar("surface_color", { length: 16 })
    .notNull()
    .default("#172554"),
  accentColor: varchar("accent_color", { length: 16 })
    .notNull()
    .default("#38bdf8"),
  backgroundImageUrl: text("background_image_url"),
  logoImageUrl: text("logo_image_url"),
  maxAttempts: integer("max_attempts"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type FriendRow = typeof friends.$inferSelect;
export type NewFriendRow = typeof friends.$inferInsert;
export type DailyChallengeRow = typeof dailyChallenges.$inferSelect;
export type GameSettingsRow = typeof gameSettings.$inferSelect;
