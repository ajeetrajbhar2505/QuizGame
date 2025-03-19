import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../web.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
})
export class QuizPage implements OnInit {
  Questions: any[] = []; // Array to store filtered questions
  quizId: string = ''; // Variable to store the subject ID from the route
  quizDetails:any = {}
  currentQuestionIndex: number = 0; // Track the current question index
  currentQuestion: any = null; // Track the current question object
  score: number = 0; // Track the score
  showPopup: boolean = false; // Track if the popup is visible

  constructor(
    private ActivatedRoute: ActivatedRoute,
    private readonly http: HttpClient,
    private router: Router,
    private readonly webService:WebService
  ) {}

  ngOnInit(): void {
    // Initialize the quiz when the component loads
    this.initializeQuiz();
  }

  // Function to initialize the quiz
  initializeQuiz(): void {
    // Reset all state variables
    this.Questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.showPopup = false;

    // Get the subject ID from the route parameters
    this.quizId = this.ActivatedRoute.snapshot.params['id'];
    // Fetch questions from the JSON file
    this.webService.getQuizById(this.quizId).subscribe((data: any) => {
      // Filter questions based on the subject ID and add flags
      this.quizDetails = data
      this.Questions = data.questions.map((question: any) => {
        question.selectedOption = null;
        question.isAnswered = false;
        return question;
      });
      
      // Set the current question
      this.setCurrentQuestion();
    });
  }

  // Function to filter questions based on the subject ID
  filterQuestions(globalQuestions: any, id: string): any[] {
    const subjectKey = this.getSubjectKey(id); // Get the key for the subject
    return globalQuestions[subjectKey] || []; // Return the questions for the subject or an empty array if not found
  }

  // Function to map the subject ID to the JSON key
  getSubjectKey(id: string): string {
    switch (id) {
      case 'General Knowledge':
        return 'General_Knowledge';
      case 'Mathematics':
        return 'Mathematics';
      case 'English':
        return 'English';
      case 'Science':
        return 'Science';
      case 'History':
        return 'History';
      case 'Geography':
        return 'Geography';
      default:
        return ''; // Return an empty string if no match is found
    }
  }

  // Function to set the current question
  setCurrentQuestion(): void {
    this.currentQuestion = this.Questions[this.currentQuestionIndex];
  }

  // Function to handle option selection
  selectOption(option: string): void {
    if (!this.currentQuestion.isAnswered) {
      this.currentQuestion.selectedOption = option;
      this.currentQuestion.isAnswered = true;

      // Check if the selected option is correct
      if (option === this.currentQuestion.correctAnswer) {
        this.score += 1; // Add 5 points for the correct answer
      }
    }
  }

  // Function to handle the "Next" button
  nextQuestion(): void {
    if (this.currentQuestionIndex < this.Questions.length - 1) {
      this.currentQuestionIndex++;
      this.setCurrentQuestion();
    }
  }

  // Function to handle the "Back" button
  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.setCurrentQuestion();
    }
  }

  // Function to handle the "Skip" button
  skipQuestion(): void {
    if (this.currentQuestionIndex < this.Questions.length - 1) {
      this.currentQuestionIndex++;
      this.setCurrentQuestion();
    }
  }

  // Function to calculate the progress percentage
  getProgressPercentage(): number {
    return ((this.currentQuestionIndex + 1) / this.Questions.length) * 100;
  }

  // Function to check if the current question is the last one
  isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.Questions.length - 1;
  }

  // Function to handle the "Submit" button
  submitQuiz(): void {
    this.showPopup = true; // Show the popup
    let useranswers = this.Questions.filter(data=> data.isAnswered).map(data=> data.selectedOption)
    const body = { quizId : this.quizId,answers:useranswers}
    this.webService.attemptQuiz(body).subscribe(
      (res) => {
        
      },
      (err) => {
        console.error('Error attempting Quiz:', err);
      }
    );
  }

  // Function to close the popup and reset the quiz
  closePopup(): void {
    this.showPopup = false;
    this.initializeQuiz(); // Reset the quiz state
    this.router.navigate(['/home']); // Navigate to the home page
  }
}