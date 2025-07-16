import { Component, OnInit, OnDestroy } from '@angular/core';
import { CreateQuizesService } from '../create-quizes.service';
import { Observable, Subscription, interval, map, take } from 'rxjs';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdBy: string;
  source: 'openai' | 'manual';
  category?: string;
  totalQuestions?: number;
  difficulty?: string;
  approvalStatus: string;
  estimatedTime: number;
}

interface QuizQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

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

  private loadingMessages = [
    "Analyzing your topic...",
    "Creating engaging questions...",
    "Verifying content accuracy...",
    "Applying difficulty settings...",
    "Quality checking...",
  ];
  private messageSubscription?: Subscription;
  private quizSubscriptions: Subscription[] = [];

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
    this.cleanupSubscriptions();
  }

  private setupQuizSubscriptions(): void {
    this.quizSubscriptions.push(
      this.quizService.getCurrentDraft$.subscribe({
        next: (quiz) => {
          this.isCreating = false;
          if (quiz) {
            this.toasterService.success('Quiz created successfully!');
            this.resetPromptFields();
            this.loadDraftQuizzes();
          }
        },
        error: (err) => {
          this.handleCreationError(err);
        }
      })
    );

    this.quizSubscriptions.push(
      this.quizService.getQuizesDraft$.subscribe(quizzes => {
        this.draftQuizzes = quizzes;
      })
    );
  }

  private cleanupSubscriptions(): void {
    this.messageSubscription?.unsubscribe();
    this.quizSubscriptions.forEach(sub => sub.unsubscribe());
  }

  private resetPromptFields(): void {
    this.quizPrompt = '';
    this.quizPromptDraft = '';
    this.messageSubscription?.unsubscribe();
  }

  private handleCreationError(err: any): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.resetPromptFields();
    this.toasterService.error('Failed to create quiz. Please try again.');
    console.error('Quiz creation error:', err);
  }

  cancelQuizGeneration(): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.resetPromptFields();
  }

  loadDraftQuizzes(): void {
    this.quizSubscriptions.push(
      this.quizService.getAllQuiz().subscribe({
        error: (err) => {
          console.error('Error loading quizzes:', err);
        }
      })
    );
  }

  createQuiz(): void {
    if (!this.validateQuizPrompt()) return;

    this.prepareForQuizCreation();
    this.startLoadingAnimation();
    
    this.quizSubscriptions.push(
      this.quizService.createQuiz(this.quizPromptDraft).subscribe({
        error: (err) => {
          this.handleCreationError(err);
        }
      })
    );
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
    this.messageSubscription = this.getLoadingMessages().subscribe({
      next: (message) => {
        this.quizPrompt = message;
      }
    });
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { queryParams: { id: quizId } });
  }

  deleteQuiz(quizId: string, index: number): void {
    this.quizSubscriptions.push(
      this.quizService.deleteQuiz(quizId).subscribe({
        next: () => {
          this.draftQuizzes = this.draftQuizzes.filter((_, i) => i !== index);
        },
        error: (err) => {
          this.toasterService.error(err.error?.message || 'Failed to delete quiz');
          console.error('Delete failed:', err);
        }
      })
    );
  }

  private getLoadingMessages(): Observable<string> {
    return interval(3000).pipe(
      map(index => this.loadingMessages[index % this.loadingMessages.length])
    );
  }
}