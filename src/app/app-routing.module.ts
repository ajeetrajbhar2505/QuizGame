import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login/login.component';
import { HomePage } from './home/home.page';
import { QuizPage } from './quiz/quiz.component';

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
    path: 'quiz/:id',
    component : QuizPage
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
