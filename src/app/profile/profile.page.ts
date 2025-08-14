import { Component, OnInit } from '@angular/core';
import { DashboardService, UserStats, user } from '../dashboard.service';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';
import { Share } from '@capacitor/share';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  activeTab: string = 'quizzes'; // Default active tab
  currentUser: user;

  // Combined view model observable
  viewModel$: Observable<{
    userStats: UserStats | null;
    draftQuizzes: Quiz[];
  }>;

  constructor(
    private dashboardService: DashboardService,
    private quizService: CreateQuizesService,
    private router: Router,
    private toasterService: ToasterService
  ) {
    this.currentUser = this.dashboardService.getUser();
    
    // Combine all needed observables
    this.viewModel$ = combineLatest([
      this.dashboardService.getUserStats$,
      this.quizService.getQuizesDraft$
    ]).pipe(
      map(([userStats, draftQuizzes]) => ({ userStats, draftQuizzes }))
    );
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.dashboardService.getDashboardStats().toPromise()
    this.quizService.getAllQuiz().toPromise()
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
    await Share.share(shareOptions);
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