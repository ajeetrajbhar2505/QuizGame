import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { DashboardService, LeaderboardUser } from '../dashboard.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnDestroy {
  @Input() leaderboardUsers$: Observable<LeaderboardUser[]>;
  @Input() ParentInjected: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private sanitizer: DomSanitizer
  ) {
    this.leaderboardUsers$ = this.dashboardService.leaderboard$;
  }

  ngOnDestroy(): void {
    this.loadLeaderboardData(3);
  }

  protected loadLeaderboardData(limit: number): void {
    this.dashboardService.getLeaderboardUser(limit).subscribe();
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