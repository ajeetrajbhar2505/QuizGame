import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { CreateQuizesService } from './create-quizes.service';
import { DashboardService } from './dashboard.service';

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
    private createQuizesService:CreateQuizesService,
    private dashboardService:DashboardService
    
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        window.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      });
  }

  navigateTopage(page:string){
  this.router.navigate([page])
  this.__runInitializers()
  }

 async __runInitializers(){
   this.createQuizesService.initializeData()
   await this.dashboardService.getLeaderboardUser(3).toPromise()
  }

  ngOnInit(): void {
    this.logged = (localStorage.getItem('token')) ? true : false
    this.socketService.authData$.subscribe((data: any) => {
      this.logged = data ? true : false
    })

  }
  

}
