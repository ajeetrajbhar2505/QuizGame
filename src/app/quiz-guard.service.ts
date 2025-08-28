import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CanDeactivate } from '@angular/router';
import { AlertController } from '@ionic/angular';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class QuizGuardService implements CanDeactivate<ComponentCanDeactivate> {
  private routeChangeSubject = new Subject<boolean>();
  
  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    return component.canDeactivate ? component.canDeactivate() : true;
  }

  get routeChange$(): Observable<boolean> {
    return this.routeChangeSubject.asObservable();
  }
}