import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, UserStats, user } from '../dashboard.service';
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
  currentUser: user;
  userActivities: any[] = [];
  draftQuizzes: Quiz[] = [];
  activeTab: string = 'quizzes'; // Default active tab

  private subscriptions: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private router: Router,
    private toasterService: ToasterService
  ) {
    this.currentUser = this.dashboardService.getUser();
  }

  ngOnInit(): void {
    this.setupDataSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  private setupDataSubscriptions(): void {
    this.subscriptions.push(
      this.dashboardService.getUserStats$.subscribe({
        next: (stats: UserStats) => this.userStats = stats,
        error: (err) => console.error('Error loading user stats:', err)
      })
    );

    this.subscriptions.push(
      this.dashboardService.getUserActivity$.subscribe({
        next: (activities) => this.userActivities = activities,
        error: (err) => console.error('Error loading user activities:', err)
      })
    );

    this.subscriptions.push(
      this.quizService.getQuizesDraft().subscribe({
        next: (quizzes: Quiz[]) => this.draftQuizzes = quizzes,
        error: (err) => {
          console.error('Failed to fetch quizzes:', err);
          this.toasterService.error('Failed to load your quizzes');
        }
      })
    );
  }

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  private loadInitialData(): void {
    if (!this.userStats) {
      this.subscriptions.push(
        this.dashboardService.getDashboardStats().subscribe({
          error: (err) => console.error('Failed to load dashboard stats:', err)
        })
      );
    }

    if (this.userActivities.length === 0) {
      this.subscriptions.push(
        this.dashboardService.getRecentActivity().subscribe({
          error: (err) => console.error('Failed to load recent activity:', err)
        })
      );
    }

    this.loadQuizzes();
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { queryParams: { id: quizId } });
  }

  deleteQuiz(quizId: string): void {
    this.subscriptions.push(
      this.quizService.deleteQuiz(quizId).subscribe({
        next: () => {
          this.draftQuizzes = this.draftQuizzes.filter(quiz => quiz._id !== quizId);
          this.toasterService.success('Quiz deleted successfully');
        },
        error: (err) => {
          this.toasterService.error('Failed to delete quiz');
          console.error('Delete quiz error:', err);
        }
      })
    );
  }

  private loadQuizzes(): void {
    this.subscriptions.push(
      this.quizService.getAllQuiz().subscribe({
        error: (err) => console.error('Error loading quizzes:', err)
      })
    );
  }

  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }
}