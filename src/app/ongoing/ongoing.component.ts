import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject, Subscription, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { CreateQuizesService, Quiz, QuizQuestion } from '../create-quizes.service';

@Component({
  selector: 'app-ongoing',
  templateUrl: './ongoing.component.html',
  styleUrls: ['./ongoing.component.scss'],
})
export class OngoingComponent implements OnInit, OnDestroy {
  private quizSubject = new BehaviorSubject<Quiz | null>(null);
  quiz$: Observable<Quiz | null> = this.quizSubject.asObservable();
  quizId: string = "";
  currentQuestionIndex: number = 0;
  selectedOptions: number[] = [];
  remainingTime: number = 0;
  timerInterval: any;
  isAdminUser: boolean = false;
  isLoading:boolean = false
  private loadingStates: boolean[] = [];

  // State management for loading and actions

  // Quiz data subscription
  private quizSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService,
  ) { }

  ngOnInit() {

    this.route.queryParams.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => this.quizService.getQuiz(params['id'])),
      tap(quiz => {
         // Initialize loading states for each question
         this.quizSubject.next(quiz);
         this.isLoading = false;

         // Initialize selected options array
         this.selectedOptions = new Array(quiz.questions.length).fill(null);
 
         // Start timer if quiz is in progress (not in admin preview mode)
         if (!this.isAdminUser || quiz.approvalStatus !== 'pending') {
           this.startTimer(quiz.estimatedTime);
         }
      }),
      catchError(err => {
        this.isLoading = false;
        console.error('Error loading quiz', err);
        return of(null);
      })
    ).subscribe();


 
  }

  ngOnDestroy() {
    // Clear timer when component is destroyed
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Unsubscribe from observables
    if (this.quizSubscription) {
      this.quizSubscription.unsubscribe();
    }
  }

  // Timer implementation
  startTimer(estimatedTime: number) {
    this.remainingTime = estimatedTime;

    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        clearInterval(this.timerInterval);
        this.submitQuiz();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  // Question navigation
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  nextQuestion() {
    // Get the current quiz data from the observable
    this.quizSubscription = this.quiz$.subscribe(quiz => {
      if (quiz && this.currentQuestionIndex < quiz.questions.length - 1) {
        this.currentQuestionIndex++;
      }
    });
  }

  // Option selection
  selectOption(optionIndex: number) {
    this.selectedOptions[this.currentQuestionIndex] = optionIndex;
  }

  isOptionSelected(optionIndex?: number): boolean {
    if (optionIndex !== undefined) {
      return this.selectedOptions[this.currentQuestionIndex] === optionIndex;
    }
    return this.selectedOptions[this.currentQuestionIndex] !== undefined &&
      this.selectedOptions[this.currentQuestionIndex] !== null;
  }


  getQuestionLoadingState(index: number): boolean {
    return this.loadingStates[index] || false;
  }

  // Submit quiz
  submitQuiz() {
    this.quizSubscription = this.quiz$.subscribe(quiz => {
      if (quiz) {
        // Calculate score
        const score = this.calculateScore(quiz);
        // Submit quiz results
        console.log({score});
        
      
      }
    });
  }

  calculateScore(quiz: Quiz): number {
    let correctAnswers = 0;

    quiz.questions.forEach((question, index) => {
      const selectedOptionIndex = this.selectedOptions[index];
      if (selectedOptionIndex !== null &&
        selectedOptionIndex !== undefined &&
        question.correctAnswer === question.options[selectedOptionIndex]) {
        correctAnswers++;
      }
    });

    return (correctAnswers / quiz.questions.length) * 100;
  }

  // Admin functionality from verify quiz
  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  }



  isCorrectAnswer(questionIndex: number, option: string): boolean {
    let isCorrect = false;

    this.quizSubscription = this.quiz$.subscribe(quiz => {
      if (quiz && quiz.questions[questionIndex]) {
        isCorrect = quiz.questions[questionIndex].correctAnswer === option;
      }
    });

    return isCorrect;
  }

  trackByQuestionId(index: number, question: QuizQuestion): string {
    return question._id || index.toString();
  }
}