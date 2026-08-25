using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using JustGoUp.Server.Services;

namespace JustGoUp.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Adatbázis kapcsolati szöveg beolvasása az appsettings.json fájlból
            var connectionString = builder.Configuration.GetConnectionString("AppDbContext")
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found in appsettings.");

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString));

            // JWT BEARER HITELESÍTÉSI SÉMA REGISZTRÁCIÓJA
            // Beolvassuk a biztonsági kulcsot az appsettings.json-ből
            var jwtKey = builder.Configuration["Jwt:Key"] ?? "JustGoUpClimbingAppSuperSecretKey2026SecureTokensXMMM!!";
            var key = Encoding.UTF8.GetBytes(jwtKey);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false, // Fejlesztői környezetben kikapcsoljuk az Issuer és Audience ellenőrzést
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero // Azonnali token-lejárati ellenőrzés a pontosságért
                };
            });

            builder.Services.AddScoped<IPhotoService, PhotoService>();

            // Alapértelmezett szolgáltatások (API Kontrollerek)
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                });

            // .NET 10 beépített OpenAPI dokumentáció generálója (Swagger utódja)
            builder.Services.AddOpenApi();

            var app = builder.Build();

            // Angular SPA statikus fájljainak kiszolgálása
            app.UseDefaultFiles();
            app.MapStaticAssets();

            // OpenAPI végpont bekapcsolása fejlesztői környezetben
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseHttpsRedirection();

            // A biztonsági middleware-ek helyes sorrendje (Előbb ellenőrizzük ki vagy, utána hogy mit szabad)
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Ha az Angular útvonalakat hívják, a .NET az index.html-re irányít át
            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
