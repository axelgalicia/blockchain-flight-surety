import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';


import { Subscription } from 'rxjs';
import { BlockchainService } from '../common/services/blockchain.service';
import { Contract } from "../common/interfaces/contract.interface";
import { ContractName } from '../common/enums/contractName.enum';
import { RegisteredFlight } from '../common/interfaces/registered-flight.interface';


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

  dataRgisteredFlights: RegisteredFlight[] = [];
  displayedColumns: string[] = ['id', 'name', 'timestamp'];

  constructor(private formBuilder: FormBuilder,
    private blockchainService: BlockchainService) {

    this.initForms();
    this.listenForContracts();
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
      this.updateFormStatus();
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

    this.dataContractAddress = this.FlightSuretyData.instance.address;
    this.appContractAddress = this.FlightSuretyApp.instance.address;
  }

  toggleDataContract(): void {
    this.updateDataStatus(!this.isDataOperational);
  }

  toggleAppContract(): void {
    this.updateAppStatus(!this.isAppOperational);
  }

  public async updateAppStatus(status: boolean) {
    await this.FlightSuretyData.instance.setOperationalStatus(status, { from: this.currentAccount })
      .catch((error: any) => {
        console.log(error);
        this.contractsForm.patchValue({
          isAppOperational: !status
        });
      });
  }

  public async updateDataStatus(status: boolean) {
    await this.FlightSuretyData.instance.setOperationalStatus(status, { from: this.currentAccount })
      .catch((error: any) => {
        console.log(error);
        this.contractsForm.patchValue({
          isDataOperational: !status
        });
      });
  }

  get isDataOperational(): boolean {
    return this.contractsForm.get('isDataOperational').value;
  }

  get isAppOperational(): boolean {
    return this.contractsForm.get('isAppOperational').value;
  }

}
