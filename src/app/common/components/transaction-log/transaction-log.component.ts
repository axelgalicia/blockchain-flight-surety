import { Component, OnInit, OnDestroy } from '@angular/core';
import { Web3Service } from '../../../util/web3.service';
import { Log } from '../../interfaces/log.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transaction-log',
  templateUrl: './transaction-log.component.html',
  styleUrls: ['./transaction-log.component.scss']
})
export class TransactionLogComponent implements OnInit, OnDestroy {

  txLog: Log[] = [];
  txLog$: Subscription;


  constructor(web3Service: Web3Service) { 
    
    // Listens for Tx Logs
    this.txLog$ = web3Service.txLog$.subscribe((log: Log) => {
      console.log(log);
      this.txLog.push(log);
    });

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.txLog$.unsubscribe();
  }

}
