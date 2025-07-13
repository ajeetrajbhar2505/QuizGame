import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {

  constructor(
    private toastCtrl: ToastController
  ) { }


  async presentToast(message: string, duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'bottom', color?: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position,
      color
    });
    toast.present();
  }

  async success(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration : 3000,
      position : 'bottom',
    });
    toast.present();
  }

  async error(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration : 3000,
      position : 'bottom',
    });
    toast.present();
  }
  
}
