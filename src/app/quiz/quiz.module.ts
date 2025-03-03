import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuizRoutingModule } from './quiz-routing.module';
import { QuizComponent } from './quiz.component';
import { IonicModule } from '@ionic/angular';
import { GoogleadsService } from '../googleads.service';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [QuizComponent],
  imports: [
    CommonModule,
    QuizRoutingModule,
    IonicModule,
    HttpClientModule
  ],
  providers : [GoogleadsService]
})
export class QuizModule { }
