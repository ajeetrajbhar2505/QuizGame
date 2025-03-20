// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket!: Socket;
  private loginDataSource = new BehaviorSubject<any>(null);
  public loginData$ = this.loginDataSource.asObservable();

  constructor() {
    this.connectSocket();
  }

  private connectSocket() {
    this.socket = io('https://quiz-game-backend-rc4g.onrender.com', {
      transports: ['websocket'],  // Optional: force websocket (instead of polling)
      reconnection: true
    });

    // Socket connect event
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    // Socket error events
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
    });

    this.listenForLogin();  // Start listening for login events
  }

  private listenForLogin() {
    this.socket.on('receiveLogin', (data) => {
      this.loginDataSource.next(data);
    });
  }

  emitLogin(payload: any) {
    this.socket.emit('login', payload);
  }

  on(eventName: string, callback: Function) {
    this.socket.on(eventName, (data) => {
      callback(data);
    });
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }
}
