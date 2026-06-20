// src/app/core/models/solicitud-pendiente.model.ts

import { SolicitudInstitucion } from './solicitud-institucion.model';

export interface SolicitudPendiente extends SolicitudInstitucion {
  idSolicitud: number;
}