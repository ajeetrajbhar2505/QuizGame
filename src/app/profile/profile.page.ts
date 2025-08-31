import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';
import { Share } from '@capacitor/share';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  activeTab: string = 'quizzes';
  currentUser: user;

  // Combined view model observable
  viewModel$: Observable<{
    userStats: UserStats | null;
    draftQuizzes: Quiz[];
  }>;

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private router: Router,
    private toasterService: ToasterService
  ) {
    // Initialize with current user data
    this.currentUser = { ...this.dashboardService.getUser() };
    // Combine all needed observables
    this.viewModel$ = combineLatest([
      this.dashboardService.getUserStats$,
      this.quizService.getQuizesDraft$
    ]).pipe(
      map(([userStats, draftQuizzes]) => ({ userStats, draftQuizzes })),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    this.setupUserSubscription();
    this.loadInitialData();


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupUserSubscription(): void {
    this.dashboardService.getUserStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update user data when stats are updated
        this.currentUser = { ...this.dashboardService.getUser() };
      });
  }

  async loadInitialData() {
    try {
      await Promise.all([
        this.dashboardService.getDashboardStats().toPromise(),
        this.quizService.getAllQuiz().toPromise()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { queryParams: { id: quizId } });
  }

  deleteQuiz(quizId: string): void {
    this.quizService.deleteQuiz(quizId).subscribe({
      next: () => {
        this.toasterService.success('Quiz deleted successfully');
      },
      error: (err) => {
        this.toasterService.error('Failed to delete quiz');
        console.error('Delete quiz error:', err);
      }
    });
  }

  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }

  async shareApp() {
    const appName = "QuizMaster";
    const message = `🚀 Challenge yourself with ${appName}! 
  Test your knowledge with fun quizzes and compete with friends. 
  Join me now!`;

    const shareOptions = {
      title: `Try ${appName} - The Ultimate Quiz App`,
      text: message,
      url: 'https://your-app-website-or-play-store-link.com',
      dialogTitle: 'Challenge Your Friends',
    };

    try {
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Share error:', error);
    }
  }

  IsAdminTemplate(quiz: Quiz): boolean {
    return quiz.source?.toLowerCase() === 'admin-template' &&
      quiz.approvalStatus !== 'rejected';
  }

  avatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null;
  }
}