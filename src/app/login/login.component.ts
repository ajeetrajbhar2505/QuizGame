import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { NavController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { IonModal } from '@ionic/angular';

export interface OtpDetails {
  success: boolean;
  message: string;
  otpId: string;
  verificationToken: string;
  expiresAt: Date;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  private authSub!: Subscription;
  private loginSub!: Subscription;
  @ViewChild('modal') modal!: IonModal;
  @ViewChild('errorModal') errorModal!: IonModal;
  errorMessage: string = `
  There was an issue processing your request. Please try one of these solutions:<br><br>
  <div class="main">
  <div class="error">1. Check your internet connection</div>
  <div class="error">2. Retry the operation</div>
  <div class="error">3. Cancel and use a different email address</div></div>
`;

  OtpDetails!:OtpDetails
  loginForm = {
    email: '',
    otp: ''
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
        this.resetAuthStates();
        
        if (this.platform.is('android')) {
          this.navCtrl.back();
          this.navCtrl.back();
        }

        setTimeout(() => {
          this.handleSuccessfulLogin(data);
        }, 1000);
      }
    });


    this.loginSub = this.socketService.loginData$.subscribe((data:any) => {
      if (data) {
        this.OtpDetails = data
        this.modal.present();
      }
      else{
        this.errorModal.present();
        this.resetAuthStates();
        this.authFailed = true;
        console.log(data);
      }
    })
    // Listen for specific auth errors
    this.socketService.on('auth:login:error', (error) => {
      console.log(error);
      // this.errorMessage = error.message
      this.resetAuthStates();
      this.authFailed = true;
      this.isLoading = false;
      this.errorModal.present();
      if (this.platform.is('android')) {
        this.navCtrl.back();
      }
    });

    this.socketService.on('auth:google:error', (error) => {
      console.log(error);
      // this.errorMessage = error.message
      this.resetAuthStates();
      this.authFailed = true;
      this.googleProgress = false;
      if (this.platform.is('android')) {
        this.navCtrl.back();
      }
    });

    this.socketService.on('auth:facebook:error', (error) => {
      console.log(error);
      // this.errorMessage = error.message
      this.resetAuthStates();
      this.authFailed = true;
      this.facebookProgress = false;
      if (this.platform.is('android')) {
        this.navCtrl.back();
      }
    });
  }
  

  protected verifyOTP(){
    if (!this.loginForm.email) {
      console.error('Please enter email', 'warning');
      return;
    }
    if (!this.loginForm.otp) {
      console.error('Invalid OTP', 'warning');
      return;
    }

    this.isLoading = true;
    this.socketService.verifyloginOTP(this.loginForm.email,this.loginForm.otp,this.OtpDetails.verificationToken)
  }


  private resetAuthStates(): void {
    this.isLoading = false;
    this.googleProgress = false;
    this.facebookProgress = false;
    this.authFailed = false;
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
    if (!this.loginForm.email) {
      console.error('Please enter email', 'warning');
      return;
    }

    this.isLoading = true;
    this.socketService.login(this.loginForm.email);
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