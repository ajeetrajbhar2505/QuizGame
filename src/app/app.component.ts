import { Component, OnInit } from '@angular/core';
import { LoaderService } from './loader.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SocketService } from './socket.service';

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
  constructor(private socketService: SocketService, private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  ngOnInit(): void {
    this.logged = (localStorage.getItem('token')) ? true : false
    this.socketService.authData$.subscribe((data:any) => {
      this.logged = data ? true : false
    })
  
  }
}
