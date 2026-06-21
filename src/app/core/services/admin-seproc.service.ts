// src/app/core/services/admin-seproc.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, switchAll, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SolicitudPendiente } from '../models/solicitud-pendiente.model';


export interface AdminMe {
  nombreUsuario: string;
  rolUsuario: string;
}

export interface CsrfResponse {
  token: string;
  headerName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSeprocService {

  private apiUrl = `${environment.apiUrl}`;

  private csrfToken = '';
  private csrfHeaderName = 'X-XSRF-TOKEN';

  constructor(private http: HttpClient) { }

  obtenerCsrf(): Observable<CsrfResponse> {
    return this.http.get<CsrfResponse>(
      `${this.apiUrl}/admin-seproc/csrf`,
      {
        withCredentials: true
      }
    ).pipe(
      tap((respuesta) => {
        this.csrfToken = respuesta.token;
        this.csrfHeaderName = respuesta.headerName;
      })
    );
  }

  private asegurarCsrf(): Observable<CsrfResponse | null> {
    if (this.csrfToken) {
      return of(null);
    }

    return this.obtenerCsrf();
  }

  private crearHeaders(headersExtra?: { [key: string]: string }): HttpHeaders {
    let headers = new HttpHeaders(headersExtra || {});

    if (this.csrfToken && this.csrfHeaderName) {
      headers = headers.set(this.csrfHeaderName, this.csrfToken);
    }

    return headers;
  }

  login(username: string, password: string): Observable<{ mensaje: string }> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    return this.asegurarCsrf().pipe(
      switchMap(() =>
        this.http.post<{ mensaje: string }>(
          `${this.apiUrl}/admin-seproc/login`,
          body.toString(),
          {
            headers: this.crearHeaders({
              'Content-Type': 'application/x-www-form-urlencoded'
            }),
            withCredentials: true
          }
        )
      )
    );
  }

  obtenerUsuario(): Observable<AdminMe> {
    return this.http.get<AdminMe>(`${this.apiUrl}/admin-seproc/me`, {
      withCredentials: true
    });
  }

  obtenerPendientes(): Observable<SolicitudPendiente[]> {
    return this.http.get<SolicitudPendiente[]>(`${this.apiUrl}/admin-seproc/solicitudes/pendientes`, {
      withCredentials: true
    });
  }

  aprobarSolicitud(idSolicitud: number): Observable<{ mensaje: string }> {
    return this.asegurarCsrf().pipe(
      switchMap(() =>
        this.http.post<{ mensaje: string }>(
          `${this.apiUrl}/admin-seproc/solicitudes/${idSolicitud}/aprobar`,
          {},
          {
            headers: this.crearHeaders(),
            withCredentials: true
          }
        )
      )
    );
  }

  rechazarSolicitud(idSolicitud: number): Observable<{ mensaje: string }> {
    return this.asegurarCsrf().pipe(
      switchMap(() =>
        this.http.post<{ mensaje: string }>(
          `${this.apiUrl}/admin-seproc/solicitudes/${idSolicitud}/rechazar`,
          {},
          {
            headers: this.crearHeaders(),
            withCredentials: true
          }
        )
      )
    );
  }

  logout(): Observable<{ mensaje: string }> {
    return this.asegurarCsrf().pipe(
      switchMap(() =>
        this.http.post<{ mensaje: string }>(
          `${this.apiUrl}/admin-seproc/logout`,
          {},
          {
            headers: this.crearHeaders(),
            withCredentials: true
          }
        )
      )
    );
  }
}