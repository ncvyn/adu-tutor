CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notification` (`user_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `preferred_subject` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `availability` text DEFAULT '';