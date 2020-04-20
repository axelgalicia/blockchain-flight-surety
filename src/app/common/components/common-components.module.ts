import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionLogComponent } from './transaction-log/transaction-log.component';



@NgModule({
  declarations: [
    TransactionLogComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TransactionLogComponent
  ]
})
export class CommonComponentsModule { }
