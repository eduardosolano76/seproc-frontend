// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { SeprocPageComponent } from './seproc/pages/seproc-page/seproc-page.component';
import { AdminLoginComponent } from './seproc/pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './seproc/pages/admin-dashboard/admin-dashboard.component';
import { noAuthGuard } from './core/guards/no-auth-seproc.guard';
import { adminGuard } from './core/guards/admin-seproc.guard';

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
    path: 'admin-seproc/login-seproc',
    component: AdminLoginComponent,
    title: 'SeProc Guerrero | Iniciar sesión',
    canActivate: [noAuthGuard]  
  },
    {
    path: 'admin-seproc/dashboard-seproc',
    component: AdminDashboardComponent,
    title: 'SeProc Guerrero | Modulo Administrador',
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: 'seproc'
  },
];