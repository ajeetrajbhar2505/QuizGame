import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { provideZoneChangeDetection } from '@angular/core';

// Create and show loading element before bootstrapping
const loadingElement = document.createElement('div');
loadingElement.innerHTML = `
  <div style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  ">
    <img src="assets/loading.gif" alt="Loading..." style="width: 80px; height: 80px;">
  </div>
`;
document.body.appendChild(loadingElement);

// Bootstrap the application
platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    // Remove loading element once app is initialized
    document.body.removeChild(loadingElement);
  })
  .catch(err => {
    console.log(err);
    // Also remove loading element if there's an error
    document.body.removeChild(loadingElement);
  });