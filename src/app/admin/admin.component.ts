import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';


import { Subscription } from 'rxjs';
import { BlockchainService } from '../common/services/blockchain.service';
import { Contract } from "../common/interfaces/contract.interface";
import { ContractName } from '../common/enums/contractName.enum';
import { ToastService } from '../util/toast.service';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {

  private subs = new Subscription();

  // Public contracts
  private flightSuretyAppContract: Contract;
  private flightSuretyData: Contract;

  currentAccount!: string;
  contractsForm!: FormGroup;

  constructor(private formBuilder: FormBuilder,
    private toastService: ToastService,
    private blockchainService: BlockchainService) {

    this.initForms();
    this.listenForContracts();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }


  private initForms(): void {
    this.contractsForm = this.formBuilder.group({
      isDataOperational: true,
      isAppOperational: true,
      dataContractAddress: '0x',
      appContractAddress: '0x'
    });
  }

  private listenForContracts(): void {
    this.subs.add(this.blockchainService.deployedContracts$.subscribe(async (deployedContracts: Map<ContractName, Contract>) => {
      if (deployedContracts === null) {
        return;
      }
      this.flightSuretyAppContract = deployedContracts.get(ContractName.FLIGHT_SURETY_APP)!;
      this.flightSuretyData = deployedContracts.get(ContractName.FLIGHT_SURETY_DATA)!;
      this.listenForCurrentAccount();
      this.updateFormStatus();
    }));
  }

  private listenForCurrentAccount(): void {
    this.subs.add(this.blockchainService.currentAccount$.subscribe((currentAccount: string) => {
      this.currentAccount = currentAccount;
    }));
  }

  private async isDataContractOperational(): Promise<boolean> {
    return await this.flightSuretyData!.instance.isOperational();
  }

  private async isAppContractOperational(): Promise<boolean> {
    return await this.flightSuretyAppContract!.instance.isOperational();
  }

  private async updateFormStatus(): Promise<void> {
    const isDataOn = await this.isDataContractOperational();
    const isAppOn = await this.isAppContractOperational();

    this.contractsForm.patchValue({
      isDataOperational: isDataOn,
      isAppOperational: isAppOn,
      dataContractAddress: this.flightSuretyData!.instance.address,
      appContractAddress: this.flightSuretyAppContract!.instance.address,
    });

  }

  toggleDataContract(): void {
    this.updateDataStatus(!this.isDataOperational);
  }

  toggleAppContract(): void {
    this.updateAppStatus(!this.isAppOperational);
  }

  public async authorizeContract(): Promise<void> {
    await this.flightSuretyData!.instance.updateAuthorizedAppContract(this.getAppContractAddress, { from: this.currentAccount }).
      catch((error: any) => {
        console.log(error);
        this.toastService.showError('Could not authorize this contract!', 'Authorization');
      });
  }

  public async updateAppStatus(status: boolean): Promise<void> {
    await this.flightSuretyAppContract!.instance.setOperationalStatus(status, { from: this.currentAccount })
      .catch((error: any) => {
        console.log(error);
        this.contractsForm.patchValue({
          isAppOperational: !status
        });
      });
  }

  public async updateDataStatus(status: boolean): Promise<void> {
    await this.flightSuretyData!.instance.setOperationalStatus(status, { from: this.currentAccount })
      .catch((error: any) => {
        console.log(error);
        this.contractsForm.patchValue({
          isDataOperational: !status
        });
      });
  }

  get isDataOperational(): boolean {
    return this.getContractFormValue('isDataOperational');
  }

  get isAppOperational(): boolean {
    return this.getContractFormValue('isAppOperational');
  }

  get getDataContractAddress(): boolean {
    return this.getContractFormValue('dataContractAddress');
  }

  get getAppContractAddress(): boolean {
    return this.getContractFormValue('appContractAddress');
  }


  getContractFormValue(formControlName: string): any {
    return this.contractsForm.get(formControlName)!.value;
  }

}
