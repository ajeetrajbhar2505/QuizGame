import { Component, Input, OnInit } from '@angular/core';
import { DashboardService, LeaderboardUser } from '../dashboard.service';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  @Input() leaderboardUsers$: Observable<LeaderboardUser[]>;
  @Input() ParentInjected: boolean = false

  constructor(private dashboardService: DashboardService,
    private sanitizer: DomSanitizer
    ) {
    this.leaderboardUsers$ = this.dashboardService.leaderboard$
  }

  ngOnInit() {
    this.loadInitialData()
  }

  private loadInitialData(): void {
    this.dashboardService.getLeaderboardUser(0).subscribe();
  }


  protected makeSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }


  avatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null;
  }
  trackByUserId(index: number, user: LeaderboardUser): string {
    return user.userId; // Assuming LeaderboardUser has an id property
  }

}
