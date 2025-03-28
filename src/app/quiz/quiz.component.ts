import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../web.service';
import { GoogleadsService } from '../googleads.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
})
export class QuizPage implements OnInit {

  questions: any[] = []; 
  quizId: string = '';  
  quizDetails: any = {}; 
  currentQuestionIndex: number = 0;  
  currentQuestion: any = null;  
  score: number = 0;  
  showPopup: boolean = false;  

  constructor(
    private activatedRoute: ActivatedRoute,
    private readonly googleAds: GoogleadsService,
    private router: Router,
    private readonly webService: WebService
  ) {}

  ngOnInit(): void {
    // Show ads before loading the quiz
    this.initializeQuiz();
  }

  

  // Show a random ad (Interstitial or Rewarded Video) before the quiz starts
  private showRandomAdBeforeQuiz(): void {
    const randomAdType = this.getRandomInt(1, 2);
    console.log(randomAdType);
    
    if (randomAdType === 1) {
      this.showInterstitialAd();
    } else {
      this.showRewardedAd();
    }
  }

  // Show an interstitial ad
  private showInterstitialAd(): void {
    this.googleAds.loadInterstitialAd().then(() => {
      this.googleAds.showInterstitialAds().then((loaded) => {
        if (loaded) {
          console.log('Interstitial Ad successfully loaded and displayed.');
          // Initialize the quiz after ad is shown
        }
      }).catch((err) => {
        console.error('Failed to load or show interstitial ad:', err);
      });
    }).catch((err) => {
      console.error('Error loading interstitial ad:', err);
    });
  }

  // Show a rewarded video ad
  private showRewardedAd(): void {
    this.googleAds.loadRewardedVideoAd().then(() => {
      this.googleAds.showloadRewardedVideoAds().then((loaded) => {
        if (loaded) {
          console.log('Rewarded Ad successfully loaded and displayed.');
          // Initialize the quiz after ad is shown
        }
      }).catch((err) => {
        console.error('Failed to load or show rewarded ad:', err);
      });
    }).catch((err) => {
      console.error('Error loading rewarded ad:', err);
    });
  }

  // Initialize the quiz when the component loads
  private initializeQuiz(): void {
    this.resetQuizState();

    // Fetch the subject ID from the route and get questions
    this.quizId = this.activatedRoute.snapshot.params['id'];

    this.webService.getQuizById(this.quizId).subscribe({
      next: (data: any) => {
        this.quizDetails = data;
        this.questions = this.mapQuestions(data.questions);
        this.setCurrentQuestion();
      },
      error: (err) => console.error('Error fetching quiz data:', err)
    });
  }

  // Reset quiz-related state variables
  private resetQuizState(): void {
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.showPopup = false;
  }

  // Map questions to set the default state for options and answered status
  private mapQuestions(questions: any[]): any[] {
    return questions.map((question) => ({
      ...question,
      selectedOption: null,
      isAnswered: false
    }));
  }

  // Set the current question based on the index
  private setCurrentQuestion(): void {
    this.currentQuestion = this.questions[this.currentQuestionIndex];
  }

  // Handle option selection
  selectOption(option: string): void {
    if (!this.currentQuestion.isAnswered) {
      this.currentQuestion.selectedOption = option;
      this.currentQuestion.isAnswered = true;
      this.updateScore(option);
    }
  }

  // Update score based on the selected option
  private updateScore(option: string): void {
    if (option === this.currentQuestion.correctAnswer) {
      this.score += 1;
    }
  }

  // Navigate to the next question
  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.setCurrentQuestion();
      this.showRandomAdBeforeQuiz();
    }
  }

  // Navigate to the previous question
  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.setCurrentQuestion();
    }
  }

  // Skip to the next question
  skipQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.setCurrentQuestion();
    }
  }

  // Calculate the progress percentage
  getProgressPercentage(): number {
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }

  // Check if the current question is the last one
  isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  // Submit the quiz and show the popup
  submitQuiz(): void {
    this.showPopup = true;
    const userAnswers = this.questions
      .filter((question) => question.isAnswered)
      .map((question) => question.selectedOption);

    const body = { quizId: this.quizId, answers: userAnswers };
    this.webService.attemptQuiz(body).subscribe({
      next: (res) => {
        console.log('Quiz submitted successfully', res);
      },
      error: (err) => console.error('Error attempting quiz:', err)
    });
  }

  // Close the popup and reset the quiz
  closePopup(): void {
    this.showPopup = false;
    this.resetQuizState();
    this.router.navigate(['/home']);
  }

  // Utility function to get a random integer within a given range
  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
