import { Component, OnInit } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, combineLatest, map } from 'rxjs';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
})
export class CreatePage implements OnInit {
  quizPrompt: string = '';
  quizPromptDraft: string = '';
  isCreating: boolean = false;
  waitingMessage: string = "e.g. 'Algebra basics' or paste questions here...";
  isLoadingQuizzes: boolean = false;

  private loadingMessages = [
    "Analyzing your topic...",
    "Creating engaging questions...",
    "Verifying content accuracy...",
    "Applying difficulty settings...",
    "Quality checking...",
  ];

  // Combined observable for view
  viewModel$: Observable<{
    currentDraft: Quiz | null;
    draftQuizzes: Quiz[];
  }>;

  constructor(
    private quizService: CreateQuizesService,
    private toasterService: ToasterService,
    private router: Router
  ) {
    this.viewModel$ = combineLatest([
      this.quizService.getCurrentDraft$,
      this.quizService.getQuizesDraft$
    ]).pipe(
      map(([currentDraft, draftQuizzes]) => ({ currentDraft, draftQuizzes }))
    );
  }

  ngOnInit(): void {
    this.loadDraftQuizzes();
  }

  IsAdminTemplate(quiz: Quiz): boolean {
    return quiz.source?.toLowerCase() === 'admin-template' && 
           !quiz.isPublic && 
           quiz.approvalStatus !== 'rejected';
  }

  createQuiz(): void {
    if (!this.validateQuizPrompt()) return;

    this.prepareForQuizCreation();
    this.startLoadingAnimation();
    
    this.quizService.createQuiz(this.quizPromptDraft).subscribe({
      error: (err) => this.handleCreationError(err)
    });
  }
  
  private handleCreationError(err: any): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.resetPromptFields();
    this.toasterService.error('Failed to create quiz. Please try again.');
    console.error('Quiz creation error:', err);
  }

  private validateQuizPrompt(): boolean {
    if (!this.quizPrompt.trim()) {
      this.toasterService.error('Please enter a quiz topic');
      return false;
    }
    return true;
  }

  private prepareForQuizCreation(): void {
    this.quizPromptDraft = this.quizPrompt;
    this.isCreating = true;
  }

  private startLoadingAnimation(): void {
    let counter = 0;
    const maxMessages = this.loadingMessages.length * 2;
    
    const intervalId = setInterval(() => {
      if (counter >= maxMessages || !this.isCreating) {
        clearInterval(intervalId);
        if (this.isCreating) {
          this.quizPrompt = "Almost there...";
        }
        return;
      }
      
      this.quizPrompt = this.loadingMessages[counter % this.loadingMessages.length];
      counter++;
    }, 3000);
  }

  cancelQuizGeneration(): void {
    this.isCreating = false;
    this.quizPrompt = this.quizPromptDraft;
    this.resetPromptFields();
  }

  private resetPromptFields(): void {
    this.quizPrompt = '';
    this.quizPromptDraft = '';
  }

  loadDraftQuizzes(): void {
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 2000);
    this.quizService.getAllQuiz().subscribe(()=>{
      this.isCreating = false
    });
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], { 
      queryParams: { id: quizId }
    });
  }

  deleteQuiz(quizId: string): void {
    this.quizService.deleteQuiz(quizId).subscribe({
      error: (err) => {
        this.toasterService.error(err.error?.message || 'Failed to delete quiz');
        console.error('Delete failed:', err);
      }
    });
  }

  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }
}