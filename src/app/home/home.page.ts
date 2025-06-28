import { Component } from '@angular/core';
import { LoaderService } from '../loader.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage {

  constructor(private loader:LoaderService){}

  logout(){
    this.loader.userLogged(false)
  }
}