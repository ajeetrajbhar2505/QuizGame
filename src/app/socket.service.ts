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
export class SocketService  {
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

  public initializeSocket(token?: string) {
    if (this.socket) {
      this.socket.disconnect();
    }
  
    this.socket = io(environment.apiURL, {
      transports: ['websocket'],
      reconnection: true,
      autoConnect: true,
      auth: token ? { token } : undefined,
      reconnectionDelay: 1000
    });
  
     this.setupConnectionMonitoring()
  
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

  private setupConnectionMonitoring() {
    this.socket.on('connect', () => {
      this.connectionState$.next('connected');
    });
  
    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        this.handleUnauthorized();
      }
      this.connectionState$.next('disconnected');
    });
  
    this.socket.on('reconnect_attempt', () => {
      this.connectionState$.next('reconnecting');
    });
  }

  private registerAuthEvents(): void {
    // Auth success events
    this.socket.on('auth:login:success', this.handleLoginSuccess.bind(this));
    this.socket.on('auth:register:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:google:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:facebook:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:otp:verify:success', this.handleOtpSuccess.bind(this));
    this.socket.on('auth:google:callback', this.handleGoogleAuthCallback.bind(this));
    this.socket.on('auth:facebook:callback', this.handleFacebookAuthCallback.bind(this));

    // Auth error events
    this.socket.on('auth:error', (error) => {
      console.error('Authentication error:', error.message);
    });

    // Global login notification
    this.socket.on('receiveLogin', (data: { token: string }) => {
      localStorage.setItem('token', data.token);
    });
  }

  public retryConnection(token?: string): void {
    this.initializeSocket(token || undefined);
  }

  handleGoogleAuthCallback(data: string) {
    this.socket.emit('auth:google:callback', data)
  }

  handleFacebookAuthCallback(data: string) {
    this.socket.emit('auth:facebook:callback', data)
  }


  private handleLoginSuccess(data: AuthData): void {
    this.loginDataSource.next(data);
  }

  private handleAuthSuccess(data: AuthData): void {
    console.log(data);
    
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