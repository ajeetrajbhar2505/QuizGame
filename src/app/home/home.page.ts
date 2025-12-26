import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardService, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, combineLatest, forkJoin, map, takeUntil } from 'rxjs';
import { NotificationService } from '../notification.service';
import { searchQueryModel } from '../live-quizes/live-quizes.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone : false,
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchQueryData: searchQueryModel = {
    searchQuery: '',
    selectedCategory: ''
  }
  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService,
  ) {

  }

  ngOnInit() {
    this.loadInitialData()
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData()
      }
    })
  }

  get currentUser(): user {
    return this.dashboardService.getUser()
  }

  filterQuizesEvent(searchQueryData: searchQueryModel) {
    this.searchQueryData = searchQueryData
  }

  async loadInitialData() {
    await forkJoin([
      this.dashboardService.getLeaderboardUser(),
      this.quizService.getActiveQuizes(),
      this.quizService.getPublishedQuiz(),
      this.quizService.getSubmittedQuizes(),
      this.notificationService.getUnreadNotificationsCount(),
      this.dashboardService.getDashboardStats(),
      this.quizService.initializeData(),
    ]).toPromise()


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