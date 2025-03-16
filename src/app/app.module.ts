import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoaderComponent } from './loader/loader.component';
import { CommonModule } from '@angular/common';
import { LoginPage } from './login/login.component';
import { QuizPage } from './quiz/quiz.component';
import { GoogleadsService } from './googleads.service';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home/home.page';
import { HttpClientModule } from '@angular/common/http';
import { WalletPage } from './wallet/wallet.component';

@NgModule({
  declarations: [AppComponent,LoaderComponent,LoginPage,QuizPage,HomePage,WalletPage],
  imports: [CommonModule,BrowserModule,FormsModule,IonicModule, IonicModule.forRoot(), AppRoutingModule,HttpClientModule],
  providers: [GoogleadsService,{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
