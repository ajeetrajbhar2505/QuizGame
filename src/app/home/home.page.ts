import { Component, OnInit } from '@angular/core';
import { GoogleadsService } from '../googleads.service';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../web.service';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: [];
  timeLimit: number;
  createdAt: string;
  __v: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage implements OnInit {
  token: any = '';
  userData: any = {};
  Quizzes: Quiz[] = [];

  constructor(
    private readonly googleAds: GoogleadsService,
    private router: Router,
    private route: ActivatedRoute,
    private readonly webService: WebService
  ) {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        localStorage.setItem('token', this.token);
      } else {
        this.token = localStorage.getItem('token');
      }
      this.getUserDetails();
      this.getQuizDetails();
    });
  }

  get getPoints(): number {
    let data: any = sessionStorage.getItem('score');
    return Number(JSON.parse(data)) || 0;
  }

  ngOnInit(): void {
    this.googleAds.loadBannerAds().then(data => {
      if (data) {
        console.log("Banner Ads Loaded Successfully");
      }
    }).catch(err => {
      alert(err);
    });
    this.getUserDetails();
    this.getQuizDetails();
  }

  getUserDetails() {
    this.webService.getUserById().subscribe(
      (res) => {
        this.userData = res;
      },
      (err) => {
        console.error('Error fetching user:', err);
      }
    );
  }

  getQuizDetails() {
    this.webService.getQuizzes().subscribe(
      (res) => {
        this.Quizzes = res;
      },
      (err) => {
        console.error('Error fetching quizzes:', err);
      }
    );
  }

  // Show a random ad (Interstitial or Rewarded Video) before navigating to the quiz
  playQuiz(subject: string) {
    this.showRandomAdBeforeQuiz(subject);
  }

  // Show a random ad (either interstitial or rewarded)
  private showRandomAdBeforeQuiz(subject: string): void {
    const randomAdType = this.getRandomInt(1, 2);
    if (randomAdType === 1) {
      this.showInterstitialAd(subject);
    } else {
      this.showRewardedAd(subject);
    }
  }

  // Show Interstitial Ad
  private showInterstitialAd(subject: string): void {
    this.googleAds.loadInterstitialAd().then(() => {
      this.googleAds.showInterstitialAds().then((loaded) => {
        if (loaded) {
          console.log('Interstitial Ad successfully loaded and displayed.');
          // Navigate to quiz after the ad is shown
          this.router.navigate(['/quiz/' + subject]);
        }
      }).catch((err) => {
        console.error('Failed to load or show interstitial ad:', err);
        this.router.navigate(['/quiz/' + subject]); // Proceed to quiz if ad fails
      });
    }).catch((err) => {
      console.error('Error loading interstitial ad:', err);
      this.router.navigate(['/quiz/' + subject]); // Proceed to quiz if ad fails
    });
  }

  // Show Rewarded Ad
  private showRewardedAd(subject: string): void {
    this.googleAds.loadRewardedVideoAd().then(() => {
      this.googleAds.showloadRewardedVideoAds().then((loaded) => {
        if (loaded) {
          console.log('Rewarded Ad successfully loaded and displayed.');
          // Navigate to quiz after the ad is shown
          this.router.navigate(['/quiz/' + subject]);
        }
      }).catch((err) => {
        console.error('Failed to load or show rewarded ad:', err);
        this.router.navigate(['/quiz/' + subject]); // Proceed to quiz if ad fails
      });
    }).catch((err) => {
      console.error('Error loading rewarded ad:', err);
      this.router.navigate(['/quiz/' + subject]); // Proceed to quiz if ad fails
    });
  }

  // Utility function to get a random integer within a range
  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  logout() {
    this.router.navigate(['/login']);
  }

  wallet() {
    this.router.navigate(['/wallet']);
  }
}
