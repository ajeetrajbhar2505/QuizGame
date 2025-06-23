import { NgModule } from '@angular/core';
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
import { interceptorInterceptor } from './interceptor.interceptor';
import { LoaderService } from './loader.service';
import { SocketService } from './socket.service';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CreatePage } from './create/create.page';
import { DiscoverPage } from './discover/discover.page';
import { ProfilePage } from './profile/profile.page';

library.add(fas);

@NgModule({
  declarations: [AppComponent,LoaderComponent,LoginPage,HomePage,CreatePage,DiscoverPage,ProfilePage],
  imports: [CommonModule,BrowserModule,FormsModule,IonicModule, IonicModule.forRoot(), AppRoutingModule,HttpClientModule],
  providers: [
    GoogleadsService,
    LoaderService,
    WebService,
    InAppBrowser,
    SocketService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: interceptorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
