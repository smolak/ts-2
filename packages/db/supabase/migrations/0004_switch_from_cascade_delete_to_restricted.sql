ALTER TABLE "feeds" DROP CONSTRAINT "feeds_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feeds" DROP CONSTRAINT "feeds_user_url_id_users_urls_id_fk";
--> statement-breakpoint
ALTER TABLE "follows" DROP CONSTRAINT "follows_follower_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "follows" DROP CONSTRAINT "follows_following_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "url_hashes" DROP CONSTRAINT "url_hashes_compound_hash_urls_compound_hash_fk";
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_urls_tags" DROP CONSTRAINT "user_urls_tags_user_url_id_users_urls_id_fk";
--> statement-breakpoint
ALTER TABLE "user_urls_tags" DROP CONSTRAINT "user_urls_tags_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "users_urls" DROP CONSTRAINT "users_urls_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_urls" DROP CONSTRAINT "users_urls_url_id_urls_id_fk";
--> statement-breakpoint
ALTER TABLE "users_urls_interactions" DROP CONSTRAINT "users_urls_interactions_user_url_id_users_urls_id_fk";
--> statement-breakpoint
ALTER TABLE "users_urls_interactions" DROP CONSTRAINT "users_urls_interactions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_hashes" ADD CONSTRAINT "url_hashes_compound_hash_urls_compound_hash_fk" FOREIGN KEY ("compound_hash") REFERENCES "public"."urls"("compound_hash") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_urls_tags" ADD CONSTRAINT "user_urls_tags_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_urls_tags" ADD CONSTRAINT "user_urls_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls" ADD CONSTRAINT "users_urls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls" ADD CONSTRAINT "users_urls_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls_interactions" ADD CONSTRAINT "users_urls_interactions_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls_interactions" ADD CONSTRAINT "users_urls_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;