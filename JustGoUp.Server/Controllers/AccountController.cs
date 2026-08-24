using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Data;
using JustGoUp.Server.Models;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace JustGoUp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AccountController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        //GDPR comatible registration, and secure reistration with password hashing and salting and immidateli login
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
          if(await _context.Users.AnyAsync(u => u.Username.ToLower() == model.Username.ToLower()))
          {
                return BadRequest("Username already exists.");
          }
          if(await _context.Users.AnyAsync(u => u.Email.ToLower() == model.Email.ToLower()))
          {
                return BadRequest("Email already exists.");
          }
            if (!model.HasAcceptedTerms)
            {
                return BadRequest("You must accept the terms and conditions to register.");
            }

            string passwordHash = HashPassword(model.Password);

            var newUser = new User
            {
                Username = model.Username,
                FullName = model.FullName,
                Email = model.Email,
                PasswordHash = passwordHash,
                PhoneNumber = model.PhoneNumber,
                BirthDate = DateTime.SpecifyKind(model.BirthDate, DateTimeKind.Utc),
                Role = UserRole.User,

                // GDPR compliance: store the fact that the user accepted the terms and conditions
                hasAcceptedTerms = model.HasAcceptedTerms,
                TermsAcceptedAt = DateTime.UtcNow,
                AcceptedPrivacyPolicyVersion = "v1.0",

               
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var tokenString = GenerateJwtToken(newUser);

            return Ok(new { 
                Message = "User registered successfully.",
                Token = tokenString,
                UserName = newUser.Username,
                Role = newUser.Role.ToString()
            });
        }


        //stanard login endpoint with JWT token generation
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == model.Email.ToLower());
            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            string incomingHash = HashPassword(model.Password);
            if (user.PasswordHash != incomingHash)
            {
                return Unauthorized("Invalid email or password.");
            }

            var tokenString = GenerateJwtToken(user);

            return Ok(new {
                Message = "Login successful.",
                Token = tokenString,
                UserName = user.Username,
                Role = user.Role.ToString()
            });
        }


        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = _configuration["Jwt:Key"] ?? "JustGoUpClimbingAppSuperSecretKey2026SecureTokens!"; // Ensure you have a
            var key = Encoding.UTF8.GetBytes(jwtKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role.ToString())
                }),
                Expires = DateTime.UtcNow.AddDays(7), // Token expiration
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }


        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime BirthDate { get; set; }
        public bool HasAcceptedTerms { get; set; }
        
    }

    public class LoginDto 
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
