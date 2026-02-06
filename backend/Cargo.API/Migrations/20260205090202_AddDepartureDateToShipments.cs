using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cargo.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartureDateToShipments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DepartureDate",
                table: "Shipments",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DepartureDate",
                table: "Shipments");
        }
    }
}
