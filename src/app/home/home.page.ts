import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardService, LeaderboardUser, UserStats, user } from '../dashboard.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage {
  userStats?: UserStats
  LeaderboardUser?: LeaderboardUser[]
  userActivity?: any

  User: user = {
    id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  }


  constructor(
    private dashboardService: DashboardService
  ) {

    this.dashboardService.getUserStats$.subscribe((data: UserStats) => {
      this.userStats = data
    })

    this.dashboardService.getLeaderboard$.subscribe((data: LeaderboardUser[]) => {
      this.LeaderboardUser = data
    })

    this.User = this.dashboardService.getUser()

    if (!this.userStats) {
      this.dashboardService.getDashboardStats().subscribe()
    }

    if (!this.LeaderboardUser?.length) {
        this.dashboardService.getLeaderboardUser().subscribe()
    }

  }

  logout() {
    this.dashboardService.logout()
  }


}