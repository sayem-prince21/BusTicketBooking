
using BusTicketBooking.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace BusTicketBooking.Data
{
    public class ApplicationDbContext
        : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Bus> Buses => Set<Bus>();

        public DbSet<Seat> Seats => Set<Seat>();

        public DbSet<Booking> Bookings => Set<Booking>();

        public DbSet<Ticket> Tickets => Set<Ticket>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Bus>()
                .HasMany(b => b.Seats)
                .WithOne(s => s.Bus)
                .HasForeignKey(s => s.BusId)
                .OnDelete(DeleteBehavior.Cascade);

            // Prevent duplicate seat numbers within the same bus
            modelBuilder.Entity<Seat>()
                .HasIndex(s => new { s.BusId, s.SeatNumber })
                .IsUnique();


            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Bus)
                .WithMany()
                .HasForeignKey(b => b.BusId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Seat)
                .WithMany()
                .HasForeignKey(b => b.SeatId)
                .OnDelete(DeleteBehavior.Restrict);

            // NEW: Booking-এর সঙ্গে ApplicationUser-এর relationship
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .Property(b => b.TotalPrice)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Booking)
                .WithMany()
                .HasForeignKey(t => t.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ticket>()
                .Property(t => t.TicketPrice)
                .HasPrecision(10, 2);
        }
    }
}
