import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  @ViewChild('OTPmodal') otpModal!: IonModal;
  @ViewChild('errorModal') errorModal!: IonModal;
  @ViewChild('googleModal') googleModal!: IonModal;
  @ViewChild('facebookModal') facebookModal!: IonModal;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  loginForm = {
    email: '',
    otp: ''
  };

  config = {
    length: 5,
    inputStyles: {
      'width': '50px',
      'height': '50px',
      'font-size': '24px'
    }
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
    private createQuizesService: CreateQuizesService,
    private cdr: ChangeDetectorRef
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
        // Handle the URL - it will be automatically opened by the SocketService
        // You can add additional logic here if needed
      })
    );
  }

  private setupSocketListeners(): void {
    this.subscriptions.push(
      this.socketService.connectionState.subscribe(state => {
        this.connectionState = state;
        this.cdr.detectChanges()
      })
    );

    this.subscriptions.push(
      this.socketService.authData$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => this.handleAuthSuccess(data))
    );

    this.subscriptions.push(
      this.socketService.loginError$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => this.handleLoginError(data))
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

  async handleLoginError(data: any) {
    if (!data) return;
    this.loginSuccess = false;
    this.isLoading = false;
    this.resetAuthStates();
    this.cdr.detectChanges()
  }


  async handleAuthSuccess(data: any) {
    if (!data) return;
    this.loginSuccess = true;
    this.isLoading = false;
    this.resetAuthStates();
    this.cdr.detectChanges()
    await this.handleSuccessfulLogin(data);
  }

  private handleOtpSuccess(data: any): void {
    // this.toasterService.presentToast('Login successful', 3000, 'bottom', 'success');
    this.loginSuccess = true;
    this.isLoading = false;
    this.otpSuccess = true;
    this.handleSuccessfulLogin(data);
    this.cdr.detectChanges()
  }

  async handleLoginResponse(otpDetails: any) {
    if (!otpDetails) {
      this.showErrorModal();
      return;
    }

    // this.toasterService.presentToast('OTP sent successfully!', 3000, 'bottom', 'success');
    this.loginSuccess = true;
    this.otpDetails = otpDetails;
    this.showOtpModal = true;
    this.isLoading = false;
    this.otpSuccess = false;
    this.cdr.detectChanges()

    try {
      await this.otpModal.present();
      this.startOtpTimer();
      const { data } = await this.otpModal.onDidDismiss();

      if (!data) {
        this.resetForm();
      }
      this.cdr.detectChanges()
    } catch (error) {
      console.error('Error presenting OTP modal:', error);
    }
  }

  private showErrorModal(): void {
    if (!this.errorModal) {
      return
    }
    this.errorModal.present();
    this.resetAuthStates();
    this.authFailed = true;
    this.cdr.detectChanges()
  }

  handleAuthError(message: string) {
    this.toasterService.presentToast(message, 3000, 'bottom', 'danger');
    setTimeout(() => {
      if (!this.loginSuccess) {
        this.resetAuthStates();
        this.authFailed = true;
        this.isLoading = false;
        this.showErrorModal();
        this.cdr.detectChanges()
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
      this.cdr.detectChanges()
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
      this.isLoading = false
      if (this.otpModal) {
        this.otpModal.dismiss()
      }
      this.otpDetails = undefined
      this.handleAuthError(error.message);
    }

    this.cdr.detectChanges()
  }

  async loginWithGoogle() {
    this.resetAuthStates();
    this.googleProgress = true;
    this.errorModalStatus = 'auth:google:error';

    try {
      this.socketService.initiateGoogleLogin();
      if (this.googleModal) {
        await this.googleModal.present();
      }
    } catch (error) {
      if (this.googleModal) {
        this.googleModal.dismiss()
      }
      this.googleProgress = false;
      this.handleAuthError('Failed to initiate Google login');
    }
  }

  async loginWithFacebook() {
    this.resetAuthStates();
    this.facebookProgress = true;
    this.errorModalStatus = 'auth:facebook:error';

    try {
      this.socketService.initiateFacebookLogin();
      if (this.facebookModal) {
        await this.facebookModal.present()
      }
    } catch (error) {
      if (this.facebookModal) {
        this.facebookModal.dismiss()
      }
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
      this.cdr.detectChanges();
      if (this.otpTimer <= 0) {
        this.stopOtpTimer();
        this.canResendOtp = true;
        this.cdr.detectChanges();
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
    this.showOtpModal = false;
    this.loginForm.email = "";
    this.loginForm.otp = "";
    this.continuewith = false;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private async handleSuccessfulLogin(data: any): Promise<void> {
    await this.closeModal();

    // Load initial data
    this.dashboardService.getDashboardStats().subscribe();
    this.dashboardService.getLeaderboardUser().subscribe();
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
    this.scrollToShowContent()
    this.continuewith = true;
    setTimeout(() => {
      const inputElement = document.getElementById('input');
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);
  }
  onOtpChange(value: any) {
    this.loginForm.otp = value;
  }


  scrollToShowContent() {
    try {
      const container = this.scrollContainer.nativeElement;
      const buttonHeight = 50; // Adjust this to your button's actual height

      // Scroll to show content but leave space for the button
      container.scrollTop = container.scrollHeight - container.clientHeight - buttonHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }
}