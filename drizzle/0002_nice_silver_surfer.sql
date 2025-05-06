CREATE TABLE IF NOT EXISTS "t3_better_auth_log" (
	"id" text PRIMARY KEY NOT NULL,
	"app_version" text NOT NULL,
	"timestamp" text NOT NULL,
	"os" text NOT NULL,
	"os_version" text NOT NULL,
	"device_model" text NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "t3_better_auth_post";