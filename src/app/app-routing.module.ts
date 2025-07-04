import { NgModule, createComponent } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login/login.component';
import { HomePage } from './home/home.page';
import { CreatePage } from './create/create.page';
import { DiscoverPage } from './discover/discover.page';
import { ProfilePage } from './profile/profile.page';
import { AlertPage } from './alert/alert.page';
import { UserSetupPage } from './user-setup/user-setup.page';
import { CategoriesPage } from './categories/categories.page';
import { QuizesPage } from './quizes/quizes.page';
import { authGuard, loginGuard } from './auth.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    canActivate : [loginGuard]
  },
  {
    path: 'home',
    component: HomePage,
    canActivate: [authGuard]
  },
  {
    path: 'create',
    component: CreatePage,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'discover',
    component: DiscoverPage,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [authGuard]
  },
  {
    path: 'alert',
    component: AlertPage,
    canActivate: [authGuard]
  },
  {
    path: 'setup',
    component: UserSetupPage,
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    component: CategoriesPage,
    canActivate: [authGuard]
  },
  {
    path: 'quizes',
    component: QuizesPage,
    canActivate: [authGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
