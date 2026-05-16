/**
 * @file main.js
 * @description Formulario multi-paso para solicitud de Cuenta Bancaria — Banco G&N
 *
 * Requerimientos implementados:
 *   REQ 1 — Límite estricto en input RUT (máx. 12 chars, bloqueo keydown/input).
 *   REQ 2 — Validación mayoría de edad 18+ en fecha_nacimiento.
 *   REQ 3 — Select dinámico de comunas por región.
 *   REQ 4 — Dashboard editable (dirección, correo, fecha, teléfono).
 *   REQ 5 — Toggle de estado Activa/Inactiva con persistencia.
 *   REQ 6 — Motor de físicas Antigravity (Matter.js) en el fondo.
 *   REQ 7 — Flujo de sesión: logout → pantalla sesión cerrada → login por RUT.
 */

(function () {
  'use strict';

  // ─── CONSTANTES DEL MÓDULO ───────────────────────────────────────────────────
  /** Clave única de persistencia — cambiar aquí actualiza todo el módulo. */
  const STORAGE_KEY = 'bancogn_solicitud';

  /** Teclas de navegación que los formatters de input nunca deben bloquear. */
  const ALLOWED_NAV_KEYS = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
  ];

  // ─── CONFIGURACIÓN DE PASOS ───────────────────────────────────────────────
  const STEPS_CONFIG = [
    {
      id: 1,
      fields: [
        {
          id: 'rut',
          validate: validateRut,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Ingresa un RUT válido (Ej: 12.345.678-9).',
        },
        {
          id: 'serie',
          validate: validateSerie,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Ingresa exactamente 9 dígitos numéricos (Ej: 123.456.789).',
        },
        {
          id: 'password',
          validate: validatePassword,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Mínimo 8 caracteres con letras y números.',
        },
      ],
    },
    {
      id: 2,
      fields: [
        {
          id: 'nombres',
          validate: validateText,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Solo letras y espacios, mínimo 2 caracteres.',
        },
        {
          id: 'apellidos',
          validate: validateText,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Solo letras y espacios, mínimo 2 caracteres.',
        },
        {
          id: 'fecha_nacimiento',
          // REQ 2: Validación de mayoría de edad
          validate: validateAge,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Debes ser mayor de 18 años para abrir una cuenta.',
        },
      ],
    },
    {
      id: 3,
      fields: [
        {
          id: 'region',
          validate: validateNotEmpty,
          errorMsg: 'Selecciona una región.',
        },
        {
          id: 'comuna',
          validate: validateNotEmpty,
          errorMsg: 'Selecciona una comuna.',
        },
        {
          id: 'calle',
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
        },
        {
          id: 'numero',
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
        },
      ],
    },
    {
      id: 4,
      fields: [
        {
          id: 'email',
          validate: validateEmail,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Ingresa un correo electrónico válido.',
        },
        {
          id: 'telefono',
          validate: validatePhone,
          errorMsg: 'El campo es obligatorio.',
          customError: 'Ingresa un teléfono válido (9 dígitos, comienza en 9).',
        },
      ],
    },
  ];

  // ─── REQ 3: MAPA COMPLETO DE REGIONES → COMUNAS ──────────────────────────
  const COMUNAS_POR_REGION = {
    rm: [
      'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central',
      'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja',
      'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo',
      'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda',
      'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal',
      'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón',
      'Santiago', 'Vitacura', 'Puente Alto', 'San Bernardo', 'Colina',
      'Lampa', 'Tiltil', 'San José de Maipo', 'Calera de Tango', 'Paine',
      'Buin', 'Pirque', 'Talagante', 'El Monte', 'Isla de Maipo', 'Melipilla',
      'Alhué', 'Curacaví', 'María Pinto', 'Peñaflor',
    ],
    v: [
      'Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón',
      'San Antonio', 'Cartagena', 'El Tabo', 'El Quisco', 'Algarrobo',
      'Santo Domingo', 'Quillota', 'La Cruz', 'Calera', 'Hijuelas', 'Nogales',
      'San Felipe', 'Los Andes', 'Calle Larga', 'Rinconada', 'Santa María',
      'Petorca', 'La Ligua', 'Papudo', 'Zapallar', 'Cabildo',
      'Casablanca', 'Isla de Pascua', 'Juan Fernández',
    ],
    viii: [
      'Concepción', 'Talcahuano', 'Hualpén', 'San Pedro de la Paz',
      'Chiguayante', 'Penco', 'Tomé', 'Coronel', 'Lota', 'Arauco',
      'Lebu', 'Curanilahue', 'Los Álamos', 'Los Ángeles', 'Nacimiento',
      'Yumbel', 'Cabrero', 'San Rosendo', 'Laja', 'Mulchén', 'Negrete',
      'Quilaco', 'Quilleco', 'Santa Bárbara', 'Tucapel', 'Antuco', 'Alto Biobío',
    ],
    ix: [
      'Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón', 'Lautaro',
      'Angol', 'Renaico', 'Victoria', 'Traiguén', 'Lumaco', 'Purén',
      'Los Sauces', 'Ercilla', 'Collipulli', 'Curacautín', 'Lonquimay',
      'Melipeuco', 'Nueva Imperial', 'Teodoro Schmidt', 'Saavedra', 'Carahue',
      'Galvarino', 'Perquenco', 'Freire', 'Gorbea', 'Loncoche', 'Pitrufquén',
      'Cunco', 'Panguipulli', 'Vilcún',
    ],
    iv: [
      'La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Los Vilos', 'Salamanca',
      'Combarbalá', 'Monte Patria', 'Punitaqui', 'Río Hurtado', 'Andacollo',
      'Vicuña', 'Paiguano', 'Paihuano',
    ],
    vi: [
      'Rancagua', 'Machali', 'Graneros', 'Codegua', 'Requínoa', 'Rengo',
      'San Vicente', 'Pichilemu', 'Navidad', 'Litueche', 'La Estrella',
      'Marchihue', 'Paredones', 'San Fernando', 'Chimbarongo', 'Nancagua',
      'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Lolol',
      'Santa Cruz', 'Pichidegua', 'Las Cabras', 'Olivar', 'Mostazal',
    ],
    vii: [
      'Talca', 'Curicó', 'Linares', 'Constitución', 'Cauquenes', 'Parral',
      'San Javier', 'Villa Alegre', 'Yerbas Buenas', 'Longaví', 'Retiro',
      'San Clemente', 'Maule', 'Pelarco', 'Río Claro', 'San Rafael',
      'Curepto', 'Empedrado', 'Pencahue', 'Rauco', 'Romeral',
      'Sagrada Familia', 'Teno', 'Vichuquén', 'Molina',
    ],
    x: [
      'Puerto Montt', 'Osorno', 'Castro', 'Ancud', 'Quellón', 'Chonchi',
      'Dalcahue', 'Queilen', 'Quemchi', 'Quinchao', 'Curaco de Vélez',
      'Puerto Varas', 'Fresia', 'Frutillar', 'Llanquihue', 'Los Muermos',
      'Maullín', 'Calbuco', 'San Pablo', 'San Juan de la Costa',
      'Río Negro', 'Purranque', 'Puyehue', 'Puerto Octay',
    ],
    xi: [
      'Coyhaique', 'Aysén', 'Chile Chico', 'Cochrane', 'O\'Higgins',
      'Tortel', 'Lago Verde', 'Guaitecas', 'Cisnes', 'Río Ibáñez',
    ],
    xii: [
      'Punta Arenas', 'Puerto Natales', 'Porvenir', 'Primavera',
      'Timaukel', 'Río Verde', 'Laguna Blanca', 'San Gregorio',
      'Torres del Paine', 'Cabo de Hornos', 'Antártica',
    ],
    i: [
      'Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Colchane',
      'Huara', 'Camiña', 'Pica',
    ],
    ii: [
      'Antofagasta', 'Calama', 'Tocopilla', 'Mejillones', 'Taltal',
      'María Elena', 'Ollagüe', 'San Pedro de Atacama', 'Sierra Gorda',
    ],
    iii: [
      'Copiapó', 'Caldera', 'Chañaral', 'Diego de Almagro',
      'Vallenar', 'Alto del Carmen', 'Freirina', 'Huasco',
      'Tierra Amarilla',
    ],
    xiv: [
      'Valdivia', 'La Unión', 'Panguipulli', 'Los Lagos', 'Futrono',
      'Lago Ranco', 'Paillaco', 'Río Bueno', 'Corral', 'Máfil',
      'Lanco', 'Mariquina',
    ],
    xv: [
      'Arica', 'Camarones', 'Putre', 'General Lagos',
    ],
    xvi: [
      'Chillán', 'Chillán Viejo', 'San Carlos', 'Bulnes', 'Coihueco',
      'El Carmen', 'Ninhue', 'Ñiquén', 'Pemuco', 'Pinto', 'Portezuelo',
      'Quillón', 'Quirihue', 'Ranquil', 'San Fabián', 'San Ignacio',
      'San Nicolás', 'Treguaco', 'Yungay', 'Cobquecura', 'Coelemu',
    ],
  };

  // ─── MAPA DE NOMBRES DE REGIÓN ────────────────────────────────────────────
  const REGION_NAMES = {
    rm: 'Región Metropolitana',
    v: 'Región de Valparaíso',
    viii: 'Región del Biobío',
    ix: 'Región de La Araucanía',
    iv: 'Región de Coquimbo',
    vi: "Región del Libertador B. O'Higgins",
    vii: 'Región del Maule',
    x: 'Región de Los Lagos',
    xi: 'Región de Aysén',
    xii: 'Región de Magallanes',
    i: 'Región de Tarapacá',
    ii: 'Región de Antofagasta',
    iii: 'Región de Atacama',
    xiv: 'Región de Los Ríos',
    xv: 'Región de Arica y Parinacota',
    xvi: 'Región de Ñuble',
  };

  // ─── ESTADO ─────────────────────────────────────────────────────────
  let currentStep = 1;
  const TOTAL_STEPS = STEPS_CONFIG.length;
  /**
   * Intentos de login persistidos en sessionStorage:
   * - Sobreviven navegación dentro de la pestaña
   * - Se limpian al cerrar la pestaña (a diferencia de localStorage)
   */
  var loginAttempts = (function () {
    try {
      var stored = sessionStorage.getItem('bancogn_login_attempts');
      return stored ? JSON.parse(stored) : { count: 0, lockedUntil: 0 };
    } catch (e) {
      return { count: 0, lockedUntil: 0 };
    }
  }());

  function saveLoginAttempts() {
    try { sessionStorage.setItem('bancogn_login_attempts', JSON.stringify(loginAttempts)); }
    catch (e) { /* ignorar si sessionStorage no está disponible */ }
  }

  // ─── SEGURIDAD: HASH DE CONTRASEÑA ──────────────────────────────────────
  /**
   * Hash FNV-1a de 32 bits con sal y 64 rondas para endurecer fuerza bruta.
   * NOTA educativa: en producción usar bcrypt/argon2 en el servidor.
   * @param {string} password - Contraseña en texto plano
   * @param {string} salt     - Sal única generada al registrar
   * @returns {string} Hash hexadecimal
   */
  function hashPassword(password, salt) {
    var input = salt + password + 'bancogn_pepper_v1';
    var hash = 2166136261; // FNV offset basis
    for (var round = 0; round < 64; round++) {
      for (var i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = (hash * 16777619) >>> 0; // FNV prime, unsigned 32-bit
      }
    }
    return hash.toString(16).padStart(8, '0');
  }

  function generateSalt() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ─── INICIALIZACIÓN ───────────────────────────────────────────────────────
  function init() {
    setMaxBirthDate();           // REQ 2: Bloquear fechas futuras en el date input
    attachNextButtons();
    attachBackButtons();
    attachLoginButton();
    attachRutFormatter();        // REQ 1: Formateador + limitador estricto RUT
    attachSerieFormatter();
    attachPhoneFormatter();
    attachPasswordStrength();    // REQ 2: Indicador de fortaleza + toggle show/hide
    attachTooltip();
    attachInlineValidation();
    attachRegionComunaSync();    // REQ 3: Select dinámico de comunas

    attachLoginModal();          // REQ 7: Modal de login
  }

  // ─── REQ 2: FIJAR FECHA MÁXIMA EN INPUT DATE ─────────────────────────────
  function setMaxBirthDate() {
    var input = document.getElementById('fecha_nacimiento');
    if (!input) return;
    // Máximo: hoy (no puede ingresar fecha futura)
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    input.max = yyyy + '-' + mm + '-' + dd;
  }

  // ─── NAVEGACIÓN ───────────────────────────────────────────────────────────
  function goToStep(stepNumber) {
    var prevStep = currentStep;

    var currentEl = document.getElementById('step-' + prevStep);
    if (currentEl) currentEl.classList.add('hidden');

    var prevIndicator = document.getElementById('step-indicator-' + prevStep);
    if (prevIndicator) {
      if (stepNumber > prevStep) {
        prevIndicator.classList.remove('active');
        prevIndicator.classList.add('completed');
      } else {
        prevIndicator.classList.remove('active', 'completed');
      }
    }

    currentStep = stepNumber;

    var nextEl = document.getElementById('step-' + currentStep);
    if (nextEl) {
      nextEl.classList.remove('hidden');
      nextEl.style.animation = 'none';
      nextEl.offsetHeight;
      nextEl.style.animation = '';
    }

    var nextIndicator = document.getElementById('step-indicator-' + currentStep);
    if (nextIndicator) {
      nextIndicator.classList.add('active');
      nextIndicator.classList.remove('completed');
    }

    var formArea = document.querySelector('.form-area');
    if (formArea) {
      formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function showSuccess() {
    saveToLocalStorage();

    // Limpiar contraseña de memoria del formulario tras registrar
    var pwdField = document.getElementById('password');
    if (pwdField) pwdField.value = '';

    var lastStepEl = document.getElementById('step-' + currentStep);
    if (lastStepEl) lastStepEl.classList.add('hidden');

    var lastIndicator = document.getElementById('step-indicator-' + currentStep);
    if (lastIndicator) {
      lastIndicator.classList.remove('active');
      lastIndicator.classList.add('completed');
    }

    var successEl = document.getElementById('step-success');
    if (successEl) {
      successEl.classList.remove('hidden');
      successEl.style.animation = 'none';
      successEl.offsetHeight;
      successEl.style.animation = '';
    }
  }

  // ─── PERSISTENCIA ─────────────────────────────────────────────────────────
  function saveToLocalStorage() {
    var regionCode = getValue('region');
    var salt = generateSalt();
    var usuario = {
      identidad: {
        rut: getValue('rut'),
        serie: getValue('serie'),
        nombres: getValue('nombres'),
        apellidos: getValue('apellidos'),
        fechaNacimiento: getValue('fecha_nacimiento'),
      },
      seguridad: {
        passwordHash: hashPassword(getValue('password'), salt),
        passwordSalt: salt,
      },
      ubicacion: {
        region: regionCode,
        regionNombre: REGION_NAMES[regionCode] || regionCode,
        comuna: getValue('comuna'),
        calle: getValue('calle'),
        numero: getValue('numero'),
      },
      contacto: {
        email: getValue('email'),
        telefono: getValue('telefono'),
      },
      cuenta: {
        numero: generateAccountNumber(),
        activa: true,
        fechaApertura: new Date().toISOString(),
      },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    } catch (e) {
      console.warn('[BancoGN] No se pudo guardar en localStorage:', e);
    }
  }

  function getValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // NOTA: Solo para demo. En producción usar un generador seguro en el backend.
  function generateAccountNumber() {
    return '210' + String(Math.floor(Math.random() * 9000000 + 1000000));
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('[BancoGN] Error leyendo localStorage:', e);
      return {};
    }
  }

  function persistData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[BancoGN] Error guardando en localStorage:', e);
    }
  }

  // ─── BOTONES CONTINUAR ────────────────────────────────────────────────────
  function attachNextButtons() {
    var nextBtns = document.querySelectorAll('.btn-next');
    nextBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var stepId = parseInt(btn.getAttribute('data-step'), 10);
        var stepConfig = STEPS_CONFIG.find(function (s) { return s.id === stepId; });
        if (!stepConfig) return;

        var isValid = validateStep(stepConfig);
        if (isValid) {
          if (stepId < TOTAL_STEPS) {
            goToStep(stepId + 1);
          }
        }
      });
    });

    var submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var stepConfig = STEPS_CONFIG.find(function (s) { return s.id === TOTAL_STEPS; });
        if (!stepConfig) return;
        var isValid = validateStep(stepConfig);
        if (isValid) {
          showSuccess();
        }
      });
    }
  }

  // ─── BOTONES VOLVER ───────────────────────────────────────────────────────
  function attachBackButtons() {
    var backBtns = document.querySelectorAll('.btn-back');
    backBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var stepId = parseInt(btn.getAttribute('data-step'), 10);
        if (stepId > 1) {
          clearStepErrors(STEPS_CONFIG.find(function (s) { return s.id === stepId; }));
          goToStep(stepId - 1);
        }
      });
    });
  }

  // ─── BOTÓN IR A BANCO (Paso éxito) ───────────────────────────────────────
  function attachLoginButton() {
    // Botón en pantalla de éxito "Ir a mi Banco"
    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        // REQ 4: Forzar autenticación antes de acceder al dashboard
        openLoginModal();
      });
    }

    // Botón en la barra superior de la página de solicitud
    var openLoginBtn = document.getElementById('open-login-btn');
    if (openLoginBtn) {
      openLoginBtn.addEventListener('click', function () {
        openLoginModal();
      });
    }
  }

  // ─── REQ 3: SELECT DINÁMICO DE COMUNAS ───────────────────────────────────
  function attachRegionComunaSync() {
    var regionSelect = document.getElementById('region');
    var comunaSelect = document.getElementById('comuna');
    if (!regionSelect || !comunaSelect) return;

    regionSelect.addEventListener('change', function () {
      var regionCode = regionSelect.value;
      var comunas = COMUNAS_POR_REGION[regionCode] || [];

      // Limpiar el select de comunas
      comunaSelect.innerHTML = '';

      if (comunas.length === 0) {
        comunaSelect.disabled = true;
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecciona tu región primero';
        comunaSelect.appendChild(placeholder);
        return;
      }

      // Opción vacía inicial
      var defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = 'Selecciona tu comuna';
      comunaSelect.appendChild(defaultOpt);

      // Agregar comunas ordenadas alfabéticamente
      var sorted = comunas.slice().sort();
      sorted.forEach(function (comuna) {
        var opt = document.createElement('option');
        opt.value = comuna;
        opt.textContent = comuna;
        comunaSelect.appendChild(opt);
      });

      comunaSelect.disabled = false;

      // Limpiar error previo del select de comunas
      var errorEl = document.getElementById('comuna-error');
      if (errorEl) {
        comunaSelect.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
        comunaSelect.removeAttribute('aria-invalid');
      }
    });
  }

  // ─── REQ 5: RENDERIZAR DASHBOARD ─────────────────────────────────────────
  function renderDashboard() {
    var data = loadFromLocalStorage();

    var mainEl = document.querySelector('.main-content');
    if (!mainEl) return;
    mainEl.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper';

    /* ── Bloque de bienvenida ── */
    var welcomeBlock = document.createElement('div');
    welcomeBlock.className = 'page-title-block dashboard-welcome-block';
    welcomeBlock.innerHTML = `
      <p class="dashboard-eyebrow">Panel de cliente</p>
      <h1 class="page-title">Bienvenido, <span class="dashboard-name">${escapeHtml((data.identidad && data.identidad.nombres) || 'Cliente')}</span></h1>
      <p class="page-subtitle">Tu solicitud de Cuenta Bancaria ha sido procesada exitosamente.</p>
    `;

    /* ── Tarjeta de cuenta ── */
    var accountCard = document.createElement('div');
    accountCard.className = 'dashboard-account-card';
    accountCard.setAttribute('role', 'region');
    accountCard.setAttribute('aria-label', 'Tu nueva cuenta bancaria');

    var formattedDate = '—';
    if (data.cuenta && data.cuenta.fechaApertura) {
      formattedDate = new Date(data.cuenta.fechaApertura).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
    }

    var isActive = data.cuenta ? data.cuenta.activa !== false : true;

    accountCard.innerHTML = `
      <div class="dashboard-account-header">
        <div class="dashboard-bank-logo" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="8" fill="white" fill-opacity="0.2"/>
            <path d="M6 20V12L14 7L22 12V20H17V15H11V20H6Z" fill="white"/>
          </svg>
        </div>
        <div>
          <p class="dashboard-account-label">Cuenta Corriente</p>
          <p class="dashboard-account-number">${escapeHtml((data.cuenta && data.cuenta.numero) || '—')}</p>
        </div>
        <div class="dashboard-account-chip${isActive ? '' : ' inactive'}" id="account-chip"
             role="button" tabindex="0" aria-label="Estado de cuenta: ${isActive ? 'Activa' : 'Inactiva'}">
          <span class="dashboard-chip-dot" aria-hidden="true"></span>
          <span id="chip-label">${isActive ? 'Activa' : 'Inactiva'}</span>
        </div>
      </div>
      <div class="dashboard-balance-block" aria-label="Saldo disponible">
        <span class="dashboard-balance-label">Saldo Disponible</span>
        <span class="dashboard-balance-amount">$ 0 CLP</span>
      </div>
      <div class="dashboard-status-toggle">
        <button class="toggle-track${isActive ? '' : ' inactive'}" id="status-toggle"
                aria-label="Cambiar estado de cuenta" aria-checked="${isActive}" role="switch">
          <span class="toggle-thumb"></span>
        </button>
        <span id="status-label">Estado: <strong>${isActive ? 'Activa' : 'Inactiva'}</strong></span>
      </div>
      <div class="dashboard-account-meta">
        <div>
          <span class="dashboard-meta-label">Titular</span>
          <span class="dashboard-meta-value">${escapeHtml(((data.identidad && data.identidad.nombres) || '') + ' ' + ((data.identidad && data.identidad.apellidos) || ''))}</span>
        </div>
        <div>
          <span class="dashboard-meta-label">Fecha de apertura</span>
          <span class="dashboard-meta-value">${escapeHtml(formattedDate)}</span>
        </div>
        <div>
          <span class="dashboard-meta-label">RUT</span>
          <span class="dashboard-meta-value">${escapeHtml((data.identidad && data.identidad.rut) || '—')}</span>
        </div>
      </div>
    `;

    /* ── Tarjeta resumen de datos personales ── */
    var summaryCard = document.createElement('div');
    summaryCard.className = 'form-card dashboard-summary-card';
    summaryCard.setAttribute('role', 'region');
    summaryCard.setAttribute('aria-label', 'Resumen de tus datos registrados');

    var sectionTitle = document.createElement('h2');
    sectionTitle.className = 'dashboard-section-title';
    sectionTitle.textContent = 'Datos registrados';

    var dataGrid = document.createElement('div');
    dataGrid.className = 'dashboard-data-grid';

    /**
     * REQ 4: Campos editables.
     * editable: true → muestra botón Editar.
     * editKey: clave en data para identificar qué campo editar.
     * editGroup: 'address' | 'email' | 'birthdate' | 'phone'
     */
    var id = data.identidad || {};
    var ub = data.ubicacion || {};
    var co = data.contacto || {};
    var cta = data.cuenta || {};

    var dataItems = [
      { label: 'Nombres', value: id.nombres, editable: false },
      { label: 'Apellidos', value: id.apellidos, editable: false },
      {
        label: 'Fecha de nacimiento',
        value: id.fechaNacimiento
          ? new Date(id.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-CL')
          : null,
        editable: true, editGroup: 'birthdate', rawValue: id.fechaNacimiento,
      },
      { label: 'RUT', value: id.rut, editable: false },
      { label: 'N° de documento', value: id.serie, editable: false },
      {
        label: 'Correo electrónico',
        value: co.email,
        editable: true, editGroup: 'email',
      },
      {
        label: 'Teléfono celular',
        value: co.telefono ? '+56 ' + co.telefono : null,
        editable: true, editGroup: 'phone', rawValue: co.telefono,
      },
      { label: 'Región', value: ub.regionNombre, editable: false },
      { label: 'Comuna', value: ub.comuna, editable: false },
      {
        label: 'Dirección',
        value: (ub.calle && ub.numero) ? ub.calle + ' ' + ub.numero : null,
        editable: true, editGroup: 'address',
      },
    ];

    dataItems.forEach(function (item) {
      var itemEl = document.createElement('div');
      itemEl.className = 'dashboard-data-item';
      itemEl.dataset.editGroup = item.editGroup || '';

      var labelEl = document.createElement('span');
      labelEl.className = 'dashboard-data-label';
      labelEl.textContent = item.label;

      var valueRow = document.createElement('div');
      valueRow.className = 'dashboard-data-value-row';

      var valueEl = document.createElement('span');
      valueEl.className = 'dashboard-data-value';
      valueEl.textContent = item.value || '—';

      valueRow.appendChild(valueEl);

      if (item.editable) {
        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-edit';
        editBtn.setAttribute('aria-label', 'Editar ' + item.label);
        editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Editar';
        editBtn.addEventListener('click', function () {
          openInlineEdit(itemEl, item, data, editBtn, valueEl);
        });
        valueRow.appendChild(editBtn);
      }

      itemEl.appendChild(labelEl);
      itemEl.appendChild(valueRow);
      dataGrid.appendChild(itemEl);
    });

    summaryCard.appendChild(sectionTitle);
    summaryCard.appendChild(dataGrid);



    // ── Montar en el DOM ─────────────────────────────────────────────────────
    wrapper.appendChild(welcomeBlock);
    wrapper.appendChild(accountCard);
    wrapper.appendChild(summaryCard);
    mainEl.appendChild(wrapper);

    // ── Cambiar header al modo dashboard ─────────────────────────────────────
    // Reutiliza `data` ya cargado al inicio de renderDashboard (sin segunda lectura).
    setHeaderMode('dashboard', (data.identidad && data.identidad.nombres) || '');

    // ── REQ 5: Toggle estado de cuenta ──────────────────────────────────────
    var toggleBtn = document.getElementById('status-toggle');
    var chipEl = document.getElementById('account-chip');
    var chipLabel = document.getElementById('chip-label');
    var statusLabel = document.getElementById('status-label');

    function syncStatusUI(active) {
      if (active) {
        toggleBtn.classList.remove('inactive');
        chipEl.classList.remove('inactive');
        chipEl.setAttribute('aria-label', 'Estado de cuenta: Activa');
        chipLabel.textContent = 'Activa';
        statusLabel.innerHTML = 'Estado: <strong>Activa</strong>';
        toggleBtn.setAttribute('aria-checked', 'true');
      } else {
        toggleBtn.classList.add('inactive');
        chipEl.classList.add('inactive');
        chipEl.setAttribute('aria-label', 'Estado de cuenta: Inactiva');
        chipLabel.textContent = 'Inactiva';
        statusLabel.innerHTML = 'Estado: <strong>Inactiva</strong>';
        toggleBtn.setAttribute('aria-checked', 'false');
      }
    }

    function toggleStatus() {
      data = loadFromLocalStorage();
      if (!data.cuenta) data.cuenta = {};
      data.cuenta.activa = !data.cuenta.activa;
      persistData(data);
      syncStatusUI(data.cuenta.activa);
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleStatus);
      toggleBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStatus(); }
      });
    }
    if (chipEl) {
      chipEl.addEventListener('click', toggleStatus);
      chipEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStatus(); }
      });
    }

    // ── Animaciones de entrada ───────────────────────────────────────────────
    var animatedCards = [accountCard, summaryCard];
    requestAnimationFrame(function () {
      animatedCards.forEach(function (card, index) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(28px)';
        card.style.transition = [
          'opacity 480ms cubic-bezier(0.4, 0, 0.2, 1)',
          'transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        ].join(', ');
        setTimeout(function () {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 80 + index * 130);
      });
    });
  }

  // ─── REQ 4: ESTRATEGIAS DE EDICIÓN INLINE (Strategy Pattern) ─────────────
  /**
   * Mapa de constructores de formularios inline por tipo de campo editable.
   * Para agregar un nuevo campo editable: solo añadir una entrada aquí.
   * Cada función recibe (data, editForm, inputs) y monta los controles.
   */
  var EDIT_STRATEGIES = {
    email: function (data, editForm, inputs) {
      var co = data.contacto || {};
      var inp = buildInput('text', co.email || '', 'Correo electrónico');
      inp.type = 'email';
      editForm.appendChild(inp);
      inputs.push({ el: inp, group: 'contacto', key: 'email' });
    },
    phone: function (data, editForm, inputs) {
      var co = data.contacto || {};
      var inp = buildInput('tel', co.telefono || '', 'Ej: 912345678');
      inp.maxLength = 9;
      editForm.appendChild(inp);
      inputs.push({ el: inp, group: 'contacto', key: 'telefono' });
    },
    birthdate: function (data, editForm, inputs) {
      var id = data.identidad || {};
      var inp = buildInput('date', id.fechaNacimiento || '', '');
      var today = new Date();
      inp.max = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
      editForm.appendChild(inp);
      inputs.push({ el: inp, group: 'identidad', key: 'fechaNacimiento' });
    },
    address: function (data, editForm, inputs) {
      var ub = data.ubicacion || {};
      var wrapRow = document.createElement('div');
      wrapRow.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:8px;';
      var inpCalle = buildInput('text', ub.calle || '', 'Calle');
      var inpNum = buildInput('text', ub.numero || '', 'N°');
      inpNum.style.width = '80px';
      wrapRow.appendChild(inpCalle);
      wrapRow.appendChild(inpNum);
      editForm.appendChild(wrapRow);

      var regionSel = buildRegionSelect(ub.region || '');
      var comunaSel = buildComunaSelect(ub.region || '', ub.comuna || '');
      editForm.appendChild(regionSel);
      editForm.appendChild(comunaSel);

      regionSel.addEventListener('change', function () {
        var newComunas = COMUNAS_POR_REGION[regionSel.value] || [];
        comunaSel.innerHTML = '';
        var def = document.createElement('option');
        def.value = ''; def.textContent = 'Selecciona tu comuna';
        comunaSel.appendChild(def);
        newComunas.slice().sort().forEach(function (c) {
          var o = document.createElement('option');
          o.value = c; o.textContent = c;
          comunaSel.appendChild(o);
        });
        comunaSel.disabled = newComunas.length === 0;
      });

      inputs.push({ el: inpCalle, group: 'ubicacion', key: 'calle' });
      inputs.push({ el: inpNum, group: 'ubicacion', key: 'numero' });
      inputs.push({ el: regionSel, group: 'ubicacion', key: 'region' });
      inputs.push({ el: comunaSel, group: 'ubicacion', key: 'comuna' });
    },
  };

  /** Mapa de validadores extra por editGroup (opcional; se ejecuta al guardar). */
  var EDIT_VALIDATORS = {
    email: function (inputs) { return validateEmail(inputs[0].el.value.trim()) === 'valid'; },
    phone: function (inputs) { return validatePhone(inputs[0].el.value.trim()) === 'valid'; },
    birthdate: function (inputs) { return validateAge(inputs[0].el.value.trim()) === 'valid'; },
  };

  function openInlineEdit(itemEl, item, data, editBtn, valueEl) {
    // Evitar duplicar formularios
    if (itemEl.querySelector('.dashboard-edit-form')) return;

    editBtn.style.display = 'none';

    var editForm = document.createElement('div');
    editForm.className = 'dashboard-edit-form';
    var inputs = [];

    // Delegar construcción del formulario a la estrategia correspondiente
    var strategy = EDIT_STRATEGIES[item.editGroup];
    if (strategy) strategy(data, editForm, inputs);

    // Botones guardar / cancelar
    var actRow = document.createElement('div');
    actRow.className = 'dashboard-edit-actions';
    var saveBtn = document.createElement('button');
    saveBtn.type = 'button'; saveBtn.className = 'btn-save'; saveBtn.textContent = 'Guardar';
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button'; cancelBtn.className = 'btn-cancel-edit'; cancelBtn.textContent = 'Cancelar';

    actRow.appendChild(cancelBtn);
    actRow.appendChild(saveBtn);
    editForm.appendChild(actRow);
    itemEl.appendChild(editForm);

    // Cancelar: restaura vista original
    cancelBtn.addEventListener('click', function () {
      editForm.remove();
      editBtn.style.display = '';
    });

    // Guardar: valida, persiste y actualiza DOM
    saveBtn.addEventListener('click', function () {
      var fresh = loadFromLocalStorage();
      var valid = true;

      inputs.forEach(function (inp) {
        var val = inp.el.value.trim();
        if (!val) { valid = false; inp.el.classList.add('error'); }
        else {
          inp.el.classList.remove('error');
          // Escribir en el sub-objeto correcto (estructura anidada)
          if (!fresh[inp.group]) fresh[inp.group] = {};
          fresh[inp.group][inp.key] = val;
        }
      });

      // Validación extra según tipo de campo (via EDIT_VALIDATORS)
      var extraValidator = EDIT_VALIDATORS[item.editGroup];
      if (extraValidator && inputs[0] && !extraValidator(inputs)) {
        valid = false;
        inputs[0].el.classList.add('error');
      }

      if (!valid) return;

      // Actualizar nombre derivado de región
      if (fresh.ubicacion && fresh.ubicacion.region) {
        fresh.ubicacion.regionNombre = REGION_NAMES[fresh.ubicacion.region] || fresh.ubicacion.region;
      }

      persistData(fresh);
      renderDashboard(); // Re-render para reflejar los cambios
    });
  }

  function buildInput(type, value, placeholder) {
    var inp = document.createElement('input');
    inp.type = type;
    inp.className = 'field-input';
    inp.value = value;
    inp.placeholder = placeholder;
    return inp;
  }

  function buildRegionSelect(selectedValue) {
    var sel = document.createElement('select');
    sel.className = 'field-input field-select';
    var defOpt = document.createElement('option');
    defOpt.value = ''; defOpt.textContent = 'Selecciona tu región';
    sel.appendChild(defOpt);
    Object.keys(REGION_NAMES).forEach(function (code) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = REGION_NAMES[code];
      if (code === selectedValue) opt.selected = true;
      sel.appendChild(opt);
    });
    return sel;
  }

  function buildComunaSelect(regionCode, selectedComuna) {
    var sel = document.createElement('select');
    sel.className = 'field-input field-select';
    var comunas = (COMUNAS_POR_REGION[regionCode] || []).slice().sort();
    if (comunas.length === 0) {
      sel.disabled = true;
      var def = document.createElement('option');
      def.value = ''; def.textContent = 'Selecciona tu región primero';
      sel.appendChild(def);
      return sel;
    }
    var def2 = document.createElement('option');
    def2.value = ''; def2.textContent = 'Selecciona tu comuna';
    sel.appendChild(def2);
    comunas.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      if (c === selectedComuna) opt.selected = true;
      sel.appendChild(opt);
    });
    return sel;
  }

  // ─── REQ 7: PANTALLA SESIóN CERRADA ──────────────────────────────────────
  function renderSessionClosed() {
    // Limpiar datos sensibles al cerrar sesión (principio de mínima exposición)
    // NOTA: solo se borra el número de serie del documento.
    // El bloque `seguridad` (passwordHash + passwordSalt) debe CONSERVARSE
    // para que el usuario pueda volver a autenticarse en la misma sesión.
    var sessionData = loadFromLocalStorage();
    if (sessionData.identidad) delete sessionData.identidad.serie; // número de documento
    persistData(sessionData);

    setHeaderMode('form');
    var mainEl = document.querySelector('.main-content');
    if (!mainEl) return;
    mainEl.innerHTML = '';


    var wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper';

    var screen = document.createElement('div');
    screen.className = 'session-closed-screen';

    // Ícono de candado
    screen.innerHTML = `
      <div class="session-closed-icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 16V12C11 8.13 14.13 5 18 5C21.87 5 25 8.13 25 12V16" stroke="#1A3A6B" stroke-width="2" stroke-linecap="round"/>
          <rect x="6" y="16" width="24" height="16" rx="4" stroke="#1A3A6B" stroke-width="2"/>
          <circle cx="18" cy="25" r="2" fill="#1A3A6B"/>
        </svg>
      </div>
      <h1 class="session-closed-title">Sesión cerrada</h1>
      <p class="session-closed-subtitle">Tu sesión ha sido cerrada correctamente. ¿Qué deseas hacer?</p>
      <div class="session-closed-actions">
        <button type="button" class="btn btn-primary" id="sc-login-btn">Iniciar Sesión</button>
        <button type="button" class="btn btn-secondary" id="sc-new-btn">Solicitar Nueva Cuenta</button>
      </div>
    `;

    wrapper.appendChild(screen);
    mainEl.appendChild(wrapper);

    // Botón: Solicitar nueva cuenta → limpia localStorage y reinicia formulario
    var newBtn = document.getElementById('sc-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      });
    }

    // Botón: Iniciar sesión → abre modal de login por RUT
    var loginBtn = document.getElementById('sc-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        openLoginModal();
      });
    }
  }

  // ─── REQ 7: MODAL DE LOGIN ────────────────────────────────────────────────
  function attachLoginModal() {
    var modalOverlay = document.getElementById('login-modal');
    var cancelBtn = document.getElementById('modal-cancel-btn');
    var submitBtn = document.getElementById('modal-submit-btn');
    var rutInput = document.getElementById('login-rut');
    var rutError = document.getElementById('login-rut-error');
    var passInput = document.getElementById('login-password');
    var passError = document.getElementById('login-password-error');
    if (!modalOverlay) return;

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        closeLoginModal();
      });
    }

    // Clic fuera del modal lo cierra
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeLoginModal();
    });

    // Tecla Escape cierra
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
        closeLoginModal();
      }
    });

    // Submit: verificar RUT + contraseña contra localStorage
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        attemptLogin(rutInput, rutError, passInput, passError);
      });
    }
    if (rutInput) {
      rutInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') attemptLogin(rutInput, rutError, passInput, passError);
      });
      rutInput.addEventListener('input', function () { formatRutInput(rutInput); });
    }
    if (passInput) {
      passInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') attemptLogin(rutInput, rutError, passInput, passError);
      });
    }
  }

  // ─── UTILIDAD: CONMUTAR HEADER ENTRE MODOS ───────────────────────────────
  /**
   * setHeaderMode('form')      → muestra btn "Iniciar Sesión"
   * setHeaderMode('dashboard') → oculta btn login, muestra btn "Cerrar Sesión"
   */
  function setHeaderMode(mode, userName) {
    var loginBtn = document.getElementById('open-login-btn');
    var divider = document.querySelector('.header-nav-divider');
    var nav = document.querySelector('.header-nav');

    // Eliminar botón de logout anterior si existe
    var prevLogout = document.getElementById('header-logout-btn');
    if (prevLogout) prevLogout.remove();
    var prevAvatar = document.getElementById('header-user-chip');
    if (prevAvatar) prevAvatar.remove();

    if (mode === 'dashboard') {
      // Ocultar botón de login y su divider
      if (loginBtn) loginBtn.style.display = 'none';
      if (divider) divider.style.display = 'none';

      // Chip de usuario
      var userChip = document.createElement('span');
      userChip.id = 'header-user-chip';
      userChip.className = 'header-user-chip';
      userChip.setAttribute('aria-hidden', 'true');
      userChip.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span class="header-user-name">${escapeHtml(userName || 'Mi cuenta')}</span>
      `;

      // Divider nuevo
      var newDivider = document.createElement('span');
      newDivider.className = 'header-nav-divider';
      newDivider.setAttribute('aria-hidden', 'true');

      // Botón cerrar sesión
      var logoutHeaderBtn = document.createElement('button');
      logoutHeaderBtn.type = 'button';
      logoutHeaderBtn.id = 'header-logout-btn';
      logoutHeaderBtn.className = 'btn-header-logout';
      logoutHeaderBtn.setAttribute('aria-label', 'Cerrar sesión');
      logoutHeaderBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16 17l5-5-5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        Cerrar Sesión
      `;

      logoutHeaderBtn.addEventListener('click', function () {
        renderSessionClosed();
      });

      if (nav) {
        nav.appendChild(userChip);
        nav.appendChild(newDivider);
        nav.appendChild(logoutHeaderBtn);
      }

    } else {
      // Modo 'form': restaurar botón de login y divider original
      if (loginBtn) loginBtn.style.display = '';
      if (divider) divider.style.display = '';
    }
  }

  function openLoginModal() {
    var modal = document.getElementById('login-modal');
    var rutInput = document.getElementById('login-rut');
    var rutError = document.getElementById('login-rut-error');
    var passInput = document.getElementById('login-password');
    var passError = document.getElementById('login-password-error');
    if (!modal) return;
    if (rutInput) rutInput.value = '';
    if (passInput) passInput.value = '';
    if (rutError) { rutError.textContent = ''; rutError.classList.remove('visible'); }
    if (passError) { passError.textContent = ''; passError.classList.remove('visible'); }
    modal.classList.remove('hidden');
    if (rutInput) setTimeout(function () { rutInput.focus(); }, 50);
  }

  function closeLoginModal() {
    var modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
  }

  function attemptLogin(rutInput, rutError, passInput, passError) {
    var enteredRut = rutInput ? rutInput.value.trim() : '';
    var enteredPass = passInput ? passInput.value.trim() : '';

    // ─ Rate limiting: máx. 5 intentos, bloqueo 30s ─────────────────────
    var now = Date.now();
    if (loginAttempts.lockedUntil > now) {
      var secsLeft = Math.ceil((loginAttempts.lockedUntil - now) / 1000);
      showModalError(rutInput, rutError,
        'Demasiados intentos fallidos. Espera ' + secsLeft + ' segundos.');
      return;
    }

    var stored = loadFromLocalStorage();

    // Limpiar errores previos
    if (rutInput) rutInput.classList.remove('error');
    if (rutError) { rutError.textContent = ''; rutError.classList.remove('visible'); }
    if (passInput) passInput.classList.remove('error');
    if (passError) { passError.textContent = ''; passError.classList.remove('visible'); }

    // ─ Validar RUT ─────────────────────────────────────────────
    if (!enteredRut) {
      showModalError(rutInput, rutError, 'Ingresa tu RUT.'); return;
    }
    if (validateRut(enteredRut) !== 'valid') {
      showModalError(rutInput, rutError, 'Ingresa un RUT válido (Ej: 12.345.678-9).'); return;
    }
    if (!stored.identidad || !stored.identidad.rut) {
      showModalError(rutInput, rutError, 'No existe una cuenta registrada. Solicita una primero.'); return;
    }
    var normalizeRut = function (r) { return r.replace(/[.\-]/g, '').toUpperCase(); };
    if (normalizeRut(enteredRut) !== normalizeRut(stored.identidad.rut)) {
      recordFailedAttempt(rutInput, rutError, 'El RUT no coincide con ninguna cuenta registrada.');
      return;
    }

    // ─ Validar contraseña (comparación sobre hash — nunca texto plano) ────
    if (!enteredPass) {
      showModalError(passInput, passError, 'Ingresa tu contraseña.'); return;
    }
    if (!stored.seguridad || !stored.seguridad.passwordHash ||
      hashPassword(enteredPass, stored.seguridad.passwordSalt) !== stored.seguridad.passwordHash) {
      recordFailedAttempt(passInput, passError, 'Contraseña incorrecta.');
      return;
    }

    // ─ Login exitoso ─────────────────────────────────────────────
    loginAttempts.count = 0;
    loginAttempts.lockedUntil = 0;
    closeLoginModal();
    renderDashboard();
  }

  /**
   * Registra un intento fallido. Tras 5 intentos activa bloqueo de 30s.
   * Muestra los intentos restantes hasta el bloqueo.
   */
  function recordFailedAttempt(inputEl, errorEl, message) {
    loginAttempts.count++;
    if (loginAttempts.count >= 5) {
      loginAttempts.lockedUntil = Date.now() + 30000;
      loginAttempts.count = 0;
      saveLoginAttempts();
      showModalError(inputEl, errorEl,
        'Cuenta bloqueada 30 segundos por múltiples intentos fallidos.');
    } else {
      saveLoginAttempts();
      var left = 5 - loginAttempts.count;
      showModalError(inputEl, errorEl, message + ' Intentos restantes: ' + left + '.');
    }
  }

  function showModalError(input, errorEl, message) {
    if (input) input.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }



  // ─── VALIDACIÓN POR PASO ──────────────────────────────────────────────────
  function validateStep(stepConfig) {
    var allValid = true;

    stepConfig.fields.forEach(function (field) {
      var el = document.getElementById(field.id);
      var errorEl = document.getElementById(field.id + '-error');
      if (!el || !errorEl) return;

      var value = el.value.trim();
      var result = field.validate(value);

      if (result === 'empty') {
        showFieldError(el, errorEl, field.errorMsg);
        allValid = false;
      } else if (result === 'invalid') {
        showFieldError(el, errorEl, field.customError || field.errorMsg);
        allValid = false;
      } else {
        clearFieldError(el, errorEl);
      }
    });

    return allValid;
  }

  function clearStepErrors(stepConfig) {
    if (!stepConfig) return;
    stepConfig.fields.forEach(function (field) {
      var el = document.getElementById(field.id);
      var errorEl = document.getElementById(field.id + '-error');
      if (el && errorEl) clearFieldError(el, errorEl);
    });
  }

  // ─── MOSTRAR / OCULTAR ERRORES ────────────────────────────────────────────
  function showFieldError(input, errorEl, message) {
    var wrapper = input.closest('.phone-wrapper');
    if (wrapper) {
      wrapper.classList.add('error');
    } else {
      input.classList.add('error');
    }
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(input, errorEl) {
    var wrapper = input.closest('.phone-wrapper');
    if (wrapper) {
      wrapper.classList.remove('error');
    } else {
      input.classList.remove('error');
    }
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
    input.removeAttribute('aria-invalid');
  }

  // ─── VALIDACIÓN INLINE ────────────────────────────────────────────────────
  function attachInlineValidation() {
    STEPS_CONFIG.forEach(function (stepConfig) {
      stepConfig.fields.forEach(function (field) {
        var el = document.getElementById(field.id);
        var errorEl = document.getElementById(field.id + '-error');
        if (!el || !errorEl) return;

        function checkAndClear() {
          var hasError = el.classList.contains('error') ||
            (el.closest('.phone-wrapper') &&
              el.closest('.phone-wrapper').classList.contains('error'));
          if (hasError) {
            var result = field.validate(el.value.trim());
            if (result === 'valid') clearFieldError(el, errorEl);
          }
        }

        el.addEventListener('input', checkAndClear);
        el.addEventListener('change', checkAndClear);
      });
    });
  }

  // ─── REQ 1: FORMATEO Y LÍMITE ESTRICTO RUT ───────────────────────────────────
  /**
   * Formatea el valor de un input de RUT en tiempo real.
   * Fuente única de verdad — usada en el formulario principal y en el modal.
   * @param {HTMLInputElement} inputEl
   */
  function formatRutInput(inputEl) {
    var val = inputEl.value.replace(/[^0-9kK]/gi, '');
    if (val.length > 9) val = val.slice(0, 9);
    if (val.length === 0) { inputEl.value = ''; return; }
    var body = val.slice(0, -1);
    var dv = val.slice(-1).toUpperCase();
    var formatted = '';
    body.split('').reverse().forEach(function (char, i) {
      if (i > 0 && i % 3 === 0) formatted = '.' + formatted;
      formatted = char + formatted;
    });
    inputEl.value = formatted ? formatted + '-' + dv : dv;
  }

  /**
   * Formatea el RUT en tiempo real y bloquea más de 12 caracteres
   * (máximo para el formato XX.XXX.XXX-X).
   */
  function attachRutFormatter() {
    var rutInput = document.getElementById('rut');
    if (!rutInput) return;

    // Capa 1: bloqueo en keydown antes de insertar
    rutInput.addEventListener('keydown', function (e) {
      if (ALLOWED_NAV_KEYS.indexOf(e.key) !== -1) return;
      if (e.ctrlKey || e.metaKey) return;

      // Bloquear si ya se alcanzó el máximo de 12 chars formateados
      // y no hay texto seleccionado que se reemplazaría
      var selLen = Math.abs(rutInput.selectionEnd - rutInput.selectionStart);
      if (rutInput.value.length >= 12 && selLen === 0) {
        e.preventDefault();
        return;
      }

      // Solo permitir dígitos, K y k
      if (!/^[0-9kK]$/.test(e.key)) {
        e.preventDefault();
      }
    });

    // Capa 2: formateo y corte en input (cubre paste/autofill)
    rutInput.addEventListener('input', function () { formatRutInput(rutInput); });
  }

  // ─── FORMATEO SERIE ───────────────────────────────────────────────────────
  function attachSerieFormatter() {
    var serieInput = document.getElementById('serie');
    if (!serieInput) return;

    serieInput.addEventListener('keydown', function (e) {
      if (ALLOWED_NAV_KEYS.indexOf(e.key) !== -1) return;
      if (e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    serieInput.addEventListener('input', function () {
      var raw = serieInput.value.replace(/\D/g, '');
      if (raw.length > 9) raw = raw.slice(0, 9);

      // Format: XXX.XXX.XXX
      var formatted = '';
      for (var i = 0; i < raw.length; i++) {
        if (i > 0 && i % 3 === 0) formatted += '.';
        formatted += raw[i];
      }
      serieInput.value = formatted;
    });
  }

  // ─── FORMATEO TELÉFONO ────────────────────────────────────────────────────
  function attachPhoneFormatter() {
    var phoneInput = document.getElementById('telefono');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function () {
      var val = phoneInput.value.replace(/\D/g, '');
      if (val.length > 9) val = val.slice(0, 9);
      phoneInput.value = val;
    });
  }

  // ─── TOOLTIP ──────────────────────────────────────────────────────────────
  function attachTooltip() {
    var triggers = document.querySelectorAll('.tooltip-trigger');
    triggers.forEach(function (trigger) {
      // Soporte para data-tooltip-target: desacoplado del ID hardcoded
      var targetId = trigger.dataset.tooltipTarget || 'serie-tooltip';
      var tooltipEl = document.getElementById(targetId);
      if (!tooltipEl) return;

      function showTooltip() { tooltipEl.classList.add('visible'); }
      function hideTooltip() { tooltipEl.classList.remove('visible'); }

      trigger.addEventListener('mouseenter', showTooltip);
      trigger.addEventListener('mouseleave', hideTooltip);
      trigger.addEventListener('focus', showTooltip);
      trigger.addEventListener('blur', hideTooltip);
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        tooltipEl.classList.toggle('visible');
      });
    });
  }

  // ─── FUNCIONES DE VALIDACIÓN ──────────────────────────────────────────────
  function validateNotEmpty(value) {
    if (!value || value.trim().length === 0) return 'empty';
    return 'valid';
  }

  /**
   * Valida que el campo contenga solo letras (con acentos/ñ/ü), espacios o guiones.
   * Mínimo 2 caracteres — impide entradas de un solo carácter sin sentido.
   */
  function validateText(value) {
    if (!value || value.trim().length === 0) return 'empty';
    if (value.trim().length < 2) return 'invalid';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-]+$/.test(value.trim())) return 'invalid';
    return 'valid';
  }

  /**
   * REQ 2: Valida que el usuario tenga 18 años o más.
   */
  function validateAge(value) {
    if (!value || value.length === 0) return 'empty';

    var birthDate = new Date(value + 'T12:00:00');
    if (isNaN(birthDate.getTime())) return 'invalid';

    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 18 ? 'valid' : 'invalid';
  }

  function validateRut(value) {
    if (!value || value.length === 0) return 'empty';

    var clean = value.replace(/[.\-]/g, '').toUpperCase();
    if (clean.length < 2) return 'invalid';

    var body = clean.slice(0, -1);
    var dv = clean.slice(-1);

    if (!/^\d+$/.test(body)) return 'invalid';

    var calculated = calculateRutDv(parseInt(body, 10));
    return calculated === dv ? 'valid' : 'invalid';
  }

  function calculateRutDv(rut) {
    var sum = 0;
    var multiplier = 2;

    while (rut > 0) {
      sum += (rut % 10) * multiplier;
      rut = Math.floor(rut / 10);
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    var remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
  }

  function validateSerie(value) {
    if (!value || value.length === 0) return 'empty';
    var clean = value.replace(/\./g, '');
    return /^\d{9}$/.test(clean) ? 'valid' : 'invalid';
  }

  function validatePassword(value) {
    if (!value || value.length === 0) return 'empty';
    if (value !== value.trim()) return 'invalid';       // sin espacios al inicio/fin
    if (value.length < 8 || value.length > 72) return 'invalid'; // 72 = límite bcrypt
    if (!/[a-zA-Z]/.test(value)) return 'invalid';     // debe contener letras
    if (!/[0-9]/.test(value)) return 'invalid';     // debe contener números
    if (/^(.)\1+$/.test(value)) return 'invalid';    // no permite un único carácter repetido (ej: aaaaaaa8)
    return 'valid';
  }

  // ─── REQ 2: PASSWORD STRENGTH INDICATOR ──────────────────────────────────
  function attachPasswordStrength() {
    var input = document.getElementById('password');
    var segs = [
      document.getElementById('ps-1'),
      document.getElementById('ps-2'),
      document.getElementById('ps-3'),
      document.getElementById('ps-4'),
    ];
    if (!input || segs.some(function (s) { return !s; })) return;

    input.addEventListener('input', function () {
      var v = input.value;
      var score = 0;
      if (v.length >= 8) score++;
      if (/[a-zA-Z]/.test(v) && /[0-9]/.test(v)) score++;
      if (v.length >= 12) score++;
      if (/[^a-zA-Z0-9]/.test(v)) score++;

      var colors = ['#C9351F', '#E88A0F', '#2B8A3E', '#1A7A4A'];
      segs.forEach(function (seg, i) {
        seg.style.background = i < score ? colors[Math.min(score - 1, 3)] : '';
        seg.classList.toggle('active', i < score);
      });
    });

    // Toggle show/hide password (both in step-1 and modal)
    document.querySelectorAll('.password-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrapper = btn.closest('.password-wrapper');
        var inp = wrapper ? wrapper.querySelector('input') : null;
        if (!inp) return;
        var isText = inp.type === 'text';
        inp.type = isText ? 'password' : 'text';
        btn.setAttribute('aria-label', isText ? 'Mostrar contraseña' : 'Ocultar contraseña');
        var eyeIcon = btn.querySelector('.eye-icon');
        if (eyeIcon) {
          eyeIcon.style.opacity = isText ? '1' : '0.45';
        }
      });
    });
  }

  function validateEmail(value) {
    if (!value || value.trim().length === 0) return 'empty';
    if (value.length > 254) return 'invalid';           // RFC 5321: max 254 chars
    if (value.includes('..')) return 'invalid';         // doble punto inválido
    var emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}$/;
    return emailRegex.test(value.trim()) ? 'valid' : 'invalid';
  }

  function validatePhone(value) {
    if (!value || value.length === 0) return 'empty';
    var phoneRegex = /^9\d{8}$/;
    return phoneRegex.test(value) ? 'valid' : 'invalid';
  }

  // ─── UTILIDAD: ESCAPE HTML ────────────────────────────────────────────────
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─── ARRANCAR ─────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
