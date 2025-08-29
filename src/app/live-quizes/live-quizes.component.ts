import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, output } from '@angular/core';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { LeaderboardUser, user } from '../dashboard.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SocketService } from '../socket.service';


@Component({
  selector: 'app-live-quizes',
  templateUrl: './live-quizes.component.html',
  styleUrls: ['./live-quizes.component.scss'],
})
export class LiveQuizesComponent implements OnInit,OnDestroy {
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
    private sanitizer: DomSanitizer,
    private SocketService:SocketService
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
    let isLimitRoute = ['/home'].includes(this.router.url);
    this.loadInitialData(isLimitRoute ? 3 : 0)
    this.quizService.isQuizesRefreshed.subscribe(data => {
      if (data) {
        this.loadInitialData(3)
      }
    })
  }

  async loadInitialData(index:number) {
    this.isLoadingQuizzes = true;
    setTimeout(() => {
      this.isLoadingQuizzes = false;
    }, 2000);
    await this.quizService.getActiveQuizes(index).toPromise();
  }

  async joinQuiz(quizId: any) {
    await this.quizService.joinQuiz(quizId).toPromise();
  }

  async playQuiz(quizId: any) {
    // Quiz start logic
    this.SocketService.authDataSource.next(null)
    this.router.navigate(['/ongoing'], {
      replaceUrl: true,
      queryParams: { id: quizId }
    })
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


 async ngOnDestroy() {
    await this.quizService.getActiveQuizes(3).toPromise();
    
  }

}