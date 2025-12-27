CREATE TABLE "deck_urls_tags" (
	"deck_id" char(27) NOT NULL,
	"user_url_id" char(31) NOT NULL,
	"tag_id" char(26) NOT NULL,
	"tag_order" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "deck_urls_tags_deck_id_user_url_id_tag_id_pk" PRIMARY KEY("deck_id","user_url_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "user_urls_tags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_urls_tags" CASCADE;--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "tags_user_id_name_unique";--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "tags_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "tags_user_id_index";--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "deck_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "name" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "decks" ADD COLUMN "scheduled_for_deletion_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "deck_id" char(27) NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "display_name" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "deck_urls_tags" ADD CONSTRAINT "deck_urls_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_urls_tags_deck_id_user_url_id_index" ON "deck_urls_tags" USING btree ("deck_id","user_url_id");--> statement-breakpoint
CREATE INDEX "deck_urls_tags_tag_id_index" ON "deck_urls_tags" USING btree ("tag_id");--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "decks_id_index" ON "decks" USING btree ("id") WHERE scheduled_for_deletion_at IS NULL;--> statement-breakpoint
CREATE INDEX "tags_deck_id_index" ON "tags" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "tags_name_index" ON "tags" USING btree ("name");--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_deck_id_name_unique" UNIQUE("deck_id","name");