import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, combineLatest, map } from 'rxjs';
import { Router } from '@angular/router';
import { ToasterService } from '../toaster.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  standalone : false,
  styleUrls: ['./create.page.scss'],
})
export class CreatePage implements OnInit {
  quizPrompt: string = '';
  quizPromptDraft: string = '';
  isCreating: boolean = false;;
  uploadingFile: boolean = false;;
  waitingMessage: string = "Generate 10 questions about e.g., Science, History, Movies, etc.";
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
    private router: Router,
    private cdr:ChangeDetectorRef
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
           quiz.approvalStatus !== 'rejected';
  }

createQuiz(): void {
  if (!this.validateQuizPrompt()) return;

  this.prepareForQuizCreation();
  this.startLoadingAnimation();
  
  this.quizService.createQuiz(this.quizPromptDraft).subscribe({
    next: (response) => {
      this.stopLoadingAnimation(); // Stop progress bar on success
      this.handleCreationSuccess(response);
    },
    error: (err) => {
      this.stopLoadingAnimation(); // Also stop on error
      this.handleCreationError(err);
    }
  });
}


private stopLoadingAnimation(): void {
  this.isCreating = false;
  this.quizPrompt = ''
}

private handleCreationSuccess(response: any): void {
  // Handle successful quiz creation
  this.waitingMessage = ""
  // You might want to navigate to the quiz page or show success message
  this.showSuccessMessage('Quiz created successfully!');
}

private showSuccessMessage(message: string): void {
  // Your success message implementation
  // Could use Toast, Alert, or Snackbar
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
      this.cdr.detectChanges()
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

 async loadDraftQuizzes() {
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
      this.cdr.detectChanges()
    }, 2000);
   await this.quizService.getAllQuiz().toPromise()
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

    uploadExcel(event: any) {
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = (e: any) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to array (rows & columns)
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log(data);
    };
  }


  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id;
  }
}