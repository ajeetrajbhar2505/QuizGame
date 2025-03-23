import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { WebService } from '../web.service';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  loginSub!: Subscription;
  googleProgress: boolean = false

  constructor(
    private readonly router: Router,
    private readonly webService: WebService,
    private readonly socketService: SocketService,
    private readonly modalController: ModalController,
    private readonly inAppBrowser: InAppBrowser
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
          this.router.navigate(['/home'], { queryParams: { token: data.token } })
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
        this.inAppBrowser.create(res['url'], '_blank', {
          location: 'yes', // Show or hide the browser location bar
          toolbar: 'yes', // Show or hide the browser toolbar
          zoom: 'yes', // Enable or disable zoom controls
        });
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
