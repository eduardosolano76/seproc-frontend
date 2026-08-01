// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { SeprocPageComponent } from './seproc/pages/seproc-page/seproc-page.component';
import { AdminLoginComponent } from './seproc/pages/admin-seproc-login/admin-login.component';
import { AdminDashboardComponent } from './seproc/pages/admin-seproc-dashboard/admin-dashboard.component';
import { noAuthGuard } from './core/guards/no-auth-seproc.guard';
import { adminGuard } from './core/guards/admin-seproc.guard';
import { InstitucionLoginComponent } from './seproc/pages/institucion-login/institucion-login.component';
import { InstitucionRegistroComponent } from './seproc/pages/institucion-registro/institucion-registro.component';
import { adminInstitucionGuard } from './core/guards/admin-institucion.guard';
import { AdminInstitucionDashboardComponent } from './seproc/pages/admin-institucion-dashboard/admin-institucion-dashboard.component';
import { constructorInstitucionGuard } from './core/guards/constructor-institucion.guard';
import { ConstructorInstitucionDashboardComponent } from './seproc/pages/constructor-institucion-dashboard/constructor-institucion-dashboard.component';
import { supervisorInstitucionGuard } from
  './core/guards/supervisor-institucion.guard';

import { SupervisorInstitucionDashboardComponent } from
  './seproc/pages/supervisor-institucion-dashboard/supervisor-institucion-dashboard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    component: SeprocPageComponent,
    title: 'SeProc Guerrero'
  },

  // Login dinámico por institución
  {
    path: 'login/:abreviacion',
    component: InstitucionLoginComponent,
  },

  // Registro dinámico por institución
  {
    path: 'registro/:abreviacion',
    component: InstitucionRegistroComponent,
  },

  // Login del super administrador de SeProc
  {
    path: 'admin-seproc/login-seproc',
    component: AdminLoginComponent,
    title: 'SeProc Guerrero | Iniciar sesión',
    canActivate: [noAuthGuard]
  },

  // Dashboard del super administrador de SeProc
  {
    path: 'admin-seproc/dashboard-seproc',
    component: AdminDashboardComponent,
    title: 'SeProc Guerrero | Modulo Administrador',
    canActivate: [adminGuard]
  },

  // Dashboard del Administrador de la institución
  {
    path: ':abreviacion/admin-institucion/dashboard',
    component: AdminInstitucionDashboardComponent,
    canActivate: [adminInstitucionGuard]
  },

  // Dashboard del Constructor de la institución
  {
    path: ':abreviacion/constructor-institucion/dashboard',
    component: ConstructorInstitucionDashboardComponent,
    canActivate: [constructorInstitucionGuard],
  },

  // Dashboard del Supervisor de la institución
  {
    path: ':abreviacion/supervisor-institucion/dashboard',
    component: SupervisorInstitucionDashboardComponent,
    canActivate: [supervisorInstitucionGuard],
  },

  {
    path: '**',
    redirectTo: 'inicio'
  },
];