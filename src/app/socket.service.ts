import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject, fromEvent } from 'rxjs';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { ToasterService } from './toaster.service';

interface AuthData {
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

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  socket!: Socket;
  private authDataSource = new Subject<AuthData | null>();
  private loginDataSource = new Subject<AuthData | null>();
  private otpDataSource = new Subject<AuthData | null>();
  private connectionState$ = new BehaviorSubject<ConnectionState>('disconnected');
  private socketSubscriptions: (() => void)[] = [];

  public authData$: Observable<AuthData | null> = this.authDataSource.asObservable();
  public loginData$: Observable<AuthData | null> = this.loginDataSource.asObservable();
  public otpSuccess$: Observable<AuthData | null> = this.otpDataSource.asObservable();
  public connectionState: Observable<ConnectionState> = this.connectionState$.asObservable();

  constructor(
    private router: Router,
    private toasterService: ToasterService,
  ) {
    const token = localStorage.getItem('token') || '';
    this.initializeSocket(token);
  }

  ngOnDestroy(): void {
    this.cleanupSocket();
  }

  private initializeSocket(token?: string): void {
    this.cleanupSocket();

    this.socket = io(environment.apiURL, {
      transports: ['websocket'],
      reconnection: true,
      autoConnect: true,
      auth: token ? { token } : undefined,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupConnectionMonitoring();
    this.registerAuthEvents();
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.off(); // Remove all listeners
      this.socket.disconnect();
    }
    this.socketSubscriptions.forEach(unsub => unsub());
    this.socketSubscriptions = [];
  }

  private setupConnectionMonitoring(): void {
    const connectListener = () => {
      this.connectionState$.next('connected');
      this.toasterService.presentToast('Connected to server', 2000, 'bottom', 'success');
    };

    const disconnectListener = (reason: string) => {
      if (reason === 'io server disconnect') {
        this.handleUnauthorized();
      }
      this.connectionState$.next('disconnected');
      this.toasterService.presentToast('Disconnected from server', 2000, 'bottom', 'warning');
    };

    const reconnectAttemptListener = () => {
      this.connectionState$.next('reconnecting');
    };

    const reconnectFailedListener = () => {
      this.toasterService.presentToast('Failed to reconnect to server', 2000, 'bottom', 'danger');
    };

    this.socket.on('connect', connectListener);
    this.socket.on('disconnect', disconnectListener);
    this.socket.on('reconnect_attempt', reconnectAttemptListener);
    this.socket.on('reconnect_failed', reconnectFailedListener);

    this.socketSubscriptions.push(
      () => {
        this.socket.off('connect', connectListener);
        this.socket.off('disconnect', disconnectListener);
        this.socket.off('reconnect_attempt', reconnectAttemptListener);
        this.socket.off('reconnect_failed', reconnectFailedListener);
      }
    );
  }

  private registerAuthEvents(): void {
    const loginSuccessListener = this.handleLoginSuccess.bind(this);
    const authSuccessListener = this.handleAuthSuccess.bind(this);
    const otpSuccessListener = this.handleOtpSuccess.bind(this);
    const authErrorListener = (error: { message: string }) => {
      console.error('Authentication error:', error.message);
      this.toasterService.presentToast(error.message, 3000, 'bottom', 'danger');
    };

    this.socket.on('auth:login:success', loginSuccessListener);
    this.socket.on('auth:register:success', authSuccessListener);
    this.socket.on('auth:google:success', authSuccessListener);
    this.socket.on('auth:facebook:success', authSuccessListener);
    this.socket.on('auth:otp:verify:success', otpSuccessListener);
    this.socket.on('auth:error', authErrorListener);

    this.socketSubscriptions.push(
      () => {
        this.socket.off('auth:login:success', loginSuccessListener);
        this.socket.off('auth:register:success', authSuccessListener);
        this.socket.off('auth:google:success', authSuccessListener);
        this.socket.off('auth:facebook:success', authSuccessListener);
        this.socket.off('auth:otp:verify:success', otpSuccessListener);
        this.socket.off('auth:error', authErrorListener);
      }
    );
  }

  public retryConnection(token?: string): void {
    this.initializeSocket(token || undefined);
  }

  private handleLoginSuccess(data: AuthData): void {
    this.loginDataSource.next(data);
  }

  private handleAuthSuccess(data: AuthData): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.initializeSocket(data.token);
    this.authDataSource.next(data);
  }

  private handleOtpSuccess(data: AuthData): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.initializeSocket(data.token);
    this.otpDataSource.next(data);
  }

  public register(payload: RegisterPayload): void {
    this.socket.emit('auth:register', payload);
  }

  public login(payload: any): void {
    this.socket.emit('auth:login', payload);
  }

  public logout(): void {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.socket.emit('auth:logout', user.id);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      this.authDataSource.next(null);
      this.initializeSocket(); // Reconnect without token
      this.router.navigate(['/login']);
      this.toasterService.presentToast('You have been logged out', 3000, 'bottom', 'dark');
    }
  }

  private handleUnauthorized(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.authDataSource.next(null);
    this.router.navigate(['/login']);
    this.toasterService.presentToast('Session expired. Please login again.', 3000, 'bottom', 'warning');
  }

  // Social auth methods
  public initiateGoogleLogin(): void {
    this.socket.emit('auth:google:login');
  }

  public handleGoogleCallback(code: string): void {
    this.socket.emit('auth:google:callback', code);
  }

  public initiateFacebookLogin(): void {
    this.socket.emit('auth:facebook:login');
  }

  public handleFacebookCallback(code: string): void {
    this.socket.emit('auth:facebook:callback', code);
  }

  // OTP methods
  public sendOTP(email: string): void {
    this.socket.emit('auth:otp:send', email);
  }

  public verifyOTP(email: string, otp: string): void {
    this.socket.emit('auth:otp:verify', { email, otp });
  }

  public verifyLoginOTP(email: string, otp: string, verificationToken: string): void {
    this.socket.emit('auth:verify:loginOTP', { email, otp, verificationToken });
  }

  // Utility methods
  public fromEvent<T>(eventName: string): Observable<T> {
    return fromEvent(this.socket, eventName);
  }

  public emit(eventName: string, ...args: any[]): void {
    this.socket.emit(eventName, ...args);
  }

  public disconnect(): void {
    this.socket.disconnect();
  }
}