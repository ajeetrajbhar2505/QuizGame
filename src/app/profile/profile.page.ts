import { Component, OnInit } from '@angular/core';
import { DashboardService, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss',],
})
export class ProfilePage implements OnInit {
  userStats?: UserStats;
  User?:user
  userActivity: any[] = [];
  quizesDraft: Quiz[] = [];

  constructor(
    private dashboardService:DashboardService,
    private quizService:CreateQuizesService,
    private router:Router,
    private toasterService:ToasterService
    ) {
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
    this.loadQuizzes()
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
 
    this.quizService.getQuizesDraft().subscribe({
      next: (quizes: any) => {
        this.quizesDraft = quizes;
      },
      error: (err: any) => {
        console.error('Failed to fetch quizzes:', err);
      }
    })

  }

  verifyQuiz(quizId: String) {
    this.router.navigate([`/verify-quiz`], { queryParams: { id: quizId } })
  }

  deleteQuiz(quizId: string, index: number): void {
    this.quizService.deleteQuiz(quizId).subscribe({
      next: () => {
        this.quizesDraft = this.quizesDraft.filter((_, i) => i !== index);
      },
      error: (err) => {
        this.toasterService.error(err.error?.message || 'Failed to delete quiz');
        console.error('Delete failed:', err);
      }
    });
  }

  loadQuizzes(): void {
    this.quizService.getAllQuiz().subscribe({
      error: (err) => {
        console.error('Error loading quizzes:', err);
      }
    });
  }


}
