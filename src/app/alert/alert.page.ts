import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonItemSliding } from '@ionic/angular';
import { Notification, NotificationService } from '../notification.service';
import { NotificationType } from '../notification-type.enum';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.page.html',
  styleUrls: ['./alert.page.scss'],
})
export class AlertPage implements OnInit {
  loading = false;
  unreadNotifications: Notification[] = [];
  readNotifications: Notification[] = [];
  segmentValue: 'unread' | 'all' = 'unread';

  constructor(
    private notificationService: NotificationService,
    private router: Router,
  ) { }

  async ngOnInit() {
    await this.loadNotifications();
    this.setupNotificationUpdates();
    await this.notificationService.getAllNotifications().toPromise()
  }

  private async loadNotifications(): Promise<void> {
    try {
      this.loading = true;
      this.notificationService.notifications$.subscribe((allNotifications: Notification[]) => {
        this.unreadNotifications = allNotifications.filter(n => !n.isRead);
        this.readNotifications = allNotifications.filter(n => n.isRead);
      })
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      this.loading = false;
    }
  }

  private setupNotificationUpdates(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      if (notifications) {
        this.unreadNotifications = notifications.filter(n => !n.isRead);
        this.readNotifications = notifications.filter(n => n.isRead);
      }
    });
  }

  getNotificationIcon(type: NotificationType): string {
    const icons = {
      [NotificationType.QUIZ_INVITATION]: 'mail-unread-outline',
      [NotificationType.QUIZ_START]: 'play-circle-outline',
      [NotificationType.QUESTION_READY]: 'help-circle-outline',
      [NotificationType.QUIZ_ENDED]: 'checkmark-done-outline',
      [NotificationType.RESULTS_AVAILABLE]: 'bar-chart-outline',
      [NotificationType.NEW_LEADER]: 'trophy-outline',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'ribbon-outline',
      [NotificationType.ADMIN_ANNOUNCEMENT]: 'megaphone-outline',
      [NotificationType.SYSTEM_ALERT]: 'warning-outline'
    };
    return icons[type] || 'notifications-outline';
  }

  getNotificationColor(type: NotificationType): string {
    const colors = {
      [NotificationType.QUIZ_INVITATION]: 'primary',
      [NotificationType.QUIZ_START]: 'success',
      [NotificationType.QUESTION_READY]: 'warning',
      [NotificationType.QUIZ_ENDED]: 'tertiary',
      [NotificationType.RESULTS_AVAILABLE]: 'secondary',
      [NotificationType.NEW_LEADER]: 'danger',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'success',
      [NotificationType.ADMIN_ANNOUNCEMENT]: 'danger',
      [NotificationType.SYSTEM_ALERT]: 'warning'
    };
    return colors[type] || 'medium';
  }

  async viewNotification(notification: Notification): Promise<void> {
    if (!notification.isRead) {
      await this.notificationService.markAsRead(notification._id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case NotificationType.QUIZ_INVITATION:
        this.router.navigate(['/quiz', notification.metadata?.quizId]);
        break;
      case NotificationType.ACHIEVEMENT_UNLOCKED:
        this.router.navigate(['/profile/achievements']);
        break;
      default:
        // Default action or show details modal
        console.log('Notification action:', notification);
        break;
    }
  }

  async markAllAsRead(): Promise<void> {
    const unreadIds = this.unreadNotifications.map(n => n._id);
    if (unreadIds.length > 0) {
      await this.notificationService.markAllAsRead();
      this.unreadNotifications = [];
      this.readNotifications = [...this.unreadNotifications, ...this.readNotifications];
    }
  }


  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id;
  }

  async doRefresh(event: any): Promise<void> {
    await this.loadNotifications();
    event.target.complete();
  }
}