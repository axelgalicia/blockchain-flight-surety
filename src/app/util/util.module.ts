import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WindowRefService} from './window-ref.service';
import {Web3Service} from "./web3.service";
import { ToastService } from './toast.service';
import { ToastrModule } from 'ngx-toastr';
@NgModule({
  imports: [
    CommonModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-center',
    })
  ],
  providers: [
    Web3Service,
    WindowRefService,
    ToastService
  ],
  declarations: [],
  exports: []
})
export class UtilModule { }