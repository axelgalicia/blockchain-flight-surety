import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  title: string;
  // Ethereum Address for the current account
  userAccount: string;

  constructor() {
    this.title = 'Flight Surety App';
    this.userAccount = '0xa5bc6a5b6cb656ba575bc76b5a6';
  }



}
