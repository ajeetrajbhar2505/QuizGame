// error-types.enum.ts
export enum ErrorTypes {
  // Auth Errors
  'auth:register:error',
  'auth:login:error',
  'auth:otp:verify:error',
  'auth:logout:error',
  'auth:google:error',
  'auth:facebook:error',
  'auth:otp:send:error',
  'auth:me:error',
  'auth:error',
  'auth:google:callback:error',
  'auth:facebook:callback:error',
  
  // Dashboard Errors
  'dashboard:activity:error',
  'dashboard:stats:error',
  'dashboard:leaderboardUser:error',
  
  // Leaderboard Errors
  'leaderboard:friends:error',
  
  // Notification Errors
  'notification:get:error',
  'notification:UnreadNotificationsCount:error',
  'notification:read:error',
  'notification:send:error',
  'notification:broadcast:error',
  
  // Profile Errors
  'profile:get:error',
  'profile:update:error',
  'profile:badges:error',
  
  // Quiz Errors
  'quiz:create:error',
  'quiz:refreshQuestion:error',
  'quiz:published:error',
  'quiz:all:error',
  'quiz:active:error',
  'quiz:SubmittedQuizes:error',
  'quiz:participants:error',
  'quiz:get:error',
  'quiz:delete:error',
  'quiz:publish:error',
  'quiz:waiting:error',
  'quiz:join:error',
  'quiz:start:error',
  'quiz:submit:error',
  'quiz:completeQuizByHost:error',
  'quiz:answer:error',
  'livequiz:get:error',
  
  // User Errors
  'user:profile:error',
  'user:update:error',
  'user:friends:error'
}