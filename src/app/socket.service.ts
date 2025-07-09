// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

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

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  public socket!: Socket;
  private authDataSource = new Subject<AuthData | null>();
  private loginDataSource = new Subject<AuthData | null>();
  private otpDataSource = new Subject<AuthData | null>();
  public authData$: Observable<AuthData | null> = this.authDataSource.asObservable();
  public loginData$: Observable<AuthData | null> = this.loginDataSource.asObservable();
  public otpSuccess: Observable<AuthData | null> = this.otpDataSource.asObservable()
  public connectionState$ = new BehaviorSubject<string>('disconnected');

  constructor(
    private router: Router,
    private toastCtrl: ToastController
    ) {
    const token = localStorage.getItem('token') || ''
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
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });
  
    // Single connection handler
     this.setupConnectionMonitoring()
  
    this.registerAuthEvents();
  }


  public retryConnection(token?: string) {
    if (this.socket) {
      this.socket.disconnect(); // Properly disconnect first
      this.socket.removeAllListeners(); // Clean up all listeners
    }
    
    this.initializeSocket(token || undefined);
  }
  
  private handleConnectionError(err: any) {
    console.error('Connection error:', err);
    setTimeout(() => {
      this.retryConnection();
    }, 5000);
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


  private generatePairingCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private registerAuthEvents(): void {
    // Auth success events
    this.socket.on('auth:login:success', this.handleLoginSuccess.bind(this));
    this.socket.on('auth:register:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:google:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:facebook:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:otp:verify:success', this.handleotpSuccess.bind(this));
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
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.initializeSocket(data.token)
    this.authDataSource.next(data);
  }

  private handleotpSuccess(data: AuthData): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.initializeSocket(data.token)
    this.otpDataSource.next(data);
  }

  // Authentication methods
  public register(payload: RegisterPayload): void {
    this.socket.emit('auth:register', payload);
  }

  public login(payload: string): void {
    this.socket.emit('auth:login', payload);
  }


  public async logout(): Promise<void> {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.socket.emit('auth:logout', user._id);
      localStorage.clear();
      this.authDataSource.next(null);
      this.router.navigate(['/login']);

    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      this.authDataSource.next(null);
      this.router.navigate(['/login']);
    }

    this.presentToast('You have been logged out', 3000, 'bottom', 'dark');

  }

  private handleUnauthorized(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.authDataSource.next(null);
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
    this.router.navigate(['/login']);
  }

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

  public sendOTP(email: string, token: string): void {
    this.socket.emit('auth:otp:send', email);
  }

  public verifyOTP(email: string, otp: string): void {
    this.socket.emit('auth:otp:verify', { email, otp });
  }

  public verifyloginOTP(email: string, otp: string, verificationToken: string): void {
    this.socket.emit('auth:verify:loginOTP', email, otp, verificationToken);
  }


  public getCurrentUser(): void {
    this.socket.emit('auth:me');
  }

  // Utility methods
  public on(eventName: string, callback: (data: any) => void): void {
    this.socket.on(eventName, callback);
  }

  public off(eventName: string): void {
    this.socket.off(eventName);
  }

  public disconnect(): void {
    this.socket.disconnect();
  }


  async presentToast(message: string, duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'bottom', color?: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position,
      color
    });
    toast.present();
  }
}