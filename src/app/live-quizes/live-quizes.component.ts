import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, output } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { LeaderboardUser, user } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-live-quizes',
  templateUrl: './live-quizes.component.html',
  styleUrls: ['./live-quizes.component.scss'],
})
export class LiveQuizesComponent implements OnInit {
  @Input() liveQuizes$: Observable<Quiz[]>;
  @Input() quizParticipants$: Observable<Quiz | null>;
  @Input() ParentInjected: boolean = false
  isLoadingQuizzes: boolean = false;
  openModel: boolean = false
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
    if (this.currentUser.avatar) {
      this.currentUser.avatar = this.makeSafeUrl(this.currentUser.avatar);
    }
    this.liveQuizes$ = this.quizService.liveQuizes$
    this.quizParticipants$ = this.quizService.getParticipants$
  }


  ngOnInit(): void {
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData(0)
      }
    })
  }

  async loadInitialData(limit: number) {
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 2000);
    await this.quizService.getActiveQuizes(limit).toPromise();
  }

  async joinQuiz(quizId: any) {
    // Quiz start logic
    await this.quizService.joinQuiz(quizId).toPromise();
  }

  async getQuizParticipant(quizId: any) {
    // Quiz start logic
    await this.quizService.getQuizParticipant(quizId).toPromise();
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

  showDialog() {
    this.openModel = true
  }

  closeDialog() {
    this.openModel = false
  }


  handleAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/user.png';
    img.onerror = null; // Prevent infinite loop
  }

  trackByUserId(index: number, user: LeaderboardUser): string {
    return user.userId;
  }


}