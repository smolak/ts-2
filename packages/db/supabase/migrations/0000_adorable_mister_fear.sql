CREATE TABLE "categories" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"user_id" char(27) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"name" varchar NOT NULL,
	"urls_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" char(27) PRIMARY KEY NOT NULL,
	"user_id" char(27) NOT NULL,
	"user_url_id" char(31) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" char(27) NOT NULL,
	"following_id" char(27) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "interaction_types" (
	"id" smallint PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "interaction_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "url_hashes" (
	"compound_hash" char(64) PRIMARY KEY NOT NULL,
	"url_hash" char(40) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "url_hashes_compound_hashes_counts" (
	"url_hash" char(40) PRIMARY KEY NOT NULL,
	"compound_hashes_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "urls" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"url" text NOT NULL,
	"compound_hash" char(64) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "urls_compound_hash_unique" UNIQUE("compound_hash")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" char(30) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" char(27) NOT NULL,
	"username" varchar NOT NULL,
	"username_normalized" varchar NOT NULL,
	"image_url" text,
	"following_count" integer DEFAULT 0 NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"liked_count" bigint DEFAULT 0 NOT NULL,
	"urls_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "user_profiles_username_normalized_unique" UNIQUE("username_normalized")
);
--> statement-breakpoint
CREATE TABLE "user_urls_categories" (
	"user_url_id" char(31) NOT NULL,
	"category_id" char(26) NOT NULL,
	"category_order" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_urls_categories_user_url_id_category_id_pk" PRIMARY KEY("user_url_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" char(27) PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"api_key" char(30),
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "users_urls" (
	"id" char(31) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" char(27) NOT NULL,
	"url_id" char(26) NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_urls_interactions" (
	"user_url_id" char(31) NOT NULL,
	"user_id" char(27) NOT NULL,
	"interaction_type_id" smallint NOT NULL,
	CONSTRAINT "users_urls_interactions_user_url_id_user_id_interaction_type_id_pk" PRIMARY KEY("user_url_id","user_id","interaction_type_id")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_hashes" ADD CONSTRAINT "url_hashes_compound_hash_urls_compound_hash_fk" FOREIGN KEY ("compound_hash") REFERENCES "public"."urls"("compound_hash") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_urls_categories" ADD CONSTRAINT "user_urls_categories_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_urls_categories" ADD CONSTRAINT "user_urls_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls" ADD CONSTRAINT "users_urls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls" ADD CONSTRAINT "users_urls_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls_interactions" ADD CONSTRAINT "users_urls_interactions_user_url_id_users_urls_id_fk" FOREIGN KEY ("user_url_id") REFERENCES "public"."users_urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls_interactions" ADD CONSTRAINT "users_urls_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_urls_interactions" ADD CONSTRAINT "users_urls_interactions_interaction_type_id_interaction_types_id_fk" FOREIGN KEY ("interaction_type_id") REFERENCES "public"."interaction_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_id_index" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feeds_user_id_created_at_index" ON "feeds" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "feeds_user_url_id_index" ON "feeds" USING btree ("user_url_id");--> statement-breakpoint
CREATE INDEX "follows_follower_id_index" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "follows_following_id_index" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "url_hashes_url_hash_index" ON "url_hashes" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "user_urls_categories_user_url_id_index" ON "user_urls_categories" USING btree ("user_url_id");--> statement-breakpoint
CREATE INDEX "user_urls_categories_category_id_index" ON "user_urls_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "users_api_key_index" ON "users" USING btree ("api_key");--> statement-breakpoint
CREATE INDEX "users_urls_user_id_index" ON "users_urls" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_urls_url_id_index" ON "users_urls" USING btree ("url_id");--> statement-breakpoint
CREATE INDEX "users_urls_interactions_user_url_id_user_id_index" ON "users_urls_interactions" USING btree ("user_url_id","user_id") WHERE interaction_type_id = 1;