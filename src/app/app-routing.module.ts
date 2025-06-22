import { NgModule, createComponent } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login/login.component';
import { HomePage } from './home/home.page';
import { CreatePage } from './create/create.page';

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
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules ,useHash : true})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
