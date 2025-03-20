import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { WebService } from '../web.service';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit {
  loginSub!: Subscription;

  constructor(private router: Router, private webService: WebService,private socketService:SocketService) { }

  ngOnInit() {
    this.subscribeToLogin()
  }

  subscribeToLogin() {
    this.loginSub = this.socketService.loginData$.subscribe(data => {
      if (data) {
        console.log('🏡 Received login data:', data);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.loginSub) {
      this.loginSub.unsubscribe();
    }
  }

  login() {
    this.router.navigate(['/home'])
  }


  loginWithGoogle() {
    this.webService.googleLogin().subscribe(
      (res) => {
        window.open(res['url'], '_blank');
      },
      (err) => {
        console.error('Error fetching user:', err);
      }
    );
  }

}
