using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cargo.API.Migrations
{
    /// <inheritdoc />
    public partial class AddArrivalDateToShipments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ArrivalDate",
                table: "Shipments",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArrivalDate",
                table: "Shipments");
        }
    }
}
