import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { LeaderboardUser, user } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthData, SocketService } from '../socket.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, OnDestroy {
  @Input() submittedQuizes$: Observable<Quiz[]>;
  @Input() quizParticipants$: Observable<Quiz | null>;
  @Input() ParentInjected: boolean = false;

  isLoadingQuizzes: boolean = false;
  openModel: boolean = false;
  currentUser: user = {
    _id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  };

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
    private SocketService: SocketService
  ) {
    const User: any = localStorage.getItem('user')
    if (User) {
      this.currentUser = JSON.parse(User)
    }
    if (this.currentUser.avatar) {
      this.currentUser.avatar = this.makeSafeUrl(this.currentUser.avatar);
    }
    this.submittedQuizes$ = this.quizService.submittedQuizes$
    this.quizParticipants$ = this.quizService.getParticipants$

    // Initialize filtered quizzes
    this.filteredQuizzes$ = this.submittedQuizes$;
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFiltering();
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData();
      }
    });
  }

  // Setup filtering observable
  private setupFiltering(): void {
    this.filteredQuizzes$ = this.submittedQuizes$.pipe(
      map(quizzes => {
        return this.applyFilters(quizzes);
      })
    );
  }

  // Apply both search and category filters
  private applyFilters(quizzes: Quiz[]): Quiz[] {
    let filtered = quizzes;

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(quiz =>
        quiz.category?.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(query) ||
        quiz.description.toLowerCase().includes(query) ||
        (quiz.category)
      );
    }

    return filtered;
  }

  // Filter quizzes based on current criteria
  filterQuizzes(): void {
    this.submittedQuizes$.pipe(
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
    this.isLoadingQuizzes = true;
    try {
      await this.quizService.getSubmittedQuizes().toPromise();
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setTimeout(() => {
        this.isLoadingQuizzes = false;
      }, 2000);
    }
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

  trackByUserId(index: number, user: LeaderboardUser): string {
    return user.userId;
  }

  async ngOnDestroy() {
    await this.quizService.getActiveQuizes(3).toPromise();
  }
}