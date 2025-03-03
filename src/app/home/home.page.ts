import { Component, OnInit } from '@angular/core';
import { GoogleadsService } from '../googleads.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  constructor(
    private readonly googleAds: GoogleadsService,
    private router: Router) {
  }

ngOnInit(): void {
  this.googleAds.loadBannerAds().then(data=>{
       if (data) {
        
       }
  }).catch(err=>{
    alert(err)
  })
}


  playQuiz(suject:string) {
    this.googleAds.loadRewardedVideoAd().then(result => {
      this.googleAds.showloadRewardedVideoAds().then(loaded => {
        if (loaded) {
          this.googleAds
          this.router.navigate(['/quiz/' + suject])
        }
      }).catch(err => {
        alert(err)
      })
    }).catch(err => { alert(err) })


  }

}
