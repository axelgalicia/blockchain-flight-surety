import { Injectable, OnDestroy } from '@angular/core';
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract';
import { ContractName } from '../common/enums/contractName.enum';
import { Contract } from "../common/interfaces/contract.interface";
import { WindowReferenceService } from './windowReference.service';
import flight_surety_app_artifacts from '../../../build/contracts/FlightSuretyApp.json';
import flight_surety_data_artifacts from '../../../build/contracts/FlightSuretyData.json';
import { Subject, interval, Subscription } from 'rxjs';
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

  private async setupContracts() {
    this.setupMetamaskWeb3();

    if (!this.web3Configured) {
      return;
    }

    this.FlightSuretyApp = contract(flight_surety_app_artifacts);
    this.FlightSuretyData = contract(flight_surety_data_artifacts);

    this.FlightSuretyApp.setProvider(this.web3.currentProvider);
    this.FlightSuretyData.setProvider(this.web3.currentProvider);

    this.FlightSuretyApp = await this.FlightSuretyApp.deployed();
    this.FlightSuretyData = await this.FlightSuretyData.deployed();

    this.updateContracts([
      {
        name: ContractName.FLIGHT_SURETY_APP,
        contract: this.FlightSuretyApp
      },
      {
        name: ContractName.FLIGHT_SURETY_DATA,
        contract: this.FlightSuretyData
      }
    ]);

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