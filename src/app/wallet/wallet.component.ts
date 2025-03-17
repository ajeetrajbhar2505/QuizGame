import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
})
export class WalletPage  implements OnInit {
  sendPointsDialog:boolean = false
  WithdrawOpen:boolean = false
  constructor(private router:Router) { }

  ngOnInit() {}

  goBack(){
    this.router.navigate(['/home'])
  }

  closeWithdraw(){
    this.WithdrawOpen = false
  }

  popupWithdraw(){
    this.WithdrawOpen = true
  }

  closesendPointsDialog(){
    this.sendPointsDialog = false
  }

  popupsendPointsDialog(){
    this.sendPointsDialog = true
  }
}
