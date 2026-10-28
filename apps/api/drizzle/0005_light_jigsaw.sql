CREATE TABLE "branch_product_weight_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_product_id" uuid NOT NULL,
	"weight_grams" integer NOT NULL,
	"promotional_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branch_product_weight_offers_values_check" CHECK ("branch_product_weight_offers"."weight_grams" > 0 AND "branch_product_weight_offers"."promotional_price" > 0)
);
--> statement-breakpoint
ALTER TABLE "branch_product_weight_offers" ADD CONSTRAINT "branch_product_weight_offers_branch_product_id_branch_products_id_fk" FOREIGN KEY ("branch_product_id") REFERENCES "public"."branch_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_branch_product_weight_offers_unique" ON "branch_product_weight_offers" USING btree ("branch_product_id","weight_grams");--> statement-breakpoint
CREATE INDEX "idx_branch_product_weight_offers_branch_product_id" ON "branch_product_weight_offers" USING btree ("branch_product_id");