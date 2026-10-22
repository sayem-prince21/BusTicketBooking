using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusTicketBooking.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestBookingContactDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PassengerEmail",
                table: "Bookings",
                type: "varchar(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PassengerPhone",
                table: "Bookings",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PassengerEmail",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PassengerPhone",
                table: "Bookings");
        }
    }
}
