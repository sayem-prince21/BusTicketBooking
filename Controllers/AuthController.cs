
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;

using BusTicketBooking.DTOs;
using BusTicketBooking.Models;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;

namespace BusTicketBooking.Controllers
{
    // Enables API-specific behavior and automatic model validation.
    [ApiController]

    // Sets the base route to /api/auth.
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // Manages user creation, lookup, and password verification.
        private readonly UserManager<ApplicationUser> _userManager;

        // Provides JWT configuration values.
        private readonly IConfiguration _configuration;

        // Inject required services through dependency injection.
        public AuthController(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        // Registers a new user at POST /api/auth/register.
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            RegisterRequest request)
        {
            // Normalize the email address.
            var email = request.Email.Trim();

            // Check whether the email is already registered.
            var existingEmail = await _userManager
                .FindByEmailAsync(email);

            if (existingEmail != null)
            {
                return BadRequest(new
                {
                    message = "Email is already registered."
                });
            }

            // Normalize the phone number.
            var phoneNumber = request.PhoneNumber.Trim();

            // Check whether the phone number is already in use.
            var existingPhone = _userManager.Users
                .Any(u => u.PhoneNumber == phoneNumber);

            if (existingPhone)
            {
                return BadRequest(new
                {
                    message = "Phone number is already registered."
                });
            }

            // Create the new user account.
            var user = new ApplicationUser
            {
                // Use email as the Identity username.
                UserName = email,

                // Store the user's email address.
                Email = email,

                // Store the phone number for phone-based login.
                PhoneNumber = phoneNumber,

                // Store the user's full name.
                FullName = request.FullName.Trim()
            };

            // Identity securely hashes the password before storing it.
            var result = await _userManager
                .CreateAsync(user, request.Password);

            // Return validation errors if registration fails.
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    errors = result.Errors.Select(
                        e => e.Description)
                });
            }

            var roleResult = await _userManager.AddToRoleAsync(
                user,
                "Customer");

            if (!roleResult.Succeeded)
            {
                var deleteResult = await _userManager.DeleteAsync(user);
                var errors = string.Join(
                    "; ", roleResult.Errors.Select(e => e.Description));

                if (!deleteResult.Succeeded)
                {
                    var cleanupErrors = string.Join(
                        "; ", deleteResult.Errors.Select(e => e.Description));

                    throw new InvalidOperationException(
                        $"Could not assign the Customer role ({errors}) or remove the incomplete account ({cleanupErrors}).");
                }

                throw new InvalidOperationException(
                    $"Could not assign the Customer role: {errors}");
            }

            // Return account details without exposing the password.
            return Ok(new
            {
                message = "Registration successful.",
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber
            });
        }

        // Logs in using either email or phone number.
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            LoginRequest request)
        {
            // Determine which login identifier was supplied.
            bool hasEmail =
                !string.IsNullOrWhiteSpace(request.Email);

            bool hasPhone =
                !string.IsNullOrWhiteSpace(request.PhoneNumber);

            // Require exactly one identifier.
            if (hasEmail == hasPhone)
            {
                return BadRequest(new
                {
                    message =
                        "Provide either email or phone number, not both."
                });
            }

            ApplicationUser? user;

            // Find the account using email.
            if (hasEmail)
            {
                user = await _userManager.FindByEmailAsync(
                    request.Email!.Trim());
            }
            else
            {
                // Find the account using phone number.
                var phoneNumber = request.PhoneNumber!.Trim();

                user = _userManager.Users
                    .FirstOrDefault(
                        u => u.PhoneNumber == phoneNumber);
            }

            // Return a generic error if the account does not exist.
            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid login credentials."
                });
            }

            // Verify the submitted password against Identity's password hash.
            bool passwordValid = await _userManager
                .CheckPasswordAsync(user, request.Password);

            if (!passwordValid)
            {
                return Unauthorized(new
                {
                    message = "Invalid login credentials."
                });
            }

            // Read JWT settings from configuration or User Secrets.
            var key = _configuration["Jwt:Key"];
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            // Ensure all required JWT settings are configured.
            if (string.IsNullOrWhiteSpace(key) ||
                string.IsNullOrWhiteSpace(issuer) ||
                string.IsNullOrWhiteSpace(audience))
            {
                return Problem(
                    title: "Authentication configuration is incomplete.",
                    statusCode: 500);
            }


            // Create claims identifying the authenticated user.
            var claims = new List<Claim>
            {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.Id),

            new Claim(
                ClaimTypes.Name,
                user.UserName ?? string.Empty),

            new Claim(
                ClaimTypes.Email,
                user.Email ?? string.Empty)
             };

            // Get all roles assigned to this user.
            var userRoles = await _userManager.GetRolesAsync(user);

            // Add each role to the JWT claims.
            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }


            // Set the token expiration time to one hour from now.
            var expiresAt = DateTime.UtcNow.AddHours(1);

            // Create the symmetric signing key from the secret.
            var signingKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key));

            // Specify the JWT signing algorithm.
            var credentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

            // Generate a signed JWT token.
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            // Convert the JWT object into a token string.
            var tokenString = new JwtSecurityTokenHandler()
                .WriteToken(token);

            // Return the token and basic user information.
            return Ok(new AuthResponseDto
            {
                Token = tokenString,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                ExpiresAt = expiresAt
            });
        }

        // Returns the current user's profile.
        // Requires a valid JWT access token.
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            // Read the authenticated user's ID from the JWT claims.
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            // Reject the request if the user ID is unavailable.
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Retrieve the authenticated user from the database.
            var user = await _userManager.FindByIdAsync(userId);

            // Handle the case where the account no longer exists.
            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            // Return the current user's basic information.
            return Ok(new
            {
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber
            });
        }
    }
}
