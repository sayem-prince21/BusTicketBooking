using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BusTicketBooking.Models;
using Microsoft.AspNetCore.Identity;

namespace BusTicketBooking.Services
{
    public static class AdminSeeder
    {
        public static async Task CreateAdminAsync(
            IServiceProvider serviceProvider,
            string adminEmail)
        {
            using var scope = serviceProvider.CreateScope();

            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();

            var roleManager = scope.ServiceProvider
                .GetRequiredService<RoleManager<IdentityRole>>();

            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                var createRoleResult = await roleManager.CreateAsync(
                    new IdentityRole("Admin"));

                if (!createRoleResult.Succeeded)
                {
                    var errors = string.Join(
                        "; ",
                        createRoleResult.Errors.Select(e => e.Description));

                    throw new InvalidOperationException(
                        $"Could not create the Admin role: {errors}");
                }
            }

            var user = await userManager.FindByEmailAsync(adminEmail);

            if (user == null)
            {
                throw new InvalidOperationException(
                    $"Admin account '{adminEmail}' was not found. Register this account first.");
            }

            if (!await userManager.IsInRoleAsync(user, "Admin"))
            {
                var result = await userManager.AddToRoleAsync(
                    user, "Admin");

                if (!result.Succeeded)
                {
                    var errors = string.Join(
                        "; ", result.Errors.Select(e => e.Description));

                    throw new InvalidOperationException(
                        $"Could not assign Admin role: {errors}");
                }
            }
        }
    }
}
