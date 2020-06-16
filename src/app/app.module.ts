// Angular Modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field'; 
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Custom Modules
import { UtilModule } from './util/util.module';
import { MatCardModule } from '@angular/material/card';
import { CommonComponentsModule } from './common/components/common-components.module';
import { AdminComponent } from './admin/admin.component';
import { AirlinesComponent } from './airlines/airlines.component';
import { PassengerComponent } from './passenger/passenger.component';
import { AppService } from './common/services/app.service';

@NgModule({
  declarations: [
    AppComponent,
    AdminComponent,
    AirlinesComponent,
    PassengerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule,
    UtilModule,
    CommonComponentsModule
  ],
  providers: [AppService],
  bootstrap: [AppComponent]
})
export class AppModule { }
