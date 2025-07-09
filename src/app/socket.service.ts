// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

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
  private pairingCode:string
  constructor(private router: Router) {
    const token = localStorage.getItem('token') || ''
    this.initializeSocket(token);
    this.pairingCode = this.generatePairingCode();
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
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });
  
    // Error handling
    this.socket.on('connect_error', (err) => {
      console.warn('Connection error:', err.message);
      setTimeout(() => this.socket.connect(), 5000);
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        this.handleUnauthorized();
      }
    });
  
    this.registerAuthEvents();
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
}