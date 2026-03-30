CREATE TABLE `analyticsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(12,2) NOT NULL DEFAULT '0',
	`completedOrders` int NOT NULL DEFAULT 0,
	`pendingOrders` int NOT NULL DEFAULT 0,
	`simplePackageCount` int NOT NULL DEFAULT 0,
	`recommendedPackageCount` int NOT NULL DEFAULT 0,
	`premiumPackageCount` int NOT NULL DEFAULT 0,
	`conversionRate` decimal(5,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `analyticsSnapshots_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`phone` varchar(20),
	`schoolName` varchar(255),
	`grade` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`customerId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`emailType` enum('order_confirmation','payment_received','order_in_progress','order_delivered','revision_request','revision_completed') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100) DEFAULT 'application/zip',
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`packageType` enum('simple','recommended','premium') NOT NULL,
	`status` enum('pending_payment','in_progress','delivered','completed') NOT NULL DEFAULT 'pending_payment',
	`price` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`paymentStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`formData` longtext NOT NULL,
	`deliveryDate` timestamp,
	`completedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`stripePaymentIntentId` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`status` enum('pending','succeeded','failed','canceled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(100),
	`customerEmail` varchar(320),
	`stripeCustomerId` varchar(255),
	`receiptUrl` varchar(1024),
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`revisionNumber` int NOT NULL,
	`status` enum('requested','in_progress','completed') NOT NULL DEFAULT 'requested',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`description` longtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `date_idx` ON `analyticsSnapshots` (`date`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `emailLogs` (`orderId`);--> statement-breakpoint
CREATE INDEX `customerId_idx` ON `emailLogs` (`customerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `emailLogs` (`status`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `files` (`orderId`);--> statement-breakpoint
CREATE INDEX `customerId_idx` ON `orders` (`customerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `paymentStatus_idx` ON `orders` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `orders` (`orderId`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `stripePaymentIntentId_idx` ON `payments` (`stripePaymentIntentId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `revisions` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `revisions` (`status`);