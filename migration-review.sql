START TRANSACTION;
ALTER TABLE `Seats` MODIFY `SeatNumber` varchar(255) NOT NULL;

CREATE UNIQUE INDEX `IX_Seats_BusId_SeatNumber` ON `Seats` (`BusId`, `SeatNumber`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261021141516_AddUniqueSeatNumberPerBus', '10.0.9');

COMMIT;

