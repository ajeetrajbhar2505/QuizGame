import { NgModule, createComponent } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login/login.component';
import { HomePage } from './home/home.page';
import { CreatePage } from './create/create.page';
import { DiscoverPage } from './discover/discover.page';
import { ProfilePage } from './profile/profile.page';
import { AlertPage } from './alert/alert.page';

const routes: Routes = [
  {
    path: 'login',
    component : LoginPage
  },
  {
    path: 'home',
    component : HomePage
  },
  {
    path: 'create',
    component : CreatePage
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'discover',
    component : DiscoverPage
  },
  {
    path: 'profile',
    component : ProfilePage
  },
  {
    path: 'alert',
    component : AlertPage
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules ,useHash : true})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
