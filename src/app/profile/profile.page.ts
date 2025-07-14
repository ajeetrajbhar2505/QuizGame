import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, UserStats } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  userStats?: UserStats;
  currentUser?: any;
  User:any
  userActivity: any[] = [];
  quizesDraft: Quiz[] = [];
  activeTab: string = 'quizzes'; // Default active tab
  private subscriptions: Subscription = new Subscription();

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private router: Router,
    private toasterService: ToasterService
  ) {}

  ngOnInit(): void {
    this.setupDataListeners();
    this.loadInitialData();
    this.setupTabSwitching();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupDataListeners(): void {
    // User stats listener
    this.subscriptions.add(
      this.dashboardService.getUserStats$.subscribe((data: UserStats) => {
        this.userStats = data;
      })
    );

    // User activity listener
    this.subscriptions.add(
      this.dashboardService.getUserActivity$.subscribe((data: any) => {
        this.userActivity = data;
      })
    );

    // Current user
    this.currentUser = this.dashboardService.getUser();

    // Draft quizzes listener
    this.subscriptions.add(
      this.quizService.getQuizesDraft().subscribe({
        next: (quizes: Quiz[]) => {
          this.quizesDraft = quizes;
        },
        error: (err: any) => {
          console.error('Failed to fetch quizzes:', err);
          this.toasterService.error('Failed to load your quizzes');
        }
      })
    );
  }

  private loadInitialData(): void {
    if (!this.userStats) {
      this.dashboardService.getDashboardStats().subscribe({
        error: (err) => {
          console.error('Failed to load dashboard stats:', err);
        }
      });
    }

    if (this.userActivity.length === 0) {
      this.dashboardService.getRecentActivity().subscribe({
        error: (err) => {
          console.error('Failed to load recent activity:', err);
        }
      });
    }

    this.loadQuizzes();
  }

  private setupTabSwitching(): void {
    // This is now handled in the template with Angular's click bindings
    // The DOM manipulation has been moved to the template
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { queryParams: { id: quizId } });
  }

  deleteQuiz(quizId: string): void {
    this.quizService.deleteQuiz(quizId)
  }

  loadQuizzes(): void {
  }

  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }
}