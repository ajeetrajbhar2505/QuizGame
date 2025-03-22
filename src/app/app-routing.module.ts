import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login/login.component';
import { HomePage } from './home/home.page';
import { QuizPage } from './quiz/quiz.component';
import { WalletPage } from './wallet/wallet.component';

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
    path: 'wallet',
    component : WalletPage
  },
  {
    path: 'quiz/:id',
    component : QuizPage
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules ,useHash : true})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
