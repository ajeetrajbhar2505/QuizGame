import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../loader.service';

@Component({
  selector: 'app-user-setup',
  templateUrl: './user-setup.page.html',
  styleUrls: ['./user-setup.page.scss'],
})
export class UserSetupPage implements OnInit {

  constructor(private loader:LoaderService) { }

  ngOnInit() {
  }

}
