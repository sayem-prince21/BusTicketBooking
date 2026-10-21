using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BusTicketBooking.DTOs;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/customer/profile")]
    [Authorize(Roles = "Customer")]
    public class CustomerProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public CustomerProfileController(
            UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        // GET: api/customer/profile
        [HttpGet]
        public async Task<IActionResult> GetMyProfile()
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Customer account not found."
                });
            }

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber
            });
        }

        // PUT: api/customer/profile
        [HttpPut]
        public async Task<IActionResult> UpdateMyProfile(
            [FromBody] UpdateCustomerDto dto)
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Customer account not found."
                });
            }

            var newEmail = dto.Email.Trim();

            var existingUser =
                await _userManager.FindByEmailAsync(newEmail);

            if (existingUser != null &&
                existingUser.Id != user.Id)
            {
                return Conflict(new
                {
                    message = "This email is already registered."
                });
            }

            var oldEmail = user.Email;

            user.FullName = dto.FullName.Trim();
            user.PhoneNumber =
                string.IsNullOrWhiteSpace(dto.PhoneNumber)
                    ? null
                    : dto.PhoneNumber.Trim();

            if (!string.Equals(
                oldEmail,
                newEmail,
                StringComparison.OrdinalIgnoreCase))
            {
                user.Email = newEmail;

                // Require email re-confirmation after changing email.
                user.EmailConfirmed = false;

                if (string.Equals(
                    user.UserName,
                    oldEmail,
                    StringComparison.OrdinalIgnoreCase))
                {
                    user.UserName = newEmail;
                }
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to update profile.",
                    errors = result.Errors.Select(
                        e => e.Description)
                });
            }

            return Ok(new
            {
                message = "Profile updated successfully.",
                profile = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber
                }
            });
        }

        // PUT: api/customer/profile/change-password
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangeMyPassword(
            [FromBody] ChangeMyPasswordDto dto)
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Customer account not found."
                });
            }

            var result = await _userManager.ChangePasswordAsync(
                user,
                dto.CurrentPassword,
                dto.NewPassword
            );

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Password change failed.",
                    errors = result.Errors.Select(
                        e => e.Description)
                });
            }

            return Ok(new
            {
                message = "Password changed successfully."
            });
        }
    }
}