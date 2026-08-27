using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JustGoUp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddDescriptionToRoutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ClimbingRoutes",
                type: "character varying(9000)",
                maxLength: 9000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "ClimbingRoutes");
        }
    }
}
