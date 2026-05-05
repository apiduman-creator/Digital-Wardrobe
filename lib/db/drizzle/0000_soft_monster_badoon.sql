CREATE TABLE `closet_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`color` text NOT NULL,
	`brand` text,
	`season` text NOT NULL,
	`occasion` text NOT NULL,
	`image_uri` text,
	`notes` text,
	`favorite` integer DEFAULT false NOT NULL,
	`wear_count` integer DEFAULT 0 NOT NULL,
	`last_worn` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outfits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`item_ids` text NOT NULL,
	`occasion` text NOT NULL,
	`season` text NOT NULL,
	`notes` text,
	`favorite` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
