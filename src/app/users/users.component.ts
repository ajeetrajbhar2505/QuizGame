import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { DashboardService, LeaderboardUser } from '../dashboard.service';
import { CreateQuizesService } from '../create-quizes.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent  implements  OnInit,OnDestroy {
  @Input() leaderboardUsers$: Observable<LeaderboardUser[]>;
  @Input() ParentInjected: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private quizService:CreateQuizesService,
    private sanitizer: DomSanitizer
  ) {
    this.leaderboardUsers$ = this.dashboardService.leaderboard$;
  }
  

  ngOnInit(): void {
    this.quizService.isQuizesRefreshed.subscribe(data=>{
      if (data) {
        this.loadLeaderboardData(0)
      }
    })
  }
  

  ngOnDestroy(): void {
    this.loadLeaderboardData(3)
  }

  protected async loadLeaderboardData(limit:number) {
   await this.dashboardService.getLeaderboardUser(limit).toPromise();
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