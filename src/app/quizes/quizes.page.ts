import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { DashboardService, LeaderboardUser, user } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthData, SocketService } from '../socket.service';
import { map } from 'rxjs/operators';
import { searchQueryModel } from '../live-quizes/live-quizes.component';


@Component({
  selector: 'app-quizes',
  templateUrl: './quizes.page.html',
  standalone : false,
  styleUrls: ['./quizes.page.scss'],
})
export class QuizesPage implements OnInit, OnDestroy {
  @Input() publishedQuizes$: Observable<Quiz[]>;
  @Input() ParentInjected: boolean = false;
  @Output() handleRefresh: EventEmitter<boolean> = new EventEmitter<boolean>()

  isLoadingQuizzes: boolean = false;
  openModel: boolean = false;

  @Input() set searchQueryData(data: searchQueryModel) {
    if (data.searchQuery || data.selectedCategory) {
      this.searchQuery = data.searchQuery
      this.selectedCategory = data.selectedCategory
      this.filterQuizzes()
    }
  }

  // Filter properties
  searchQuery: string = '';
  selectedCategory: string = 'all';
  filteredQuizzes$: Observable<Quiz[]>;
  categories = [
    { id: 'all', name: 'All', icon: 'fas fa-layer-group' },
    { id: 'math', name: 'Math', icon: 'fas fa-calculator' },
    { id: 'science', name: 'Science', icon: 'fas fa-flask' },
    { id: 'literature', name: 'Literature', icon: 'fas fa-book' },
    { id: 'geography', name: 'Geography', icon: 'fas fa-globe-americas' },
    { id: 'history', name: 'History', icon: 'fas fa-history' }
  ];

  constructor(
    private quizService: CreateQuizesService,
    protected router: Router,
    private sanitizer: DomSanitizer,
    private SocketService: SocketService,
    private dashboardService: DashboardService
  ) {

    this.publishedQuizes$ = this.quizService.getPublishedQuizes$
    this.filteredQuizzes$ = this.publishedQuizes$;
  }

  get currentUser(): user {
    return this.dashboardService.getUser()
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData();
      }
    });
  }



  // Apply both search and category filters
  private applyFilters(quizzes: Quiz[]): Quiz[] {

    // Apply category filter
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      return quizzes.filter(quiz =>
        quiz.category?.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      return quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(query)
      );
    }

    return quizzes

  }

  // Filter quizzes based on current criteria
  filterQuizzes(): void {
    this.publishedQuizes$.pipe(
      map(quizzes => this.applyFilters(quizzes))
    ).subscribe(filtered => {
      // This will trigger the async pipe update
      this.filteredQuizzes$ = of(filtered);
    });
  }

  // Select category and filter
  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterQuizzes();
  }
  async loadInitialData() {
    this.handleRefresh.emit(true)
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 2000);
    await this.quizService.getPublishedQuiz().toPromise();
  }

  async getQuizParticipant(quizId: any) {
    this.SocketService.authDataSource.next(null);
    await this.quizService.getQuizParticipant(quizId).toPromise();
  }

  protected makeSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  avatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null;
  }

  async joinQuiz(quizId: any) {
    await this.quizService.joinQuiz(quizId).toPromise();
  }

  async playQuiz(quizId: any) {
    // Quiz start logic
    this.SocketService.authDataSource.next(null)
    this.router.navigate(['/ongoing'], {
      replaceUrl: true,
      queryParams: { id: quizId }
    })
  }

  // TrackBy functions for ngFor performance
  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }

  showDialog() {
    this.openModel = true;
  }

  closeDialog() {
    let AuthData: AuthData = {
      token: localStorage.getItem('token') || '',
      user: JSON.parse(localStorage.getItem('user') || '{}')
    };
    this.SocketService.authDataSource.next(AuthData);
    this.openModel = false;
  }

  handleAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null; // Prevent infinite loop
  }

  async BeginQuiz(quizId: string) {
    // Quiz start logic
    await this.quizService.BeginQuiz(quizId).toPromise();
  }


  async startQuiz(quizId: string) {
    // Quiz start logic
    await this.quizService.startQuiz(quizId).toPromise();
  }



  async completeQuizByHost(quizId: string) {
    // Quiz start logic
    await this.quizService.completeQuizByHost(quizId).toPromise();
  }


  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], {
      queryParams: { id: quizId }
    });
  }

  trackByUserId(index: number, user: LeaderboardUser): string {
    return user.userId;
  }

  async ngOnDestroy() {
    await this.quizService.getPublishedQuiz(3).toPromise();
  }
}