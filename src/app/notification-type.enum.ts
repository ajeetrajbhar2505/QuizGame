// notification-type.enum.ts
export enum NotificationType {
    QUIZ_INVITATION = 'quiz-invitation',       // Invited to join a quiz
    QUIZ_START = 'quiz-start',                // Quiz is starting
    QUESTION_READY = 'question-ready',         // Next question is available
    NEW_QUIZ = 'new-quiz',         // New Quiz is available
    QUIZ_ENDED = 'quiz-ended',                // Quiz has ended
    RESULTS_AVAILABLE = 'results-available',  // Results are ready
    NEW_LEADER = 'new-leader',                // You're now the leader
    ACHIEVEMENT_UNLOCKED = 'achievement-unlocked', // Earned a badge/achievement
    ADMIN_ANNOUNCEMENT = 'admin-announcement', // Admin broadcast
    SYSTEM_ALERT = 'system-alert'             // System notification
  }