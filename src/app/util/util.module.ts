import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowReferenceService } from './windowReference.service';
import { Web3Service } from "./web3.service";
import { ToastService } from './toast.service';
import { ToastrModule } from 'ngx-toastr';
@NgModule({
  imports: [
    CommonModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-center',
    })
  ],
  providers: [
    Web3Service,
    WindowReferenceService,
    ToastService
  ],
  declarations: [],
  exports: []
})
export class UtilModule { }