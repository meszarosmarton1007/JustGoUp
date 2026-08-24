using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Data;

namespace JustGoUp.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            
            var connectionString = builder.Configuration.GetConnectionString("AppDbContext")
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found in appsettings.");

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString));

           
            builder.Services.AddControllers();

            
            builder.Services.AddOpenApi();

            var app = builder.Build();

            
            app.UseDefaultFiles();
            app.MapStaticAssets();

            
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseHttpsRedirection();

            
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            
            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
