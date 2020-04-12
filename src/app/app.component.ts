import { Component, Inject, OnInit } from '@angular/core';
import { ToastService } from './util/toast.service';
import { Web3Service } from './util/web3.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  title: string;
  // Ethereum Address for the current account
  currentAccount: string;

  constructor(private web3Service: Web3Service,
    private toastService: ToastService) {
    this.title = 'Flight Surety App';
    this.currentAccount = '0xa5bc6a5b6cb656ba575bc76b5a6';
  }


  async ngOnInit() {
     //const accounts = await this.web3.currentProvider.getAccounts();
     //console.log(accounts);
  }


}
