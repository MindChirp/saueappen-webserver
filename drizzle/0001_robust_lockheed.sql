ALTER TABLE "t3_better_auth_account" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "t3_better_auth_session" RENAME TO "session";--> statement-breakpoint
ALTER TABLE "t3_better_auth_user" RENAME TO "user";--> statement-breakpoint
ALTER TABLE "t3_better_auth_verification" RENAME TO "verification";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "t3_better_auth_session_token_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "t3_better_auth_user_email_unique";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "t3_better_auth_account_user_id_t3_better_auth_user_id_fk";
--> statement-breakpoint
ALTER TABLE "t3_better_auth_post" DROP CONSTRAINT "t3_better_auth_post_created_by_t3_better_auth_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "t3_better_auth_session_user_id_t3_better_auth_user_id_fk";
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "offline_expiry" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "t3_better_auth_post" ADD CONSTRAINT "t3_better_auth_post_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "is_premium";--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_token_unique" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");