import { Component, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '../socket.service';
import { DashboardService, UserStats } from '../dashboard.service';
import { Subscription } from 'rxjs';

interface user {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage implements OnInit,OnDestroy {

  stats?: UserStats;
  activity: any[] = [];
  private subs: Subscription[] = [];

  User: user = {
    id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  }


  constructor(
    private socketService: SocketService,
    private dashboardService:DashboardService
    ) { }


  ngOnInit(): void {
    const User: any = localStorage.getItem('user')
    if (User) {
      this.User = JSON.parse(User)
    }
    this.socketService.authData$.subscribe((data: any) => {
      if (data) {
        this.User = data.user
      }
    })

    this.subs.push(
      this.dashboardService.getDashboardStats().subscribe((data:any) => {
        this.stats = data['stats'];
      }),
      
      this.dashboardService.getRecentActivity().subscribe((data:any) => {
        this.activity = data['activity'];
      }),
      
      this.dashboardService.onStatsUpdate().subscribe((data:any) => {
        this.stats = data['stats'];
      })
    );
  }
  logout() {
    this.dashboardService.logout()
  }


  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}