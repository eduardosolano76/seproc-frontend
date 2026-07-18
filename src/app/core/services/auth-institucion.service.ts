// src/app/core/services/auth-institucion.service.ts

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface LoginInstitucionRequest {
  username: string;
  password: string;
  empresa: string;
}

export interface LoginInstitucionResponse {
  mensaje: string;
  redirectUrl: string;
}

export interface RegistroInstitucionRequest {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password: string;
}

export interface RegistroInstitucionResponse {
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})

export class AuthInstitucionService {

  private readonly http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}`;

  login(
    credenciales: LoginInstitucionRequest
  ): Observable<LoginInstitucionResponse> {

    const body = new HttpParams()
      .set('username', credenciales.username)
      .set('password', credenciales.password)
      .set('empresa', credenciales.empresa);

    return this.http.post<LoginInstitucionResponse>(
      `${this.apiUrl}/auth/login`,
      body,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  }

    registrar(
    abreviacion: string,
    datos: RegistroInstitucionRequest
  ): Observable<RegistroInstitucionResponse> {

    return this.http.post<RegistroInstitucionResponse>(
      `${this.apiUrl}/seproc/registro/${encodeURIComponent(abreviacion)}`,
      datos,
      {
        withCredentials: true
      }
    );
  }

  obtenerUrlBackend(ruta: string): string {
    if (!ruta) {
      return this.apiUrl;
    }

    if (/^https?:\/\//i.test(ruta)) {
      return ruta;
    }

    return `${this.apiUrl}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  }
}