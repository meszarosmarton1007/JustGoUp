import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { GymListComponent } from './components/gym-list/gym-list.component';
import { AuthGuard } from './guards/auth.guard';
import { WallListComponent } from './components/wall-list/wall-list.component';
import { RouteManagerComponent } from './components/route-manager/route-manager.component';



const rutes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { isAuthPage: true } },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard], data: { isAuthPage: true } },
  { path: 'gyms', component: GymListComponent, canActivate: [AuthGuard] },
  { path: 'gym-walls/:gymId', component: WallListComponent, canActivate: [AuthGuard] },
  { path: 'wall-routes/:wallId', component: RouteManagerComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/gyms', pathMatch: 'full' },  // Default route
  { path: '**', redirectTo: '/gyms' }  // Wildcard route for a 404 page}
];

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    RegisterComponent,
    GymListComponent,
    WallListComponent,
    RouteManagerComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(rutes)
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
