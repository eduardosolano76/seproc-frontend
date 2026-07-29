// src/app/core/models/admin-institucion.model.ts

export type AdminInstitucionView =
  | 'solicitudes'
  | 'proyectos'
  | 'usuarios-supervisores'
  | 'usuarios-constructores'
  | 'usuarios-directores'
  | 'usuarios-central'
  | 'usuarios-administrador'
  | 'pendientes'
  | 'password';

export type EstadoSolicitud =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'RECHAZADA';

export type EstadoProyecto =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'FINALIZADO';

export interface PerfilAdminInstitucion {
  idUsuario: number;
  username: string;
  nombreUsuario: string;
  rolUsuario: string;
  fotoUrl: string;
  logoEmpresa: string;
  abreviacion: string;
}

export interface SolicitudResumen {
  idSolicitud: number;
  nombreEscuela: string;
  constructor: string;
  fechaSolicitud: string;
  estadoSolicitud: EstadoSolicitud;
}

export interface DetalleInmueble {
  nombreEscuela: string;
  cct1: string;
  cct2?: string | null;
  estado: string;
  municipio: string;
  ciudad: string;
  calleNumero: string;
  cp: string;
  responsableInmueble: string;
  contacto: string;
  numInmueblesEvaluar: number;
  numEntreEjes: number;
  tipoObra: string;
  tipoEdificacion: string;
}

export interface SolicitudDetalle extends DetalleInmueble {
  idSolicitud: number;
  estadoSolicitud: EstadoSolicitud;
  motivoRechazo?: string | null;
  fechaSolicitud?: string | null;
  quienEnvia: string;
  supervisorAsignado?: string | null;
}

export interface Supervisor {
  id: number;
  nombre: string;
}

export interface ProyectoResumen {
  idProyecto: number;
  idSolicitud: number;
  nombreEscuela: string;
  constructor: string;
  supervisor: string;
  fechaAprobacion: string;
  estadoProyecto: EstadoProyecto;
}

export interface ProyectoDetalle extends DetalleInmueble {
  idProyecto: number;
  idSolicitud: number;
  estadoProyecto: EstadoProyecto;
  fechaAprobacion?: string | null;
  quienEnvia: string;
  supervisorAsignado: string;
  modoVista: string;
  soloLectura: boolean;
  puedeSubir: boolean;
  puedeComentar: boolean;
  puedeAprobar: boolean;
  estadosEtapa: Record<string, string>;
}

export interface ArchivoEvidencia {
  nombre: string;
  nota?: string | null;
  url: string;
}

export interface ObservacionEtapa {
  usuarioNombre: string;
  fecha: string;
  mensaje: string;
}

export interface EntregaEtapa {
  usuarioNombre: string;
  fechaSubida: string;
  version: number;
  estadoEntrega: string;
  archivos: ArchivoEvidencia[];
}

export interface DetalleEtapa {
  ultimaObservacion?: ObservacionEtapa | null;
  entregaActual?: EntregaEtapa | null;
}

export interface HistorialEtapa {
  tipo: string;
  usuarioNombre: string;
  usuarioRol?: string;
  fecha: string;
  mensaje?: string;
  descripcion?: string;
  nombreArchivo?: string;
  urlArchivo?: string;
}

export interface UsuarioAdmin {
  idUsuario: number;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  rolNombre: string;
}

export interface UsuarioUpsert {
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  rolNombre: string;
}

export interface CambiarPassword {
  passActual: string;
  passNueva: string;
  passRepetida: string;
}

export interface DocumentoInicial {
  idDocumento?: number;
  nombreDocumento: string;
  subido: boolean;
  fechaLimite?: string;
  archivoUrl?: string;
  nombreArchivoOriginal?: string;
  estadoDocumento?: string;
}

export interface DocumentacionInicial {
  completo: boolean;
  mensaje: string;
  documentos: DocumentoInicial[];
}

export interface ApiMensaje {
  mensaje: string;
}