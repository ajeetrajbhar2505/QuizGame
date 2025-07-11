import { Component, OnInit } from '@angular/core';
import { DashboardService, UserStats, user } from '../dashboard.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  userStats?: UserStats;
  User?:user
  userActivity: any[] = [];
  constructor(private dashboardService:DashboardService) {
    this.dashboardService.getUserStats$.subscribe((data:UserStats)=>{
      this.userStats = data
    })

    this.dashboardService.getUserActivity$.subscribe((data:any)=>{
      this.userActivity = data
    })

    this.User = this.dashboardService.getUser()


    if (!this.userStats) {
      this.dashboardService.getDashboardStats().subscribe()
    }

    if (!this.userActivity) {
        this.dashboardService.getRecentActivity().subscribe()
    }
   }

  ngOnInit() {
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            if (tabId) {
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            }
        });
    });
 
  }

}
