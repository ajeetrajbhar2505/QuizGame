import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { LoaderService } from '../loader.service';
import { NavController } from '@ionic/angular';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  private authSub!: Subscription;
  loginForm = {
    email: '',
    password: ''
  };
  isLoading = false;
  googleProgress = false;
  facebookProgress = false;
  authFailed: boolean = false

  constructor(
    private readonly router: Router,
    private readonly socketService: SocketService,
    private readonly modalController: ModalController,
    private readonly inAppBrowser: InAppBrowser,
    private readonly loader: LoaderService,
    private navCtrl: NavController,
    private platform: Platform
  ) {
    if (localStorage.getItem('token') && localStorage.getItem('token') != undefined) {
      router.navigate(['/home'])
    }
  }

  ngOnInit() {
    this.setupAuthListeners();
    this.setupSocialLoginCallbacks();
  }


  private setupAuthListeners(): void {
    this.authSub = this.socketService.authData$.subscribe(data => {
      if (data) {
        if (this.platform.is('android')) {
          this.navCtrl.back();
        }
        this.isLoading = false;
        this.googleProgress = false;
        this.facebookProgress = false;
        this.authFailed = false

        setTimeout(() => {
          this.handleSuccessfulLogin(data);
        }, 1000);
      }
    });

    // Listen for specific auth errors
    this.socketService.on('auth:login:error', (error) => {
      this.isLoading = true;
      this.authFailed = true
      if (this.platform.is('android')) {
        this.navCtrl.back();
      }
    });

    this.socketService.on('auth:google:error', (error) => {
      this.googleProgress = true;
      this.authFailed = true
      if (this.platform.is('android')) {
        this.navCtrl.back();
      }
    });

    this.socketService.on('auth:facebook:error', (error) => {
      this.facebookProgress = true;
      this.authFailed = true
      if (this.platform.is('android')) {
        this.navCtrl.back();
      }
    });
  }

  private setupSocialLoginCallbacks(): void {
    this.authFailed = false

    // Handle Google auth URL
    this.socketService.on('auth:google:url', (data) => {
      this.inAppBrowser.create(data.url, '_blank', {
        location: 'yes',
        toolbar: 'yes',
        zoom: 'yes',
      });
    });

    // Handle Facebook auth URL
    this.socketService.on('auth:facebook:url', (data) => {
      this.inAppBrowser.create(data.url, '_blank', {
        location: 'yes',
        toolbar: 'yes',
        zoom: 'yes',
      });
    });
  }

  handleSuccessfulLogin(data: any): void {
    setTimeout(() => {
      this.closeModal();
      this.router.navigate(['/home'], {
        queryParams: { token: data.token },
        state: { user: data.user }
      });
    }, 1000);
  }

  login(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      console.error('Please enter both email and password', 'warning');
      return;
    }

    this.isLoading = true;
    this.socketService.login(this.loginForm);
  }

  loginWithGoogle(): void {
    this.googleProgress = true;
    this.authFailed = false
    this.socketService.initiateGoogleLogin();
  }

  loginWithFacebook(): void {
    this.authFailed = false
    this.facebookProgress = true;
    this.socketService.initiateFacebookLogin();
  }

  async closeModal(): Promise<void> {
    await this.modalController.dismiss();
  }

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    // Clean up socket listeners
    this.socketService.off('auth:login:error');
    this.socketService.off('auth:google:error');
    this.socketService.off('auth:facebook:error');
    this.socketService.off('auth:google:url');
    this.socketService.off('auth:facebook:url');
  }
}