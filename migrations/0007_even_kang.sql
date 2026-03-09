CREATE TABLE `info_card_vote` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `info_card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `info_card_vote_card_user_idx` ON `info_card_vote` (`card_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `info_card_vote_card_idx` ON `info_card_vote` (`card_id`);--> statement-breakpoint
ALTER TABLE `info_card` ADD `subjects` text DEFAULT '["General"]' NOT NULL;