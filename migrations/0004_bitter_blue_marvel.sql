CREATE TABLE `badge` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`svg_filename` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `badge_slug_unique` ON `badge` (`slug`);--> statement-breakpoint
CREATE TABLE `user_badge` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`awarded_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badge_id`) REFERENCES `badge`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_badge_unique_idx` ON `user_badge` (`user_id`,`badge_id`);--> statement-breakpoint
CREATE INDEX `user_badge_userId_idx` ON `user_badge` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_badge_badgeId_idx` ON `user_badge` (`badge_id`);