ALTER TABLE "categories" RENAME TO "tags";--> statement-breakpoint
ALTER TABLE "user_urls_categories" RENAME TO "user_urls_tags";--> statement-breakpoint
ALTER TABLE "user_urls_tags" RENAME COLUMN "category_id" TO "tag_id";--> statement-breakpoint
ALTER TABLE "user_urls_tags" RENAME COLUMN "category_order" TO "tag_order";--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "categories_user_id_name_unique";--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "categories_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_urls_tags" DROP CONSTRAINT "user_urls_categories_user_url_id_users_urls_id_fk";
--> statement-breakpoint
ALTER TABLE "user_urls_tags" DROP CONSTRAINT "user_urls_categories_category_id_categories_id_fk";
--> statement-breakpoint
DROP INDEX "categories_user_id_index";--> statement-breakpoint
DROP INDEX "user_urls_categories_user_url_id_index";--> statement-breakpoint
DROP INDEX "user_urls_categories_category_id_index";--> statement-breakpoint
ALTER TABLE "user_urls_tags" DROP CONSTRAINT "user_urls_categories_user_url_id_category_id_pk";--> statement-breakpoint
ALTER TABLE "user_urls_tags" ADD CONSTRAINT "user_urls_tags_user_url_id_tag_id_pk" PRIMARY KEY("user_url_id","tag_id");--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_urls_tags" ADD CONSTRAINT "user_urls_tags_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_urls_tags" ADD CONSTRAINT "user_urls_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tags_user_id_index" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_urls_tags_user_url_id_index" ON "user_urls_tags" USING btree ("user_url_id");--> statement-breakpoint
CREATE INDEX "user_urls_tags_tag_id_index" ON "user_urls_tags" USING btree ("tag_id");--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_name_unique" UNIQUE("user_id","name");