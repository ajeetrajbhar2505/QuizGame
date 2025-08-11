import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, ReplaySubject, of, fromEvent } from 'rxjs';
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

const MAX_RECONNECTION_ATTEMPTS = 5;
const BASE_RECONNECTION_DELAY = 1000;
const MAX_RECONNECTION_DELAY = 10000;

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  public socket!: Socket;
  public authDataSource = new ReplaySubject<AuthData | null>(1);
  private loginDataSource = new ReplaySubject<AuthData | null>(1);
  private otpDataSource = new ReplaySubject<AuthData | null>(1);
  private authErrorSource = new ReplaySubject<any | null>(1);
  private connectionState$ = new BehaviorSubject<ConnectionState>('disconnected');
  private connectionAttempts = 0;
  private urlSubject = new ReplaySubject<{url: string}>(1); // New subject for URL events

  public readonly authData$ = this.authDataSource.asObservable();
  public readonly loginData$ = this.loginDataSource.asObservable();
  public readonly otpSuccess$ = this.otpDataSource.asObservable();
  public readonly connectionState = this.connectionState$.asObservable();
  public readonly authError$ = this.authErrorSource.asObservable();
  public readonly url$ = this.urlSubject.asObservable(); // Expose URL observable

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
    this.cleanupSocket();
  }

  private initializeSocket(token?: string): void {
    try {
      this.connectionState$.next('connecting');
      
      this.socket = io(environment.apiURL, {
        transports: ['websocket'],
        reconnection: true,
        autoConnect: true,
        auth: token ? { token } : undefined,
        reconnectionDelay: this.calculateReconnectionDelay(),
        reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
        forceNew: true // Ensure new connection instance
      });

      this.setupConnectionMonitoring();
      this.registerAuthEvents();
      this.registerUrlEvents(); // Register URL-specific events
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.connectionState$.next('error');
    }
  }

  private registerUrlEvents(): void {
    this.socket.on('auth:google:url', (data: {url: string}) => {
      this.urlSubject.next(data); // Emit URL data
      this.openAuthUrl(data); // Also open URL if needed
    });

    this.socket.on('auth:facebook:url', (data: {url: string}) => {
      this.urlSubject.next(data); // Emit URL data
      this.openAuthUrl(data); // Also open URL if needed
    });
  }

  private calculateReconnectionDelay(): number {
    const delay = Math.min(BASE_RECONNECTION_DELAY * Math.pow(2, this.connectionAttempts), MAX_RECONNECTION_DELAY);
    return delay + Math.random() * delay;
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private setupConnectionMonitoring(): void {
    this.socket.on('connect', () => {
      this.connectionAttempts = 0;
      this.connectionState$.next('connected');
      console.log('Socket connected');

      if (localStorage.getItem('token')) {
        this.emit('quiz:all');
        this.emit('quiz:published',3);
      }
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      this.handleDisconnect(reason);
      if (!this.socket?.connected) {
        this.cleanupSocket();
        this.socket.auth = {
          token :  localStorage.getItem('token') || undefined
        }
        this.socket.connect()
      }
    });

    this.socket.on('connect_error', (err: Error) => {
      this.handleConnectionError(err);
    });

    this.socket.on('reconnect_attempt', () => {
      this.connectionAttempts++;
      this.connectionState$.next('reconnecting');
      console.log(`Reconnection attempt ${this.connectionAttempts}`);
    });

    this.socket.on('reconnect_failed', () => {
      this.connectionState$.next('error');
      this.showToast('Connection failed. Please refresh the page.');
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

    if (this.connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      setTimeout(() => this.retryConnection(), this.calculateReconnectionDelay());
    }
  }

  private registerAuthEvents(): void {
    const authEvents = {
      'auth:login:success': this.handleLoginSuccess.bind(this),
      'auth:register:success': this.handleAuthSuccess.bind(this),
      'auth:google:success': this.handleAuthSuccess.bind(this),
      'auth:facebook:success': this.handleAuthSuccess.bind(this),
      'auth:otp:verify:success': this.handleOtpSuccess.bind(this),
      'auth:google:callback': this.handleGoogleCallback.bind(this),
      'auth:facebook:callback': this.handleFacebookCallback.bind(this),
      'auth:error': this.handleAuthError.bind(this),
      'receiveLogin': (data: { token: string }) => {
        localStorage.setItem('token', data.token);
      }
    };

    Object.entries(authEvents).forEach(([event, handler]) => {
      this.socket.on(event, handler);
    });
  }

  handleAuthError(error: any) {
    this.authErrorSource.next(error.message);
  }

  private handleAuthSuccess(data: AuthData): void {
    this.persistAuthData(data);
    this.authDataSource.next(data);
  }

  private handleLoginSuccess(data: AuthData): void {
    this.loginDataSource.next(data);
  }

  private handleOtpSuccess(data: AuthData): void {
    this.persistAuthData(data);
    this.otpDataSource.next(data);
    this.authDataSource.next(data);

  }

  private persistAuthData(data: AuthData): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.cleanupSocket();
    this.socket.auth = {
      token : data.token || localStorage.getItem('token')
    }
    this.socket.connect()
  }

  private showToast(message: string, duration = 3000, position = 'bottom', color = 'dark'): void {
    this.toasterService.presentToast(message, duration, position, color);
  }

  public retryConnection(token?: string): void {
    this.connectionState$.next('connecting');
    if (!this.socket?.connected) {
      this.cleanupSocket();
      this.socket.auth = {
        token : token || localStorage.getItem('token')
      }
      this.socket.connect()
    }
  }

  public async logout(): Promise<void> {
    this.toasterService.dismiss();

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.id) {
        this.emit('auth:logout', user.id);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      this.router.navigate(['/login']);
      this.showToast('You have been logged out');
    }
  }

  private handleUnauthorized(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
    this.showToast('Session expired. Please login again.', 3000, 'bottom', 'warning');
  }

  // Authentication methods
  public register(payload: RegisterPayload): void {
    this.emit('auth:register', payload);
  }

  public login(payload: string): void {
    if (this.socket?.connected) {
      this.emit('auth:login', payload);
    } else {
      this.httpLogin(payload).subscribe(data => this.handleLoginSuccess(data));
    }
  }

  httpLogin(email: string): Observable<any> {
    return this.http.post(`${environment.apiURL}auth/login`, { email });
  }

  httpverifyOTP(email: string, otp: string, verificationToken: string) {
    return this.http.post(`${environment.apiURL}auth/verifyOtpAndLogin`, { email, otp, verificationToken });
  }

  httpGoogleLogin(payload: string): Observable<any> {
    return this.http.post(`${environment.apiURL}auth/google/login`, payload);
  }

  httpFacebookLogin(payload: string): Observable<any> {
    return this.http.post(`${environment.apiURL}auth/facebook/login`, payload);
  }

  public initiateGoogleLogin(): void {
    if (this.socket?.connected) {
      this.emit('auth:google:login');
    } else {
      this.httpGoogleLogin('payload').subscribe(data => {
        this.urlSubject.next(data); // Emit URL data
        this.openAuthUrl(data);
      });
    }
  }

  public handleGoogleCallback(code: string): void {
    this.emit('auth:google:callback', code);
  }

  public initiateFacebookLogin(): void {
    if (this.socket?.connected) {
      this.emit('auth:facebook:login');
    } else {
      this.httpFacebookLogin('payload').subscribe(data => {
        this.urlSubject.next(data); // Emit URL data
        this.openAuthUrl(data);
      });
    }
  }

  public handleFacebookCallback(code: string): void {
    this.emit('auth:facebook:callback', code);
  }

  public sendOTP(email: string): void {
    this.emit('auth:otp:send', email);
  }

  public verifyOTP(email: string, otp: string): void {
    this.emit('auth:otp:verify', email, otp);
  }

  public verifyLoginOTP(email: string, otp: string, verificationToken: string): void {
    if (this.socket?.connected) {
      this.emit('auth:verify:loginOTP', email, otp, verificationToken);
    } else {
      this.httpverifyOTP(email, otp, verificationToken).subscribe((data: any) => this.handleOtpSuccess(data));
    }
  }

  // Socket utility methods
  public fromEvent<T>(eventName: string): Observable<T> {
    try {
      return fromEvent(this.socket, eventName) as Observable<T>;
    } catch (error) {
      console.error(`Error listening to event ${eventName}:`, error);
      return of();
    }
  }

  public emit(eventName: string, ...args: any[]): void {
    if (this.socket?.connected) {
      console.log(`Emitting event: ${eventName}`, args);
      this.socket.emit(eventName, ...args);
    } else {
      console.warn(`Attempted to emit ${eventName} while disconnected`);
      this.showToast('Connection lost. Trying to reconnect...', 2000, 'bottom', 'warning');
      this.retryConnection();
    }
  }

  openAuthUrl(data: {url: string}): void {
    try {
      console.log('Opening URL:', data.url);
      if (!this.platform.is('cordova')) {
        window.open(data.url, '_blank');
        return;
      }
      this.inAppBrowser.create(data.url, '_blank');
    } catch (error) {
      console.error('Error opening browser:', error);
    }
  }

  public connect(token?: string): void {
      this.cleanupSocket();
      this.socket.auth = {
        token : token || localStorage.getItem('token')
      }
      this.socket.connect()
  }

  public disconnect(): void {
    this.socket?.disconnect();
  }
}