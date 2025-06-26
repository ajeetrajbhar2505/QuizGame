// loader.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loaderSubject = new BehaviorSubject<boolean>(false);
  private loggedSubject = new BehaviorSubject<boolean>(false);
  loggedState = this.loggedSubject.asObservable();
  loaderState$ = this.loaderSubject.asObservable();

  userLogged(){
    this.loggedSubject.next(true)
  }

  showLoader() {
    this.loaderSubject.next(true);
  }

  hideLoader() {
    this.loaderSubject.next(false);
  }
}
