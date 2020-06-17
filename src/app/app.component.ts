import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from './util/toast.service';
import { Subscription } from 'rxjs';
import { OperationalStatus } from './common/enums/operationalStatus.enum';
import { Contract } from "./common/interfaces/contract.interface";
import { ContractName } from './common/enums/contractName.enum';
import { BlockchainService } from './common/services/blockchain.service';


export enum StatusClasses {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISCONNECTED = 'disconnected'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  // Subscriptions
  private subs = new Subscription();

  // Public contracts
  public FlightSuretyApp: Contract;
  public FlightSuretyData: Contract;

  //  Operational status
  operationalStatus = OperationalStatus.DISCONNECTED;
  statusclass = StatusClasses.DISCONNECTED;

  currentAccountBalance: string;
  currentAccount: string;

  private web3: any;

  constructor(private blockchainService: BlockchainService,
    private toastService: ToastService) {
    this.listenForWeb3();
  }

  private listenForAccount(): void {
    // Listens for new Metamask Address
    this.subs.add(this.blockchainService.currentAccount$.subscribe((currAccount: string) => {
      this.currentAccount = currAccount;
      this.updateAccountBalance(currAccount);
      this.listenForContracts();
      this.updateOperationalStatus();
    }));
  }

  private listenForWeb3(): void {
    this.subs.add(this.blockchainService.web3$.subscribe((web3: any) => {
      this.web3 = web3;
      this.listenForAccount();
    }));
  }

  private listenForContracts(): void {
    this.blockchainService.deployedContracts$.subscribe((deployedContracts: Map<ContractName, any>) => {
      if (deployedContracts === null) {
        return;
      }
      this.FlightSuretyApp = deployedContracts.get(ContractName.FLIGHT_SURETY_APP);
      this.FlightSuretyData = deployedContracts.get(ContractName.FLIGHT_SURETY_DATA);
    });
  }

  async updateAccountBalance(address: string) {
    if (address === null) {
      this.currentAccountBalance = '';
      return;
    }
    const weiBalance = await this.web3.eth.getBalance(address);
    this.currentAccountBalance = this.web3.utils.fromWei(weiBalance, 'ether');
  }

  // public updateStatus() {
  //   this.FlightSuretyData.instance.setOperationalStatus(true, { from: this.currentAccount }).catch(error => {
  //     console.log(error);
  //     console.log('Rejected');
  //   });
  // }


  ngOnInit() {
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async updateOperationalStatus() {
    if (this.currentAccount === null) {
      this.operationalStatus = OperationalStatus.DISCONNECTED;
      this.statusclass = this.getStatusClass(OperationalStatus.DISCONNECTED);
      return;
    }

    try {
      const isActive = await this.FlightSuretyApp.instance.isOperational()
        && await this.FlightSuretyData.instance.isOperational();
      this.operationalStatus = isActive ? OperationalStatus.ACTIVE : OperationalStatus.PAUSED;
    } catch (e) {
      this.operationalStatus = OperationalStatus.DISCONNECTED;
    }

    this.statusclass = this.getStatusClass(this.operationalStatus);
  }

  getStatusClass(operationalStatus: OperationalStatus): StatusClasses {
    switch (operationalStatus) {
      case OperationalStatus.ACTIVE: return StatusClasses.ACTIVE; break;
      case OperationalStatus.PAUSED: return StatusClasses.PAUSED; break;
      case OperationalStatus.DISCONNECTED: return StatusClasses.DISCONNECTED; break;
      default: return StatusClasses.DISCONNECTED;
    }
  }


}
