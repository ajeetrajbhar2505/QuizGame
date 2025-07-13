import { Component, OnInit, OnDestroy } from '@angular/core';
import { CreateQuizesService } from '../create-quizes.service';
import { Observable, Subscription, interval, map, take, finalize } from 'rxjs';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
})
export class CreatePage implements OnInit, OnDestroy {
  quizPrompt = '';
  quizPromptDraft = '';
  isCreating = false;
  quizesDraft: Quiz[] = [];
  waitingMessage = "e.g. 'Algebra basics' or paste questions here...";

  private messages = [
    "Analyzing your topic...",
    "Creating engaging questions...",
    "Verifying content accuracy...",
    "Applying difficulty settings...",
    "Quality checking...",
  ];
  private messageSub?: Subscription;
  private subscriptions = new Subscription();

  constructor(
    private quizService: CreateQuizesService,
    private toasterService: ToasterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.quizService.getQuizesDraft().subscribe({
        next: (quizes) => this.quizesDraft = quizes,
        error: (err) => {
          console.error('Failed to fetch quizzes:', err);
          this.toasterService.error('Failed to load quizzes. Please try again.');
        }
      })
    );

    this.subscriptions.add(
      this.quizService.getCurrentDraft().subscribe({
        next: (quiz) => {
          if (quiz) {
            this.handleQuizCreationSuccess();
          }
        },
        error: (err) => this.handleQuizCreationError(err)
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.messageSub?.unsubscribe();
  }

  createQuiz(): void {
    if (!this.quizPrompt.trim()) {
      this.toasterService.error('Please enter a quiz topic');
      return;
    }

    this.quizPromptDraft = this.quizPrompt;
    this.isCreating = true;
    this.startLoadingMessages();

    this.subscriptions.add(
      this.quizService.createQuiz(this.quizPromptDraft)
        .pipe(finalize(() => this.isCreating = false))
        .subscribe({
          error: (err) => this.handleQuizCreationError(err)
        })
    );
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { queryParams: { id: quizId } });
  }

  deleteQuiz(quizId: string, index: number): void {
    this.subscriptions.add(
      this.quizService.deleteQuiz(quizId).subscribe({
        next: () => {
          this.quizesDraft = this.quizesDraft.filter((_, i) => i !== index);
          this.toasterService.success('Quiz deleted successfully');
        },
        error: (err) => {
          this.toasterService.error(err.error?.message || 'Failed to delete quiz');
          console.error('Delete failed:', err);
        }
      })
    );
  }

  private startLoadingMessages(): void {
    this.messageSub = this.getMessages().subscribe(
      message => this.quizPrompt = message
    );
  }

  private getMessages(): Observable<string> {
    return interval(3000).pipe(
      map(index => this.messages[index % this.messages.length])
    );
  }

  private handleQuizCreationSuccess(): void {
    this.isCreating = false;
    this.toasterService.success('Quiz created successfully!');
    this.quizPrompt = '';
    this.quizPromptDraft = '';
    this.messageSub?.unsubscribe();
  }

  private handleQuizCreationError(err: any): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.quizPromptDraft = '';
    this.messageSub?.unsubscribe();
    this.toasterService.error('Failed to create quiz. Please try again.');
    console.error('Quiz creation error:', err);
  }
}

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
}

interface QuizQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}