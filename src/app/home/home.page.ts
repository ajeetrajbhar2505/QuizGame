import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, LeaderboardUser, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  userStats?: UserStats;
  leaderboardUsers?: LeaderboardUser[];
  userActivity?: any;
  publishedQuizzes: Quiz[] = [];
  private subscriptions = new Subscription();

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
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeData(): void {
    // User stats subscription
    this.subscriptions.add(
      this.dashboardService.getUserStats$.subscribe((data: UserStats | null) => {
        if (data) {
          this.userStats = data;
        }
      })
    );

    // Leaderboard subscription with avatar processing
    this.subscriptions.add(
      this.dashboardService.leaderboard$.subscribe((data: any[]) => {
        this.leaderboardUsers = data.map(user => ({
          ...user,
          avatar: user.avatar ? this.makeSafeUrl(user.avatar) : null
        }));
      })
    );

    // Current user
    this.currentUser = this.dashboardService.getUser();
    if (this.currentUser.avatar) {
      this.currentUser.avatar = this.makeSafeUrl(this.currentUser.avatar);
    }

    // Quiz data subscription
    this.subscriptions.add(
      this.quizService.getPublishedQuizes$.subscribe(quizzes => {
        this.publishedQuizzes = quizzes;
      })
    );
  }

  private loadInitialData(): void {
    // Only fetch if not already loaded
    if (!this.userStats) {
      this.dashboardService.getDashboardStats().subscribe();
    }

    if (!this.leaderboardUsers?.length) {
      this.dashboardService.getLeaderboardUser().subscribe();
    }

    this.quizService.getPublishedQuiz().subscribe();
  }

  protected makeSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  startQuiz(quizId: string): void {
    // Quiz start logic
  }

  logout(): void {
    this.dashboardService.logout();
  }
}