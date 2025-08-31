import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardService, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, Subject, filter, forkJoin, from, map, of, switchMap, takeUntil } from 'rxjs';
import { NotificationService } from '../notification.service';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
 currentUser$: Observable<user | null> = from([this.getStoredUser()]).pipe(
  switchMap(storedUser => storedUser ? of(storedUser) : this.socketService.authData$.pipe(
    map(authData => authData?.user || null),
    filter(user => user !== null)
  ))
);
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService,
    private socketService:SocketService
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

  private getStoredUser(): user | null {
    try {
      // Try currentUser first, then fallback to user for backward compatibility
      const userData = localStorage.getItem('user') || localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
          return user;
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
    }
    return null;
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