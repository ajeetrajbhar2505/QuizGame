import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { DashboardService, LeaderboardUser } from '../dashboard.service';
import { CreateQuizesService } from '../create-quizes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  @Input() leaderboardUsers$: Observable<LeaderboardUser[]>;
  @Input() ParentInjected: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private sanitizer: DomSanitizer,
    private router:Router
  ) {
    this.leaderboardUsers$ = this.dashboardService.leaderboard$;
  }


  ngOnInit(): void {
    let isLimitRoute = ['/home'].includes(this.router.url);
    this.loadLeaderboardData(isLimitRoute ? 3 : 0)
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadLeaderboardData(3)
      }
    })
  }


  async ngOnDestroy() {
    await this.dashboardService.getLeaderboardUser(3).toPromise();
  }

  protected async loadLeaderboardData(index:number) {
    await this.dashboardService.getLeaderboardUser(index).toPromise();
  }

  makeSafeUrl(url: string): SafeUrl | string {
    if (!url) {
      return 'assets/user.png';
    }
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  handleAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null; // Prevent infinite loop
  }

  trackByUserId(index: number, user: LeaderboardUser): string {
    return user.userId;
  }
}