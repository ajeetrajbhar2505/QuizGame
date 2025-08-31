import { Component, OnInit } from '@angular/core';
import { DashboardService, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
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
    private notificationService: NotificationService
  ) {
    // Current user'
    this.currentUser = this.dashboardService.getUser();
    if (this.currentUser.avatar) {
      this.currentUser.avatar = this.makeSafeUrl(this.currentUser.avatar);
    }
  }

  ngOnInit() {
    this.loadInitialData()
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData()
      }
    })
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


}