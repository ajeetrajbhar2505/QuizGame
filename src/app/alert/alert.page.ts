import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.page.html',
  styleUrls: ['./alert.page.scss'],
})
export class AlertPage implements OnInit {
  unreadAlerts = [
    {
      id: 1,
      type: 'achievement',
      title: 'New Badge Earned!',
      message: 'You earned the "Quiz Master" badge for creating 10 quizzes',
      time: '2 hours ago',
      badge: 'New',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'Streak Reminder',
      message: 'Complete a quiz today to maintain your 7-day streak',
      time: '5 hours ago',
      read: false
    }
  ];

  readAlerts = [
    {
      id: 3,
      type: 'normal',
      title: 'Quiz Published',
      message: 'Your "Algebra Basics" quiz has been approved and published',
      time: '1 day ago',
      read: true
    },
    {
      id: 4,
      type: 'achievement',
      title: 'Level Up!',
      message: 'You reached Level 5 in Mathematics',
      time: '2 days ago',
      read: true
    },
    {
      id: 5,
      type: 'normal',
      title: 'New Follower',
      message: 'JohnDoe started following you',
      time: '3 days ago',
      read: true
    }
  ];

  constructor() { }

  ngOnInit() {
  }

  getAlertIcon(type: string): string {
    switch(type) {
      case 'success':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      case 'warning':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="orange" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      case 'error':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
    }
  }

  viewAlert(alert: any) {
    // Mark as read if unread
    if (!alert.read) {
      alert.read = true;
      this.unreadAlerts = this.unreadAlerts.filter(a => a.id !== alert.id);
      this.readAlerts.unshift(alert);
    }
    
    // Navigate to alert details or perform action
    console.log('Viewing alert:', alert);
  }

  markAllAsRead() {
    this.unreadAlerts.forEach(alert => {
      alert.read = true;
      this.readAlerts.unshift(alert);
    });
    this.unreadAlerts = [];
  }

  exploreQuizzes() {
    // Navigate to explore page
    console.log('Navigating to explore quizzes');
  }
}
