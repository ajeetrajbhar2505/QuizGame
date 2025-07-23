import { Component, OnInit } from '@angular/core';
import { DashboardService, LeaderboardUser, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
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
    private quizService: CreateQuizesService,
    private sanitizer: DomSanitizer
  ) {
  }


  ngOnInit(): void {
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

  protected makeSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url || 'assets/AppLogo.png')
  }

  private subscribeToQuizUpdates(): void {
    this.quizService.getPublishedQuizes$.subscribe(quizzes => {
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