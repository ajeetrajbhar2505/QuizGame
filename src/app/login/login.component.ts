import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { WebService } from '../web.service';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { LoaderService } from '../loader.service';
import { Platform } from '@ionic/angular';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  private authSub!: Subscription;
  private backButtonSubscription!: Subscription;
  loginForm = {
    email: '',
    password: ''
  };
  isLoading = false;
  googleProgress = false;
  facebookProgress = false;

  constructor(
    private readonly router: Router,
    private readonly webService: WebService,
    private readonly socketService: SocketService,
    private readonly modalController: ModalController,
    private readonly inAppBrowser: InAppBrowser,
    private readonly loader: LoaderService,
    private platform: Platform
  ) { }

  ngOnInit() {
    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(10, () => {
      console.log('Back button was pressed!');
    })
    this.setupAuthListeners();
    this.setupSocialLoginCallbacks();
  }
  

  private setupAuthListeners(): void {
    this.authSub = this.socketService.authData$.subscribe(data => {
      if (data) {
        this.handleSuccessfulLogin(data);
      }
    });

    // Listen for specific auth errors
    this.socketService.on('auth:login:error', (error) => {
      this.isLoading = true;
      console.error(error.message, 'danger');
    });

    this.socketService.on('auth:google:error', (error) => {
      this.googleProgress = true;
      console.error(error.message, 'danger');
    });

    this.socketService.on('auth:facebook:error', (error) => {
      this.facebookProgress = true;
      console.error(error.message, 'danger');
    });
  }

  private setupSocialLoginCallbacks(): void {
    // Handle Google auth URL
    this.socketService.on('auth:google:url', (data) => {
      console.log({'auth:google:url': (data)});
      
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
    this.isLoading = false;
    this.googleProgress = false;
    this.facebookProgress = false;
    
    this.loader.userLogged(true);
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
    this.socketService.initiateGoogleLogin();
  }

  loginWithFacebook(): void {
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