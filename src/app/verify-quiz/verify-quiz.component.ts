import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateQuizesService, Quiz } from '../create-quizes.service';

@Component({
  selector: 'app-verify-quiz',
  templateUrl: './verify-quiz.component.html',
  styleUrls: ['./verify-quiz.component.scss']
})
export class VerifyQuizComponent implements OnInit {
  quiz!: any;
  isLoading: boolean = true;
  published: boolean = false

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService
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
        this.published =  quiz.isPublic
        this.isLoading = false;
      },
      error: (err) => {
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
    this.quizService.generateNewQuestion(this.quiz._id).subscribe({
      next: (newQuestion: any) => {
        this.quiz.questions[index] = newQuestion;
      },
      error: (err: any) => {
        console.error('Failed to refresh question', err);
      }
    });
  }

  approveQuiz(): void {
    this.quizService.updateQuizStatus(this.quiz._id, true).subscribe({
      next: () => {
        this.quiz.isPublic = true
      },
      error: (err: any) => {
        console.error('Approval failed', err);
      }
    });
  }

  rejectQuiz(): void {
    this.isLoading = true
    this.quizService.updateQuizStatus(this.quiz._id, false).subscribe({
      next: () => {
        this.quiz.isPublic = false
      },
      error: (err: any) => {
        console.error('Rejection failed', err);
      }
    });
  }
}