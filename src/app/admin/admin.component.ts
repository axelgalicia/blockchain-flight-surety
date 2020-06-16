import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subscription } from 'rxjs';
import { AppService } from '../common/services/app.service';
import { OperationalStatus } from '../common/enums/operationalStatus.enum';
import { Contract } from "../common/interfaces/contract.interface";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  // Contracts
  private deployedContracts$: Subscription;
  private FlightSuretyApp: Contract;
  private FlightSuretyData: Contract;

  contractsForm: FormGroup;

  constructor(formBuilder: FormBuilder,
    appService: AppService) {
    this.contractsForm = formBuilder.group({
      isDataOperational: true,
      isAppOperational: true
    });
  }

  ngOnInit(): void {
  }


  get isDataOperational(): boolean {
    return this.contractsForm.get('isDataOperational').value;
  }

  get isAppOperational(): boolean {
    return this.contractsForm.get('isAppOperational').value;
  }

}
