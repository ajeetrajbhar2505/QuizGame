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
  private otpSub!: Subscription;
  @ViewChild('OTPmodal') OTPmodal!: IonModal;
  @ViewChild('errorModal') errorModal!: IonModal;
  @ViewChild('googleModal') googleModal!: IonModal;
  @ViewChild('facebookModal') facebookModal!: IonModal;
  errorModalStatus: string = ""
  errorMessage: string = `
  There was an issue processing your request. Please try one of these solutions:<br><br>
  <div class="main">
  <div class="error">1. Check your internet connection</div>
  <div class="error">2. Retry the operation</div>
  <div class="error">3. Cancel and use a different email address</div></div>
`;

  OtpDetails!: OtpDetails;
  loginForm = {
    email: '',
    otp: ''
  };
  isLoading = false;
  googleProgress = false;
  facebookProgress = false;
  authFailed: boolean = false;
  otpSuccess: boolean = false;
  showOtpModal: boolean = false;
  otpTimer: number = 120;
  timerInterval: any;
  canResendOtp: boolean = false;
  loginSuccess: boolean = false

  constructor(
    private readonly router: Router,
    public readonly socketService: SocketService,
    private readonly modalController: ModalController,
    private readonly inAppBrowser: InAppBrowser,
    private navCtrl: NavController,
    private platform: Platform
  ) {
    this.resetAuthStates();
    this.socketService.initializeSocket('')
  }

  ngOnInit() {
    this.setupAuthListeners();
    this.setupSocialLoginCallbacks();
  }

  async retrySocialLogins() {
    // Close all modals first
    await this.modalController.dismiss();

    // Reset all relevant states
    this.resetAuthStates();
    this.errorModalStatus = '';

    // Add a small delay to ensure modal is fully dismissed
    setTimeout(() => {
      switch (this.errorModalStatus) {
        case 'auth:google:error':
          this.googleProgress = true;
          this.socketService.retryConnection();
          this.socketService.initiateGoogleLogin();
          break;
        case 'auth:facebook:error':
          this.facebookProgress = true;
          this.socketService.retryConnection();
          this.socketService.initiateFacebookLogin();
          break;
        default:
          this.socketService.retryConnection();
          this.login();
          break;
      }
    }, 300);
  }

  private setupAuthListeners(): void {

    this.socketService.off('auth:login:error');
    this.socketService.off('auth:google:error');
    this.socketService.off('auth:facebook:error');

    this.authSub = this.socketService.authData$.subscribe(data => {
      console.log({ authdata: data });

      if (data) {
        this.loginSuccess = true
        this.isLoading = false
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

    this.otpSub = this.socketService.otpSuccess.subscribe(data => {
      console.log({ otpSuccess: data });
      if (data) {
        this.loginSuccess = true
        this.isLoading = false
        this.otpSuccess = true;
        setTimeout(() => {
          this.handleSuccessfulLogin(data);
        }, 1000);
      }
    });

    this.loginSub = this.socketService.loginData$.subscribe((data: any) => {
      console.log({ loginData: data });

      if (data) {
        this.loginSuccess = true
        this.startOtpTimer()
        this.OtpDetails = data;
        this.showOtpModal = true;
        this.isLoading = false
        this.otpSuccess = false;
        this.OTPmodal.present();
        this.loginForm.otp = "";
      } else {
        this.errorModal.present();
        this.resetAuthStates();
        this.authFailed = true;
        console.log(data);
      }
    });

    // Listen for specific auth errors

    this.socketService.on('auth:login:error', (error) => {
      this.handleAuthError('auth:login:error', error);
    });

    this.socketService.on('auth:google:error', (error) => {
      this.handleAuthError('auth:google:error', error);
    });

    this.socketService.on('auth:facebook:error', (error) => {
      this.handleAuthError('auth:facebook:error', error);
    });

  }

  protected verifyOTP() {
    this.loginSuccess = false
    if (!this.loginForm.email) {
      console.error('Please enter email', 'warning');
      return;
    }
    if (!this.loginForm.otp) {
      console.error('Invalid OTP', 'warning');
      return;
    }

    this.isLoading = true;
    this.socketService.verifyloginOTP(this.loginForm.email, this.loginForm.otp, this.OtpDetails.verificationToken);
  }

  private resetAuthStates(): void {
    this.isLoading = false;
    this.googleProgress = false;
    this.facebookProgress = false;
    this.authFailed = false;
    this.otpSuccess = false;
    this.showOtpModal = false;
    this.loginForm.email = 'fyit.ajeetrajbhar18144@gmail.com'
    this.loginForm.otp = ""
  }

  private setupSocialLoginCallbacks(): void {
    this.authFailed = false;

    // Handle Google auth URL
    this.socketService.on('auth:google:url', (data) => {
      if (!this.platform.is('cordova') || !this.platform.is('capacitor')) {
        window.open(data.url, '_blank')
        return;
      }
      this.inAppBrowser.create(data.url, '_blank', {
        location: 'yes',
        toolbar: 'yes',
        zoom: 'yes',
      });
    });

    // Handle Facebook auth URL
    this.socketService.on('auth:facebook:url', (data) => {
      if (!this.platform.is('cordova') || !this.platform.is('capacitor')) {
        window.open(data.url, '_blank')
        return;
      }
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

  private handleAuthError(type: string, error: any) {
    this.errorModalStatus = type;
    this.resetAuthStates();
    this.authFailed = true;

    // Ensure UI updates properly
    setTimeout(() => {
      if (!this.loginSuccess) {
        if (this.platform.is('android')) {
          this.navCtrl.back();
        }
      }
    }, 1000);
  }

  login(): void {
    if (!this.loginForm.email) {
      console.error('Please enter email', 'warning');
      return;
    }

    this.authFailed = false;
    this.isLoading = true;
    this.socketService.login(this.loginForm.email);
  }

  loginWithGoogle(): void {
    this.googleProgress = true;
    this.googleModal.present()
    this.authFailed = false;
    this.socketService.initiateGoogleLogin();
  }

  loginWithFacebook(): void {
    this.authFailed = false;
    this.facebookModal.present()
    this.facebookProgress = true;
    this.socketService.initiateFacebookLogin();
  }

  async closeModal(): Promise<void> {
    this.showOtpModal = false;
    await this.modalController.dismiss();
  }

  startOtpTimer(): void {
    this.otpTimer = 120; // Reset to 2 minutes
    this.canResendOtp = false;
    this.timerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.stopOtpTimer();
        this.canResendOtp = true;
      }
    }, 1000);
  }

  stopOtpTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formatTimer(): string {
    const minutes = Math.floor(this.otpTimer / 60);
    const seconds = this.otpTimer % 60;
    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} seconds`;
  }

  resendOtp(): void {
    if (!this.canResendOtp) return;

    this.login();
    this.startOtpTimer();
    this.loginForm.otp = ""
  }

  ngOnDestroy(): void {
    this.stopOtpTimer()
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    if (this.loginSub) {
      this.loginSub.unsubscribe();
    }
    if (this.otpSub) {
      this.otpSub.unsubscribe();
    }
    // Clean up socket listeners
    this.socketService.off('auth:login:error');
    this.socketService.off('auth:google:error');
    this.socketService.off('auth:facebook:error');
    this.socketService.off('auth:google:url');
    this.socketService.off('auth:facebook:url');
  }
}