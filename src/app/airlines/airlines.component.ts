import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { Contract } from '../common/interfaces/contract.interface';
import { FormGroup, FormBuilder } from '@angular/forms';
import { RegisteredFlight } from '../common/interfaces/registered-flight.interface';
import { ToastService } from '../util/toast.service';
import { BlockchainService } from '../common/services/blockchain.service';
import { ContractName } from '../common/enums/contractName.enum';

@Component({
  selector: 'app-airlines',
  templateUrl: './airlines.component.html',
  styleUrls: ['./airlines.component.scss']
})
export class AirlinesComponent implements OnInit {

  private subs = new Subscription();


  // Public contracts
  private FlightSuretyApp: Contract;
  private FlightSuretyData: Contract;

  currentAccount: string;

  contractsForm: FormGroup;

  dataContractAddress: string;
  appContractAddress: string;

  newFlightsForm: FormGroup;

  newFlightNumber: string;
  newFlightTime: string;

  dataRgisteredFlights: RegisteredFlight[] = [];
  displayedColumns: string[] = ['id', 'name', 'timestamp'];

  constructor(private formBuilder: FormBuilder,
    private toastService: ToastService,
    private blockchainService: BlockchainService) {

    this.initForms();
    this.listenForContracts();
  }

  ngOnInit(): void {
    this.initForms();
  }

  private listenForContracts() {
    this.subs.add(this.blockchainService.deployedContracts$.subscribe(async (deployedContracts: Map<ContractName, any>) => {
      if (deployedContracts === null) {
        return;
      }
      this.FlightSuretyApp = deployedContracts.get(ContractName.FLIGHT_SURETY_APP);
      this.FlightSuretyData = deployedContracts.get(ContractName.FLIGHT_SURETY_DATA);
      this.listenForCurrentAccount();
      this.dataContractAddress = this.FlightSuretyData.instance.address;
      this.appContractAddress = this.FlightSuretyApp.instance.address;
    }));
  }

  private listenForCurrentAccount() {
    this.subs.add(this.blockchainService.currentAccount$.subscribe((currentAccount: string) => {
      this.currentAccount = currentAccount;
    }));
  }

  initForms(): void {

    this.newFlightsForm = this.formBuilder.group({
      newFlightNumber: '',
      newFlightTime: ''
    });
  }

}
