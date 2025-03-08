import { Injectable } from '@angular/core';
import { AdmobAds, BannerPosition, BannerSize } from 'capacitor-admob-ads'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleadsService {

  constructor() { 
  }

  async loadBannerAds(): Promise<boolean> {
    // return true
    try {
      await  AdmobAds.showBannerAd({
        adId: environment.BannerAdId,
        isTesting: true,
        adSize: BannerSize.BANNER,
        adPosition: BannerPosition.BOTTOM
      })

      return true;
    } catch (err:any) {
      return false;
    }
  }

  async loadInterstitialAd(): Promise<boolean> {
    try {
      await AdmobAds.loadInterstitialAd({
        adId: environment.InterstitialAdsId,
        isTesting: true,
      });
      return true;
    } catch (err:any) {
      return false;
    }
  }

  async showInterstitialAds(): Promise<boolean> {
    // return true
    try {
      await AdmobAds.showInterstitialAd();
      return true
    } catch (err:any) {
      return false
    }
  }

  async loadRewardedVideoAd(): Promise<boolean> {
    // return true
    try {
      await AdmobAds.loadRewardedVideoAd({
        adId: environment.RewardedVideoAddId,
        isTesting: true,
      });
      return true;
    } catch (err: any) {
      return false;
    }
  }
  
  async showloadRewardedVideoAds(): Promise<boolean> {
    // return true
    try {
      await AdmobAds.showRewardedVideoAd();
      return true;
    } catch (err: any) {
      return false;
    }
  }

  

}
