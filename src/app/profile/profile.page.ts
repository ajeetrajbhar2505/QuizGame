import { Component, OnInit } from '@angular/core';
import { DashboardService, UserStats } from '../dashboard.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  stats?: UserStats;
  activity: any[] = [];
  private subs: Subscription[] = [];

  constructor(private dashboardService:DashboardService) { }

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

    this.subs.push(
      this.dashboardService.getDashboardStats().subscribe((data:any) => {
        this.stats = data['stats'];
      }),
      
      this.dashboardService.getRecentActivity().subscribe((data:any) => {
        this.activity = data['activity'];
      }),
      
      this.dashboardService.onStatsUpdate().subscribe((data:any) => {
        this.stats = data['stats'];
      })
    );
    
  }

}
