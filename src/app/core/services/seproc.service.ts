// src/app/core/services/seproc.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Institucion } from '../models/institucion.model';
import { SolicitudInstitucion } from '../models/solicitud-institucion.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})

export class SeprocService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  obtenerInstituciones(): Observable<Institucion[]> {
    return this.http.get<Institucion[]>(`${this.apiUrl}/seproc/instituciones`);
  }

  enviarSolicitud(solicitud: SolicitudInstitucion): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/seproc/solicitudes`, solicitud);
  }

  obtenerInstitucionPorAbreviacion(abreviacion: string): Observable<Institucion> {
    return this.http.get<Institucion>(`${this.apiUrl}/seproc/instituciones/${abreviacion}`);
  }
}