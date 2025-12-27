import { Injectable } from '@angular/core';
import { 
  AdMob, 
  BannerAdOptions, 
  BannerAdSize, 
  BannerAdPosition, 
  AdOptions, 
  RewardAdOptions 
} from '@capacitor-community/admob';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleadsService {

  constructor() {}

  async loadBannerAds(): Promise<boolean> {
    try {
      const options: BannerAdOptions = {
        adId: environment.BannerAdId,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true // Set to false in production
      };
      await AdMob.showBanner(options);
      return true;
    } catch (err) {
      return false;
    }
  }

  async loadInterstitialAd(): Promise<boolean> {
    try {
      const options: AdOptions = {
        adId: environment.InterstitialAdsId,
        isTesting: true,
      };
      await AdMob.prepareInterstitial(options);
      return true;
    } catch (err) {
      return false;
    }
  }

  async showInterstitialAds(): Promise<boolean> {
    try {
      await AdMob.showInterstitial();
      return true;
    } catch (err) {
      return false;
    }
  }

  async loadRewardedVideoAd(): Promise<boolean> {
    try {
      const options: RewardAdOptions = {
        adId: environment.RewardedVideoAddId,
        isTesting: true,
      };
      await AdMob.prepareRewardVideoAd(options);
      return true;
    } catch (err) {
      return false;
    }
  }

  async showloadRewardedVideoAds(): Promise<boolean> {
    try {
      await AdMob.showRewardVideoAd();
      return true;
    } catch (err) {
      return false;
    }
  }
}
