import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuizRoutingModule } from './quiz-routing.module';
import { QuizComponent } from './quiz.component';
import { IonicModule } from '@ionic/angular';
import { GoogleadsService } from '../googleads.service';


@NgModule({
  declarations: [QuizComponent],
  imports: [
    CommonModule,
    QuizRoutingModule,
    IonicModule
  ],
  providers : [GoogleadsService]
})
export class QuizModule { }
