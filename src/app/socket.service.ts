import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject, ReplaySubject } from 'rxjs';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { ToasterService } from './toaster.service';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

export interface AuthData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    isVerified: boolean;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  socket!: Socket;
  private authDataSource = new ReplaySubject<AuthData | null>(1);
  private loginDataSource = new ReplaySubject<AuthData | null>(1);
  private otpDataSource = new ReplaySubject<AuthData | null>(1);
  private connectionState$ = new BehaviorSubject<ConnectionState>('disconnected');

  public authData$: Observable<AuthData | null> = this.authDataSource.asObservable();
  public loginData$: Observable<AuthData | null> = this.loginDataSource.asObservable();
  public otpSuccess$: Observable<AuthData | null> = this.otpDataSource.asObservable();
  public connectionState: Observable<ConnectionState> = this.connectionState$.asObservable();

  private connectionAttempts = 0;
  private maxReconnectionAttempts = 5;

  constructor(
    private router: Router,
    private toasterService: ToasterService,
    private http: HttpClient,
    private inAppBrowser: InAppBrowser,
    private platform: Platform
  ) {
    this.initializeSocket(localStorage.getItem('token') || undefined);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeSocket(token?: string): void {
    this.cleanupSocket();

    this.socket = io(environment.apiURL, {
      transports: ['websocket'],
      reconnection: true,
      autoConnect: true,
      auth: token ? { token } : undefined,
      reconnectionDelay: this.calculateReconnectionDelay(),
      reconnectionAttempts: this.maxReconnectionAttempts
    });

    this.setupConnectionMonitoring();
    this.registerAuthEvents();
  }

  private calculateReconnectionDelay(): number {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, this.connectionAttempts), maxDelay);
    return delay + Math.random() * delay;
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
  }

  private cleanup(): void {
    this.cleanupSocket();
    this.authDataSource.complete();
    this.loginDataSource.complete();
    this.otpDataSource.complete();
    this.connectionState$.complete();
  }

  private setupConnectionMonitoring(): void {
    this.socket.on('connect', () => {
      this.connectionAttempts = 0;
      this.connectionState$.next('connected');
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (err: Error) => {
      this.handleConnectionError(err);
    });

    this.socket.on('reconnect_attempt', () => {
      this.connectionAttempts++;
      this.connectionState$.next('reconnecting');
    });

    this.socket.on('reconnect_failed', () => {
      this.connectionState$.next('error');
      this.toasterService.presentToast(
        'Connection failed. Please refresh the page.',
        3000,
        'bottom',

      );
    });
  }

  private handleDisconnect(reason: Socket.DisconnectReason): void {
    console.log(`Disconnected: ${reason}`);
    this.connectionState$.next('disconnected');

    if (reason === 'io server disconnect') {
      this.handleUnauthorized();
    }
  }

  private handleConnectionError(err: Error): void {
    console.error('Connection error:', err);
    this.connectionState$.next('error');

    if (this.connectionAttempts < this.maxReconnectionAttempts) {
      setTimeout(() => {
        this.retryConnection();
      }, this.calculateReconnectionDelay());
    }
  }

  private registerAuthEvents(): void {
    this.socket.on('auth:login:success', this.handleLoginSuccess.bind(this));
    this.socket.on('auth:register:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:google:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:facebook:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:otp:verify:success', this.handleOtpSuccess.bind(this));
    this.socket.on('auth:google:callback', this.handleGoogleCallback.bind(this));
    this.socket.on('auth:facebook:callback', this.handleFacebookCallback.bind(this));

    // Auth error events
    this.socket.on('auth:error', (error) => {
      console.error('Authentication error:', error.message);
    });

    // Global login notification
    this.socket.on('receiveLogin', (data: { token: string }) => {
      localStorage.setItem('token', data.token);
    });
  }
  private handleAuthSuccess(data: AuthData): void {
    this.persistAuthData(data);
    this.authDataSource.next(data);
  }

  private handleLoginSuccess(data: any): void {
    this.loginDataSource.next(data);
  }

  private handleOtpSuccess(data: AuthData): void {
    this.persistAuthData(data);
    this.otpDataSource.next(data);
  }

  private handleAuthError(error: { message: string }): void {
    console.error('Authentication error:', error.message);
    this.toasterService.presentToast(
      error.message || 'Authentication failed',
      3000,
      'bottom',

    );
  }

  private persistAuthData(data: AuthData): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (this.socket) {
    this.socket.disconnect()
    }
    this.initializeSocket(data.token);
  }

  public retryConnection(token?: string): void {
    this.connectionState$.next('connecting');
    this.initializeSocket(token || undefined);
  }

  public async logout(): Promise<void> {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.id) {
        this.socket.emit('auth:logout', user.id);
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      this.router.navigate(['/login']);
      this.toasterService.presentToast(
        'You have been logged out',
        3000,
        'bottom',
        'dark'
      );
    }
  }

  private clearAuthData(): void {
    localStorage.clear();
    this.authDataSource.next(null);
    this.retryConnection();
  }

  private handleUnauthorized(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
    this.toasterService.presentToast(
      'Session expired. Please login again.',
      3000,
      'bottom',
      'warning'
    );
  }

  // Authentication methods
  public register(payload: RegisterPayload): void {
    this.socket.emit('auth:register', payload);
  }

  public login(payload: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('auth:login', payload);
      return
    }
    this.httpLogin(payload).subscribe(data => {
      this.handleLoginSuccess(data)
    })
  }

  httpLogin(email: string): Observable<any> {
    return this.http.post(environment.apiURL + 'auth/login', { email })
  }

  httpverifyOTP(email: string, otp: string, verificationToken: string) {
    return this.http.post(environment.apiURL + 'auth/verifyOtpAndLogin', { email, otp, verificationToken })
  }

  httpGoogleLogin(payload: string): Observable<any> {
    return this.http.post(environment.apiURL + 'auth/google/login', payload)
  }

  httpFacebookLogin(payload: string): Observable<any> {
    return this.http.post(environment.apiURL + 'auth/facebook/login', payload)
  }

  public initiateGoogleLogin(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('auth:google:login');
      return
    }
    this.httpGoogleLogin('payload').subscribe(data => {
      this.openAuthUrl(data.url)
    })
  }

  public handleGoogleCallback(code: string): void {
    this.socket.emit('auth:google:callback', code);
  }

  public initiateFacebookLogin(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('auth:facebook:login');
      return
    }
    this.httpFacebookLogin('payload').subscribe(data => {
      this.openAuthUrl(data.url)
    })
  }

  public handleFacebookCallback(code: string): void {
    this.socket.emit('auth:facebook:callback', code);
  }

  public sendOTP(email: string): void {
    this.socket.emit('auth:otp:send', email);
  }

  public verifyOTP(email: string, otp: string): void {
    this.socket.emit('auth:otp:verify', email, otp);
  }

  public verifyLoginOTP(email: string, otp: string, verificationToken: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('auth:verify:loginOTP', email, otp, verificationToken);
      return
    }
    this.httpverifyOTP(email, otp, verificationToken).subscribe((data: any) => {
      this.handleOtpSuccess(data)
    })
  }

  public getCurrentUser(): void {
    this.socket.emit('auth:me');
  }

  // Socket utility methods
  public fromEvent<T>(eventName: string): Observable<T> {
    return new Observable<T>(observer => {
      const listener = (data: T) => observer.next(data);
      this.socket.on(eventName, listener);

      return () => {
        this.socket.off(eventName, listener);
      };
    });
  }

  public emit(eventName: string, ...args: any[]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName, ...args);
    } else {
      console.warn(`Attempted to emit ${eventName} while disconnected`);
      this.toasterService.presentToast(
        'Connection lost. Trying to reconnect...',
        2000,
        'bottom',
        'warning'
      );
    }
  }

  openAuthUrl(url: string): void {
    if (!this.platform.is('cordova')) {
      window.open(url, '_blank');
      return;
    }

    try {
      this.inAppBrowser.create(url, '_system');
    } catch (error) {
      console.error('Error opening browser:', error);
    }
  }

  public disconnect(): void {
    this.socket.disconnect();
  }
}