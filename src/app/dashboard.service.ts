import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs';


export interface UserStats {
  correctAnswers: number; 
  points: number; 
  quizzesCreated: number;
  quizzesHosted: number;
  rank: number;
  wrongAnswers: number,
  streak: {
    current: number,
    longest: number,
    lastUpdated: number
  }
}


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private socketService:SocketService) { }


  getDashboardStats(): Observable<UserStats> {
    this.socketService.emit('dashboard:stats:get');
    return this.socketService.fromEvent<UserStats>('dashboard:stats:success');
  }

  getRecentActivity(): Observable<any[]> {
    this.socketService.emit('dashboard:activity:get');
    return this.socketService.fromEvent<any[]>('dashboard:activity:success');
  }

  onStatsUpdate(): Observable<UserStats> {
    return this.socketService.fromEvent<UserStats>('dashboard:stats:update');
  }

  logout(): void {
    this.socketService.logout()
  }
}
