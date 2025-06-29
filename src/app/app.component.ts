import { Component, OnInit } from '@angular/core';
import { LoaderService } from './loader.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showLoader:boolean = false
  logged:boolean =false
  currentRoute: string = '';
  constructor(private LoaderService:LoaderService,private router:Router) {
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  ngOnInit(): void {
    this.LoaderService.loaderState$.subscribe(showLoader=>{
      this.showLoader = showLoader
    })
    this.LoaderService.loggedState.subscribe(logged=>{
      console.log(logged);
      this.logged = logged
      if (logged) {
      this.router.navigate(['/home'])
      }
      
    })
  }
}
