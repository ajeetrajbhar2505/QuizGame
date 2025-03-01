import { Component } from '@angular/core';
import { AdmobAds, BannerPosition, BannerSize } from 'capacitor-admob-ads'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  constructor() {
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
