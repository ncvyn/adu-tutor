ALTER TABLE `user` ADD `preferred_subjects` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `xp`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `preferred_subject`;