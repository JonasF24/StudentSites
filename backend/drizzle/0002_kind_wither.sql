DROP INDEX `date_idx` ON `analyticsSnapshots`;--> statement-breakpoint
DROP INDEX `email_idx` ON `customers`;--> statement-breakpoint
DROP INDEX `orderId_idx` ON `emailLogs`;--> statement-breakpoint
DROP INDEX `customerId_idx` ON `emailLogs`;--> statement-breakpoint
DROP INDEX `status_idx` ON `emailLogs`;--> statement-breakpoint
DROP INDEX `orderId_idx` ON `files`;--> statement-breakpoint
DROP INDEX `customerId_idx` ON `orders`;--> statement-breakpoint
DROP INDEX `status_idx` ON `orders`;--> statement-breakpoint
DROP INDEX `paymentStatus_idx` ON `orders`;--> statement-breakpoint
DROP INDEX `orderId_idx` ON `orders`;--> statement-breakpoint
DROP INDEX `orderId_idx` ON `payments`;--> statement-breakpoint
DROP INDEX `stripePaymentIntentId_idx` ON `payments`;--> statement-breakpoint
DROP INDEX `status_idx` ON `payments`;--> statement-breakpoint
DROP INDEX `orderId_idx` ON `revisions`;--> statement-breakpoint
DROP INDEX `status_idx` ON `revisions`;--> statement-breakpoint
ALTER TABLE `revisions` ADD CONSTRAINT `revisions_orderId_revisionNumber_unique` UNIQUE(`orderId`,`revisionNumber`);--> statement-breakpoint
ALTER TABLE `revisions` ADD CONSTRAINT `revisionNumber` CHECK (revisionNumber >= 1 AND revisionNumber <= 5);--> statement-breakpoint
ALTER TABLE `emailLogs` ADD CONSTRAINT `emailLogs_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD CONSTRAINT `emailLogs_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revisions` ADD CONSTRAINT `revisions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `analyticsSnapshots_date_idx` ON `analyticsSnapshots` (`date`);--> statement-breakpoint
CREATE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `emailLogs_orderId_idx` ON `emailLogs` (`orderId`);--> statement-breakpoint
CREATE INDEX `emailLogs_customerId_idx` ON `emailLogs` (`customerId`);--> statement-breakpoint
CREATE INDEX `emailLogs_status_idx` ON `emailLogs` (`status`);--> statement-breakpoint
CREATE INDEX `files_orderId_idx` ON `files` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_customerId_idx` ON `orders` (`customerId`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_paymentStatus_idx` ON `orders` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `orders_orderId_idx` ON `orders` (`orderId`);--> statement-breakpoint
CREATE INDEX `payments_orderId_idx` ON `payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `payments_stripePaymentIntentId_idx` ON `payments` (`stripePaymentIntentId`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `revisions_orderId_idx` ON `revisions` (`orderId`);--> statement-breakpoint
CREATE INDEX `revisions_status_idx` ON `revisions` (`status`);