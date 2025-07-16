import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { NavController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { IonModal } from '@ionic/angular';
import { ToasterService } from '../toaster.service';
import { DashboardService } from '../dashboard.service';

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
  connected: String = ''
  constructor(
    private readonly router: Router,
    private readonly socketService: SocketService,
    private readonly modalController: ModalController,
    private readonly inAppBrowser: InAppBrowser,
    private navCtrl: NavController,
    private platform: Platform,
    private toasterService: ToasterService,
    private dashboardService: DashboardService
  ) {
    this.resetAuthStates();
    this.socketService.initializeSocket('')
  }

  ngOnInit() {
    this.setupAuthListeners();
    this.setupSocialLoginCallbacks();
    this.socketService.connectionState$.subscribe(data => {
      this.connected = data
    })
  }

  retrySocialLogins() {
    switch (this.errorModalStatus) {
      case 'auth:google:error':
        this.loginWithGoogle()
        break;
      case 'auth:facebook:error':
        this.loginWithFacebook()
        break;
      default:
        this.login()
        break;
    }
  }

  private setupAuthListeners(): void {
    this.authSub = this.socketService.authData$.subscribe(data => {
      if (data) {
        this.toasterService.presentToast('Login successful', 3000, 'bottom', 'dark');
        this.loginSuccess = true
        this.isLoading = false
        this.resetAuthStates();

        if (this.platform.is('android')) {
          this.navCtrl.back();
        }

        setTimeout(() => {
          this.handleSuccessfulLogin(data);
        }, 1000);
      }
    });

    this.otpSub = this.socketService.otpSuccess.subscribe(data => {
      if (data) {
        this.toasterService.presentToast('Login successful', 3000, 'bottom', 'dark');
        this.loginSuccess = true
        this.isLoading = false
        this.otpSuccess = true;
        setTimeout(() => {
          this.handleSuccessfulLogin(data);
        }, 1000);
      }
    });

    this.loginSub = this.socketService.loginData$.subscribe((data: any) => {
      this.toasterService.presentToast('OTP send successfully!', 3000, 'bottom', 'dark');
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
      }
    });

    // Listen for specific auth errors

    this.socketService.on('auth:otp:verify:error', (error) => {
      this.errorModalStatus = 'auth:otp:verify:error'
      setTimeout(() => {
        this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
        this.isLoading = false;
      }, 1000);

    });

    this.socketService.on('auth:login:error', (error) => {
      this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
      this.errorModalStatus = 'auth:login:error'
      setTimeout(() => {
        if (!this.loginSuccess) {
          this.resetAuthStates();
          this.authFailed = true;
          this.isLoading = false;
          this.errorModal.present();
          if (this.platform.is('android')) {
            this.navCtrl.back();
          }
        }
      }, 1000);

    });

    this.socketService.on('auth:google:error', (error) => {
      this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
      this.errorModalStatus = 'auth:google:error'
      setTimeout(() => {
        if (!this.loginSuccess) {
          this.resetAuthStates();
          this.isLoading = false;
          this.authFailed = true;
          this.googleProgress = false;
          if (this.platform.is('android')) {
            this.navCtrl.back();
          }
        }
      }, 1000);

    });

    this.socketService.on('auth:facebook:error', (error) => {
      this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
      this.errorModalStatus = 'auth:facebook:error'
      setTimeout(() => {
        if (!this.loginSuccess) {
          this.resetAuthStates();
          this.isLoading = false;
          this.authFailed = true;
          this.facebookProgress = false;
          if (this.platform.is('android')) {
            this.navCtrl.back();
          }
        }
      }, 1000);

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
      this.dashboardService.getDashboardStats().subscribe()
      this.dashboardService.getRecentActivity().subscribe()
      this.dashboardService.getLeaderboardUser().subscribe()
      this.socketService.authDataSource.next(data)
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

    this.authFailed = false;
    this.isLoading = true;
    this.socketService.login(this.loginForm.email);
  }

  loginWithGoogle() {
    this.resetAuthStates()
    this.googleProgress = true;
    this.googleModal.present()
    this.authFailed = false;
    this.socketService.initiateGoogleLogin();
  }

  loginWithFacebook() {
    this.resetAuthStates()
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
    this.removeAuthEvents()
  }

  private removeAuthEvents(): void {
    if (!this.socketService.socket) return;
    
    this.socketService.off('auth:login:success');
    this.socketService.off('auth:register:success');
    this.socketService.off('auth:google:success');
    this.socketService.off('auth:facebook:success');
    this.socketService.off('auth:otp:verify:success');
    this.socketService.off('auth:google:callback');
    this.socketService.off('auth:facebook:callback');
    this.socketService.off('auth:error');
    this.socketService.off('receiveLogin');
  }
}