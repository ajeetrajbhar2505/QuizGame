import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { ToasterService } from '../toaster.service';
import { Observable, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-verify-quiz',
  templateUrl: './verify-quiz.component.html',
  styleUrls: ['./verify-quiz.component.scss']
})
export class VerifyQuizComponent implements OnInit {
  quiz$!: Observable<Quiz>;
  isLoading = true;
  rejecting = false;
  approving = false;
  currentIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService,
    private toasterService: ToasterService
  ) { }

  ngOnInit(): void {
    this.quiz$ = this.route.queryParams.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => this.quizService.getQuiz(params['id'])),
      tap(() => this.isLoading = false)
    );
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  }

  refreshQuestion(quizId: string, index: number): void {
    this.currentIndex = index;
    this.quiz$ = this.quizService.generateNewQuestion(quizId, index).pipe(
      switchMap(() => this.quizService.getQuiz(quizId))
    );
  }

  approveQuiz(quizId: string): void {
    this.approving = true;
    this.quiz$ = this.quizService.updateQuizStatus(quizId, true, 'approved').pipe(
      tap(() => {
        this.approving = false;
        this.toasterService.success('Quiz Approved');
      }),
      switchMap(() => this.quizService.getQuiz(quizId)),
      tap({
        error: (err) => {
          this.approving = false;
          this.toasterService.error('Approval failed');
          console.error('Approval failed', err);
        }
      })
    );
  }

  rejectQuiz(quizId: string): void {
    this.rejecting = true;
    this.quiz$ = this.quizService.updateQuizStatus(quizId, false, 'rejected').pipe(
      tap(() => {
        this.rejecting = false;
        this.toasterService.success('Quiz Rejected');
      }),
      switchMap(() => this.quizService.getQuiz(quizId)),
      tap({
        error: (err) => {
          this.rejecting = false;
          this.toasterService.error('Rejection failed');
          console.error('Rejection failed', err);
        }
      })
    );
  }

  trackByQuestionId(index: number, question: any): string {
    return question._id || index.toString();
  }
}