ALTER TABLE `conversation` ADD `updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `conversation` SET `updated_at` = `created_at`;--> statement-breakpoint
CREATE INDEX `conversation_updated_idx` ON `conversation` (`updated_at`);
