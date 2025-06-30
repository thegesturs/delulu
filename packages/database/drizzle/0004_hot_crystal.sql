CREATE TABLE "post_social_providers" (
	"post_id" varchar(191) NOT NULL,
	"social_provider_id" varchar(191) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_social_providers_post_id_social_provider_id_pk" PRIMARY KEY("post_id","social_provider_id")
);
--> statement-breakpoint
ALTER TABLE "post_social_providers" ADD CONSTRAINT "post_social_providers_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_social_providers" ADD CONSTRAINT "post_social_providers_social_provider_id_social_providers_id_fk" FOREIGN KEY ("social_provider_id") REFERENCES "public"."social_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_social_providers_post_id_idx" ON "post_social_providers" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_social_providers_provider_id_idx" ON "post_social_providers" USING btree ("social_provider_id");