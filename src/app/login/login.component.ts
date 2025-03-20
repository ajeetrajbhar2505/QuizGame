import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { WebService } from '../web.service';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit {
  loginSub!: Subscription;
  googleProgress:boolean = false

  constructor(
    private router: Router, 
    private webService: WebService,
    private socketService:SocketService,
    private modalController: ModalController
    ) { }

  ngOnInit() {
    this.subscribeToLogin()
  }

  subscribeToLogin() {
    this.loginSub = this.socketService.loginData$.subscribe(data => {
      if (data) {
        this.googleProgress = false
         setTimeout(() => {
          this.closeModal();
          this.router.navigate(['/home'],{queryParams : {token : data.token}})
         }, 2000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.loginSub) {
      this.loginSub.unsubscribe();
    }
  }

  login() {
    this.router.navigate(['/home'])
  }


  loginWithGoogle() {
    this.googleProgress = true
    // return
    this.webService.googleLogin().subscribe(
      (res) => {
        window.open(res['url'], '_blank');
      },
      (err) => {
        console.error('Error fetching user:', err);
      }
    );
  }

  async closeModal() {
    await this.modalController.dismiss();
  }


}
