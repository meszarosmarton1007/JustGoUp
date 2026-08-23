using JustGoUp.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace JustGoUp.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public AppDbContext() { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
           
        }

        // Database sets for each entity
        public DbSet<User> Users { get; set; }
        public DbSet<ClimbingGym> ClimbingGyms { get; set; }
        public DbSet<ClimbingWall> ClimbingWalls { get; set; }
        public DbSet<ClimbingRoute> ClimbingRoutes { get; set; }
        public DbSet<RouteComment> RouteComments { get; set; }
        public DbSet<AscentLog> AscentLogs { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PartnerProfile> PartnerProfiles { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // unique constraints for User entity
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

            // global query filters for soft delete
            modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
            modelBuilder.Entity<ClimbingGym>().HasQueryFilter(g => !g.IsDeleted);
            modelBuilder.Entity<ClimbingWall>().HasQueryFilter(w => !w.IsDeleted);
            modelBuilder.Entity<ClimbingRoute>().HasQueryFilter(r => !r.IsDeleted);
            modelBuilder.Entity<RouteComment>().HasQueryFilter(c => !c.IsDeleted);
            modelBuilder.Entity<AscentLog>().HasQueryFilter(a => !a.IsDeleted);
            modelBuilder.Entity<Post>().HasQueryFilter(p => !p.IsDeleted);
            modelBuilder.Entity<PartnerProfile>().HasQueryFilter(pp => !pp.IsDeleted);

            // recursive relationship for RouteComment (self-referencing)
            modelBuilder.Entity<RouteComment>()
                .HasOne(c => c.ParentComment)
                .WithMany(p => p.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Cascade); // parent comment deletion cascades to child comments

            modelBuilder.Entity<RouteComment>()
                .HasOne(c => c.ClimbingRoute)
                .WithMany(r => r.Comments)
                .HasForeignKey(c => c.ClimbingRouteId)
                .OnDelete(DeleteBehavior.Cascade); // Climbing route deletion cascades to comments

            modelBuilder.Entity<RouteComment>()
                .HasOne(c => c.User)
                .WithMany(u => u.RouteComments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict); // User deletion leaves comments intact

            // 1:1 relationship between User and PartnerProfile
            modelBuilder.Entity<PartnerProfile>()
                .HasOne(pp => pp.User)
                .WithOne(u => u.PartnerProfile)
                .HasForeignKey<PartnerProfile>(pp => pp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PartnerProfile>()
                .HasOne(pp => pp.ClimbingGym)
                .WithMany(g => g.LookingForPartnersHere)
                .HasForeignKey(pp => pp.ClimbingGymId)
                .OnDelete(DeleteBehavior.Restrict);

            //social media posts relationships
            modelBuilder.Entity<Post>().HasOne(p => p.User).WithMany(u => u.Posts).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Post>().HasOne(p => p.ClimbingRoute).WithMany(r => r.SharedInPosts).HasForeignKey(p => p.ClimbingRouteId).OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<Post>().HasOne(p => p.AscentLog).WithMany(a => a.SharedInPosts).HasForeignKey(p => p.AscentLogId).OnDelete(DeleteBehavior.SetNull);

            // created by relationships (User creates Gyms, Walls, Routes, Ascents)
            modelBuilder.Entity<ClimbingGym>().HasOne(g => g.CreatedByUser).WithMany(u => u.CreatedGyms).HasForeignKey(g => g.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ClimbingWall>().HasOne(w => w.CreatedByUser).WithMany(u => u.CreatedWalls).HasForeignKey(w => w.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ClimbingRoute>().HasOne(r => r.User).WithMany(u => u.CreatedRoutes).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<AscentLog>().HasOne(a => a.User).WithMany(u => u.Ascents).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);

            // 1:N relationships between Gyms, Walls, Routes, and Ascents
            modelBuilder.Entity<ClimbingWall>().HasOne(w => w.ClimbingGym).WithMany(g => g.Walls).HasForeignKey(w => w.ClimbingGymId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ClimbingRoute>().HasOne(r => r.ClimbingWall).WithMany(w => w.Routes).HasForeignKey(r => r.ClimbingWallId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<AscentLog>().HasOne(a => a.ClimbingRoute).WithMany(r => r.Ascents).HasForeignKey(a => a.ClimbingRouteId).OnDelete(DeleteBehavior.Cascade);

            // social features relationships (Friendships and ChatMessages)
            modelBuilder.Entity<Friendship>().HasOne(f => f.Requestor).WithMany(u => u.SentFriendRequests).HasForeignKey(f => f.RequestorId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Friendship>().HasOne(f => f.Receiver).WithMany(u => u.ReceivedFriendRequests).HasForeignKey(f => f.ReceiverId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChatMessage>().HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChatMessage>().HasOne(m => m.Receiver).WithMany(u => u.ReceivedMessages).HasForeignKey(m => m.ReceiverId).OnDelete(DeleteBehavior.Restrict);

        }
    }
}
