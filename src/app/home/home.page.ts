import { Component, OnInit } from '@angular/core';
import { DashboardService, LeaderboardUser, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { RefresherCustomEvent } from '@ionic/angular';

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
    this.dashboardService.getLeaderboardUser(3).subscribe();
    this.quizService.getPublishedQuiz().subscribe();
  }

  protected makeSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }


  avatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null;
  }

  logout(): void {
    this.dashboardService.logout();
  }

  handleRefresh(event: any) {
    this.loadInitialData()
  }

}