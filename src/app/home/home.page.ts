import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardService, LeaderboardUser, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage  {
  userStats?: UserStats
  LeaderboardUser?: LeaderboardUser[]
  userActivity?: any
  quizesDraft: Quiz[] = [];

  User: user = {
    id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  }


  constructor(
    private dashboardService: DashboardService,
    private quizService:CreateQuizesService
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

    this.loadQuizzes()
  }


  startQuiz(quizId:string){

  }


  loadQuizzes(): void {
    this.quizService.getPublishedQuizes().subscribe(quizzes => {
      this.quizesDraft = quizzes;
    });
  }

  logout() {
    this.dashboardService.logout()
  }


}