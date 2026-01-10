import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoaderComponent } from './loader/loader.component';
import { CommonModule } from '@angular/common';
import { LoginPage } from './login/login.component';
import { GoogleadsService } from './googleads.service';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home/home.page';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { WebService } from './web.service';
import { LoaderService } from './loader.service';
import { SocketService } from './socket.service';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CreatePage } from './create/create.page';
import { DiscoverPage } from './discover/discover.page';
import { ProfilePage } from './profile/profile.page';
import { AlertPage } from './alert/alert.page';
import { UserSetupPage } from './user-setup/user-setup.page';
import { CategoriesPage } from './categories/categories.page';
import { QuizesPage } from './quizes/quizes.page';
import { VerifyQuizComponent } from './verify-quiz/verify-quiz.component';
import { UsersComponent } from './users/users.component';
import { LiveQuizesComponent } from './live-quizes/live-quizes.component';
import { OngoingComponent } from './ongoing/ongoing.component';
import { HistoryComponent } from './history/history.component';
import { NgOtpInputModule } from 'ng-otp-input';

library.add(fas);

@NgModule({
  declarations: [AppComponent,LoaderComponent,LoginPage,HomePage,CreatePage,DiscoverPage,ProfilePage,AlertPage,UserSetupPage,CategoriesPage,QuizesPage,VerifyQuizComponent,UsersComponent,LiveQuizesComponent,OngoingComponent,HistoryComponent],
  imports: [CommonModule,BrowserModule,FormsModule,IonicModule, IonicModule.forRoot(), AppRoutingModule,HttpClientModule,NgOtpInputModule],
  providers: [
    GoogleadsService,
    LoaderService,
    WebService,
    InAppBrowser,
    SocketService,
    {
      provide: APP_INITIALIZER,
      useFactory: (socket: SocketService) => () => socket.connect(localStorage.getItem('token') || ''),
      deps: [SocketService],
      multi: true
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
