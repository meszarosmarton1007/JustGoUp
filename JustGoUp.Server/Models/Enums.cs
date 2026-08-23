namespace JustGoUp.Server.Models
{

    public enum UserRole
    {
        User,       // Regular user with basic access
        GymOwner,   // Owner of a gym
        Admin        // System administrator

    }

    public enum AccentStyle
    {
        Onsight, // Style where the climber completes the route on the first attempt without prior knowledge
        Flash,  // Style where the climber completes the route on the first attempt with prior knowledge
        Redpoint, // Style where the climber completes the route after multiple attempts
        Toprope, // Style where the climber is secured by a rope from above
        Attempt, // Style where the climber attempts the route but does not complete it

    }

    public enum FriendshipStatus
    {
        Pending,    // Status indicating that the friendship request is pending
        Accepted,   // Status indicating that the friendship request has been accepted
        Blocked // Status indicating that the friendship request has been blocked
    }
}
