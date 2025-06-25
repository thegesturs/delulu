ALTER TABLE "social_providers" DROP CONSTRAINT "social_providers_profile_id_organization_id_unique";--> statement-breakpoint
ALTER TABLE "social_providers" DROP CONSTRAINT "social_providers_user_id_profile_id_unique";--> statement-breakpoint
ALTER TABLE "social_providers" DROP COLUMN "client_id";--> statement-breakpoint
ALTER TABLE "social_providers" DROP COLUMN "client_secret";--> statement-breakpoint
ALTER TABLE "social_providers" ADD CONSTRAINT "social_providers_profile_id_organization_id_user_id_unique" UNIQUE("profile_id","organization_id","user_id");