import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { WebService } from '../web.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage implements OnInit {

  constructor(private router: Router, private webService: WebService) { }

  ngOnInit() { }

  login() {
    this.router.navigate(['/home'])
  }


  loginWithGoogle() {
    this.webService.googleLogin().subscribe(
      (res) => {
      window.location.href = res['url']
      },
      (err) => {
        console.error('Error fetching user:', err);
      }
    );
  }

}
