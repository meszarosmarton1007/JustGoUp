using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JustGoUp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddImagePublicURLToWallsaAndRoutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "imageUrl",
                table: "ClimbingWalls",
                newName: "ImageUrl");

            migrationBuilder.AddColumn<string>(
                name: "ImagePublicId",
                table: "ClimbingWalls",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImagePublicId",
                table: "ClimbingRoutes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePublicId",
                table: "ClimbingWalls");

            migrationBuilder.DropColumn(
                name: "ImagePublicId",
                table: "ClimbingRoutes");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "ClimbingWalls",
                newName: "imageUrl");
        }
    }
}
