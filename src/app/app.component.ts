import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from './util/toast.service';
import { Web3Service } from './util/web3.service';
import { Subscription } from 'rxjs';
import { OperationalStatus } from './common/enums/operationalStatus.enum';
import { Contract } from "./common/interfaces/contract.interface";
import { ContractName } from "./common/enums/contractName.enum";


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

  // Current selected Address
  currentAccount: string;
  //  Operational status
  operationalStatus = OperationalStatus.DISCONNECTED;
  statusclass = StatusClasses.DISCONNECTED;
  // Subscriptions
  currentAccount$: Subscription;

  // Contracts
  deployedContracts$: Subscription;
  FlightSuretyApp: Contract;
  FlightSuretyData: Contract;

  constructor(private web3Service: Web3Service,
    private toastService: ToastService) {

    this.currentAccount$ = this.web3Service.currentAccount$.subscribe((currAccount: string) => {
      this.currentAccount = currAccount;
    });

    this.deployedContracts$ = this.web3Service.deployedContracts$.subscribe((deployedContracts: Map<ContractName, any>) => {
        this.FlightSuretyApp = deployedContracts.get(ContractName.FLIGHT_SURETY_APP);
        this.FlightSuretyData = deployedContracts.get(ContractName.FLIGHT_SURETY_DATA);
        this.updateOperationalStatus();
    });

  }


  ngOnInit() {
  }

  ngOnDestroy() {
    this.currentAccount$.unsubscribe();
    this.deployedContracts$.unsubscribe();
  }

  async updateOperationalStatus() {
    const isActive = await this.FlightSuretyApp.contract.isOperational() && await this.FlightSuretyData.contract.isOperational();
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
