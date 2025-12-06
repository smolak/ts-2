ALTER TABLE "users_urls" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "users_urls_id_index" ON "users_urls" USING btree ("id") WHERE is_deleted = false;