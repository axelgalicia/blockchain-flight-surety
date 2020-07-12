import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AirlinesComponent } from './airlines/airlines.component';


const routes: Routes = [
  { path: 'admin', component: AdminComponent },
  { path: 'airlines', component: AirlinesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
