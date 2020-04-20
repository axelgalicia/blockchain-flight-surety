import { Injectable, OnDestroy } from '@angular/core';
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract';
import { ContractName } from '../common/enums/contractName.enum';
import { Contract } from "../common/interfaces/contract.interface";
import { Log } from "../common/interfaces/log.interface";
import { WindowReferenceService } from './windowReference.service';
import flight_surety_app_artifacts from '../../../build/contracts/FlightSuretyApp.json';
import flight_surety_data_artifacts from '../../../build/contracts/FlightSuretyData.json';
import { Subject, interval, Subscription, BehaviorSubject } from 'rxjs';
import { ToastService } from './toast.service';


@Injectable()
export class Web3Service implements OnDestroy {

  private web3: Web3;
  private web3Configured = false;
  private accounts: string[];
  // Contracts
  private FlightSuretyApp: any;
  private FlightSuretyData: any;

  // Deployed Contracts
  deployedContracts = new Map<ContractName, Contract>();
  deployedContractsSource = new Subject<Map<ContractName, Contract>>();
  deployedContracts$ = this.deployedContractsSource.asObservable();

  // Current Metamask Account
  private currentAccountSource = new Subject<string>();
  public currentAccount$ = this.currentAccountSource.asObservable();

  // Tx Logs
  private txLogsSource = new Subject<Log>();
  private txLogsSubscription$: any;
  txLogs$ = this.txLogsSource.asObservable();

  // Web3 Object
  private web3Source = new BehaviorSubject<any>(null);
  web3$ = this.web3Source.asObservable();

  // Interval to refresh current Metamask account
  private refreshAccountInterval$: Subscription;

  constructor(private windowRef: WindowReferenceService,
    private toastService: ToastService) {
    this.setupContracts();
    this.refreshAccountInterval$ = interval(100).subscribe(x => {
      this.refreshAccounts();
    });

  }

  ngOnDestroy() {
    this.refreshAccountInterval$.unsubscribe();
    // Web3 Subscription type
    this.txLogsSubscription$.unsubscribe();
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
    this.web3Source.next(this.web3);
  }

  private async setupContracts() {
    this.setupMetamaskWeb3();

    if (!this.web3Configured) {
      return;
    }
    
    // Create Contract object from ABI JSON object
    this.FlightSuretyApp = contract(flight_surety_app_artifacts);
    this.FlightSuretyData = contract(flight_surety_data_artifacts);

    this.FlightSuretyApp.setProvider(this.web3.currentProvider);
    this.FlightSuretyData.setProvider(this.web3.currentProvider);

    // Create new Truffle instances of these contracts
    this.FlightSuretyApp = await this.FlightSuretyApp.deployed();
    this.FlightSuretyData = await this.FlightSuretyData.deployed();

    // Listen for Transaction logs
    this.listenForTxLogs();

    this.updateContracts([
      {
        name: ContractName.FLIGHT_SURETY_APP,
        instance: this.FlightSuretyApp
      },
      {
        name: ContractName.FLIGHT_SURETY_DATA,
        instance: this.FlightSuretyData
      }
    ]);

  }

  listenForTxLogs() {
    this.txLogsSubscription$ = this.web3.eth.subscribe('logs', {}, (error, log) => { })
      .on("data", (log) => {
        this.txLogsSource.next(log);
      })
      .on("error", (error) => {
        this.toastService.showError('There was an error with the transaction, please try again.', 'Transaction')
        console.log(error);
      });

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

  // Publish the new current account
  private setCurrentAccount(account: string) {
    this.currentAccountSource.next(account)
  }

  // Publish a new version of a contract
  private updateContracts(contracts: Contract[]) {
    contracts.forEach((contract: Contract) => {
      this.deployedContracts.set(contract.name, contract);
    });
    this.deployedContractsSource.next(this.deployedContracts);
  }

}