import { Component, OnInit } from '@angular/core';
import { SocketService } from '../socket.service';

interface user {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage implements OnInit {
  User: user = {
    id: "",
    name: "",
    email: "",
    avatar: "",
    role: "",
    isVerified: false
  }


  constructor(private socketService: SocketService) { }


  ngOnInit(): void {
    const User: any = localStorage.getItem('user')
    if (User) {
      this.User = JSON.parse(User)
    }
    this.socketService.authData$.subscribe((data: any) => {
      if (data) {
        this.User = data.user
      }
    })
  }
  logout() {
   this,this.socketService.logout()
  }
}