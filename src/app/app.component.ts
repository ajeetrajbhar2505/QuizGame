import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { DashboardService } from './dashboard.service';
import { CreateQuizesService } from './create-quizes.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showLoader: boolean = false
  logged: boolean = false
  currentRoute: string = '';
  constructor(
    private socketService: SocketService,
    private router: Router,
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url == '/home' || event.url == '/quizes') {
          let limit = event.url == '/home' ? 3 : 0
          if (event) {
            this.quizService.initializeData(limit);
          }
        }

        if (event.url == '/home' || event.url == '/users') {
          let limit = event.url == '/home' ? 3 : 0
          if (event) {
            this.dashboardService.getLeaderboardUser(limit)
          }
        }
        this.currentRoute = event.url;
        window.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      });
  }

  ngOnInit(): void {
    this.logged = (localStorage.getItem('token')) ? true : false
    this.socketService.authData$.subscribe((data: any) => {
      this.logged = data ? true : false
    })

  }
  

}
