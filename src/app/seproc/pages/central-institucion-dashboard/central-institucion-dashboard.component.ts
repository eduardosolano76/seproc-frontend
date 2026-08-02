// src/app/seproc/pages/central-institucion-dashboard/central-institucion-dashboard.component.ts

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectorRef,
    Component,
    DestroyRef,
    HostListener,
    OnInit,
    inject,
} from '@angular/core';
import {
    FormsModule,
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, distinctUntilChanged, finalize, forkJoin, map, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
    CentralInstitucionView,
    DetalleEtapaCentral,
    DocumentacionInicialCentral,
    DocumentoInicialCentral,
    EstadoProyectoCentral,
    EstadoSolicitudCentral,
    HistorialEtapaCentral,
    PerfilCentralInstitucion,
    ProyectoCentralDetalle,
    ProyectoCentralResumen,
    SolicitudCentralDetalle,
    SolicitudCentralResumen,
    SupervisorCentral,
    UsuarioCentral,
    UsuarioCentralUpsert,
    CambiarPasswordCentral,
} from '../../../core/models/central-institucion.model';
import { CentralInstitucionService } from '../../../core/services/central-institucion.service';

interface EtapaVisual {
    clave: string;
    nombre: string;
    estado: string;
}

interface BloqueVisual {
    clave: 'preliminares' | 'cimentacion' | 'estructura' | 'acabados';
    nombre: string;
    estado: string;
}

type CampoUsuario =
    | 'nombre'
    | 'apellido'
    | 'username'
    | 'email'
    | 'password';

type CampoPassword = 'actual' | 'nueva' | 'repetida';

@Component({
    selector: 'app-central-institucion-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './central-institucion-dashboard.component.html',
    styleUrl: './central-institucion-dashboard.component.css',
})
export class CentralInstitucionDashboardComponent implements OnInit {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly titleService = inject(Title);
    private readonly centralService = inject(CentralInstitucionService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);
    private versionFotoPerfil = Date.now();

    readonly vistasValidas: CentralInstitucionView[] = [
        'solicitudes',
        'proyectos',
        'usuarios-supervisores',
        'usuarios-constructores',
        'usuarios-directores',
        'password',
    ];

    perfil: PerfilCentralInstitucion | null = null;

    vista: CentralInstitucionView = 'solicitudes';
    menuUsuariosAbierto = false;
    menuPerfilAbierto = false;
    menuEstadoAbierto = false;
    menuMovilAbierto = false;

    cargandoContenido = false;
    cargandoModalSolicitud = false;
    cargandoModalDocumentacion = false;
    cargandoDetalleProyecto = false;
    enviando = false;
    busqueda = '';

    modalSinFotoAbierto = false;
    modalEliminarFotoAbierto = false;
    eliminandoFoto = false;
    modalExitoFotoAbierto = false;
    mensajeExitoFoto = '';

    modalConfirmarEstadoAbierto: boolean = false;
    estadoPendienteCambio: EstadoProyectoCentral | null = null;
    cambiandoEstado: boolean = false;
    modalExitoEstadoAbierto: boolean = false;

    readonly FOTO_PERFIL_PREDETERMINADA = '/assets/seproc/sinFotoPerfil.png';

    mensaje = '';
    tipoMensaje: 'success' | 'error' = 'success';

    estadoSolicitud: EstadoSolicitudCentral = 'PENDIENTE';
    solicitudes: SolicitudCentralResumen[] = [];
    solicitudDetalle: SolicitudCentralDetalle | null = null;
    documentacionSolicitud: DocumentacionInicialCentral | null = null;
    supervisores: SupervisorCentral[] = [];
    supervisorSeleccionado: number | null = null;
    motivoRechazo = '';

    modalSolicitudAbierto = false;
    modalSupervisorAbierto = false;
    modalRechazoAbierto = false;

    estadoProyecto: EstadoProyectoCentral = 'ACTIVO';
    proyectos: ProyectoCentralResumen[] = [];
    proyectoDetalle: ProyectoCentralDetalle | null = null;

    vistaProyecto: 'lista' | 'proceso' | 'bloque' | 'etapa' | 'historial' = 'lista';

    bloqueActual: BloqueVisual | null = null;
    etapasBloque: EtapaVisual[] = [];
    etapaActual: EtapaVisual | null = null;
    detalleEtapa: DetalleEtapaCentral | null = null;
    historialEtapa: HistorialEtapaCentral[] = [];

    documentacionProyecto: DocumentacionInicialCentral | null = null;
    modalDocumentacionAbierto = false;

    usuarios: UsuarioCentral[] = [];

    modalUsuarioAbierto = false;
    modoUsuario: 'CREAR' | 'EDITAR' = 'CREAR';
    usuarioSeleccionadoId: number | null = null;
    passwordVisible = false;

    modalEliminarUsuarioAbierto = false;
    modalExitoUsuarioAbierto = false;
    eliminandoUsuario = false;
    tituloExitoUsuario = '';
    mensajeExitoUsuario = '';
    mensajeErrorUsuario = '';

    intentoCambiarPassword = false;

    modalExitoPasswordAbierto = false;

