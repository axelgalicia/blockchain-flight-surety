import { Injectable, OnInit, Output, EventEmitter } from '@angular/core';
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract';

import { WindowRefService } from './window-ref.service';
import flight_surety_app_artifacts from '../../../build/contracts/FlightSuretyApp.json';
import flight_surety_data_artifacts from '../../../build/contracts/FlightSuretyData.json';
import { Subject, interval } from 'rxjs';
import { accessSync } from 'fs';
import { ToastService } from './toast.service';

@Injectable()
export class Web3Service {

  private web3: Web3;
  private web3Configured = false;
  private accounts: string[];
  public FlightSuretyApp: any;
  public FlightSuretyData: any;

  private currentAccountSource = new Subject<string>();
  public currentAccount$ = this.currentAccountSource.asObservable();
  private refreshAccountInterval$;

  constructor(private windowRef: WindowRefService,
    private toastService: ToastService) {
    this.setupContracts();
    this.refreshAccountInterval$ = interval(500).subscribe(x => {
      this.refreshAccounts();
    });

  }

  private setupMetamaskWeb3() {
    if (!this.windowRef.nativeWindow) {
      throw new Error('Can not get the window');
    }
    if (!this.windowRef.nativeWindow.web3) {
      const msg = 'Not a metamask browser';
      this.setCurrentAccount('Not connected');
      this.toastService.showError(msg, 'Connection Error');
      return;
    }
    this.web3 = new Web3(this.windowRef.nativeWindow.web3.currentProvider);
    this.web3Configured = true;
  }

  private setupContracts() {
    this.setupMetamaskWeb3();

    if (!this.web3Configured) {
      return;
    }

    this.FlightSuretyApp = contract(flight_surety_app_artifacts);
    this.FlightSuretyData = contract(flight_surety_data_artifacts);

    this.FlightSuretyApp.setProvider(this.web3.currentProvider);
    this.FlightSuretyData.setProvider(this.web3.currentProvider);
  }

  private async refreshAccounts() {

    if (!this.web3Configured) {
      return;
    }

    let accs = await this.web3.eth.getAccounts();
    if (!accs[0]) {
      accs = await this.windowRef.nativeWindow.web3.currentProvider.enable();
    }

    if (!this.accounts || this.accounts[0] !== accs[0]) {
      this.setCurrentAccount(accs[0]);
      if (!this.accounts) {
        this.toastService.showSuccess('Ethereum client connected', 'Connection Status');
      } else {
        this.toastService.showSuccess('Address updated', 'Connection Status');
      }
      this.accounts = accs;
    }
  }

  private setCurrentAccount(account: string) {
    this.currentAccountSource.next(account)
  }

}