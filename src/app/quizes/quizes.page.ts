import { Component, EventEmitter, Input, OnInit, Output, output } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { user } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RefresherCustomEvent } from '@ionic/angular';



@Component({
  selector: 'app-quizes',
  templateUrl: './quizes.page.html',
  styleUrls: ['./quizes.page.scss'],
})
export class QuizesPage implements OnInit {
  @Input() publishedQuizzes$: Observable<Quiz[]>;
  @Input() ParentInjected: boolean = false
  isLoadingQuizzes: boolean = false;
  @Output() handleRefresh:EventEmitter<boolean> = new EventEmitter(false)

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
    this.loadInitialData();
  }

  protected loadInitialData(): void {
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 2000);
    this.handleRefresh.emit(true)
    this.quizService.getPublishedQuiz(0).subscribe();
  }

  startQuiz(quizId: string): void {
    // Quiz start logic
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


}