using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusTicketBooking.Migrations
{
    /// <inheritdoc />
    public partial class AddBusRouteAndSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DepartureTime",
                table: "Buses",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Destination",
                table: "Buses",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Buses",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<decimal>(
                name: "TicketPrice",
                table: "Buses",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DepartureTime",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "Destination",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "TicketPrice",
                table: "Buses");
        }
    }
}
