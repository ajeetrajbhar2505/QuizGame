import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardService, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  currentUser: user;
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService
  ) {
    // Current user'
    this.currentUser = { ...this.dashboardService.getUser() };
  }

  ngOnInit() {
    this.setupUserSubscription()
    this.loadInitialData()
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData()
      }
    })
  }
  private setupUserSubscription(): void {
    this.dashboardService.getUserStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update user data when stats are updated
        this.currentUser = { ...this.dashboardService.getUser() };
      });
  }


  async loadInitialData() {
    await forkJoin([
      this.dashboardService.getLeaderboardUser(),
      this.quizService.getActiveQuizes(),
      this.quizService.getPublishedQuiz(),
      this.notificationService.getUnreadNotificationsCount()
    ]).toPromise()

    this.dashboardService.getDashboardStats();
    this.quizService.initializeData();
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


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}