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

 get getPoints():number{
   let data:any =  sessionStorage.getItem('score')
   return Number(JSON.parse(data)) || 0
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

  logout(){
   this.router.navigate(['/login'])
  }

  wallet(){
   this.router.navigate(['/wallet'])
  }

}
