import { Component, OnInit } from '@angular/core';
import { LoaderService } from './loader.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showLoader:boolean = false
  logged:boolean =false
  constructor(private LoaderService:LoaderService,private router:Router) {}

  ngOnInit(): void {
    this.LoaderService.loaderState$.subscribe(showLoader=>{
      this.showLoader = showLoader
    })
    this.LoaderService.loggedState.subscribe(logged=>{
      this.logged = logged
      this.router.navigate(['/home'])
    })
  }
}
