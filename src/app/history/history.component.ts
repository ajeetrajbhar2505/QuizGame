import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, output } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { LeaderboardUser, user } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthData, SocketService } from '../socket.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, OnDestroy {
  @Input() submittedQuizes$: Observable<Quiz[]>;
  @Input() quizParticipants$: Observable<Quiz | null>;
  @Input() ParentInjected: boolean = false
  isLoadingQuizzes: boolean = false;
  openModel: boolean = false
  currentUser: user = {
    _id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  };

  constructor(
    private quizService: CreateQuizesService,
    protected router: Router,
    private sanitizer: DomSanitizer,
    private SocketService: SocketService
  ) {
    const User: any = localStorage.getItem('user')
    if (User) {
      this.currentUser = JSON.parse(User)
    }
    if (this.currentUser.avatar) {
      this.currentUser.avatar = this.makeSafeUrl(this.currentUser.avatar);
    }
    this.submittedQuizes$ = this.quizService.submittedQuizes$
    this.quizParticipants$ = this.quizService.getParticipants$
  }


  ngOnInit(): void {
    this.loadInitialData()
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData()
      }
    })
  }

  async loadInitialData() {
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 2000);
    await this.quizService.getSubmittedQuizes().toPromise();
  }


  async getQuizParticipant(quizId: any) {
    // Quiz start logic
    this.SocketService.authDataSource.next(null);
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
    let AuthData: AuthData = {
      token: localStorage.getItem('token') || '',
      user: JSON.parse(localStorage.getItem('user') || '{}')
    };
    this.SocketService.authDataSource.next(AuthData);
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


  async ngOnDestroy() {
    await this.quizService.getActiveQuizes(3).toPromise();

  }

}