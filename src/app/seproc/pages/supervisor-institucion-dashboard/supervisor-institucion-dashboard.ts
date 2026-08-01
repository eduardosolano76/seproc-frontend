// src/app/seproc/pages/supervisor-institucion-dashboard/supervisor-institucion-dashboard.ts

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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormsModule,
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    distinctUntilChanged,
    finalize,
    map,
} from 'rxjs';

import {
    CambiarPasswordSupervisor,
    DetalleEtapaSupervisor,
    DocumentacionInicialSupervisor,
    EstadoProyecto,
    HistorialEtapaSupervisor,
    PerfilSupervisorInstitucion,
    ProyectoSupervisorDetalle,
    ProyectoSupervisorResumen,
    SupervisorInstitucionView,
} from '../../../core/models/supervisor-institucion.model';
import { SupervisorInstitucionService } from
    '../../../core/services/supervisor-institucion.service';

interface EtapaVisual {
    clave: string;
    nombre: string;
    estado: string;
}

interface BloqueVisual {
    clave:
    | 'preliminares'
    | 'cimentacion'
    | 'estructura'
    | 'acabados';
    nombre: string;
    estado: string;
}

type CampoPassword =
    | 'actual'
    | 'nueva'
    | 'repetida';


@Component({
    selector: 'app-supervisor-institucion-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
    ],
    templateUrl: './supervisor-institucion-dashboard.html',
    styleUrl: './supervisor-institucion-dashboard.css',
})
export class SupervisorInstitucionDashboardComponent
    implements OnInit {

    private readonly fb =
        inject(NonNullableFormBuilder);

    private readonly route =
        inject(ActivatedRoute);

    private readonly router =
        inject(Router);

    private readonly titleService =
        inject(Title);

    private readonly supervisorService =
        inject(SupervisorInstitucionService);

    private readonly destroyRef =
        inject(DestroyRef);

    private readonly cdr =
        inject(ChangeDetectorRef);

    private versionFotoPerfil = Date.now();

    readonly vistasValidas:
        SupervisorInstitucionView[] = [
            'proyectos',
            'password',
        ];

    readonly FOTO_PERFIL_PREDETERMINADA =
        '/assets/seproc/sinFotoPerfil.png';

    perfil:
        PerfilSupervisorInstitucion | null = null;

    vista:
        SupervisorInstitucionView = 'proyectos';

    menuPerfilAbierto = false;
    menuMovilAbierto = false;

    cargandoContenido = false;
    cargandoDetalleProyecto = false;
    cargandoModalDocumentacion = false;
    procesandoEtapa = false;
    enviando = false;

    mensaje = '';

    tipoMensaje:
        | 'success'
        | 'error' = 'success';

    busqueda = '';

    estadoProyecto:
        EstadoProyecto = 'ACTIVO';

    proyectos:
        ProyectoSupervisorResumen[] = [];

    proyectoDetalle:
        ProyectoSupervisorDetalle | null = null;

    vistaProyecto:
        | 'lista'
        | 'proceso'
        | 'bloque'
        | 'etapa'
        | 'historial' = 'lista';

    bloqueActual:
        BloqueVisual | null = null;

    etapasBloque:
        EtapaVisual[] = [];

    etapaActual:
        EtapaVisual | null = null;

    detalleEtapa:
        DetalleEtapaSupervisor | null = null;

    historialEtapa:
        HistorialEtapaSupervisor[] = [];

    comentarioSupervisor = '';

    modalConfirmarObservacionAbierto = false;
    modalConfirmarAprobacionAbierto = false;

    documentacionProyecto:
        DocumentacionInicialSupervisor | null = null;

    modalDocumentacionAbierto = false;

    modalSinFotoAbierto = false;
    modalEliminarFotoAbierto = false;
    eliminandoFoto = false;
    modalExitoFotoAbierto = false;
    mensajeExitoFoto = '';

    intentoCambiarPassword = false;
    modalExitoPasswordAbierto = false;

    modalNotificacionAbierto = false;
    mensajeModalNotificacion = '';

    tipoModalNotificacion:
        | 'success'
        | 'error' = 'success';

    readonly passwordForm = this.fb.group({
        actual: [
            '',
            Validators.required,
        ],
        nueva: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(
                    /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
                ),
            ],
        ],
        repetida: [
            '',
            Validators.required,
        ],
    });

    @HostListener(
        'document:click',
        ['$event']
    )
    cerrarMenuPerfilAlHacerClickFuera(
        event: MouseEvent
    ): void {

        const elemento =
            event.target as HTMLElement;

        if (
            this.menuPerfilAbierto &&
            !elemento.closest('.userbox')
        ) {
            this.menuPerfilAbierto = false;
        }
    }

    ngOnInit(): void {
        const abreviacionGuardada =
            sessionStorage
                .getItem('institucionAbreviacion')
                ?.trim();

        this.titleService.setTitle(
            abreviacionGuardada
                ? `${abreviacionGuardada.toUpperCase()} | Modulo Supervisor`
                : 'SEPROC | Modulo Supervisor'
        );

        this.cargarPerfil();

        this.route.queryParamMap
            .pipe(
                map(
                    (params) =>
                        params.get('view') ??
                        'proyectos'
                ),
                map(
                    (view) =>
                        this.esVistaValida(view)
                            ? view
                            : 'proyectos'
                ),
                distinctUntilChanged(),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe((view) => {
                this.vista = view;
                this.cargarVistaActual();
            });
    }

    private esVistaValida(
        view: string
    ): view is SupervisorInstitucionView {

        return this.vistasValidas.includes(
            view as SupervisorInstitucionView
        );
    }

    cambiarVista(
        view: SupervisorInstitucionView
    ): void {

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
        this.bloqueActual = null;
        this.etapaActual = null;
        this.detalleEtapa = null;

        if (this.vista === 'proyectos') {
            this.cargarProyectos();
            return;
        }

        this.cargandoContenido = false;
    }

    private cargarPerfil(): void {
        this.supervisorService
            .obtenerPerfil()
            .pipe(
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: (perfil) => {
                    this.perfil = perfil;

                    const abreviacion =
                        perfil.abreviacion?.trim() ||
                        sessionStorage
                            .getItem(
                                'institucionAbreviacion'
                            )
                            ?.trim();

                    if (abreviacion) {
                        sessionStorage.setItem(
                            'institucionAbreviacion',
                            abreviacion.toLowerCase()
                        );

                        this.titleService.setTitle(
                            `${abreviacion.toUpperCase()} | Modulo Supervisor`
                        );
                    } else {
                        this.titleService.setTitle(
                            'SEPROC | Modulo Supervisor'
                        );
                    }

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    cargarProyectos(): void {
        this.cargandoContenido = true;

        this.supervisorService
            .obtenerProyectos(
                this.estadoProyecto
            )
            .pipe(
                finalize(
                    () => this.finalizarCarga()
                ),
                takeUntilDestroyed(
                    this.destroyRef
                )
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

    seleccionarEstadoProyecto(
        estado: EstadoProyecto
    ): void {

        if (
            this.estadoProyecto === estado
        ) {
            return;
        }

        this.estadoProyecto = estado;
        this.cargarProyectos();
    }

    get proyectosFiltrados():
        ProyectoSupervisorResumen[] {

        const texto =
            this.normalizar(this.busqueda);

        if (!texto) {
            return this.proyectos;
        }

        return this.proyectos.filter(
            (proyecto) =>
                this.normalizar(
                    proyecto.nombreEscuela
                ).includes(texto) ||
                this.normalizar(
                    proyecto.constructor
                ).includes(texto)
        );
    }

    abrirProyecto(
        idProyecto: number
    ): void {

        this.vistaProyecto = 'proceso';
        this.proyectoDetalle = null;
        this.bloqueActual = null;
        this.etapaActual = null;
        this.detalleEtapa = null;
        this.cargandoDetalleProyecto = true;

        this.supervisorService
            .obtenerDetalleProyecto(
                idProyecto
            )
            .pipe(
                finalize(() => {
                    this.cargandoDetalleProyecto = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(
                    this.destroyRef
                )
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

    volverAListaProyectos(): void {
        this.vistaProyecto = 'lista';
        this.proyectoDetalle = null;
        this.bloqueActual = null;
        this.etapaActual = null;
        this.detalleEtapa = null;

        this.cargarProyectos();
    }

    get bloquesProyecto():
        BloqueVisual[] {

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
                    nombre:
                        'Trabajos preliminares',
                    etapas:
                        this.crearEtapasPreliminares(),
                },
                {
                    clave: 'cimentacion',
                    nombre: 'Cimentación',
                    etapas:
                        this.crearEtapasCimentacion(),
                },
                {
                    clave: 'estructura',
                    nombre: 'Estructura',
                    etapas:
                        this.crearEtapasEstructura(),
                },
                {
                    clave: 'acabados',
                    nombre:
                        'Albañilería y acabados',
                    etapas:
                        this.crearEtapasAcabados(),
                },
            ];

        return bloques.map(
            (bloque) => ({
                clave: bloque.clave,
                nombre: bloque.nombre,
                estado:
                    this.resolverEstadoGrupo(
                        bloque.etapas.map(
                            (etapa) => etapa.clave
                        )
                    ),
            })
        );
    }

    abrirBloque(
        bloque: BloqueVisual
    ): void {

        if (
            this.claseVisualEtapa(
                bloque.estado
            ) === 'locked'
        ) {
            return;
        }

        this.bloqueActual = bloque;

        switch (bloque.clave) {
            case 'preliminares':
                this.etapasBloque =
                    this.crearEtapasPreliminares();
                break;

            case 'cimentacion':
                this.etapasBloque =
                    this.crearEtapasCimentacion();
                break;

            case 'estructura':
                this.etapasBloque =
                    this.crearEtapasEstructura();
                break;

            case 'acabados':
                this.etapasBloque =
                    this.crearEtapasAcabados();
                break;
        }

        this.vistaProyecto = 'bloque';
    }

    abrirEtapa(
        etapa: EtapaVisual
    ): void {

        if (
            !this.proyectoDetalle ||
            this.claseVisualEtapa(
                etapa.estado
            ) === 'locked'
        ) {
            return;
        }

        this.cargandoContenido = true;
        this.etapaActual = etapa;
        this.comentarioSupervisor = '';

        this.supervisorService
            .obtenerDetalleEtapa(
                this.proyectoDetalle.idProyecto,
                etapa.clave
            )
            .pipe(
                finalize(
                    () => this.finalizarCarga()
                ),
                takeUntilDestroyed(
                    this.destroyRef
                )
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
        if (
            !this.proyectoDetalle ||
            !this.etapaActual
        ) {
            return;
        }

        this.cargandoContenido = true;

        this.supervisorService
            .obtenerHistorialEtapa(
                this.proyectoDetalle.idProyecto,
                this.etapaActual.clave
            )
            .pipe(
                finalize(
                    () => this.finalizarCarga()
                ),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: (historial) => {
                    this.historialEtapa =
                        historial.filter(
                            (item) =>
                                !item.tipo
                                    ?.toLowerCase()
                                    .includes('borrador')
                        );

                    this.vistaProyecto =
                        'historial';
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    prepararObservacion(): void {
        if (!this.puedeEvaluarEntrega) {
            this.notificar(
                'La entrega no está disponible para evaluación.',
                'error'
            );
            return;
        }

        if (
            !this.comentarioSupervisor.trim()
        ) {
            this.mostrarModalNotificacion(
                'Escribe el motivo o las observaciones para devolver el reporte.',
                'error'
            );
            return;
        }

        this.modalConfirmarObservacionAbierto =
            true;
    }

    confirmarObservacion(): void {
        if (
            !this.proyectoDetalle ||
            !this.etapaActual ||
            !this.puedeEvaluarEntrega ||
            this.procesandoEtapa
        ) {
            return;
        }

        const comentario =
            this.comentarioSupervisor.trim();

        if (!comentario) {
            this.modalConfirmarObservacionAbierto =
                false;

            this.mostrarModalNotificacion(
                'Escribe el motivo o las observaciones.',
                'error'
            );

            return;
        }

        this.procesandoEtapa = true;

        this.supervisorService
            .observarEtapa(
                this.proyectoDetalle.idProyecto,
                this.etapaActual.clave,
                comentario
            )
            .pipe(
                finalize(() => {
                    this.procesandoEtapa = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: () => {
                    this.modalConfirmarObservacionAbierto =
                        false;

                    this.comentarioSupervisor = '';

                    this.mostrarModalNotificacion(
                        'Observación enviada correctamente.',
                        'success'
                    );

                    this.recargarEtapaActual();
                },
                error: (error) => {
                    this.modalConfirmarObservacionAbierto =
                        false;

                    this.mostrarError(error);
                },
            });
    }

    prepararAprobacion(): void {
        if (!this.puedeEvaluarEntrega) {
            this.notificar(
                'La entrega no está disponible para evaluación.',
                'error'
            );
            return;
        }

        if (
            this.comentarioSupervisor.trim()
        ) {
            this.mostrarModalNotificacion(
                'Borra la observación para aprobar, o usa “Devolver reporte” para enviarla.',
                'error'
            );
            return;
        }

        this.modalConfirmarAprobacionAbierto =
            true;
    }

    confirmarAprobacion(): void {
        if (
            !this.proyectoDetalle ||
            !this.etapaActual ||
            !this.puedeEvaluarEntrega ||
            this.procesandoEtapa
        ) {
            return;
        }

        const idProyecto =
            this.proyectoDetalle.idProyecto;

        const etapa =
            this.etapaActual.clave;

        this.procesandoEtapa = true;

        this.supervisorService
            .aprobarEtapa(
                idProyecto,
                etapa
            )
            .pipe(
                finalize(() => {
                    this.procesandoEtapa = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: () => {
                    this.modalConfirmarAprobacionAbierto =
                        false;

                    this.comentarioSupervisor = '';
                    this.mostrarModalNotificacion(
                        'Etapa aprobada correctamente.',
                        'success'
                    );

                    this.recargarProyectoDespuesDeAprobar(
                        idProyecto
                    );
                },
                error: (error) => {
                    this.modalConfirmarAprobacionAbierto =
                        false;

                    this.mostrarError(error);
                },
            });
    }

    get puedeEvaluarEntrega():
        boolean {

        const estado =
            this.detalleEtapa
                ?.entregaActual
                ?.estadoEntrega
                ?.toUpperCase();

        return Boolean(
            this.proyectoDetalle
                ?.puedeComentar &&
            this.proyectoDetalle
                ?.puedeAprobar &&
            estado === 'ENVIADA'
        );
    }

    private recargarEtapaActual():
        void {

        if (
            !this.proyectoDetalle ||
            !this.etapaActual
        ) {
            return;
        }

        const idProyecto =
            this.proyectoDetalle.idProyecto;

        const etapa =
            this.etapaActual.clave;

        this.cargandoContenido = true;

        this.supervisorService
            .obtenerDetalleEtapa(
                idProyecto,
                etapa
            )
            .pipe(
                finalize(
                    () => this.finalizarCarga()
                ),
                takeUntilDestroyed(
                    this.destroyRef
                )
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

    private recargarProyectoDespuesDeAprobar(
        idProyecto: number
    ): void {

        this.cargandoContenido = true;

        this.supervisorService
            .obtenerDetalleProyecto(
                idProyecto
            )
            .pipe(
                finalize(
                    () => this.finalizarCarga()
                ),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: (proyecto) => {
                    this.proyectoDetalle =
                        proyecto;

                    this.bloqueActual = null;
                    this.etapaActual = null;
                    this.detalleEtapa = null;

                    this.vistaProyecto =
                        'proceso';
                },
                error: (error) => {
                    this.mostrarError(error);
                    this.vistaProyecto = 'lista';
                    this.cargarProyectos();
                },
            });
    }

    abrirDocumentacionProyecto():
        void {

        if (!this.proyectoDetalle) {
            return;
        }

        this.modalDocumentacionAbierto =
            true;

        this.cargandoModalDocumentacion =
            true;

        this.documentacionProyecto =
            null;

        this.supervisorService
            .obtenerDocumentacionProyecto(
                this.proyectoDetalle.idProyecto
            )
            .pipe(
                finalize(() => {
                    this.cargandoModalDocumentacion =
                        false;

                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: (documentacion) => {
                    this.documentacionProyecto =
                        documentacion;
                },
                error: (error) => {
                    this.modalDocumentacionAbierto =
                        false;

                    this.mostrarError(error);
                },
            });
    }

    private crearEtapasPreliminares():
        EtapaVisual[] {

        return this.prepararEtapas([
            {
                clave:
                    'limpieza_trazo_nivelacion',
                nombre:
                    'Limpieza, trazo y nivelación',
            },
        ]);
    }

    private crearEtapasCimentacion():
        EtapaVisual[] {

        return this.prepararEtapas([
            {
                clave: 'excavacion',
                nombre: 'Excavación',
            },
            {
                clave:
                    'plantilla_concreto',
                nombre:
                    'Plantilla de concreto',
            },
            {
                clave: 'zapata',
                nombre: 'Zapata',
            },
            {
                clave: 'contratrabe',
                nombre: 'Contratrabe',
            },
            {
                clave:
                    'columnas_castillos_cimentacion',
                nombre:
                    'Columnas o castillos',
            },
            {
                clave:
                    'cimbra_murete_enrase',
                nombre:
                    'Cimbra y murete de enrase',
            },
            {
                clave:
                    'concreto_cimentacion',
                nombre: 'Concreto',
            },
            {
                clave:
                    'habilitado_cadenas_cimentacion',
                nombre:
                    'Habilitado de cadenas',
            },
            {
                clave: 'relleno',
                nombre: 'Relleno',
            },
        ]);
    }

    private crearEtapasEstructura():
        EtapaVisual[] {

        const niveles =
            this.obtenerNumeroNiveles();

        const etapas: Array<{
            clave: string;
            nombre: string;
        }> = [];

        for (
            let nivel = 1;
            nivel <= niveles;
            nivel++
        ) {
            const prefijo =
                `estructura_n${nivel}_`;

            etapas.push(
                {
                    clave:
                        `${prefijo}habilitado_castillos`,
                    nombre:
                        `Nivel ${nivel}: Habilitado de castillos`,
                },
                {
                    clave:
                        `${prefijo}habilitado_columnas`,
                    nombre:
                        `Nivel ${nivel}: Habilitado de columnas`,
                },
                {
                    clave:
                        `${prefijo}habilitado_muros_concreto`,
                    nombre:
                        `Nivel ${nivel}: Muros de concreto`,
                },
                {
                    clave:
                        `${prefijo}habilitado_cadenas_intermedias`,
                    nombre:
                        `Nivel ${nivel}: Cadenas intermedias`,
                },
                {
                    clave:
                        `${prefijo}cimbra_verticales`,
                    nombre:
                        `Nivel ${nivel}: Cimbra vertical`,
                },
                {
                    clave:
                        `${prefijo}concreto_verticales`,
                    nombre:
                        `Nivel ${nivel}: Concreto vertical`,
                },
                {
                    clave:
                        `${prefijo}habilitado_dalas`,
                    nombre:
                        `Nivel ${nivel}: Habilitado de dalas`,
                },
                {
                    clave:
                        `${prefijo}habilitado_vigas_trabes`,
                    nombre:
                        `Nivel ${nivel}: Vigas y trabes`,
                },
                {
                    clave:
                        `${prefijo}cimbra_horizontales`,
                    nombre:
                        `Nivel ${nivel}: Cimbra horizontal`,
                },
                {
                    clave:
                        `${prefijo}concreto_horizontales`,
                    nombre:
                        `Nivel ${nivel}: Concreto horizontal`,
                },
                {
                    clave:
                        `${prefijo}cimbra_losa`,
                    nombre:
                        `Nivel ${nivel}: Cimbra para losa`,
                },
                {
                    clave:
                        `${prefijo}habilitado_losa`,
                    nombre:
                        `Nivel ${nivel}: Habilitado para losa`,
                },
                {
                    clave:
                        `${prefijo}concreto_losa`,
                    nombre:
                        `Nivel ${nivel}: Concreto de losa`,
                },
                {
                    clave:
                        `${prefijo}habilitado_barandal_concreto`,
                    nombre:
                        `Nivel ${nivel}: Barandal de concreto`,
                },
                {
                    clave:
                        `${prefijo}cimbra_otros_concreto`,
                    nombre:
                        `Nivel ${nivel}: Cimbra de otros elementos`,
                },
                {
                    clave:
                        `${prefijo}concreto_otros_concreto`,
                    nombre:
                        `Nivel ${nivel}: Otros elementos de concreto`,
                }
            );
        }

        return this.prepararEtapas(
            etapas
        );
    }

    private crearEtapasAcabados():
        EtapaVisual[] {

        return this.prepararEtapas([
            {
                clave: 'pisos',
                nombre: 'Pisos',
            },
            {
                clave: 'guarnicion',
                nombre: 'Guarnición',
            },
        ]);
    }

    private prepararEtapas(
        etapas: Array<{
            clave: string;
            nombre: string;
        }>
    ): EtapaVisual[] {

        const estados =
            this.proyectoDetalle
                ?.estadosEtapa ?? {};

        const existeAlguna =
            etapas.some((etapa) =>
                Object.prototype
                    .hasOwnProperty.call(
                        estados,
                        etapa.clave
                    )
            );

        const etapasFinales =
            existeAlguna
                ? etapas.filter(
                    (etapa) =>
                        Object.prototype
                            .hasOwnProperty.call(
                                estados,
                                etapa.clave
                            )
                )
                : etapas;

        return etapasFinales.map(
            (etapa) => ({
                ...etapa,
                estado:
                    estados[etapa.clave]
                        ?.toUpperCase() ??
                    'BLOQUEADA',
            })
        );
    }

    private resolverEstadoGrupo(
        claves: string[]
    ): string {

        const estados =
            this.proyectoDetalle
                ?.estadosEtapa ?? {};

        const valores =
            claves.map(
                (clave) =>
                    estados[clave]
                        ?.toUpperCase() ??
                    'BLOQUEADA'
            );

        if (valores.length === 0) {
            return 'BLOQUEADA';
        }

        if (
            valores.every(
                (estado) =>
                    estado === 'APROBADA'
            )
        ) {
            return 'APROBADA';
        }

        if (
            valores.some(
                (estado) =>
                    [
                        'EN_PROCESO',
                        'ENVIADA',
                        'CON_OBSERVACIONES',
                        'DISPONIBLE',
                        'APROBADA',
                    ].includes(estado)
            )
        ) {
            return 'EN_PROCESO';
        }

        return 'BLOQUEADA';
    }

    private obtenerNumeroNiveles():
        number {

        const tipo =
            this.proyectoDetalle
                ?.tipoEdificacion
                ?.toUpperCase();

        if (tipo === 'U3C') {
            return 3;
        }

        if (tipo === 'U2C') {
            return 2;
        }

        return 1;
    }

    claseVisualEtapa(
        estado?: string
    ): 'done' | 'current' | 'locked' {

        const valor =
            estado?.toUpperCase();

        if (valor === 'APROBADA') {
            return 'done';
        }

        if (
            valor === 'EN_PROCESO' ||
            valor === 'ENVIADA' ||
            valor === 'CON_OBSERVACIONES' ||
            valor === 'DISPONIBLE'
        ) {
            return 'current';
        }

        return 'locked';
    }

    iconoEtapa(
        estado?: string
    ): string {

        switch (
        this.claseVisualEtapa(estado)
        ) {
            case 'done':
                return '/assets/seproc/listo.png';

            case 'current':
                return '/assets/seproc/proceso.png';

            default:
                return '/assets/seproc/bloqueado.png';
        }
    }

    obtenerClaseTipo(
        tipo: string
    ): string {

        if (!tipo) {
            return 'tipo-default';
        }

        const valor =
            tipo.toLowerCase();

        if (
            valor.includes('entrega')
        ) {
            return 'tipo-entrega';
        }

        if (
            valor.includes('aprobacion') ||
            valor.includes('aprobación') ||
            valor.includes('aprobado')
        ) {
            return 'tipo-aprobacion';
        }

        if (
            valor.includes('observacion') ||
            valor.includes('observación')
        ) {
            return 'tipo-observacion';
        }

        if (
            valor.includes('borrador')
        ) {
            return 'tipo-borrador';
        }

        return 'tipo-default';
    }

    formatearEstado(
        estado?: string | null
    ): string {

        if (!estado) {
            return '—';
        }

        const texto = estado
            .replaceAll('_', ' ')
            .trim()
            .toLowerCase();

        return (
            texto.charAt(0).toUpperCase() +
            texto.slice(1)
        );
    }

    campoPasswordInvalido(
        campo: CampoPassword
    ): boolean {

        const control =
            this.passwordForm.controls[campo];

        const tieneTexto =
            String(
                control.value ?? ''
            ).length > 0;

        if (
            campo === 'nueva' &&
            tieneTexto &&
            (
                control.hasError('minlength') ||
                control.hasError('pattern')
            )
        ) {
            return true;
        }

        return (
            this.intentoCambiarPassword &&
            control.invalid
        );
    }

    mensajeCampoPassword(
        campo: CampoPassword
    ): string {

        const control =
            this.passwordForm.controls[campo];

        const tieneTexto =
            String(
                control.value ?? ''
            ).length > 0;

        if (
            campo === 'nueva' &&
            tieneTexto &&
            (
                control.hasError('minlength') ||
                control.hasError('pattern')
            )
        ) {
            return 'Debe tener al menos 8 caracteres, un número y un carácter especial.';
        }

        if (
            this.intentoCambiarPassword &&
            control.hasError('required')
        ) {
            return 'Este campo es obligatorio.';
        }

        return '';
    }

    cambiarPassword(): void {
        this.intentoCambiarPassword =
            true;

        if (
            this.passwordForm.invalid ||
            this.enviando
        ) {
            return;
        }

        const valores =
            this.passwordForm.getRawValue();

        if (
            valores.nueva !==
            valores.repetida
        ) {
            this.notificar(
                'Las contraseñas nuevas no coinciden.',
                'error'
            );
            return;
        }

        const payload:
            CambiarPasswordSupervisor = {
            passActual: valores.actual,
            passNueva: valores.nueva,
            passRepetida:
                valores.repetida,
        };

        this.enviando = true;

        this.supervisorService
            .cambiarPassword(payload)
            .pipe(
                finalize(() => {
                    this.enviando = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: () => {
                    this.passwordForm.reset();

                    this.intentoCambiarPassword =
                        false;

                    this.mensaje = '';

                    this.modalExitoPasswordAbierto =
                        true;

                    this.cdr.markForCheck();
                },
                error: (
                    error: HttpErrorResponse
                ) => {
                    this.notificar(
                        this.obtenerMensajeError(
                            error
                        ),
                        'error'
                    );
                },
            });
    }

    subirFoto(
        event: Event
    ): void {

        const input =
            event.target as HTMLInputElement;

        const file =
            input.files?.[0];

        if (!file) {
            return;
        }

        const formatos = [
            'image/png',
            'image/jpeg',
            'image/webp',
        ];

        if (
            !formatos.includes(file.type)
        ) {
            this.notificar(
                'Selecciona una imagen PNG, JPG o WEBP.',
                'error'
            );

            input.value = '';
            return;
        }

        this.supervisorService
            .subirFotoPerfil(file)
            .pipe(
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: (respuesta) => {
                    if (this.perfil) {
                        this.perfil = {
                            ...this.perfil,
                            fotoUrl:
                                respuesta.url,
                        };
                    }

                    this.versionFotoPerfil =
                        Date.now();

                    this.menuPerfilAbierto =
                        false;

                    this.mensajeExitoFoto =
                        'Foto actualizada correctamente.';

                    this.modalExitoFotoAbierto =
                        true;

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
        const foto =
            this.fotoPerfil;

        this.menuPerfilAbierto = false;

        if (
            !foto ||
            foto.includes(
                'sinFotoPerfil.png'
            )
        ) {
            this.modalSinFotoAbierto =
                true;
            return;
        }

        this.modalEliminarFotoAbierto =
            true;
    }

    confirmarEliminarFoto(): void {
        if (this.eliminandoFoto) {
            return;
        }

        this.eliminandoFoto = true;

        this.supervisorService
            .eliminarFotoPerfil()
            .pipe(
                finalize(() => {
                    this.eliminandoFoto = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: (respuesta) => {
                    if (this.perfil) {
                        this.perfil = {
                            ...this.perfil,
                            fotoUrl: '',
                        };
                    }

                    this.versionFotoPerfil =
                        Date.now();

                    this.modalEliminarFotoAbierto =
                        false;

                    this.menuPerfilAbierto =
                        false;

                    this.mensajeExitoFoto =
                        respuesta.mensaje ||
                        respuesta.message ||
                        'Foto eliminada correctamente.';

                    this.modalExitoFotoAbierto =
                        true;

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    verFoto(): void {
        const foto =
            this.fotoPerfil;

        this.menuPerfilAbierto = false;

        if (
            !foto ||
            foto.includes(
                'sinFotoPerfil.png'
            )
        ) {
            this.modalSinFotoAbierto =
                true;
            return;
        }

        window.open(
            foto,
            '_blank',
            'noopener'
        );
    }

    cerrarSesion(): void {
        this.supervisorService
            .cerrarSesion()
            .pipe(
                takeUntilDestroyed(
                    this.destroyRef
                )
            )
            .subscribe({
                next: () => {
                    const abreviacion = (
                        this.perfil?.abreviacion ||
                        sessionStorage.getItem(
                            'institucionAbreviacion'
                        ) ||
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
                            [
                                '/login',
                                abreviacion,
                            ],
                            {
                                replaceUrl: true,
                            }
                        );

                        return;
                    }

                    this.titleService.setTitle(
                        'SEPROC | Iniciar sesión'
                    );

                    this.router.navigate(
                        ['/inicio'],
                        {
                            replaceUrl: true,
                        }
                    );
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    usarFotoPredeterminada(
        event: Event
    ): void {

        const imagen =
            event.target as HTMLImageElement;

        if (
            !imagen.src.endsWith(
                this.FOTO_PERFIL_PREDETERMINADA
            )
        ) {
            imagen.src =
                this.FOTO_PERFIL_PREDETERMINADA;
        }
    }

    get fotoPerfil(): string {
        const fotoUrl =
            this.perfil?.fotoUrl?.trim();

        if (
            !fotoUrl ||
            fotoUrl.toLowerCase() ===
            'null' ||
            fotoUrl.toLowerCase() ===
            'undefined' ||
            fotoUrl.includes(
                'sinFotoPerfil.png'
            )
        ) {
            return this
                .FOTO_PERFIL_PREDETERMINADA;
        }

        const url =
            this.supervisorService
                .resolverRecurso(fotoUrl);

        const separador =
            url.includes('?')
                ? '&'
                : '?';

        return (
            `${url}${separador}` +
            `v=${this.versionFotoPerfil}`
        );
    }

    get logoEmpresa(): string {
        const logoUrl =
            this.perfil
                ?.logoEmpresa
                ?.trim();

        const logoInvalido =
            !logoUrl ||
            logoUrl.toLowerCase() ===
            'null' ||
            logoUrl.toLowerCase() ===
            'undefined';

        if (!logoInvalido) {
            return this
                .supervisorService
                .resolverRecurso(logoUrl);
        }

        return this
            .obtenerLogoAlternativo();
    }

    private obtenerLogoAlternativo():
        string {

        const abreviacion =
            this.perfil
                ?.abreviacion
                ?.trim() ||
            sessionStorage
                .getItem(
                    'institucionAbreviacion'
                )
                ?.trim() ||
            'SEPROC';

        return (
            'https://ui-avatars.com/api/' +
            `?name=${encodeURIComponent(abreviacion)}` +
            '&background=155093&color=fff'
        );
    }

    usarLogoAlternativo(
        event: Event
    ): void {

        const imagen =
            event.target as HTMLImageElement;

        if (
            imagen.dataset[
            'logoAlternativo'
            ] === 'true'
        ) {
            return;
        }

        imagen.dataset[
            'logoAlternativo'
        ] = 'true';

        imagen.src =
            this.obtenerLogoAlternativo();
    }

    recurso(
        url?: string | null
    ): string {

        return this
            .supervisorService
            .resolverRecurso(url);
    }

    claseEstadoGeneral(
        estado?: string
    ): string {

        switch (
        estado?.toUpperCase()
        ) {
            case 'ACTIVO':
                return 'dot-aprobada';

            case 'FINALIZADO':
                return 'dot-rechazada';

            case 'INACTIVO':
            default:
                return 'dot-pendiente';
        }
    }

    get tituloSeccion(): string {
        return this.vista === 'password'
            ? 'Cambiar contraseña'
            : 'Proyectos';
    }

    get subtituloSeccion(): string {
        return this.vista === 'password'
            ? 'Actualiza tu contraseña del sistema'
            : 'Consulta los proyectos que tienes asignados';
    }

    private finalizarCarga(): void {
        this.cargandoContenido = false;
        this.cdr.markForCheck();
    }

    private normalizar(
        valor?: string | null
    ): string {

        return (valor ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            );
    }

    private obtenerMensajeError(
        error: unknown
    ): string {

        const httpError =
            error as HttpErrorResponse;

        if (
            typeof httpError?.error ===
            'string'
        ) {
            return httpError.error;
        }

        if (
            httpError?.error?.mensaje
        ) {
            return httpError.error.mensaje;
        }

        if (
            httpError?.error?.message
        ) {
            return httpError.error.message;
        }

        if (httpError?.message) {
            return httpError.message;
        }

        return (
            'No fue posible completar ' +
            'la operación.'
        );
    }

    private mostrarError(
        error: unknown
    ): void {

        this.notificar(
            this.obtenerMensajeError(
                error
            ),
            'error'
        );
    }

    cerrarModalNotificacion(): void {
        this.modalNotificacionAbierto = false;
    }

    private mostrarModalNotificacion(
        mensaje: string,
        tipo: 'success' | 'error'
    ): void {
        this.mensaje = '';
        this.mensajeModalNotificacion = mensaje;
        this.tipoModalNotificacion = tipo;
        this.modalNotificacionAbierto = true;
        this.cdr.markForCheck();
    }

    private notificar(
        mensaje: string,
        tipo:
            | 'success'
            | 'error'
    ): void {

        this.mensaje = mensaje;
        this.tipoMensaje = tipo;
        this.cdr.markForCheck();

        window.setTimeout(() => {
            if (
                this.mensaje === mensaje
            ) {
                this.mensaje = '';
                this.cdr.markForCheck();
            }
        }, 5000);
    }
}