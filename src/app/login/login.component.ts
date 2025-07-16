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

interface OtpDetails {
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
  @ViewChild('OTPmodal') otpModal!: IonModal;
  @ViewChild('errorModal') errorModal!: IonModal;
  @ViewChild('googleModal') googleModal!: IonModal;
  @ViewChild('facebookModal') facebookModal!: IonModal;

  loginForm = {
    email: 'fyit.ajeetrajbhar18144@gmail.com',
    otp: ''
  };

  otpDetails?: OtpDetails;
  errorModalStatus = '';
  errorMessage = `
    There was an issue processing your request. Please try one of these solutions:<br><br>
    <div class="main">
    <div class="error">1. Check your internet connection</div>
    <div class="error">2. Retry the operation</div>
    <div class="error">3. Cancel and use a different email address</div></div>
  `;

  isLoading = false;
  googleProgress = false;
  facebookProgress = false;
  authFailed = false;
  otpSuccess = false;
  showOtpModal = false;
  loginSuccess = false;
  connected = '';
  otpTimer = 120;
  canResendOtp = false;

  private timerInterval: any;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private socketService: SocketService,
    private modalController: ModalController,
    private inAppBrowser: InAppBrowser,
    private navCtrl: NavController,
    private platform: Platform,
    private toasterService: ToasterService,
    private dashboardService: DashboardService
  ) {
    this.resetAuthStates();
    this.socketService.initializeSocket('');
  }

  ngOnInit() {
    this.setupSocketListeners();
    this.setupConnectionListener();
  }

  ngOnDestroy() {
    this.cleanupSubscriptions();
    this.stopOtpTimer();
    this.removeSocketListeners();
  }

  private setupSocketListeners(): void {
    this.subscriptions.push(
      this.socketService.authData$.subscribe(data => this.handleAuthSuccess(data))
    );

    this.subscriptions.push(
      this.socketService.otpSuccess.subscribe(data => this.handleOtpSuccess(data))
    );

    this.subscriptions.push(
      this.socketService.loginData$.subscribe(data => this.handleLoginResponse(data))
    );

    this.setupErrorHandlers();
    this.setupSocialLoginCallbacks();
  }

  private setupConnectionListener(): void {
    this.subscriptions.push(
      this.socketService.connectionState$.subscribe(state => this.connected = state)
    );
  }

  private setupErrorHandlers(): void {
    const errorHandlers = {
      'auth:otp:verify:error': (error: any) => this.handleOtpVerifyError(error),
      'auth:login:error': (error: any) => this.handleLoginError(error),
      'auth:google:error': (error: any) => this.handleGoogleError(error),
      'auth:facebook:error': (error: any) => this.handleFacebookError(error)
    };

    Object.entries(errorHandlers).forEach(([event, handler]) => {
      this.socketService.on(event, handler);
    });
  }

  private setupSocialLoginCallbacks(): void {
    this.socketService.on('auth:google:url', (data) => this.openAuthUrl(data.url));
    this.socketService.on('auth:facebook:url', (data) => this.openAuthUrl(data.url));
  }

  private openAuthUrl(url: string): void {
    if (!this.platform.is('cordova')) {
      window.open(url, '_blank');
      return;
    }
    this.inAppBrowser.create(url, '_blank', {
      location: 'yes',
      toolbar: 'yes',
      zoom: 'yes',
    });
  }

  private handleAuthSuccess(data: any): void {
    this.toasterService.presentToast('Login successful', 3000, 'bottom', 'dark');
    this.loginSuccess = true;
    this.isLoading = false;
    this.resetAuthStates();

    if (this.platform.is('android')) {
      this.navCtrl.back();
    }

    setTimeout(() => this.handleSuccessfulLogin(data), 1000);
  }

  private handleOtpSuccess(data: any): void {
    this.toasterService.presentToast('Login successful', 3000, 'bottom', 'dark');
    this.loginSuccess = true;
    this.isLoading = false;
    this.otpSuccess = true;
    setTimeout(() => this.handleSuccessfulLogin(data), 1000);
  }

  private handleLoginResponse(data: any): void {
    if (data) {
      this.toasterService.presentToast('OTP sent successfully!', 3000, 'bottom', 'dark');
      this.loginSuccess = true;
      this.startOtpTimer();
      this.otpDetails = data;
      this.showOtpModal = true;
      this.isLoading = false;
      this.otpSuccess = false;
      this.otpModal.present();
      this.loginForm.otp = "";
    } else {
      this.errorModal.present();
      this.resetAuthStates();
      this.authFailed = true;
    }
  }

  private handleOtpVerifyError(error: any): void {
    this.errorModalStatus = 'auth:otp:verify:error';
    setTimeout(() => {
      this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
      this.isLoading = false;
    }, 1000);
  }

  private handleLoginError(error: any): void {
    this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
    this.errorModalStatus = 'auth:login:error';
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
  }

  private handleGoogleError(error: any): void {
    this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
    this.errorModalStatus = 'auth:google:error';
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
  }

  private handleFacebookError(error: any): void {
    this.toasterService.presentToast(error.message, 3000, 'bottom', 'dark');
    this.errorModalStatus = 'auth:facebook:error';
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
  }

  verifyOTP(): void {
    this.loginSuccess = false;
    if (!this.loginForm.email) {
      console.error('Please enter email', 'warning');
      return;
    }
    if (!this.loginForm.otp) {
      console.error('Invalid OTP', 'warning');
      return;
    }

    this.isLoading = true;
    this.socketService.verifyloginOTP(
      this.loginForm.email, 
      this.loginForm.otp, 
      this.otpDetails!.verificationToken
    );
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
    this.resetAuthStates();
    this.googleProgress = true;
    this.googleModal.present();
    this.authFailed = false;
    this.socketService.initiateGoogleLogin();
  }

  loginWithFacebook(): void {
    this.resetAuthStates();
    this.authFailed = false;
    this.facebookModal.present();
    this.facebookProgress = true;
    this.socketService.initiateFacebookLogin();
  }

  retrySocialLogins(): void {
    switch (this.errorModalStatus) {
      case 'auth:google:error':
        this.loginWithGoogle();
        break;
      case 'auth:facebook:error':
        this.loginWithFacebook();
        break;
      default:
        this.login();
        break;
    }
  }

  async closeModal(): Promise<void> {
    this.showOtpModal = false;
    await this.modalController.dismiss();
  }

  startOtpTimer(): void {
    this.otpTimer = 120;
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
    }
  }

  get formattedTimer(): string {
    const minutes = Math.floor(this.otpTimer / 60);
    const seconds = this.otpTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} seconds`;
  }

  resendOtp(): void {
    if (!this.canResendOtp) return;

    this.login();
    this.startOtpTimer();
    this.loginForm.otp = "";
  }

  private resetAuthStates(): void {
    this.isLoading = false;
    this.googleProgress = false;
    this.facebookProgress = false;
    this.authFailed = false;
    this.otpSuccess = false;
    this.showOtpModal = false;
    this.loginForm.otp = "";
  }

  private handleSuccessfulLogin(data: any): void {
    this.closeModal();
    this.dashboardService.getDashboardStats().subscribe();
    this.dashboardService.getRecentActivity().subscribe();
    this.dashboardService.getLeaderboardUser().subscribe();
    this.socketService.authDataSource.next(data);
    this.router.navigate(['/home'], {
      queryParams: { token: data.token },
      state: { user: data.user }
    });
  }

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private removeSocketListeners(): void {
    const events = [
      'auth:login:success',
      'auth:register:success',
      'auth:google:success',
      'auth:facebook:success',
      'auth:otp:verify:success',
      'auth:google:callback',
      'auth:facebook:callback',
      'auth:error',
      'receiveLogin'
    ];
    
    events.forEach(event => this.socketService.off(event));
  }
}