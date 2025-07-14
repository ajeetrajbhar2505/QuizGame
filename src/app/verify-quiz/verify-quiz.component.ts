import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateQuizesService, Quiz, QuizQuestion } from '../create-quizes.service';
import { ToasterService } from '../toaster.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-verify-quiz',
  templateUrl: './verify-quiz.component.html',
  styleUrls: ['./verify-quiz.component.scss']
})
export class VerifyQuizComponent implements OnInit, OnDestroy {
  quiz?: Quiz;
  isLoading: boolean = true;
  rejecting: boolean = false;
  approving: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService,
    private toasterService: ToasterService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        const quizId = params['id'];
        if (quizId) {
          this.loadQuiz(quizId);
        } else {
          this.toasterService.error('No quiz ID provided');
          this.isLoading = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadQuiz(quizId: string): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.quizService.getQuiz(quizId).subscribe({
        next: (quiz) => {
          this.quiz = quiz;
          this.isLoading = false;
        },
        error: (err) => {
          this.toasterService.error('Failed to load quiz');
          console.error('Failed to load quiz', err);
          this.isLoading = false;
        }
      })
    );
  }

  getDifficultyColor(difficulty?: string): string {
    if (!difficulty) return 'primary';
    
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  }

  refreshQuestion(index: number): void {
    if (!this.quiz?._id) return;

    this.subscriptions.add(
      this.quizService.generateNewQuestion(this.quiz._id, index).subscribe({
        next: (updatedQuiz) => {
          if (this.quiz?.questions) {
            this.quiz.questions[index] = updatedQuiz.questions[index];
            this.toasterService.success('Question refreshed successfully');
          }
        },
        error: (err) => {
          this.toasterService.error('Failed to refresh question');
          console.error('Failed to refresh question', err);
        }
      })
    );
  }

  approveQuiz(): void {
    if (!this.quiz?._id) return;

    this.approving = true;
    this.subscriptions.add(
      this.quizService.updateQuizStatus(this.quiz._id, true, 'approved')
    );
  }

  rejectQuiz(): void {
    if (!this.quiz?._id) return;

    this.rejecting = true;
    this.subscriptions.add(
      this.quizService.updateQuizStatus(this.quiz._id, false, 'rejected')
    );
  }

  trackByQuestionId(index: number, question: QuizQuestion): string {
    return question._id;
  }
}