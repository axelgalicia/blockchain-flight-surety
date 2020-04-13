import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from './util/toast.service';
import { Web3Service } from './util/web3.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  title: string;

  // Current selected Address
  currentAccount: string;
  // Subscriptions
  currentAccount$: Subscription;

  constructor(private web3Service: Web3Service,
    private toastService: ToastService) {
    this.title = 'Flight Surety App';
    this.currentAccount$ = this.web3Service.currentAccount$.subscribe((currAccount: string) => {
      this.currentAccount = currAccount;
      console.log('ACCOUNT:', currAccount);
    });

  }


  ngOnInit() {

  }

  ngOnDestroy() {
    this.currentAccount$.unsubscribe();
  }


}
