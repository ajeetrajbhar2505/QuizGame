import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, takeUntil, Subject } from 'rxjs';
import { SocketService } from './socket.service';
import { ToasterService } from './toaster.service';
import { NotificationType } from './notification-type.enum';

export interface Notification {
  _id: string;
  recipient?: string;
  sender?: string;
  isBroadcast: boolean;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  isSeen: boolean;
  metadata?: any;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notificationSource$ = new BehaviorSubject<Notification[]>([]);
  private notificationCountSource$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  public notifications$ = this.notificationSource$.asObservable();
  public notificationsCount$ = this.notificationCountSource$.asObservable();
  public unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length)
  );

  constructor(
    private socketService: SocketService,
    private toastr: ToasterService
  ) {
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSocketListeners(): void {
    // Success handlers
    this.socketService.socket.on('notification:get:success', (data: { notifications: Notification[] }) => {
      this.notificationSource$.next(data.notifications);
    });

    this.socketService.socket.on('notification:new', (data: { notification: Notification }) => {
      const current = this.notificationSource$.value;
      this.notificationSource$.next([data.notification, ...current]);
      this.showToastNotification(data.notification);
    });

    this.socketService.socket.on('notification:broadcast:success', (data: { notification: Notification }) => {
      this.notificationSource$.next([data.notification]);
      this.showToastNotification(data.notification);
    });

    this.socketService.socket.on('notification:read:success', (data: { notificationId: string }) => {
      const updated = this.notificationSource$.value.map(n => 
        n._id === data.notificationId ? { ...n, isRead: true } : n
      );
      this.notificationSource$.next(updated);
    });

    // Error handlers
    this.socketService.socket.on('notification:get:error', (data: { error: string }) => {
      this.toastr.error(data.error);
    });

    this.socketService.socket.on('notification:send:error', (data: { error: string }) => {
      this.toastr.error(data.error);
    });

    this.socketService.socket.on('notification:read:error', (data: { error: string }) => {
      this.toastr.error(data.error);
    });

    this.socketService.socket.on('notification:broadcast:error', (data: { error: string }) => {
      this.toastr.error(data.error);
    });
  }

  private showToastNotification(notification: Notification): void {
    let message = notification.message;
    if (notification.type === NotificationType.QUIZ_INVITATION) {
      message = `You've been invited to ${notification.metadata?.quizName || 'a quiz'}`;
    }
    this.toastr.success(message);
  }

  getAllNotifications(): Observable<Notification[]> {
    this.socketService.socket.emit('notification:get');
    return this.socketService.fromEvent<{ notifications: Notification[] }>('notification:get:success').pipe(
      map(data => data.notifications),
      tap(notifications => this.notificationSource$.next(notifications)),
      takeUntil(this.destroy$)
    );
  }

  getUnreadNotificationsCount(): Observable<number> {
    this.socketService.socket.emit('notification:UnreadNotificationsCount');
    return this.socketService.fromEvent<{ data:any }>('notification:UnreadNotificationsCount:success').pipe(
      map(data => data),
      tap((data:any) => this.notificationCountSource$.next(data)),
      takeUntil(this.destroy$)
    );
  }

  sendNotification(recipientId: string, type: NotificationType, metadata: any): void {
    this.socketService.socket.emit('notification:send', { 
      recipientId: recipientId, 
      type, 
      metadata 
    });
  }

  sendBroadcastNotification(type: NotificationType, messageData: any): void {
    this.socketService.socket.emit('notification:broadcast', { 
      type, 
      messageData 
    });
  }

  markAsRead(notificationId:string): Observable<string> {
    this.socketService.socket.emit('notification:read', notificationId);
    return this.socketService.fromEvent<{ notificationId: string }>('notification:read:success').pipe(
      map(data => data.notificationId),
      tap(notificationId => {
        this.getAllNotifications().subscribe()
      })
    );
  }

  markAllAsRead(): void {
    const unreadIds = this.notificationSource$.value
      .filter(n => !n.isRead)
      .map(n => n._id);
    
    if (unreadIds.length > 0) {
      this.socketService.socket.emit('notification:read-all', { notificationIds: unreadIds });
    }
  }
}