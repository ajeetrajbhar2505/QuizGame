import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable, ReplaySubject, filter } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

export interface user {
  id: string;
  name: string;
  email: string;
  avatar: any;
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

  private userStatsSubject = new ReplaySubject<UserStats | null>(1);
  getUserStats$ = this.userStatsSubject.asObservable()
  private leaderboardSubject = new ReplaySubject<LeaderboardUser[]>(1);
  public leaderboard$ = this.leaderboardSubject.asObservable();

  constructor(private socketService: SocketService, private router: Router) { }

  getDashboardStats() {
    this.socketService.socket.emit('dashboard:stats:get');
    return new Observable<UserStats>(observer => {
      const subscription = this.socketService.fromEvent<UserStats>('dashboard:stats:success').subscribe({
        next: (data: any) => {
          try {
            this.userStatsSubject.next(data.stats)
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

  get limit(): number {
    let isLimitRoute = ['/home'].includes(this.router.url);
    return isLimitRoute ? 3 : 0;
  }


  getLeaderboardUser(limit?:number) {
    this.socketService.socket.emit('dashboard:leaderboardUser:get', limit == 0 ? limit : this.limit);
    return new Observable<LeaderboardUser[]>(observer => {
      const subscription = this.socketService.fromEvent<UserStats>('dashboard:leaderboardUser:success').subscribe({
        next: (data: any) => {
          try {
            this.leaderboardSubject.next(data.leaderboard)
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

  getUser() {
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