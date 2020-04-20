import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from './util/toast.service';
import { Web3Service } from './util/web3.service';
import { Subscription } from 'rxjs';
import { OperationalStatus } from './common/enums/operationalStatus.enum';
import { Contract } from "./common/interfaces/contract.interface";
import { ContractName } from "./common/enums/contractName.enum";
import { Log } from './common/interfaces/log.interface';


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

  // Current Address
  currentAccount: string;
  currentAccountBalance: string;

  //  Operational status
  operationalStatus = OperationalStatus.DISCONNECTED;
  statusclass = StatusClasses.DISCONNECTED;

  // Subscriptions
  private currentAccount$: Subscription;
  private txLogs$: Subscription;

  // Contracts
  private deployedContracts$: Subscription;
  private FlightSuretyApp: Contract;
  private FlightSuretyData: Contract;

  // Web3 Object
  private web3$: Subscription;
  private web3: any;

  constructor(private web3Service: Web3Service,
    private toastService: ToastService) {


    // Assigns the current Web3 Object
    this.web3$ = this.web3Service.web3$.subscribe((web3: any) => {
      this.web3 = web3;
    });

    // Listens for new Metamask Address
    this.currentAccount$ = this.web3Service.currentAccount$.subscribe((currAccount: string) => {
      this.currentAccount = currAccount;
      this.updateAccountBalance(this.currentAccount);
    });

    // Listens for deployed contracts
    this.deployedContracts$ = this.web3Service.deployedContracts$.subscribe(async (deployedContracts: Map<ContractName, any>) => {
      this.FlightSuretyApp = deployedContracts.get(ContractName.FLIGHT_SURETY_APP);
      this.FlightSuretyData = deployedContracts.get(ContractName.FLIGHT_SURETY_DATA);
      this.updateOperationalStatus();
    });

    // Listens for Tx Logs
    this.txLogs$ = this.web3Service.txLogs$.subscribe((log: Log) => {
      console.log(log);
    });



  }

  async updateAccountBalance(address: string) {
    const weiBalance = await this.web3.eth.getBalance(address);
    this.currentAccountBalance = this.web3.utils.fromWei(weiBalance, 'ether');
  }

  public updateStatus() {
    this.FlightSuretyData.instance.setOperationalStatus(true, { from: this.currentAccount }).catch(error => {
      console.log('Rejected');
    });
  }


  ngOnInit() {
  }

  ngOnDestroy() {
    this.currentAccount$.unsubscribe();
    this.deployedContracts$.unsubscribe();
    this.txLogs$.unsubscribe();
    this.web3$.unsubscribe();
  }

  async updateOperationalStatus() {
    const isActive = await this.FlightSuretyApp.instance.isOperational() && await this.FlightSuretyData.instance.isOperational();
    this.operationalStatus = isActive ? OperationalStatus.ACTIVE : OperationalStatus.PAUSED;
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
