import { Component, OnInit } from '@angular/core';
import { LoaderService } from './loader.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showLoader:boolean = false
  constructor(private LoaderService:LoaderService) {}

  ngOnInit(): void {
    this.LoaderService.loaderState$.subscribe(showLoader=>{
      this.showLoader = showLoader
    })
  }
}