    readonly usuarioForm = this.fb.group({
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        username: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: [''],
        rolNombre: ['', Validators.required],
    });

    readonly passwordForm = this.fb.group({
        actual: ['', Validators.required],
        nueva: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/),
            ],
        ],
        repetida: ['', Validators.required],
    });

    @HostListener('document:click', ['$event'])
    cerrarMenuPerfilAlHacerClickFuera(event: MouseEvent): void {
        const elemento = event.target as HTMLElement;

        // Cierra el menu de la foto
        if (this.menuPerfilAbierto && !elemento.closest('.userbox')) {
            this.menuPerfilAbierto = false;
        }

        // Cierra el menú de estado
        if (this.menuEstadoAbierto && !elemento.closest('.estado-dropdown-wrap')) {
            this.menuEstadoAbierto = false;
        }
    }

    private finalizarCarga(): void {
        this.cargandoContenido = false;
        this.cdr.markForCheck();
    }

    ngOnInit(): void {
        const abreviacionGuardada = sessionStorage.getItem('institucionAbreviacion')?.trim();

        this.titleService.setTitle(
            abreviacionGuardada
                ? `${abreviacionGuardada.toUpperCase()} | Módulo Central`
                : 'SEPROC | Módulo Central',
        );

        this.cargarPerfil();

        this.route.queryParamMap
            .pipe(
                map((params) => params.get('view') ?? 'solicitudes'),
                map((view) => (this.esVistaValida(view) ? view : 'solicitudes')),
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((view) => {
                this.vista = view;
                this.menuUsuariosAbierto = this.esVistaUsuarios(view);

                this.cargarVistaActual();
            });
    }

    private esVistaValida(view: string): view is CentralInstitucionView {
        return this.vistasValidas.includes(view as CentralInstitucionView);
    }

    esVistaUsuarios(view: CentralInstitucionView = this.vista): boolean {
        return view.startsWith('usuarios-');
    }

    cambiarVista(view: CentralInstitucionView): void {
        this.menuMovilAbierto = false;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { view },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private cargarVistaActual(): void {
        this.busqueda = '';
        this.vistaProyecto = 'lista';
        this.proyectoDetalle = null;

        switch (this.vista) {
            case 'solicitudes':
                this.cargarSolicitudes();
                break;

            case 'proyectos':
                this.cargarProyectos();
                break;

            case 'password':
                this.cargandoContenido = false;
                break;

            default:
                if (this.esVistaUsuarios()) {
                    this.cargarUsuarios();
                }
                break;
        }
    }

    private cargarPerfil(): void {
        this.centralService
            .obtenerPerfil()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (perfil) => {
                    this.perfil = perfil;

                    const abreviacion =
                        perfil.abreviacion?.trim() || sessionStorage.getItem('institucionAbreviacion')?.trim();

                    if (abreviacion) {
                        sessionStorage.setItem('institucionAbreviacion', abreviacion);

                        this.titleService.setTitle(`${abreviacion.toUpperCase()} | Módulo Central`);
                    } else {
                        this.titleService.setTitle('SEPROC | Módulo Central');
                    }

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    cargarSolicitudes(): void {
        this.cargandoContenido = true;

        this.centralService
            .obtenerSolicitudes(this.estadoSolicitud)
            .pipe(
                finalize(() => this.finalizarCarga()),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (solicitudes) => {
                    this.solicitudes = solicitudes;
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    seleccionarEstadoSolicitud(estado: EstadoSolicitudCentral): void {
        this.estadoSolicitud = estado;
        this.cargarSolicitudes();
    }

    get solicitudesFiltradas(): SolicitudCentralResumen[] {
        const texto = this.normalizar(this.busqueda);

        if (!texto) {
            return this.solicitudes;
        }

        return this.solicitudes.filter(
            (solicitud) =>
                this.normalizar(solicitud.nombreEscuela).includes(texto) ||
                this.normalizar(solicitud.constructor).includes(texto),
        );
    }

    abrirSolicitud(idSolicitud: number): void {
        this.modalSolicitudAbierto = true;
        this.cargandoModalSolicitud = true;
        this.solicitudDetalle = null;

        forkJoin({
            detalle: this.centralService.obtenerDetalleSolicitud(idSolicitud),

            documentacion: this.centralService
                .obtenerDocumentacionSolicitud(idSolicitud)
                .pipe(catchError(() => of(null))),
        })
            .pipe(
                finalize(() => {
                    this.cargandoModalSolicitud = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (resultado) => {
                    this.solicitudDetalle = resultado.detalle;
                    this.documentacionSolicitud = resultado.documentacion;
                },
                error: (error) => {
                    this.mostrarError(error);
                    this.modalSolicitudAbierto = false;
                },
            });
    }

    prepararAprobacionSolicitud(): void {
        if (!this.solicitudDetalle) {
            return;
        }

        this.centralService
            .obtenerSupervisores()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (supervisores) => {
                    this.supervisores = supervisores;
                    this.supervisorSeleccionado = null;
                    this.modalSupervisorAbierto = true;

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    confirmarAprobacionSolicitud(): void {
        if (!this.solicitudDetalle || !this.supervisorSeleccionado) {
            this.notificar('Selecciona un supervisor.', 'error');
            return;
        }

        this.enviando = true;

        this.centralService
            .aprobarSolicitud(this.solicitudDetalle.idSolicitud, this.supervisorSeleccionado)
            .pipe(
                finalize(() => {
                    this.enviando = false;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.modalSupervisorAbierto = false;
                    this.modalSolicitudAbierto = false;
                    this.notificar('Solicitud aprobada correctamente.', 'success');
                    this.cargarSolicitudes();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    prepararRechazoSolicitud(): void {
        this.motivoRechazo = '';
        this.modalRechazoAbierto = true;
    }

    confirmarRechazoSolicitud(): void {
        if (!this.solicitudDetalle) {
            return;
        }

        const motivo = this.motivoRechazo.trim();

        if (!motivo) {
            this.notificar('Escribe el motivo del rechazo.', 'error');
            return;
        }

        this.enviando = true;

        this.centralService
            .rechazarSolicitud(this.solicitudDetalle.idSolicitud, motivo)
            .pipe(
                finalize(() => {
                    this.enviando = false;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.modalRechazoAbierto = false;
                    this.modalSolicitudAbierto = false;
                    this.notificar('Solicitud rechazada correctamente.', 'success');
                    this.cargarSolicitudes();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    cargarProyectos(): void {
        this.cargandoContenido = true;

        this.centralService
            .obtenerProyectos(this.estadoProyecto)
            .pipe(
                finalize(() => this.finalizarCarga()),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (proyectos) => {
                    this.proyectos = proyectos;
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    seleccionarEstadoProyecto(estado: EstadoProyectoCentral): void {
        this.estadoProyecto = estado;
        this.cargarProyectos();
    }

    get proyectosFiltrados(): ProyectoCentralResumen[] {
        const texto = this.normalizar(this.busqueda);

        if (!texto) {
            return this.proyectos;
        }

        return this.proyectos.filter(
            (proyecto) =>
                this.normalizar(proyecto.nombreEscuela).includes(texto) ||
                this.normalizar(proyecto.constructor).includes(texto) ||
                this.normalizar(proyecto.supervisor).includes(texto),
        );
    }

    abrirProyecto(idProyecto: number): void {
        this.vistaProyecto = 'proceso';
        this.proyectoDetalle = null;
        this.cargandoDetalleProyecto = true;

        this.centralService
            .obtenerDetalleProyecto(idProyecto)
            .pipe(
                finalize(() => {
                    this.cargandoDetalleProyecto = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (proyecto) => {
                    this.proyectoDetalle = proyecto;
                },
                error: (error) => {
                    this.mostrarError(error);
                    this.vistaProyecto = 'lista';
                },
            });
    }

    get bloquesProyecto(): BloqueVisual[] {
        if (!this.proyectoDetalle) {
            return [];
        }

        const bloques: Array<{
            clave: BloqueVisual['clave'];
            nombre: string;
            etapas: EtapaVisual[];
        }> = [
                {
                    clave: 'preliminares',
                    nombre: 'Trabajos preliminares',
                    etapas: this.crearEtapasPreliminares(),
                },
                {
                    clave: 'cimentacion',
                    nombre: 'Cimentación',
                    etapas: this.crearEtapasCimentacion(),
                },
                {
                    clave: 'estructura',
                    nombre: 'Estructura',
                    etapas: this.crearEtapasEstructura(),
                },
                {
                    clave: 'acabados',
                    nombre: 'Albañilería y acabados',
                    etapas: this.crearEtapasAcabados(),
                },
            ];

        return bloques.map((bloque) => ({
            clave: bloque.clave,
            nombre: bloque.nombre,
            estado: this.resolverEstadoGrupo(bloque.etapas.map((etapa) => etapa.clave)),
        }));
    }

    abrirBloque(bloque: BloqueVisual): void {
        if (this.claseVisualEtapa(bloque.estado) === 'locked') {
            return;
        }

        this.bloqueActual = bloque;

        switch (bloque.clave) {
            case 'preliminares':
                this.etapasBloque = this.crearEtapasPreliminares();
                break;

            case 'cimentacion':
                this.etapasBloque = this.crearEtapasCimentacion();
                break;

            case 'estructura':
                this.etapasBloque = this.crearEtapasEstructura();
                break;

            case 'acabados':
                this.etapasBloque = this.crearEtapasAcabados();
                break;
        }

        this.vistaProyecto = 'bloque';
    }

    abrirEtapa(etapa: EtapaVisual): void {
        if (!this.proyectoDetalle || this.claseVisualEtapa(etapa.estado) === 'locked') {
            return;
        }

        this.cargandoContenido = true;
        this.etapaActual = etapa;

        this.centralService
            .obtenerDetalleEtapa(this.proyectoDetalle.idProyecto, etapa.clave)
            .pipe(
                finalize(() => this.finalizarCarga()),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (detalle) => {
                    this.detalleEtapa = detalle;
                    this.vistaProyecto = 'etapa';
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    abrirHistorialEtapa(): void {
        if (!this.proyectoDetalle || !this.etapaActual) {
            return;
        }

        this.cargandoContenido = true;

        this.centralService
            .obtenerHistorialEtapa(this.proyectoDetalle.idProyecto, this.etapaActual.clave)
            .pipe(
                finalize(() => this.finalizarCarga()),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (historial) => {
                    this.historialEtapa = historial.filter(
                        (item) => !item.tipo?.toLowerCase().includes('borrador'),
                    );

                    this.vistaProyecto = 'historial';
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    obtenerClaseTipo(tipo: string): string {
        if (!tipo) return 'tipo-default';

        const t = tipo.toLowerCase();

        if (t.includes('entrega')) return 'tipo-entrega';
        if (t.includes('aprobacion') || t.includes('aprobación')) return 'tipo-aprobacion';
        if (t.includes('observacion') || t.includes('observación')) return 'tipo-observacion';
        if (t.includes('borrador') || t.includes('borrador')) return 'tipo-borrador';

        return 'tipo-default';
    }

    seleccionarNuevoEstado(estado: EstadoProyectoCentral): void {
        this.menuEstadoAbierto = false;

        if (!this.proyectoDetalle) {
            return;
        }

        if (this.proyectoDetalle.estadoProyecto === estado) {
            return;
        }

        this.estadoPendienteCambio = estado;
        this.modalConfirmarEstadoAbierto = true;
    }

    confirmarCambioEstado(): void {
        if (!this.proyectoDetalle || !this.estadoPendienteCambio) {
            return;
        }

        this.cambiandoEstado = true;
        this.enviando = true;

        this.centralService
            .cambiarEstadoProyecto(this.proyectoDetalle.idProyecto, this.estadoPendienteCambio)
            .pipe(
                finalize(() => {
                    this.cambiandoEstado = false;
                    this.enviando = false;
                    this.modalConfirmarEstadoAbierto = false;
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: () => {
                    this.modalExitoEstadoAbierto = true;

                    this.estadoPendienteCambio = null;
                    this.vistaProyecto = 'lista';
                    this.cargarProyectos();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    abrirDocumentacionProyecto(): void {
        if (!this.proyectoDetalle) {
            return;
        }

        this.modalDocumentacionAbierto = true;
        this.cargandoModalDocumentacion = true;
        this.documentacionProyecto = null;

        this.centralService
            .obtenerDocumentacionProyecto(this.proyectoDetalle.idProyecto)
            .pipe(
                finalize(() => {
                    this.cargandoModalDocumentacion = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (documentacion) => {
                    this.documentacionProyecto = documentacion;
                },
                error: (error) => {
                    this.mostrarError(error);
                    this.modalDocumentacionAbierto = false;
                },
            });
    }

    solicitarCorreccion(documento: DocumentoInicialCentral): void {
        if (!documento.idDocumento) {
            return;
        }

        const motivo = window.prompt('Escribe el motivo de la corrección:')?.trim();

        if (!motivo) {
            return;
        }

        this.centralService
            .solicitarCorreccionDocumento(documento.idDocumento, motivo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.notificar('Se solicitó la corrección.', 'success');
                    this.abrirDocumentacionProyecto();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    aprobarDocumento(documento: DocumentoInicialCentral): void {
        if (!documento.idDocumento) {
            return;
        }

        this.centralService
            .aprobarDocumento(documento.idDocumento)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.notificar('Documento aprobado correctamente.', 'success');
                    this.abrirDocumentacionProyecto();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    private crearEtapasPreliminares(): EtapaVisual[] {
        return this.prepararEtapas([
            {
                clave: 'limpieza_trazo_nivelacion',
                nombre: 'Limpieza, trazo y nivelación',
            },
        ]);
    }

    private crearEtapasCimentacion(): EtapaVisual[] {
        return this.prepararEtapas([
            { clave: 'excavacion', nombre: 'Excavación' },
            {
                clave: 'plantilla_concreto',
                nombre: 'Plantilla de concreto',
            },
            { clave: 'zapata', nombre: 'Zapata' },
            { clave: 'contratrabe', nombre: 'Contratrabe' },
            {
                clave: 'columnas_castillos_cimentacion',
                nombre: 'Columnas o castillos',
            },
            {
                clave: 'cimbra_murete_enrase',
                nombre: 'Cimbra y murete de enrase',
            },
            {
                clave: 'concreto_cimentacion',
                nombre: 'Concreto',
            },
            {
                clave: 'habilitado_cadenas_cimentacion',
                nombre: 'Habilitado de cadenas',
            },
            { clave: 'relleno', nombre: 'Relleno' },
        ]);
    }

    private crearEtapasEstructura(): EtapaVisual[] {
        const niveles = this.obtenerNumeroNiveles();
        const etapas: Array<{
            clave: string;
            nombre: string;
        }> = [];

        for (let nivel = 1; nivel <= niveles; nivel++) {
            const prefijo = `estructura_n${nivel}_`;

            etapas.push(
                {
                    clave: `${prefijo}habilitado_castillos`,
                    nombre: `Nivel ${nivel}: Habilitado de castillos`,
                },
                {
                    clave: `${prefijo}habilitado_columnas`,
                    nombre: `Nivel ${nivel}: Habilitado de columnas`,
                },
                {
                    clave: `${prefijo}habilitado_muros_concreto`,
                    nombre: `Nivel ${nivel}: Muros de concreto`,
                },
                {
                    clave: `${prefijo}habilitado_cadenas_intermedias`,
                    nombre: `Nivel ${nivel}: Cadenas intermedias`,
                },
                {
                    clave: `${prefijo}cimbra_verticales`,
                    nombre: `Nivel ${nivel}: Cimbra vertical`,
                },
                {
                    clave: `${prefijo}concreto_verticales`,
                    nombre: `Nivel ${nivel}: Concreto vertical`,
                },
                {
                    clave: `${prefijo}habilitado_dalas`,
                    nombre: `Nivel ${nivel}: Habilitado de dalas`,
                },
                {
                    clave: `${prefijo}habilitado_vigas_trabes`,
                    nombre: `Nivel ${nivel}: Vigas y trabes`,
                },
                {
                    clave: `${prefijo}cimbra_horizontales`,
                    nombre: `Nivel ${nivel}: Cimbra horizontal`,
                },
                {
                    clave: `${prefijo}concreto_horizontales`,
                    nombre: `Nivel ${nivel}: Concreto horizontal`,
                },
                {
                    clave: `${prefijo}cimbra_losa`,
                    nombre: `Nivel ${nivel}: Cimbra para losa`,
                },
                {
                    clave: `${prefijo}habilitado_losa`,
                    nombre: `Nivel ${nivel}: Habilitado para losa`,
                },
                {
                    clave: `${prefijo}concreto_losa`,
                    nombre: `Nivel ${nivel}: Concreto de losa`,
                },
                {
                    clave: `${prefijo}habilitado_barandal_concreto`,
                    nombre: `Nivel ${nivel}: Barandal de concreto`,
                },
                {
                    clave: `${prefijo}cimbra_otros_concreto`,
                    nombre: `Nivel ${nivel}: Cimbra de otros elementos`,
                },
                {
                    clave: `${prefijo}concreto_otros_concreto`,
                    nombre: `Nivel ${nivel}: Otros elementos de concreto`,
                },
            );
        }

        return this.prepararEtapas(etapas);
    }

    private crearEtapasAcabados(): EtapaVisual[] {
        return this.prepararEtapas([
            { clave: 'pisos', nombre: 'Pisos' },
            { clave: 'guarnicion', nombre: 'Guarnición' },
        ]);
    }

    private prepararEtapas(etapas: Array<{ clave: string; nombre: string }>): EtapaVisual[] {
        const estados = this.proyectoDetalle?.estadosEtapa ?? {};

        const existeAlguna = etapas.some((etapa) =>
            Object.prototype.hasOwnProperty.call(estados, etapa.clave),
        );

        const etapasFinales = existeAlguna
            ? etapas.filter((etapa) => Object.prototype.hasOwnProperty.call(estados, etapa.clave))
            : etapas;

        return etapasFinales.map((etapa) => ({
            ...etapa,
            estado: estados[etapa.clave]?.toUpperCase() ?? 'BLOQUEADA',
        }));
    }

    private resolverEstadoGrupo(claves: string[]): string {
        const estados = this.proyectoDetalle?.estadosEtapa ?? {};

        const valores = claves.map((clave) => estados[clave]?.toUpperCase() ?? 'BLOQUEADA');

        if (valores.length === 0) {
            return 'BLOQUEADA';
        }

        if (valores.every((estado) => estado === 'APROBADA')) {
            return 'APROBADA';
        }

        if (
            valores.some((estado) =>
                ['EN_PROCESO', 'CON_OBSERVACIONES', 'DISPONIBLE', 'APROBADA'].includes(estado),
            )
        ) {
            return 'EN_PROCESO';
        }

        return 'BLOQUEADA';
    }

    private obtenerNumeroNiveles(): number {
        const tipo = this.proyectoDetalle?.tipoEdificacion?.toUpperCase();

        if (tipo === 'U3C') {
            return 3;
        }

        if (tipo === 'U2C') {
            return 2;
        }

        return 1;
    }

    claseVisualEtapa(estado?: string): 'done' | 'current' | 'locked' {
        const valor = estado?.toUpperCase();

        if (valor === 'APROBADA') {
            return 'done';
        }

        if (valor === 'EN_PROCESO' || valor === 'CON_OBSERVACIONES' || valor === 'DISPONIBLE') {
            return 'current';
        }

        return 'locked';
    }

    iconoEtapa(estado?: string): string {
        switch (this.claseVisualEtapa(estado)) {
            case 'done':
                return '/assets/seproc/listo.png';

            case 'current':
                return '/assets/seproc/proceso.png';

            default:
                return '/assets/seproc/bloqueado.png';
        }
    }

    get avanceProyecto(): number {
        const estados = Object.values(this.proyectoDetalle?.estadosEtapa ?? {});

        if (estados.length === 0) {
            return 0;
        }

        const aprobadas = estados.filter((estado) => estado?.toUpperCase() === 'APROBADA').length;

        return Math.round((aprobadas / estados.length) * 100);
    }

    cargarUsuarios(): void {
        this.cargandoContenido = true;

        this.centralService
            .obtenerUsuarios(this.vista)
            .pipe(
                finalize(() => this.finalizarCarga()),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (usuarios) => {
                    this.usuarios = usuarios;
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    get usuariosFiltrados(): UsuarioCentral[] {
        const texto = this.normalizar(this.busqueda);

        if (!texto) {
            return this.usuarios;
        }

        return this.usuarios.filter(
            (usuario) =>
                this.normalizar(`${usuario.nombre} ${usuario.apellido}`).includes(texto) ||
                this.normalizar(usuario.username).includes(texto) ||
                this.normalizar(usuario.email).includes(texto),
        );
    }

    abrirCrearUsuario(): void {
        const rolNombre = this.obtenerRolDeVista();

        this.modoUsuario = 'CREAR';
        this.usuarioSeleccionadoId = null;
        this.passwordVisible = false;
        this.mensajeErrorUsuario = '';

        this.usuarioForm.controls.password.setValidators([
            Validators.required
        ]);

        this.usuarioForm.controls.password.updateValueAndValidity({
            emitEvent: false
        });

        this.usuarioForm.reset({
            nombre: '',
            apellido: '',
            username: '',
            email: '',
            password: '',
            rolNombre,
        });

        this.modalUsuarioAbierto = true;
    }

    abrirEditarUsuario(idUsuario: number): void {
        this.centralService
            .obtenerUsuario(idUsuario)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (usuario) => {
                    this.modoUsuario = 'EDITAR';
                    this.usuarioForm.controls.password.clearValidators();

                    this.usuarioForm.controls.password.updateValueAndValidity({
                        emitEvent: false
                    });
                    this.usuarioSeleccionadoId = idUsuario;
                    this.passwordVisible = false;
                    this.mensajeErrorUsuario = '';

                    this.usuarioForm.reset({
                        nombre: usuario.nombre ?? '',
                        apellido: usuario.apellido ?? '',
                        username: usuario.username ?? '',
                        email: usuario.email ?? '',
                        password: '',
                        rolNombre: usuario.rolNombre ?? '',
                    });

                    this.modalUsuarioAbierto = true;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    guardarUsuario(): void {
        this.mensajeErrorUsuario = '';
        this.usuarioForm.markAllAsTouched();

        if (this.usuarioForm.invalid) {
            return;
        }

        const payload: UsuarioCentralUpsert = this.usuarioForm.getRawValue();
        const esCreacion = this.modoUsuario === 'CREAR';

        this.enviando = true;

        const peticion = esCreacion
            ? this.centralService.crearUsuario(payload)
            : this.centralService.actualizarUsuario(
                this.usuarioSeleccionadoId!,
                payload,
            );

        peticion
            .pipe(
                finalize(() => {
                    this.enviando = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    this.modalUsuarioAbierto = false;

                    this.tituloExitoUsuario = esCreacion
                        ? 'Usuario creado'
                        : 'Usuario actualizado';

                    this.mensajeExitoUsuario =
                        respuesta.mensaje ||
                        (esCreacion
                            ? 'Usuario creado correctamente.'
                            : 'Usuario actualizado correctamente.');

                    this.modalExitoUsuarioAbierto = true;
                    this.usuarioSeleccionadoId = null;

                    this.cargarUsuarios();
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.manejarErrorUsuario(error);
                },
            });
    }

    campoUsuarioInvalido(campo: CampoUsuario): boolean {
        const control = this.usuarioForm.controls[campo];

        return control.invalid && (control.touched || control.dirty);
    }

    mensajeCampoUsuario(campo: CampoUsuario): string {
        const control = this.usuarioForm.controls[campo];

        if (
            campo === 'username' &&
            control.hasError('usernameExiste')
        ) {
            return 'Username ya existe.';
        }

        if (control.hasError('required')) {
            return 'Este campo es obligatorio.';
        }

        if (control.hasError('email')) {
            return 'Escribe un correo electrónico válido.';
        }

        return '';
    }

    eliminarUsuario(): void {
        if (!this.usuarioSeleccionadoId) {
            return;
        }

        this.modalUsuarioAbierto = false;
        this.modalEliminarUsuarioAbierto = true;
    }

    cancelarEliminacionUsuario(): void {
        if (this.eliminandoUsuario) {
            return;
        }

        this.modalEliminarUsuarioAbierto = false;
        this.modalUsuarioAbierto = true;
    }

    confirmarEliminarUsuario(): void {
        const idUsuario = this.usuarioSeleccionadoId;

        if (!idUsuario || this.eliminandoUsuario) {
            return;
        }

        this.eliminandoUsuario = true;

        this.centralService
            .eliminarUsuario(idUsuario)
            .pipe(
                finalize(() => {
                    this.eliminandoUsuario = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    this.modalEliminarUsuarioAbierto = false;
                    this.modalUsuarioAbierto = false;

                    this.tituloExitoUsuario = 'Usuario eliminado';
                    this.mensajeExitoUsuario =
                        respuesta.mensaje || 'Usuario eliminado correctamente.';

                    this.modalExitoUsuarioAbierto = true;
                    this.usuarioSeleccionadoId = null;

                    this.cargarUsuarios();
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.modalEliminarUsuarioAbierto = false;
                    this.modalUsuarioAbierto = false;
                    this.tituloExitoUsuario = 'No se pudo eliminar el usuario';
                    this.mensajeExitoUsuario = this.obtenerMensajeError(error);

                    this.modalExitoUsuarioAbierto = true;
                    this.cdr.detectChanges();
                },
            });
    }

    private obtenerRolDeVista(): string {
        const roles: Partial<Record<CentralInstitucionView, string>> = {
            'usuarios-supervisores': 'supervisor',
            'usuarios-constructores': 'contratista',
            'usuarios-directores': 'direccion',
        };

        return roles[this.vista] ?? '';
    }

    campoPasswordInvalido(campo: CampoPassword): boolean {
        const control = this.passwordForm.controls[campo];
        const tieneTexto = String(control.value ?? '').length > 0;

        if (
            campo === 'nueva' &&
            tieneTexto &&
            (control.hasError('minlength') || control.hasError('pattern'))
        ) {
            return true;
        }

        return this.intentoCambiarPassword && control.invalid;
    }

    mensajeCampoPassword(campo: CampoPassword): string {
        const control = this.passwordForm.controls[campo];
        const tieneTexto = String(control.value ?? '').length > 0;

        if (
            campo === 'nueva' &&
            tieneTexto &&
            (control.hasError('minlength') || control.hasError('pattern'))
        ) {
            return 'Debe tener al menos 8 caracteres, un número y un carácter especial.';
        }

        if (this.intentoCambiarPassword && control.hasError('required')) {
            return 'Este campo es obligatorio.';
        }

        return '';
    }

    cambiarPassword(): void {
        this.intentoCambiarPassword = true;

        if (this.passwordForm.invalid || this.enviando) {
            return;
        }

        const valores = this.passwordForm.getRawValue();

        if (valores.nueva !== valores.repetida) {
            this.notificar(
                'Las contraseñas nuevas no coinciden.',
                'error',
            );
            return;
        }

        const payload: CambiarPasswordCentral = {
            passActual: valores.actual,
            passNueva: valores.nueva,
            passRepetida: valores.repetida,
        };

        this.enviando = true;

        this.centralService
            .cambiarPassword(payload)
            .pipe(
                finalize(() => {
                    this.enviando = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    this.passwordForm.reset();
                    this.intentoCambiarPassword = false;
                    this.mensaje = '';
                    this.modalExitoPasswordAbierto = true;
                    this.cdr.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    const mensajeBackend =
                        typeof error.error === 'string'
                            ? error.error
                            : error.error?.mensaje || error.error?.message;

                    this.notificar(
                        mensajeBackend ||
                        'No fue posible cambiar la contraseña.',
                        'error',
                    );
                },
            });
    }

    subirFoto(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        const formatos = ['image/png', 'image/jpeg', 'image/webp'];

        if (!formatos.includes(file.type)) {
            this.notificar('Selecciona una imagen PNG, JPG o WEBP.', 'error');
            input.value = '';
            return;
        }

        this.centralService
            .subirFotoPerfil(file)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (respuesta) => {
                    if (this.perfil) {
                        this.perfil = {
                            ...this.perfil,
                            fotoUrl: respuesta.url,
                        };
                    }
                    this.versionFotoPerfil = Date.now();
                    this.menuPerfilAbierto = false;
                    this.mensajeExitoFoto = 'Foto actualizada correctamente.';
                    this.modalExitoFotoAbierto = true;
                    input.value = '';
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    input.value = '';
                    this.mostrarError(error);
                },
            });
    }

    eliminarFoto(): void {
        const foto = this.fotoPerfil;
        this.menuPerfilAbierto = false;

        if (!foto || foto.includes('sinFotoPerfil.png')) {
            this.modalSinFotoAbierto = true;
            return;
        }

        this.modalEliminarFotoAbierto = true;
    }

    confirmarEliminarFoto(): void {
        if (this.eliminandoFoto) {
            return;
        }

        this.eliminandoFoto = true;

        this.centralService
            .eliminarFotoPerfil()
            .pipe(
                finalize(() => {
                    this.eliminandoFoto = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    if (this.perfil) {
                        this.perfil = {
                            ...this.perfil,

                            fotoUrl: '',
                        };
                    }

                    this.versionFotoPerfil = Date.now();
                    this.modalEliminarFotoAbierto = false;
                    this.menuPerfilAbierto = false;
                    this.mensajeExitoFoto = respuesta.mensaje || 'Foto eliminada correctamente.';
                    this.modalExitoFotoAbierto = true;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    verFoto(): void {
        const foto = this.fotoPerfil;
        this.menuPerfilAbierto = false;

        if (!foto || foto.includes('sinFotoPerfil.png')) {
            this.modalSinFotoAbierto = true;
            return;
        }

        window.open(foto, '_blank', 'noopener');
    }

    cerrarSesion(): void {
        this.centralService
            .cerrarSesion()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    const abreviacion = (
                        this.perfil?.abreviacion ||
                        sessionStorage.getItem('institucionAbreviacion') ||
                        ''
                    )
                        .trim()
                        .toLowerCase();

                    sessionStorage.removeItem(
                        'institucionAbreviacion'
                    );

                    if (abreviacion) {
                        this.titleService.setTitle(
                            `${abreviacion.toUpperCase()} | Iniciar sesión`
                        );

                        this.router.navigate(
                            ['/login', abreviacion],
                            {
                                replaceUrl: true,
                            }
                        );
                    } else {
                        this.titleService.setTitle(
                            'SEPROC | Iniciar sesión'
                        );

                        this.router.navigate(
                            ['/inicio'],
                            {
                                replaceUrl: true,
                            }
                        );
                    }
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    usarFotoPredeterminada(event: Event): void {
        const imagen = event.target as HTMLImageElement;

        if (!imagen.src.endsWith(this.FOTO_PERFIL_PREDETERMINADA)) {
            imagen.src = this.FOTO_PERFIL_PREDETERMINADA;
        }
    }

    get fotoPerfil(): string {
        const fotoUrl = this.perfil?.fotoUrl?.trim();

        if (
            !fotoUrl ||
            fotoUrl.toLowerCase() === 'null' ||
            fotoUrl.toLowerCase() === 'undefined' ||
            fotoUrl.includes('sinFotoPerfil.png')
        ) {
            return this.FOTO_PERFIL_PREDETERMINADA;
        }

        const url = this.centralService.resolverRecurso(fotoUrl);
        const separador = url.includes('?') ? '&' : '?';

        return `${url}${separador}v=${this.versionFotoPerfil}`;
    }

    get logoEmpresa(): string {
        const logoUrl = this.perfil?.logoEmpresa?.trim();

        const logoInvalido =
            !logoUrl || logoUrl.toLowerCase() === 'null' || logoUrl.toLowerCase() === 'undefined';

        if (!logoInvalido) {
            return this.centralService.resolverRecurso(logoUrl);
        }

        return this.obtenerLogoAlternativo();
    }

    private obtenerLogoAlternativo(): string {
        const abreviacion =
            this.perfil?.abreviacion?.trim() ||
            sessionStorage.getItem('institucionAbreviacion')?.trim() ||
            'SEPROC';

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(abreviacion)}&background=155093&color=fff`;
    }

    usarLogoAlternativo(event: Event): void {
        const imagen = event.target as HTMLImageElement;

        // Evita repetir el intento si también falla el avatar.
        if (imagen.dataset['logoAlternativo'] === 'true') {
            return;
        }

        imagen.dataset['logoAlternativo'] = 'true';
        imagen.src = this.obtenerLogoAlternativo();
    }

    recurso(url?: string | null): string {
        return this.centralService.resolverRecurso(url);
    }

    claseEstadoGeneral(estado?: string): string {
        switch (estado?.toUpperCase()) {
            case 'APROBADA':
            case 'ACTIVO':
                return 'dot-aprobada';

            case 'RECHAZADA':
            case 'FINALIZADO':
                return 'dot-rechazada';

            default:
                return 'dot-pendiente';
        }
    }

    get tituloSeccion(): string {
        switch (this.vista) {
            case 'solicitudes':
                return 'Solicitudes de proyectos';

            case 'proyectos':
                return 'Proyectos';

            case 'password':
                return 'Cambiar contraseña';

            default:
                return 'Usuarios';
        }
    }

    get subtituloSeccion(): string {
        switch (this.vista) {
            case 'solicitudes':
                return 'Revisa y decide solicitudes de proyecto';

            case 'proyectos':
                return 'Consulta y administra los proyectos registrados';

            case 'password':
                return 'Actualiza tu contraseña del sistema';

            default:
                return 'Gestiona los usuarios del sistema. Seleccione el usuario para editarlo o eliminarlo.';
        }
    }

    private normalizar(valor?: string | null): string {
        return (valor ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    private obtenerMensajeError(error: unknown): string {
        const httpError = error as HttpErrorResponse;

        if (typeof httpError?.error === 'string') {
            return httpError.error;
        }

        if (httpError?.error?.mensaje) {
            return httpError.error.mensaje;
        }

        if (httpError?.error?.message) {
            return httpError.error.message;
        }

        if (httpError?.message) {
            return httpError.message;
        }

        return 'No fue posible completar la operación.';
    }

    private manejarErrorUsuario(error: unknown): void {
        const mensaje = this.obtenerMensajeError(error);
        const mensajeNormalizado = this.normalizar(mensaje);

        if (
            mensajeNormalizado.includes('username') &&
            mensajeNormalizado.includes('ya existe')
        ) {
            const usernameControl = this.usuarioForm.controls.username;

            usernameControl.setErrors({
                ...(usernameControl.errors ?? {}),
                usernameExiste: true,
            });

            usernameControl.markAsTouched();
            this.cdr.markForCheck();
            return;
        }

        this.mensajeErrorUsuario = mensaje;
        this.cdr.markForCheck();
    }

    private mostrarError(error: unknown): void {
        this.notificar(this.obtenerMensajeError(error), 'error');
    }

    private notificar(mensaje: string, tipo: 'success' | 'error'): void {
        this.mensaje = mensaje;
        this.tipoMensaje = tipo;
        this.cdr.markForCheck();

        window.setTimeout(() => {
            if (this.mensaje === mensaje) {
                this.mensaje = '';
                this.cdr.markForCheck();
            }
        }, 5000);
    }
}