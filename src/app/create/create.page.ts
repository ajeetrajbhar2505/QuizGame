import { Component, OnInit, OnDestroy } from '@angular/core';
import { CreateQuizesService } from '../create-quizes.service';
import { Observable, Subscription, interval, map, take } from 'rxjs';
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
  isCreating: boolean = true;
  quizesDraft: Quiz[] = [];
  waitingMessage: string = "e.g. 'Algebra basics' or paste questions here..."

  private messages = [
    "Analyzing your topic...",
    "Creating engaging questions...",
    "Verifying content accuracy...",
    "Applying difficulty settings...",
    "Quality checking...",
  ];
  private messageSub!: Subscription;


  private subscriptions: Subscription = new Subscription();

  constructor(
    private quizService: CreateQuizesService,
    private toasterService: ToasterService,
    private router: Router
  ) { }

  ngOnInit(): void {

    // return
    this.subscriptions.add(

      this.quizService.getCurrentDraft().subscribe({
        next: (quiz) => {
          this.isCreating = false;
          if (quiz) {
            this.toasterService.success('Quiz created successfully!');
            this.quizPrompt = '';
            this.quizPromptDraft = ''
            this.messageSub?.unsubscribe();
          }
          this.loadQuizzes()
        },
        error: (err) => {
          this.isCreating = false;
          this.quizPrompt = this.quizPromptDraft
          this.quizPromptDraft = ''
          this.messageSub?.unsubscribe();
          this.toasterService.success('Failed to create quiz. Please try again.');
          console.error('Quiz creation error:', err);
        }
      })
    );

    this.subscriptions.add(
      this.quizService.getQuizesDraft().subscribe({
        next: (quizes: any) => {
          this.quizesDraft = quizes;
        },
        error: (err: any) => {
          console.error('Failed to fetch quizzes:', err);
          this.toasterService.success('Failed to load quizzes. Please try again.');
        }
      })
    );

    this.loadQuizzes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  }

  cancelQuizGeneration(){
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft
    this.quizPromptDraft = ''
    this.messageSub?.unsubscribe();
  }

  loadQuizzes(): void {
    this.quizService.getAllQuiz().subscribe({
      error: (err) => {
        console.error('Error loading quizzes:', err);
      }
    });
  }

  async createQuiz() {
    if (!this.quizPrompt.trim()) {
      this.toasterService.success('Please enter a quiz topic');
      return;
    }

    this.quizPromptDraft = this.quizPrompt
    this.messageSub = this.getMessages().subscribe({
      next: (message) => {
        this.quizPrompt = message
      }
    });
    this.isCreating = true;
    // return
    this.quizService.createQuiz(this.quizPromptDraft).subscribe({
      error: (err) => {
        this.isCreating = false;
        if (this.messageSub) {
          this.messageSub.unsubscribe();
        }
        console.error('Quiz creation error:', err);
      }
    });
  }



  verifyQuiz(quizId: String) {
    this.router.navigate([`/verify-quiz`], { queryParams: { id: quizId } })
  }

  deleteQuiz(quizId: string, index: number): void {
    this.quizService.deleteQuiz(quizId).subscribe({
      next: () => {
        this.quizesDraft = this.quizesDraft.filter((_, i) => i !== index);
      },
      error: (err) => {
        this.toasterService.error(err.error?.message || 'Failed to delete quiz');
        console.error('Delete failed:', err);
      }
    });
  }


  getMessages(): Observable<string> {
    return interval(3000).pipe(
      map(index => this.messages[index % this.messages.length])
    );
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
  totalQuestions?: number,
  difficulty?: string;
  approvalStatus:string
  estimatedTime:number
}

interface QuizQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}