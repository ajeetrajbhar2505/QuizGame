import { Component, OnInit, OnDestroy } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, Subscription, interval, map } from 'rxjs';
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
  quizesDraft: Quiz[] = [];
  waitingMessage: string = "e.g. 'Algebra basics' or paste questions here...";
  currentMessage: string = '';

  private messages = [
    "Analyzing your topic...",
    "Creating engaging questions...",
    "Verifying content accuracy...",
    "Applying difficulty settings...",
    "Quality checking...",
  ];
  private messageSub?: Subscription;
  private quizSubscriptions: Subscription = new Subscription();

  constructor(
    private quizService: CreateQuizesService,
    private toasterService: ToasterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupQuizListeners();
    this.loadQuizzes();
  }

  private setupQuizListeners(): void {
    // Listen for draft quizzes updates
    this.quizSubscriptions.add(
      this.quizService.getQuizesDraft().subscribe(quizzes => {
        this.quizesDraft = quizzes;
      })
    );

    // Listen for current draft updates
    this.quizSubscriptions.add(
      this.quizService.getCurrentDraft().subscribe({
        next: (quiz) => {
          if (quiz) {
            this.handleQuizCreationSuccess();
          }
        },
        error: (err) => {
          this.handleQuizCreationError(err);
        }
      })
    );
  }

  private handleQuizCreationSuccess(): void {
    this.isCreating = false;
    this.quizPrompt = '';
    this.quizPromptDraft = '';
    this.stopWaitingMessages();
    this.toasterService.success('Quiz created successfully!');
    this.loadQuizzes();
  }

  private handleQuizCreationError(err: any): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.quizPromptDraft = '';
    this.stopWaitingMessages();
    this.toasterService.error('Failed to create quiz. Please try again.');
    console.error('Quiz creation error:', err);
  }

  private stopWaitingMessages(): void {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
      this.messageSub = undefined;
    }
  }

  ngOnDestroy(): void {
    this.quizSubscriptions.unsubscribe();
    this.stopWaitingMessages();
  }

  cancelQuizGeneration(): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.quizPromptDraft = '';
    this.stopWaitingMessages();
  }

  loadQuizzes(): void {
  }

  createQuiz(): void {
    if (!this.quizPrompt.trim()) {
      this.toasterService.error('Please enter a quiz topic');
      return;
    }

    this.quizPromptDraft = this.quizPrompt;
    this.isCreating = true;
    
    // Start showing waiting messages
    this.messageSub = this.getWaitingMessages().subscribe(message => {
      this.currentMessage = message;
    });

    // Create the quiz - no need to subscribe since we're listening to the observable
    this.quizService.createQuiz(this.quizPromptDraft);
  }

  private getWaitingMessages(): Observable<string> {
    return interval(3000).pipe(
      map(index => this.messages[index % this.messages.length])
    );
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { queryParams: { id: quizId } });
  }

  deleteQuiz(quizId: string): void {
    this.quizService.deleteQuiz(quizId)
  }

  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }
}