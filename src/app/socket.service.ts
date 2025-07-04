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
  private socket!: Socket;
  private authDataSource = new Subject<AuthData | null>();
  public authData$: Observable<AuthData | null> = this.authDataSource.asObservable();

  constructor(private router:Router) {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io(environment.apiURL, {
      transports: ['websocket'],
      reconnection: true,
      autoConnect: true,
      auth: {
        token: localStorage.getItem('token')
      }
    });

    this.registerSocketEvents();
    this.registerAuthEvents();
  }

  private registerSocketEvents(): void {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
    });
  }

  private registerAuthEvents(): void {
    // Auth success events
    this.socket.on('auth:login:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:register:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:google:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:facebook:success', this.handleAuthSuccess.bind(this));
    this.socket.on('auth:otp:verify:success', this.handleAuthSuccess.bind(this));
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

  handleGoogleAuthCallback(data:string){
   this.socket.emit('auth:google:callback',data)
  }

  handleFacebookAuthCallback(data:string){
    this.socket.emit('auth:facebook:callback',data)
   }

  private handleAuthSuccess(data: AuthData): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.authDataSource.next(data);
  }

  // Authentication methods
  public register(payload: RegisterPayload): void {
    this.socket.emit('auth:register', payload);
  }

  public login(payload: LoginPayload): void {
    this.socket.emit('auth:login', payload);
  }

  public logout(): void {
    const user = JSON.parse(localStorage.getItem('user') || '');
    if (user) {
    this.socket.emit('auth:logout',user._id);
    }
    localStorage.clear();
    this.authDataSource.next(null);
    this.router.navigate(['/login'])
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

  public sendOTP(email: string): void {
    this.socket.emit('auth:otp:send', email);
  }

  public verifyOTP(email: string, otp: string): void {
    this.socket.emit('auth:otp:verify', { email, otp });
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