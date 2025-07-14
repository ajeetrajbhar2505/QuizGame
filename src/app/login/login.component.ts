import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../socket.service';
import { Subscription, timer } from 'rxjs';
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

type AuthErrorType = 
  | 'auth:otp:verify:error' 
  | 'auth:login:error' 
  | 'auth:google:error' 
  | 'auth:facebook:error';

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

  private subscriptions: Subscription = new Subscription();
  private otpTimerSub?: Subscription;

  loginForm = {
    email: 'fyit.ajeetrajbhar18144@gmail.com',
    otp: ''
  };

  otpDetails?: OtpDetails;
  errorModalStatus: AuthErrorType | null = null;
  errorMessage = `
    There was an issue processing your request. Please try one of these solutions:<br><br>
    <div class="main">
      <div class="error">1. Check your internet connection</div>
      <div class="error">2. Retry the operation</div>
      <div class="error">3. Cancel and use a different email address</div>
    </div>
  `;

  // State flags
  isLoading = false;
  googleProgress = false;
  facebookProgress = false;
  authFailed = false;
  otpSuccess = false;
  showOtpModal = false;
  loginSuccess = false;
  canResendOtp = false;

  // Timer
  otpTimer = 120;
  connectionState = 'disconnected';

  constructor(
    private readonly router: Router,
    private readonly socketService: SocketService,
    private readonly modalController: ModalController,
    private readonly inAppBrowser: InAppBrowser,
    private navCtrl: NavController,
    private platform: Platform,
    private toasterService: ToasterService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.resetAuthStates();
    this.setupAuthListeners();
    this.setupSocialLoginCallbacks();
    this.setupConnectionListener();
  }

  private setupConnectionListener(): void {
    this.subscriptions.add(
      this.socketService.connectionState.subscribe(state => {
        this.connectionState = state;
      })
    );
  }

  retrySocialLogins(): void {
    if (!this.errorModalStatus) return;

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

  private setupAuthListeners(): void {
    // Auth success listeners
    this.subscriptions.add(
      this.socketService.authData$.subscribe(data => {
        if (data) {
          this.handleAuthSuccess(data);
        }
      })
    );

    this.subscriptions.add(
      this.socketService.otpSuccess$.subscribe(data => {
        if (data) {
          this.handleOtpSuccess(data);
        }
      })
    );

    this.subscriptions.add(
      this.socketService.loginData$.subscribe(data => {
        if (data) {
          this.handleOtpSent(data);
        } else {
          this.handleAuthFailure();
        }
      })
    );

    // Error listeners
    this.setupErrorListeners();
  }

  private setupErrorListeners(): void {
    const errorHandlers: Record<AuthErrorType, (error: {message: string}) => void> = {
      'auth:otp:verify:error': (error) => this.handleOtpVerifyError(error),
      'auth:login:error': (error) => this.handleLoginError(error),
      'auth:google:error': (error) => this.handleGoogleError(error),
      'auth:facebook:error': (error) => this.handleFacebookError(error)
    };

    Object.entries(errorHandlers).forEach(([event, handler]) => {
      this.subscriptions.add(
        this.socketService.fromEvent(event).subscribe()
      );
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

    setTimeout(() => {
      this.handleSuccessfulLogin(data);
    }, 1000);
  }

  private handleOtpSuccess(data: any): void {
    this.toasterService.presentToast('Login successful', 3000, 'bottom', 'dark');
    this.loginSuccess = true;
    this.isLoading = false;
    this.otpSuccess = true;
    
    setTimeout(() => {
      this.handleSuccessfulLogin(data);
    }, 1000);
  }

  private handleOtpSent(data: any): void {
    this.toasterService.presentToast('OTP sent successfully!', 3000, 'bottom', 'dark');
    this.loginSuccess = true;
    this.startOtpTimer();
    this.otpDetails = data;
    this.showOtpModal = true;
    this.isLoading = false;
    this.otpSuccess = false;
    this.otpModal.present();
    this.loginForm.otp = "";
  }

  private handleAuthFailure(): void {
    this.errorModal.present();
    this.resetAuthStates();
    this.authFailed = true;
  }

  private handleOtpVerifyError(error: {message: string}): void {
    this.errorModalStatus = 'auth:otp:verify:error';
    this.showErrorToast(error.message);
  }

  private handleLoginError(error: {message: string}): void {
    this.errorModalStatus = 'auth:login:error';
    this.showErrorToast(error.message);
    this.handleCommonError();
  }

  private handleGoogleError(error: {message: string}): void {
    this.errorModalStatus = 'auth:google:error';
    this.showErrorToast(error.message);
    this.handleCommonError();
    this.googleProgress = false;
  }

  private handleFacebookError(error: {message: string}): void {
    this.errorModalStatus = 'auth:facebook:error';
    this.showErrorToast(error.message);
    this.handleCommonError();
    this.facebookProgress = false;
  }

  private handleCommonError(): void {
    if (!this.loginSuccess) {
      this.resetAuthStates();
      this.isLoading = false;
      this.authFailed = true;
      this.errorModal.present();
      
      if (this.platform.is('android')) {
        this.navCtrl.back();
      }
    }
  }

  private showErrorToast(message: string): void {
    setTimeout(() => {
      this.toasterService.presentToast(message, 3000, 'bottom', 'dark');
    }, 1000);
  }

  verifyOTP(): void {
    this.loginSuccess = false;
    
    if (!this.loginForm.email) {
      this.toasterService.presentToast('Please enter email', 3000, 'bottom', 'warning');
      return;
    }
    
    if (!this.loginForm.otp) {
      this.toasterService.presentToast('Invalid OTP', 3000, 'bottom', 'warning');
      return;
    }

    if (!this.otpDetails?.verificationToken) {
      this.toasterService.presentToast('Verification token missing', 3000, 'bottom', 'warning');
      return;
    }

    this.isLoading = true;
    this.socketService.verifyLoginOTP(
      this.loginForm.email, 
      this.loginForm.otp, 
      this.otpDetails.verificationToken
    );
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

  private setupSocialLoginCallbacks(): void {
    this.authFailed = false;

    // Handle Google auth URL
    this.subscriptions.add(
      this.socketService.fromEvent<{url: string}>('auth:google:url').subscribe(data => {
        this.openExternalUrl(data.url);
      })
    );

    // Handle Facebook auth URL
    this.subscriptions.add(
      this.socketService.fromEvent<{url: string}>('auth:facebook:url').subscribe(data => {
        this.openExternalUrl(data.url);
      })
    );
  }

  private openExternalUrl(url: string): void {
    if (!this.platform.is('cordova') && !this.platform.is('capacitor')) {
      window.open(url, '_blank');
      return;
    }
    
    this.inAppBrowser.create(url, '_blank', {
      location: 'yes',
      toolbar: 'yes',
      zoom: 'yes',
    });
  }

  private handleSuccessfulLogin(data: any): void {
    this.closeModal();
    this.router.navigate(['/home'], {
      queryParams: { token: data.token },
      state: { user: data.user }
    });
  }

  login(): void {
    if (!this.loginForm.email) {
      this.toasterService.presentToast('Please enter email', 3000, 'bottom', 'warning');
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

  async closeModal(): Promise<void> {
    this.showOtpModal = false;
    await this.modalController.dismiss();
  }

  startOtpTimer(): void {
    this.stopOtpTimer();
    this.otpTimer = 120;
    this.canResendOtp = false;
    
    this.otpTimerSub = timer(0, 1000).subscribe(() => {
      this.otpTimer--;
      
      if (this.otpTimer <= 0) {
        this.stopOtpTimer();
        this.canResendOtp = true;
      }
    });
  }

  stopOtpTimer(): void {
    if (this.otpTimerSub) {
      this.otpTimerSub.unsubscribe();
      this.otpTimerSub = undefined;
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

  ngOnDestroy(): void {
    this.stopOtpTimer();
    this.subscriptions.unsubscribe();
  }
}