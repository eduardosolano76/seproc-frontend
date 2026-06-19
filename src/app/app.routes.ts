// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { SeprocPageComponent } from './seproc/pages/seproc-page/seproc-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'seproc',
    pathMatch: 'full'
  },
  {
    path: 'seproc',
    component: SeprocPageComponent,
    title: 'SeProc Guerrero'
  },
  {
    path: '**',
    redirectTo: 'seproc'
  }
];