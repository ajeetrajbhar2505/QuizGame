import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {

  constructor(
    private toastCtrl: ToastController
  ) { }


  async presentToast(message: string, duration: number = 1000, position:any, color?: string) {
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
      duration : 1000,
      position : 'top',
    });
    toast.present();
  }

  async error(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration : 3000,
      position : 'top',
    });
    toast.present();
  }

  async dismiss(){
    const toast  = await this.toastCtrl.dismiss()
  }
  
}
