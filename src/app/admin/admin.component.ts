import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subscription, interval } from 'rxjs';
import { BlockchainService } from '../common/services/blockchain.service';
import { OperationalStatus } from '../common/enums/operationalStatus.enum';
import { Contract } from "../common/interfaces/contract.interface";
import { ContractName } from '../common/enums/contractName.enum';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {

  private subs = new Subscription();


  // Public contracts
  private FlightSuretyApp: Contract;
  private FlightSuretyData: Contract;

  private currentAccount: string;

  contractsForm: FormGroup;

  dataContractAddress: string;
  appContractAddress: string;

  constructor(private formBuilder: FormBuilder,
    private blockchainService: BlockchainService) {

    this.initForms();
    this.listenForContracts();

    interval(20000).subscribe(x => {
      this.updateAppStatus(!this.isAppOperational);
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }


  private initForms() {
    this.contractsForm = this.formBuilder.group({
      isDataOperational: true,
      isAppOperational: true
    });
  }

  private listenForContracts() {
    this.subs.add(this.blockchainService.deployedContracts$.subscribe(async (deployedContracts: Map<ContractName, any>) => {
      if (deployedContracts === null) {
        return;
      }
      this.FlightSuretyApp = deployedContracts.get(ContractName.FLIGHT_SURETY_APP);
      this.FlightSuretyData = deployedContracts.get(ContractName.FLIGHT_SURETY_DATA);
      this.listenForCurrentAccount();

    }));
  }

  private listenForCurrentAccount() {
    this.subs.add(this.blockchainService.currentAccount$.subscribe((currentAccount: string) => {
      this.currentAccount = currentAccount;
    }));
  }

  private async isDataContractOperational(): Promise<boolean> {
    return await this.FlightSuretyData.instance.isOperational();
  }

  private async isAppContractOperational(): Promise<boolean> {
    return await this.FlightSuretyApp.instance.isOperational();
  }

  private async updateFormStatus() {
    const isDataOn = await this.isDataContractOperational();
    const isAppOn = await this.isAppContractOperational();

    this.contractsForm.patchValue({
      isDataOperational: isDataOn,
      isAppOperational: isAppOn
    });
  }

  public updateAppStatus(status: boolean) {
    this.FlightSuretyData.instance.setOperationalStatus(status, { from: this.currentAccount }).catch(error => {
      console.log(error);
      console.log('Rejected');
      this.updateFormStatus();
    });
  }


  get isDataOperational(): boolean {
    return this.contractsForm.get('isDataOperational').value;
  }

  get isAppOperational(): boolean {
    return this.contractsForm.get('isAppOperational').value;
  }

}
