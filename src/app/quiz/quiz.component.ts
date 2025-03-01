import { Component, OnInit } from '@angular/core';
import { AdmobAds, BannerPosition, BannerSize } from 'capacitor-admob-ads'

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
})
export class QuizComponent  implements OnInit {

  constructor() { }

  ngOnInit() {
    // this.showBannerAds()
  }

  showBannerAds() {
    AdmobAds.showBannerAd({
      adId: 'ca-app-pub-4874253778737753/3116134419', 
      isTesting: true,
      adSize: BannerSize.BANNER,
      adPosition: BannerPosition.BOTTOM
    }).then(() => {
      alert('Banner is shown')
    }).catch((err) => {
     alert('Error' + err)
    })
  }


}
