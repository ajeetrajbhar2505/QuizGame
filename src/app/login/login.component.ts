import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../socket.service';
import { Subject, Subscription, timer } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { IonModal } from '@ionic/angular';
import { ToasterService } from '../toaster.service';
import { DashboardService } from '../dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { CreateQuizesService } from '../create-quizes.service';

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
    email: '',
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

  // State flags
  continuewith = false;
  isLoading = false;
  googleProgress = false;
  facebookProgress = false;
  authFailed = false;
  otpSuccess = false;
  showOtpModal = false;
  loginSuccess = false;
  canResendOtp = false;
  connectionState = 'disconnected';

  // Timer
  otpTimer = 120;
  private timerSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private socketService: SocketService,
    private modalController: ModalController,
    private toasterService: ToasterService,
    private dashboardService: DashboardService,
    private createQuizesService: CreateQuizesService
  ) { }

  ngOnInit() {
    this.setupSocketListeners();
    this.listenForSocialUrls();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private listenForSocialUrls(): void {
    this.subscriptions.push(
      this.socketService.url$.subscribe(({ url }) => {
        console.log('Received social login URL:', url);
        // Handle the URL - it will be automatically opened by the SocketService
        // You can add additional logic here if needed
      })
    );
  }

  private setupSocketListeners(): void {
    this.subscriptions.push(
      this.socketService.connectionState.subscribe(state => {
        this.connectionState = state;
        console.log('Connection state changed:', state);
      })
    );

    this.subscriptions.push(
      this.socketService.authData$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => this.handleAuthSuccess(data))
    );

    this.subscriptions.push(
      this.socketService.otpSuccess$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => this.handleOtpSuccess(data))
    );

    this.subscriptions.push(
      this.socketService.loginData$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => this.handleLoginResponse(data))
    );

    this.subscriptions.push(
      this.socketService.authError$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => this.handleAuthError(data))
    );
  }

  async handleAuthSuccess(data: any) {
    if (!data) return;

    this.toasterService.presentToast('Login successful', 3000, 'bottom', 'success');
    this.loginSuccess = true;
    this.isLoading = false;
    this.resetAuthStates();

    await this.handleSuccessfulLogin(data);
  }

  private handleOtpSuccess(data: any): void {
    // this.toasterService.presentToast('Login successful', 3000, 'bottom', 'success');
    this.loginSuccess = true;
    this.isLoading = false;
    this.otpSuccess = true;
    this.handleSuccessfulLogin(data);
  }

  async handleLoginResponse(otpDetails: any) {
    if (!otpDetails) {
      this.showErrorModal();
      return;
    }

    // this.toasterService.presentToast('OTP sent successfully!', 3000, 'bottom', 'success');
    this.loginSuccess = true;
    this.startOtpTimer();
    this.otpDetails = otpDetails;
    this.showOtpModal = true;
    this.isLoading = false;
    this.otpSuccess = false;

    try {
      await this.otpModal.present();
      const { data } = await this.otpModal.onDidDismiss();

      if (!data) {
        this.resetForm();
      }
    } catch (error) {
      console.error('Error presenting OTP modal:', error);
    }
  }

  private showErrorModal(): void {
    this.errorModal.present();
    this.resetAuthStates();
    this.authFailed = true;
  }

  handleAuthError(message: string) {
    this.toasterService.presentToast(message, 3000, 'bottom', 'danger');
    setTimeout(() => {
      if (!this.loginSuccess) {
        this.resetAuthStates();
        this.authFailed = true;
        this.isLoading = false;
        this.showErrorModal();
      }
    }, 1000);
  }

  async verifyOTP(): Promise<void> {
    if (!this.validateOtpForm()) return;

    this.isLoading = true;
    try {
      await this.socketService.verifyLoginOTP(
        this.loginForm.email,
        this.loginForm.otp,
        this.otpDetails!.verificationToken
      );
    } catch (error: any) {
      this.handleAuthError(error.message);
    }
  }

  private validateOtpForm(): boolean {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!this.loginForm.email) {
      this.toasterService.presentToast('Please enter email', 3000, 'bottom');
      return false;
    }

    if (!emailRegex.test(this.loginForm.email)) {
      this.toasterService.presentToast('Please enter valid email', 3000, 'bottom');
      return false;
    }

    if (!this.loginForm.otp) {
      this.toasterService.presentToast('Invalid OTP', 3000, 'bottom');
      return false;
    }

    return true;
  }

  async login(): Promise<void> {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!this.loginForm.email) {
      this.toasterService.presentToast('Please enter email', 3000, 'bottom');
      return;
    }

    if (!emailRegex.test(this.loginForm.email)) {
      this.toasterService.presentToast('Please enter valid email', 3000, 'bottom');
      return;
    }

    this.authFailed = false;
    this.isLoading = true;
    try {
      await this.socketService.login(this.loginForm.email);
    } catch (error: any) {
      this.handleAuthError(error.message);
    }
  }

  async loginWithGoogle() {
    this.resetAuthStates();
    this.googleProgress = true;
    this.errorModalStatus = 'auth:google:error';

    try {
      await this.googleModal.present();
      this.socketService.initiateGoogleLogin();
    } catch (error) {
      this.googleProgress = false;
      this.handleAuthError('Failed to initiate Google login');
    }
  }

  async loginWithFacebook() {
    this.resetAuthStates();
    this.facebookProgress = true;
    this.errorModalStatus = 'auth:facebook:error';

    try {
      await this.facebookModal.present();
      this.socketService.initiateFacebookLogin();
    } catch (error) {
      this.facebookProgress = false;
      this.handleAuthError('Failed to initiate Facebook login');
    }
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

  private startOtpTimer(): void {
    this.stopOtpTimer();
    this.otpTimer = 120;
    this.canResendOtp = false;

    this.timerSubscription = timer(0, 1000).subscribe(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.stopOtpTimer();
        this.canResendOtp = true;
      }
    });
  }

  private stopOtpTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  get formattedTimer(): string {
    const minutes = Math.floor(this.otpTimer / 60);
    const seconds = this.otpTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
  }

  private resetForm(): void {
    this.loginForm.email = "";
    this.loginForm.otp = "";
    this.toasterService.dismiss();
    this.continuewith = false;
    this.isLoading = false;
  }

  private async handleSuccessfulLogin(data: any): Promise<void> {
    await this.closeModal();

    // Load initial data
    this.dashboardService.getDashboardStats().subscribe();
    this.dashboardService.getLeaderboardUser(3).subscribe();
    this.createQuizesService.initializeData();

    // Navigate to home
    this.router.navigate(['/home'], {
      queryParams: { token: data.token },
      state: { user: data.user }
    });
  }

  async closeModal(): Promise<void> {
    this.showOtpModal = false;
    try {
      await this.modalController.dismiss();
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }

  private cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopOtpTimer();
    this.cleanupSubscriptions();
  }

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  // UI Helpers
  focusInput(): void {
    this.continuewith = true;
    setTimeout(() => {
      const inputElement = document.getElementById('input');
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);
  }
}