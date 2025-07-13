import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { ToasterService } from '../toaster.service';

@Component({
  selector: 'app-verify-quiz',
  templateUrl: './verify-quiz.component.html',
  styleUrls: ['./verify-quiz.component.scss']
})
export class VerifyQuizComponent implements OnInit {
  quiz!: any;
  isLoading: boolean = true;
  rejecting: boolean = false
  approving: boolean = false

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService,
    private toasterService:ToasterService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(data => {
      this.loadQuiz(data['id']);
    })
  }

  loadQuiz(quizId: string): void {
    this.isLoading = true;
    this.quizService.getQuiz(quizId).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.isLoading = false;
      },
      error: (err) => {
        this.toasterService.error('Failed to load quiz')
        console.error('Failed to load quiz', err);
        this.isLoading = false;
      }
    });
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  }

  refreshQuestion(index: number): void {
    this.quizService.generateNewQuestion(this.quiz._id,index).subscribe({
      next: (newQuestion: any) => {
        console.log({newQuestion});
        this.quiz.questions[index] = newQuestion;
      },
      error: (err: any) => {
        this.toasterService.error('Failed to refresh question')
        console.error('Failed to refresh question', err);
      }
    });
  }

  approveQuiz(): void {
    this.approving = true
    this.quizService.updateQuizStatus(this.quiz._id, true, 'approved').subscribe({
      next: (data) => {
        this.approving = false
        this.quiz = data
        this.toasterService.success('Quiz Approved')
      },
      error: (err: any) => {
        this.approving = false
        this.toasterService.error('Approval failed')
        console.error('Approval failed', err);
      }
    });
  }

  rejectQuiz(): void {
    this.rejecting = true
    this.quizService.updateQuizStatus(this.quiz._id, false, 'rejected').subscribe({
      next: (data) => {
        this.rejecting = false
        this.quiz = data
        this.toasterService.success('Quiz Rejected')
      },
      error: (err: any) => {
        this.rejecting = false
        this.toasterService.error('Rejection failed')
        console.error('Rejection failed', err);
      }
    });
  }

}