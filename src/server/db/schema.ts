// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTable, text } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

export const log = pgTable("log", {
  id: text("id").primaryKey(),
  appVersion: text("app_version").notNull(),
  timestamp: text("timestamp").notNull(),
  os: text("os").notNull(),
  osVersion: text("os_version").notNull(),
  deviceModel: text("device_model").notNull(),
  fingerprint: text("fingerprint").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  message: text("message").notNull(),
});

export * from "./auth-schema";
