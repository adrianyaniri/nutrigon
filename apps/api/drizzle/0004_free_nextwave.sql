DROP INDEX "idx_products_code";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_products_code_unique" ON "products" USING btree ("code") WHERE "products"."code" IS NOT NULL;