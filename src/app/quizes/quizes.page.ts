import { Component, Input, OnInit } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { DashboardService, LeaderboardUser } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-quizes',
  templateUrl: './quizes.page.html',
  styleUrls: ['./quizes.page.scss'],
})
export class QuizesPage implements OnInit {
  @Input() publishedQuizzes$: Observable<Quiz[]>;
  @Input() ParentInjected:boolean = false

  constructor(
    private quizService: CreateQuizesService,
    private dashboardService:DashboardService,
    protected router:Router,
    private sanitizer: DomSanitizer
  ) {
    this.publishedQuizzes$ = this.quizService.getPublishedQuizes$;
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.quizService.getPublishedQuiz().subscribe();
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