import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, Subscription, of, Subject } from 'rxjs';
import { switchMap, tap, catchError, map, take, filter } from 'rxjs/operators';
import { CreateQuizesService, Quiz, QuizQuestion } from '../create-quizes.service';
import { ComponentCanDeactivate } from '../quiz-guard.service';
import { AuthData, SocketService } from '../socket.service';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-ongoing',
  templateUrl: './ongoing.component.html',
  styleUrls: ['./ongoing.component.scss'],
})
export class OngoingComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  private quizSubject = new BehaviorSubject<Quiz | null>(null);
  quiz$: Observable<Quiz | null> = this.quizSubject.asObservable();
  quizId: string = "";
  currentQuestionIndex: number = 0;
  selectedOptions: number[] = [];
  remainingTime: number = 0;
  timerInterval: any;
  isAdminUser: boolean = false;
  isLoading: boolean = false;
  resultPopup: boolean = false;
  viewAnswer: boolean = false;
  private loadingStates: boolean[] = [];
  isQuizActive: boolean = false;
  private routeChangeSubscription!: Subscription;
  private deactivateSubject: Subject<boolean> | null = null;
  confirmationPopup: boolean = false;
  private backButtonListener: any;
  correctAnswersCount: number = 0;

  // Computed properties
  get currentQuestion(): QuizQuestion | undefined {
    const quiz = this.quizSubject.getValue();
    return quiz?.questions[this.currentQuestionIndex];
  }

  get progressPercentage(): number {
    const quiz = this.quizSubject.getValue();
    return quiz ? ((this.currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0;
  }

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService,
    private location: Location,
    private router: Router,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {
    this.isQuizActive = true;
    this.socketService.authDataSource.next(null);
  }

  async ngOnInit() {
    this.setupBackButtonHandler();
    this.loadQuizData();
  }

  private loadQuizData(): void {
    this.route.queryParams.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => {
        this.quizId = params['id'];
        return this.quizService.getLiveQuiz(this.quizId);
      }),
      tap(quiz => {
        this.quizSubject.next(quiz);
        this.isLoading = false;

        // Initialize selected options array
        this.selectedOptions = new Array(quiz.questions.length).fill(null);

        // Start timer if quiz is in progress
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

  private async setupBackButtonHandler() {
    if (typeof window !== 'undefined' && 'capacitor' in window) {
      this.backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (this.isQuizActive && !this.confirmationPopup) {
          this.handleBackButton();
        } else if (this.confirmationPopup) {
          this.stayInQuiz();
        } else {
          App.exitApp();
        }
      });
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    event.preventDefault();
    this.handleBackButton();
  }

  private async handleBackButton(): Promise<void> {
    if (!this.isQuizActive) return;

    this.confirmationPopup = true;
    this.cdr.detectChanges();
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (!this.isQuizActive) return true;

    this.confirmationPopup = true;
    this.deactivateSubject = new Subject<boolean>();

    return this.deactivateSubject.asObservable().pipe(
      take(1),
      map(response => {
        this.confirmationPopup = false;
        if (response) this.cleanupQuiz();
        return response;
      })
    );
  }

  stayInQuiz(): void {
    if (this.deactivateSubject) {
      this.deactivateSubject.next(false);
      this.deactivateSubject.complete();
      this.deactivateSubject = null;
    }
    this.confirmationPopup = false;
    this.resultPopup = false;
  }

  leaveQuiz(): void {
    if (this.deactivateSubject) {
      this.deactivateSubject.next(true);
      this.deactivateSubject.complete();
      this.deactivateSubject = null;
    }
    this.confirmationPopup = false;
    this.cleanupQuiz();
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  ngOnDestroy() {
    if (this.backButtonListener) this.backButtonListener.remove();
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.cleanupQuiz();
  }

  private cleanupQuiz(): void {
    this.isQuizActive = false;
    const authData: AuthData = {
      token: localStorage.getItem('token') || '',
      user: JSON.parse(localStorage.getItem('user') || '{}')
    };
    this.socketService.authDataSource.next(authData);
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.isQuizActive) {
      $event.returnValue = 'You have an active quiz. Are you sure you want to leave?';
    }
  }

  startTimer(estimatedTime: number): void {
    this.remainingTime = estimatedTime;

    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        clearInterval(this.timerInterval);
        this.isQuizActive = false;
        this.submitQuiz();
      }
    }, 1000);
  }
  

  pauseTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  nextQuestion(): void {
    const quiz = this.quizSubject.getValue();
    if (quiz && this.currentQuestionIndex < quiz.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  selectOption(optionIndex: number, quizId: string, question: QuizQuestion | any, answer: string): void {
    if (!quizId) return;

    this.selectedOptions[this.currentQuestionIndex] = optionIndex;
    this.quizService.submitAnswer(quizId, question._id, answer).subscribe(data => {
      this.quiz$.subscribe((quiz: any) => {
        quiz.questions[this.currentQuestionIndex].correctAnswer = data.correctAnswer;
      })
    });
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

  async submitQuiz(): Promise<void> {
    try {
      const quiz = this.quizSubject.getValue();
      if (quiz) {
        this.correctAnswersCount = this.calculateCorrectAnswers(quiz);
        if(!this.viewAnswer){
          this.quizService.submitQuiz(quiz._id).subscribe();
          this.pauseTimer()
        }
        this.resultPopup = true;
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }

  calculateCorrectAnswers(quiz: Quiz): number {
    return quiz.questions.reduce((count, question, index) => {
      const selectedOptionIndex = this.selectedOptions[index];
      return (selectedOptionIndex !== null &&
        selectedOptionIndex !== undefined &&
        question.correctAnswer === question.options[selectedOptionIndex])
        ? count + 1 : count;
    }, 0);
  }

  calculatePoints(quiz: Quiz): number {
    return quiz.questions.reduce((totalPoints, question, index) => {
      const selectedOptionIndex = this.selectedOptions[index];
      
      // Check if an option was selected and if it's correct
      if (selectedOptionIndex !== null && 
          selectedOptionIndex !== undefined && 
          question.correctAnswer === question.options[selectedOptionIndex]) {
        
        // Add the question's point value to the total
        return totalPoints + (question.points || 1); // Use question.points or default to 1
      }
      
      return totalPoints; // Return current total if answer is wrong or not selected
    }, 0);
  }

  isCorrectAnswer(correctAnswer: string | undefined, option: string): boolean {
    return correctAnswer === option;
  }

  viewAnswers(): void {
    this.viewAnswer = true;
    this.resultPopup = false;
  }

  async closeQuizWithoutSubmit(): Promise<void> {
    this.cleanupQuiz();
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  // Helper method to check if an answer is wrong
  isWrongAnswer(optionIndex: number, option: string): boolean {
    if (!this.viewAnswer || !this.currentQuestion) return false;

    const isSelected = this.isOptionSelected(optionIndex);
    const isCorrect = this.currentQuestion.correctAnswer === option;

    return isSelected && !isCorrect;
  }

  // Helper method to check if an answer should be shown as correct
  isCorrectAnswerToShow(option: string): boolean {
    if (!this.viewAnswer || !this.currentQuestion) return false;

    return this.currentQuestion.correctAnswer === option;
  }

  // TrackBy function for better performance
  trackByOption(index: number, option: string): string {
    return option; // Use the option text as unique identifier
  }

  trackByQuestionId(index: number, question: QuizQuestion): string {
    return question._id || index.toString();
  }
}