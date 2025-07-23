import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable, Subject } from 'rxjs';

export interface user {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  isVerified: boolean;
}


export class UserStats {
  correctAnswers: number = 0;
  points: number = 0;
  quizzesCreated: number = 0;
  quizzesHosted: number = 0;
  rank: number = 0;
  wrongAnswers: number = 0;
  streak: {
    current: number;
    longest: number;
    lastUpdated: Date;
  } = {
    current: 0,
    longest: 0,
    lastUpdated: new Date(0)
  };
}

export class LeaderboardUser {
  userId: string = '';
  name: string = '';
  avatar: string = '';
  points: number = 0;
  rank: number = 0;
  streak: number = 0;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  UserStats$:Subject<UserStats> = new Subject<UserStats>()
  UserActivity$:Subject<any> = new Subject<any>()
  Leaderboard$:Subject<LeaderboardUser[]> = new Subject<LeaderboardUser[]>()

  getUserStats$:Observable<UserStats> = this.UserStats$.asObservable()
  getUserActivity$:Observable<any> = this.UserActivity$.asObservable()
  getLeaderboard$:Observable<LeaderboardUser[]> = this.Leaderboard$.asObservable()

  constructor(private socketService: SocketService) { 

  }

  getDashboardStats() {
    this.socketService.socket.emit('dashboard:stats:get');
    return new Observable<UserStats>(observer => {
      const subscription = this.socketService.fromEvent<UserStats>('dashboard:stats:success').subscribe({
        next: (data: any) => {
          try {
            this.UserStats$.next(data.stats)
            observer.next(data.stats);
          } catch (error) {
            observer.error('Failed to save stats to localStorage');
          }
        },
        error: (err) => observer.error(err)
      });

      return () => subscription.unsubscribe();
    });
  }

  getRecentActivity() {
    this.socketService.socket.emit('dashboard:activity:get');
    return new Observable<any[]>(observer => {
      const subscription = this.socketService.fromEvent<any[]>('dashboard:activity:success').subscribe({
        next: (data: any) => {
          try {
            this.UserActivity$.next(data.activity)
            observer.next(data.activity);
          } catch (error) {
            observer.error('Failed to save activity to localStorage');
          }
        },
        error: (err) => observer.error(err)
      });

      return () => subscription.unsubscribe();
    });
  }

  getLeaderboardUser() {
    this.socketService.socket.emit('dashboard:leaderboardUser:get');
    return new Observable<LeaderboardUser[]>(observer => {
      const subscription = this.socketService.fromEvent<UserStats>('dashboard:leaderboardUser:success').subscribe({
        next: (data: any) => {
          try {
            this.Leaderboard$.next(data.leaderboard)
            observer.next(data.leaderboard);
          } catch (error) {
            observer.error('Failed to save leaderboard to localStorage');
          }
        },
        error: (err) => observer.error(err)
      });

      return () => subscription.unsubscribe();
    });
  }

  getUser(){
    const User: any = localStorage.getItem('user')
    if (User) {
      return JSON.parse(User)
    }
    this.socketService.authData$.subscribe((data: any) => {
      if (data) {
        return data.user
      }
    })
  }

  logout(): void {
    // Clear local storage on logout
    localStorage.removeItem('UserStats');
    localStorage.removeItem('activity');
    this.socketService.logout();
  }
}