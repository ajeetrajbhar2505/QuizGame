import { Component } from '@angular/core';
import { GoogleadsService } from '../googleads.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage  {

  constructor(
    private readonly googleAds: GoogleadsService, 
    private router: Router) 
    { }


  playQuiz() {
    this.googleAds.showloadRewardedVideoAds().then(loaded => {
      if (loaded) {
        this.googleAds
        this.router.navigate(['/quiz'])
      }
    }).catch(err => {
      alert(err)
    })
  }

}
