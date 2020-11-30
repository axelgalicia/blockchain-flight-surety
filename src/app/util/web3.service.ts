import { Injectable, OnDestroy } from '@angular/core';
import { default as Web3 } from 'web3';
const contract = require('@truffle/contract');
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

  private subs = new Subscription();

  private web3: Web3;
  private web3Configured = false;
  private accounts: string[];
  // Contracts
  private flightSuretyApp: any;
  private flightSuretyData: any;

  // Deployed Contracts
  private deployedContracts = new Map<ContractName, Contract>();
  private deployedContractsSource = new BehaviorSubject<Map<ContractName, Contract>>(null);
  public readonly deployedContracts$ = this.deployedContractsSource.asObservable();

  // Current Metamask Account
  private currentAccountSource = new BehaviorSubject<string>(null);
  public readonly currentAccount$ = this.currentAccountSource.asObservable();

  // Tx Logs
  private txLogSource = new Subject<Log>();
  public readonly txLog$ = this.txLogSource.asObservable();

  // Web3 Object
  private web3Source = new BehaviorSubject<any>(null);
  public readonly web3$ = this.web3Source.asObservable();

  constructor(private windowRef: WindowReferenceService,
    private toastService: ToastService) {
    this.setupContracts();
    this.subs.add(interval(1000).subscribe(x => {
      this.refreshAccounts();
    }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private setupMetamaskWeb3(): void {
    if (!this.windowRef.nativeWindow) {
      throw new Error('Cannot get the window object');
    }
    if (!this.windowRef.nativeWindow.web3) {
      const msg = 'Not a Metamask browser';
      this.setCurrentAccount('Not connected');
      this.toastService.showError(msg, 'Connection Error');
      return;
    }
    this.web3 = new Web3(this.windowRef.nativeWindow.web3.currentProvider);
    this.web3Configured = true;
    this.web3Source.next(this.web3);
  }

  private async setupContracts(): Promise<void> {
    this.setupMetamaskWeb3();

    if (!this.web3Configured) {
      return;
    }

    // Create Contract object from ABI JSON object
    this.flightSuretyApp = contract(flight_surety_app_artifacts);
    this.flightSuretyData = contract(flight_surety_data_artifacts);

    this.flightSuretyApp.setProvider(this.web3.currentProvider);
    this.flightSuretyData.setProvider(this.web3.currentProvider);

    // Create new Truffle instances of these contracts
    this.flightSuretyApp = await this.flightSuretyApp.deployed();
    this.flightSuretyData = await this.flightSuretyData.deployed();

    // Listen for Transaction logs
    this.listenForTxLogs();

    this.updateContracts([
      {
        name: ContractName.FLIGHT_SURETY_APP,
        instance: this.flightSuretyApp
      },
      {
        name: ContractName.FLIGHT_SURETY_DATA,
        instance: this.flightSuretyData
      }
    ]);

  }

  private async isMetamaskUnlocked(): Promise<boolean> {
    return await this.windowRef.nativeWindow.web3.currentProvider._metamask.isUnlocked();
  }

  listenForTxLogs(): void {
    this.subs.add(this.web3.eth.subscribe('logs', {}, (error, log) => {
     })
      .on("data", (log: Log) => {
        this.txLogSource.next(log);
      })
      .on("error", (error) => {
        this.toastService.showError('There was an error with the transaction, please try again.', 'Transaction')
        console.log(error);
      }));

  }


  private async refreshAccounts(): Promise<void> {

    const isMetamaskUnblocked = await this.isMetamaskUnlocked();
    if (!this.web3Configured || !isMetamaskUnblocked) {
      this.setCurrentAccount(null);
      this.accounts = [];
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