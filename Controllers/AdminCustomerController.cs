
using BusTicketBooking.DTOs;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using BusTicketBooking.Data;
using Microsoft.EntityFrameworkCore;


namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/admin/customers")]
    [Authorize(Roles = "Admin")]
    public class AdminCustomerController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public AdminCustomerController(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET: api/admin/customers
        [HttpGet]
        public async Task<IActionResult> GetAllCustomers()
        {
            var customers =
                await _userManager.GetUsersInRoleAsync("Customer");

            var result = customers.Select(user =>
                new CustomerDetailsDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email ?? string.Empty,
                    PhoneNumber = user.PhoneNumber
                });

            return Ok(result);
        }

        // GET: api/admin/customers/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomerById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound(new
                {
                    message = "Customer not found."
                });

            var isCustomer =
                await _userManager.IsInRoleAsync(user, "Customer");

            if (!isCustomer)
                return NotFound(new
                {
                    message = "Customer not found."
                });

            var result = new CustomerDetailsDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber
            };

            return Ok(result);
        }


        // DELETE: api/admin/customers/{id}
        // DELETE: api/admin/customers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(string id)
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            var isCustomer =
                await _userManager.IsInRoleAsync(user, "Customer");

            if (!isCustomer)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            // Check whether this customer has bookings
            var hasBookings = await _context.Bookings
                .AnyAsync(booking => booking.UserId == id);

            if (hasBookings)
            {
                return Conflict(new
                {
                    message =
                        "This customer cannot be deleted because booking records exist. Preserve the booking history and deactivate the customer account instead."
                });
            }

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to delete customer.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new
            {
                message = "Customer deleted successfully.",
                customerId = id
            });
        }


        // PUT: api/admin/customers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(
            string id,
            [FromBody] UpdateCustomerDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            var isCustomer =
                await _userManager.IsInRoleAsync(user, "Customer");

            if (!isCustomer)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            // Check whether another account already uses this email
            var existingUser =
                await _userManager.FindByEmailAsync(dto.Email.Trim());

            if (existingUser != null && existingUser.Id != user.Id)
            {
                return Conflict(new
                {
                    message = "This email is already registered."
                });
            }

            var oldEmail = user.Email;
            var newEmail = dto.Email.Trim();

            user.FullName = dto.FullName.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber)
                ? null
                : dto.PhoneNumber.Trim();

            user.Email = newEmail;

            // Keep username synchronized if it previously matched the email
            if (string.Equals(
                user.UserName,
                oldEmail,
                StringComparison.OrdinalIgnoreCase))
            {
                user.UserName = newEmail;
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to update customer details.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new
            {
                message = "Customer details updated successfully.",
                customer = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber
                }
            });
        }

    }
}
