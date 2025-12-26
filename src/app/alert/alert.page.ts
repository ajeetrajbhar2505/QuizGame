import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonItemSliding } from '@ionic/angular';
import { Notification, NotificationService } from '../notification.service';
import { NotificationType } from '../notification-type.enum';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.page.html',
  standalone : false,
  styleUrls: ['./alert.page.scss'],
})
export class AlertPage implements OnInit {
  loading = false;
  unreadNotifications: Notification[] = [];
  readNotifications: Notification[] = [];
  segmentValue: 'unread' | 'all' = 'unread';
  isLoadingNotification:boolean = false
  constructor(
    private notificationService: NotificationService,
    private router: Router,
  ) { }

  async ngOnInit() {
    await this.loadNotifications();
    await this.notificationService.getAllNotifications().toPromise()
  }

  IsToday_sDateWithTimezone(date: Date | string, timeZone?: string): boolean {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    // Convert both dates to the same timezone (or local time if no timezone specified)
    const inputDateStr = inputDate.toLocaleDateString('en-CA', { timeZone });
    const todayStr = today.toLocaleDateString('en-CA', { timeZone });
    
    return inputDateStr === todayStr;
  }

  private async loadNotifications(): Promise<void> {
    try {
      this.isLoadingNotification = true;
      setTimeout(() => {
        this.isLoadingNotification = false;
      }, 2000);
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


  getNotificationIcon(notification: Notification): string {
    const type: NotificationType = notification.type;
    const isRead: boolean = notification.isRead;

    const icons:any = {
      [NotificationType.QUIZ_INVITATION]: isRead ? 'mail-open' : 'mail-unread',
      [NotificationType.QUIZ_START]: isRead ? 'play-circle-outline' : 'mail-unread',
      [NotificationType.QUESTION_READY]: isRead ? 'help-circle-outline' : 'mail-unread',
      [NotificationType.QUIZ_ENDED]: isRead ? 'mail-open' : 'mail-unread',
      [NotificationType.RESULTS_AVAILABLE]: isRead ? 'bar-chart-outline' : 'mail-unread',
      [NotificationType.NEW_LEADER]: isRead ? 'trophy-outline' : 'mail-unread',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: isRead ? 'ribbon-outline' : 'mail-unread',
      [NotificationType.ADMIN_ANNOUNCEMENT]: isRead ? 'megaphone-outline' : 'mail-unread',
      [NotificationType.SYSTEM_ALERT]: isRead ? 'warning-outline': 'mail-unread'
    };

    return icons[type] || 'notifications';
  }

  getNotificationColor(type: NotificationType): string {
    const colors:any = {
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

  navigateToactionUrl(actionUrl:String){
  }

  async viewNotification(notification: Notification) {
    if (!notification.isRead) {
      await this.notificationService.markAsRead(notification._id);
      this.unreadNotifications = this.unreadNotifications.filter(n => n._id !== notification._id);
      this.readNotifications.unshift({
        ...notification,
        isRead: true
      });
    }
    this.navigateToactionUrl(notification.actionUrl)
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

  async doRefresh() {
    await this.loadNotifications();
  }
}