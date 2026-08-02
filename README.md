# SeProc frontend

Sistema web para la gestión y seguimiento del proceso constructivo de aulas tipo.

## Descripción

SeProc es un sistema web desarrollado para apoyar el seguimiento del proceso constructivo de aulas tipo. Este repositorio contiene la interfaz de usuario del sistema, desarrollada con Angular.

El frontend permite visualizar el avance de los proyectos por etapas, acceder a las funciones correspondientes a cada rol y consultar el historial de entregas, observaciones y revisiones. También proporciona las pantallas de autenticación, registro y los distintos paneles de control del sistema.

El sistema está orientado a las dependencias encargadas de la construcción y supervisión de infraestructura educativa.

## Objetivo

Facilitar el control y seguimiento de proyectos de construcción mediante una interfaz web que permita:

- Visualizar el avance por etapas del proceso constructivo.

- Mostrar vistas y acciones de acuerdo con el rol del usuario.

- Consultar el historial de avances, entregas y observaciones.

- Dar seguimiento a los proyectos en ejecución.

- Facilitar la comunicación entre las áreas participantes.

## Roles del sistema

El sistema contempla distintos tipos de usuario:

- **Constructor**
- **Supervisor**
- **Central**
- **Administración**
- **Dirección**

Cada rol cuenta con un panel y acciones específicas de acuerdo con su participación dentro del flujo del proceso constructivo.

## Funcionalidades principales

- Inicio de sesión para usuarios e instituciones.

- Registro de instituciones.

- Paneles de control diferenciados por rol.

- Protección de rutas mediante guards.

- Seguimiento del avance de proyectos por etapas.

- Desbloqueo de procesos conforme al flujo del proyecto.

- Visualización del historial de entregas, revisiones y observaciones.

- Consulta de proyectos y detalle de avance.

- Comunicación con el backend mediante servicios.

- Interfaz web responsiva.

## Capturas del sistema

### Página principal

![Página principal de SeProc](docs/images/pagina-principal.png)

### Inicio de sesión

![Inicio de sesión](docs/images/inicio-sesion.png)

### Panel del constructor

![Panel del constructor](docs/images/panel-constructor.png)

### Panel del supervisor

![Panel del supervisor](docs/images/panel-supervisor.png)

### Panel central

![Panel central](docs/images/panel-central.png)

### Panel de administración

![Panel de administración](docs/images/panel-administracion.png)

### Panel de dirección

![Panel de dirección](docs/images/panel-direccion.png)

### Seguimiento del proyecto

![Seguimiento del proyecto](docs/images/seguimiento-proyecto.png)

## Tecnologías utilizadas

- **Frontend:** Angular, TypeScript, HTML5, CSS3
- **Navegación:** Angular Router
- **Comunicación con el backend:** servicios HTTP de Angular

## Estado del proyecto

Proyecto en desarrollo como parte de residencia profesional.

## Repositorio

Este repositorio contiene el frontend del sistema SeProc.

## Autores

Desarrollado por el equipo del proyecto SeProc.