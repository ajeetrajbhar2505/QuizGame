import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, output } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { user } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';



@Component({
  selector: 'app-quizes',
  templateUrl: './quizes.page.html',
  styleUrls: ['./quizes.page.scss'],
})
export class QuizesPage implements OnInit, OnDestroy {
  @Input() publishedQuizzes$: Observable<Quiz[]>;
  @Input() ParentInjected: boolean = false
  isLoadingQuizzes: boolean = false;
  @Output() handleRefresh: EventEmitter<boolean> = new EventEmitter(false)

  currentUser: user = {
    id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  };

  constructor(
    private quizService: CreateQuizesService,
    protected router: Router,
    private sanitizer: DomSanitizer
  ) {
    const User: any = localStorage.getItem('user')
    if (User) {
      this.currentUser = JSON.parse(User)
    }
    this.publishedQuizzes$ = this.quizService.getPublishedQuizes$;
  }

  ngOnInit(): void {
    let isLimitRoute = ['/home'].includes(this.router.url);
    this.loadInitialData(isLimitRoute ? 3 : 0)
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData(3)
      }
    })
  }


  async loadInitialData(index: number) {
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 2000);
    this.handleRefresh.emit(true)
    await this.quizService.getPublishedQuiz(index).toPromise();
  }

  async BeginQuiz(quizId: string) {
    // Quiz start logic
    await this.quizService.BeginQuiz(quizId).toPromise();
  }


  async startQuiz(quizId: string) {
    // Quiz start logic
    await this.quizService.startQuiz(quizId).toPromise();
  }



  async completeQuizByHost(quizId: string) {
    // Quiz start logic
    await this.quizService.completeQuizByHost(quizId).toPromise();
  }

  verifyQuiz(quizId: string): void {
    this.router.navigate(['/verify-quiz'], {
      queryParams: { id: quizId }
    });
  }

  protected makeSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  avatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null;
  }

  // TrackBy functions for ngFor performance
  trackByQuizId(index: number, quiz: Quiz): string {
    return quiz._id; // Assuming Quiz has an _id property
  }

  async ngOnDestroy() {
    await this.quizService.getPublishedQuiz(3).toPromise();
  }


}