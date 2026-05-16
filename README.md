# Solicitud de Cuenta Bancaria — Banco G&N

Este repositorio contiene el desarrollo de una aplicación web interactiva para la **Solicitud de Apertura de Cuenta Bancaria (Banco G&N)**. El proyecto consiste en un formulario dinámico multi-paso y un panel de cliente (Dashboard) completamente reactivo incorporado en una Arquitectura de Página Única (SPA) mediante JavaScript Vanilla, HTML5 Semántico y CSS3 Moderno.

El desarrollo ha sido diseñado con un enfoque modular, escalable y accesible, cumpliendo rigurosamente con los más altos estándares de calidad de software y alineado con los criterios de evaluación de desarrollo frontend moderno.

---

## 🚀 Características Principales y Funcionalidades

### 1. Formulario Multi-Paso Dinámico (Steps)
* **Paso 1: Credenciales de Acceso:** Captura de RUN, Número de Serie del documento y creación de contraseña segura.
* **Paso 2: Información Personal:** Validación semántica de nombres, apellidos y fecha de nacimiento.
* **Paso 3: Datos de Ubicación:** Selección geográfica anidada y normalizada de dirección.
* **Paso 4: Información de Contacto:** Registro validado de correo electrónico y teléfono móvil.

### 2. Dashboard de Cliente Autenticado
Una vez enviada la solicitud con éxito, el sistema simula la creación instantánea de una Cuenta Corriente y renderiza un panel privado que permite:
* Visualización de datos financieros (Número de cuenta ficticio, saldo en CLP, fecha de apertura).
* **Edición Inline (Estrategia de Edición):** Modificación en tiempo real de campos específicos (Dirección, Teléfono, Fecha de Nacimiento y Correo) directamente desde la interfaz sin recargar la página.
* **Toggle de Estado de Cuenta:** Control conmutador (`Activa` / `Inactiva`) con persistencia absoluta.

### 3. Flujo Completo de Sesión y Seguridad Avanzada
* **Cierre de Sesión Seguro:** Al presionar "Cerrar Sesión", el sistema purga de la memoria del cliente los datos extremadamente sensibles (como el número de serie de la cédula y estructuras criptográficas) y redirige a una pantalla de estado protegido.
* **Autenticación por RUN:** Pantalla modal interactiva que valida las credenciales almacenadas localmente.
* **Control de Fuerza Bruta (Rate Limiting):** Bloqueo automático del login por 30 segundos tras registrar 5 intentos fallidos consecutivos, informando dinámicamente al usuario el tiempo restante.

---

## 🛠️ Stack Tecnológico y Buenas Prácticas

* **HTML5 Estricto y Semántico:** Uso de etiquetas estructurales (`<main>`, `<header>`, `<footer>`, `<aside>`, `<section>`) combinadas con atributos de accesibilidad **ARIA** (`aria-live`, `role="status"`, `aria-describedby`, `aria-required`) para garantizar una lectura óptima por lectores de pantalla.
* **CSS3 Moderno Avanzado:** Arquitectura basada en propiedades personalizadas (`:root`), layouts flexibles con CSS Grid y Flexbox, animaciones de aceleración por hardware (`cubic-bezier`), y diseño 100% responsivo adaptable mediante estrategias *Mobile-First*.
* **JavaScript Vanilla (ES6+):** Programación pura orientada a eventos, encapsulada mediante una Expresión de Función Invocada Inmediatamente (**IIFE**) para evitar la contaminación del entorno global y proteger el estado interno de la aplicación.



