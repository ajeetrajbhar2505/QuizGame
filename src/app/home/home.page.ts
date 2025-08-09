import { Component, OnInit } from '@angular/core';
import { DashboardService, LeaderboardUser, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  userStats$: Observable<UserStats | null>;
  leaderboardUsers$: Observable<LeaderboardUser[]>;
  publishedQuizzes$: Observable<Quiz[]>;

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
    private sanitizer: DomSanitizer,
  ) {
    // Current user
    const User: any = localStorage.getItem('user')
    if (User) {
      this.currentUser = JSON.parse(User)
    }
    if (this.currentUser.avatar) {
      this.currentUser.avatar = this.makeSafeUrl(this.currentUser.avatar);
    }

    // Initialize observables
    this.userStats$ = this.dashboardService.getUserStats$;
    this.leaderboardUsers$ = this.dashboardService.leaderboard$
    this.publishedQuizzes$ = this.quizService.getPublishedQuizes$;
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.dashboardService.getDashboardStats().subscribe();
    this.dashboardService.getLeaderboardUser().subscribe();
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

  avatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null;
  }

  // TrackBy functions for ngFor performance
  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id; // Assuming Quiz has an _id property
  }

  trackByUserId(index: number, user: LeaderboardUser): string {
    return user.userId; // Assuming LeaderboardUser has an id property
  }
}