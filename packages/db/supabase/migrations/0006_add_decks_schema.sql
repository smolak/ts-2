CREATE TYPE "public"."user_plan" AS ENUM('free', 'medium', 'pro');--> statement-breakpoint
CREATE TABLE "deck_follows" (
	"deck_id" char(27) NOT NULL,
	"follower_id" char(27) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "deck_follows_deck_id_follower_id_pk" PRIMARY KEY("deck_id","follower_id")
);
--> statement-breakpoint
CREATE TABLE "deck_urls" (
	"deck_id" char(27) NOT NULL,
	"user_url_id" char(31) NOT NULL,
	"added_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "deck_urls_deck_id_user_url_id_pk" PRIMARY KEY("deck_id","user_url_id")
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" char(27) PRIMARY KEY NOT NULL,
	"user_id" char(27) NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"urls_count" integer DEFAULT 0 NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "decks_user_id_slug_unique" UNIQUE("user_id","slug")
);
--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "deck_id" char(27) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" "user_plan" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deck_follows" ADD CONSTRAINT "deck_follows_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_follows" ADD CONSTRAINT "deck_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_urls" ADD CONSTRAINT "deck_urls_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_urls" ADD CONSTRAINT "deck_urls_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_follows_follower_id_index" ON "deck_follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "deck_follows_deck_id_index" ON "deck_follows" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "deck_urls_user_url_id_index" ON "deck_urls" USING btree ("user_url_id");--> statement-breakpoint
CREATE INDEX "decks_user_id_index" ON "decks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "decks_is_public_index" ON "decks" USING btree ("is_public") WHERE is_public = true;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feeds_user_id_deck_id_index" ON "feeds" USING btree ("user_id","deck_id");