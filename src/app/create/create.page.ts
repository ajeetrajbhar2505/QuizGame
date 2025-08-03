import { Component, OnInit, OnDestroy } from '@angular/core';
import { CreateQuizesService, Quiz, QuizQuestion } from '../create-quizes.service';
import { Observable, Subscription, interval, map, take, combineLatest, filter } from 'rxjs';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
})
export class CreatePage implements OnInit, OnDestroy {
  quizPrompt: string = '';
  quizPromptDraft: string = '';
  isCreating: boolean = false;
  draftQuizzes: Quiz[] = [];
  waitingMessage: string = "e.g. 'Algebra basics' or paste questions here...";
  isLoadingQuizzes: boolean = false;

  private loadingMessages = [
    "Analyzing your topic...",
    "Creating engaging questions...",
    "Verifying content accuracy...",
    "Applying difficulty settings...",
    "Quality checking...",
  ];
  private messageSubscription?: Subscription;
  private quizSubscriptions = new Subscription();

  constructor(
    private quizService: CreateQuizesService,
    private toasterService: ToasterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupQuizSubscriptions();
    this.loadDraftQuizzes();
  }

  ngOnDestroy(): void {
    this.quizSubscriptions.unsubscribe();
  }

  private setupQuizSubscriptions(): void {
    // Combine draft and current quiz state
    const quizState$ = combineLatest([
      this.quizService.getCurrentDraft$,
      this.quizService.getQuizesDraft$
    ]);

    this.quizSubscriptions.add(
      quizState$.subscribe({
        next: ([currentDraft, draftQuizzes]) => {
          this.handleQuizStateUpdate(currentDraft, draftQuizzes);
        },
        error: (err) => {
          this.toasterService.error('Error loading quiz data');
          console.error('Quiz state error:', err);
        }
      })
    );
  }

  IsAdminTemplate(quiz: Quiz): boolean {
    return quiz.source?.toLowerCase() === 'admin-template' && 
           !quiz.isPublic && 
           quiz.approvalStatus !== 'rejected';
  }


  private handleQuizStateUpdate(currentDraft: Quiz | null, draftQuizzes: Quiz[]): void {
    // Handle quiz creation completion
    if (currentDraft && this.isCreating) {
      this.isCreating = false;
      this.toasterService.success('Quiz created successfully!');
      this.resetPromptFields();
    }

    // Update draft quizzes list
    this.draftQuizzes = draftQuizzes;
  }

  private resetPromptFields(): void {
    this.quizPrompt = '';
    this.quizPromptDraft = '';
    this.messageSubscription?.unsubscribe();
  }

  createQuiz(): void {
    if (!this.validateQuizPrompt()) return;

    this.prepareForQuizCreation();
    this.startLoadingAnimation();
    
    this.quizSubscriptions.add(
      this.quizService.createQuiz(this.quizPromptDraft).subscribe({
        error: (err) => this.handleCreationError(err)
      })
    );
  }
  
  private handleCreationError(err: any): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.resetPromptFields();
    this.toasterService.error('Failed to create quiz. Please try again.');
    console.error('Quiz creation error:', err);
  }

  private validateQuizPrompt(): boolean {
    if (!this.quizPrompt.trim()) {
      this.toasterService.error('Please enter a quiz topic');
      return false;
    }
    return true;
  }

  private prepareForQuizCreation(): void {
    this.quizPromptDraft = this.quizPrompt;
    this.isCreating = true;
  }

  private startLoadingAnimation(): void {
    this.messageSubscription = interval(3000).pipe(
      map(index => this.loadingMessages[index % this.loadingMessages.length]),
      take(this.loadingMessages.length * 2) // Show all messages twice max
    ).subscribe({
      next: (message) => this.quizPrompt = message,
      complete: () => {
        if (this.isCreating) {
          this.quizPrompt = "Almost there...";
        }
      }
    });
  }

  cancelQuizGeneration(): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.resetPromptFields();
  }

  loadDraftQuizzes(): void {
    this.isLoadingQuizzes = true;
    this.quizSubscriptions.add(
      this.quizService.getAllQuiz().subscribe({
        error: (err) => {
          this.toasterService.error('Failed to load drafts');
          console.error('Error loading quizzes:', err);
        }
      })
    );
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 1000);
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { 
      queryParams: { id: quizId },
      state: { quiz: this.draftQuizzes.find(q => q._id === quizId) }
    });
  }

  deleteQuiz(quizId: string): void {
    this.quizSubscriptions.add(
      this.quizService.deleteQuiz(quizId).subscribe({
        error: (err) => {
          this.toasterService.error(err.error?.message || 'Failed to delete quiz');
          console.error('Delete failed:', err);
        }
      })
    );
  }

  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }
}