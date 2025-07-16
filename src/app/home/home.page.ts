import { Component } from '@angular/core';
import { DashboardService, LeaderboardUser, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  userStats?: UserStats;
  leaderboardUsers?: LeaderboardUser[];
  userActivity?: any;
  publishedQuizzes: Quiz[] = [];

  currentUser: user = {
    id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  };

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService
  ) {
    this.initializeData();
  }

  private initializeData(): void {
    // User stats
    this.dashboardService.getUserStats$.subscribe((data: UserStats) => {
      this.userStats = data;
    });

    // Leaderboard
    this.dashboardService.getLeaderboard$.subscribe((data: LeaderboardUser[]) => {
      this.leaderboardUsers = data;
    });

    // Current user
    this.currentUser = this.dashboardService.getUser();

    // Fetch initial data if not available
    if (!this.userStats) {
      this.dashboardService.getDashboardStats().subscribe();
    }

    if (!this.leaderboardUsers?.length) {
      this.dashboardService.getLeaderboardUser().subscribe();
    }

    // Quiz data
    this.loadPublishedQuizzes();
    this.subscribeToQuizUpdates();
  }

  private subscribeToQuizUpdates(): void {
    this.quizService.getPublishedQuizes().subscribe(quizzes => {
      this.publishedQuizzes = quizzes;
    });
  }

  private loadPublishedQuizzes(): void {
    this.quizService.getPublishedQuiz().toPromise();
  }

  startQuiz(quizId: string): void {
    // Quiz start logic will go here
  }

  logout(): void {
    this.dashboardService.logout();
  }
}