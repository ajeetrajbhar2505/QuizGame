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
  token: any = ''
  userData: any = {};
  Quizzes: Quiz[] = []
  constructor(
    private readonly googleAds: GoogleadsService,
    private router: Router, private route: ActivatedRoute,
    private readonly webService: WebService
  ) {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
        if (this.token) {
        localStorage.setItem('token', this.token);
      }
      else {
        this.token = localStorage.getItem('token')
      }
      this.getUserDetails()
    })

  }



  get getPoints(): number {
    let data: any = sessionStorage.getItem('score')
    return Number(JSON.parse(data)) || 0
  }

  ngOnInit(): void {

    this.googleAds.loadBannerAds().then(data => {
      if (data) {

      }
    }).catch(err => {
      alert(err)
    })
    this.getUserDetails();
    this.getQuizDetails()
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
        console.error('Error fetching user:', err);
      }
    );
  }



  playQuiz(suject: string) {
    this.googleAds.loadInterstitialAd().then(result => {
      this.googleAds.showInterstitialAds().then(loaded => {
        if (loaded) {
          this.googleAds
          this.router.navigate(['/quiz/' + suject])
        }
      }).catch(err => {
        alert(err)
      })
    }).catch(err => { alert(err) })


  }

  logout() {
    this.router.navigate(['/login'])
  }

  wallet() {
    this.router.navigate(['/wallet'])
  }

}
