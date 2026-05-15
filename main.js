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
          customError: 'Ingresa exactamente 9 dígitos numéricos.',
        },
      ],
    },
    {
      id: 2,
      fields: [
        {
          id: 'nombres',
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
        },
        {
          id: 'apellidos',
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
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
      'Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central',
      'Huechuraba','Independencia','La Cisterna','La Florida','La Granja',
      'La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo',
      'Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda',
      'Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal',
      'Recoleta','Renca','San Joaquín','San Miguel','San Ramón',
      'Santiago','Vitacura','Puente Alto','San Bernardo','Colina',
      'Lampa','Tiltil','San José de Maipo','Calera de Tango','Paine',
      'Buin','Pirque','Talagante','El Monte','Isla de Maipo','Melipilla',
      'Alhué','Curacaví','María Pinto','Peñaflor',
    ],
    v: [
      'Valparaíso','Viña del Mar','Quilpué','Villa Alemana','Concón',
      'San Antonio','Cartagena','El Tabo','El Quisco','Algarrobo',
      'Santo Domingo','Quillota','La Cruz','Calera','Hijuelas','Nogales',
      'San Felipe','Los Andes','Calle Larga','Rinconada','Santa María',
      'Petorca','La Ligua','Papudo','Zapallar','Cabildo',
      'Casablanca','Isla de Pascua','Juan Fernández',
    ],
    viii: [
      'Concepción','Talcahuano','Hualpén','San Pedro de la Paz',
      'Chiguayante','Penco','Tomé','Coronel','Lota','Arauco',
      'Lebu','Curanilahue','Los Álamos','Los Ángeles','Nacimiento',
      'Yumbel','Cabrero','San Rosendo','Laja','Mulchén','Negrete',
      'Quilaco','Quilleco','Santa Bárbara','Tucapel','Antuco','Alto Biobío',
    ],
    ix: [
      'Temuco','Padre Las Casas','Villarrica','Pucón','Lautaro',
      'Angol','Renaico','Victoria','Traiguén','Lumaco','Purén',
      'Los Sauces','Ercilla','Collipulli','Curacautín','Lonquimay',
      'Melipeuco','Nueva Imperial','Teodoro Schmidt','Saavedra','Carahue',
      'Galvarino','Perquenco','Freire','Gorbea','Loncoche','Pitrufquén',
      'Cunco','Panguipulli','Vilcún',
    ],
    iv: [
      'La Serena','Coquimbo','Ovalle','Illapel','Los Vilos','Salamanca',
      'Combarbalá','Monte Patria','Punitaqui','Río Hurtado','Andacollo',
      'Vicuña','Paiguano','Paihuano',
    ],
    vi: [
      'Rancagua','Machali','Graneros','Codegua','Requínoa','Rengo',
      'San Vicente','Pichilemu','Navidad','Litueche','La Estrella',
      'Marchihue','Paredones','San Fernando','Chimbarongo','Nancagua',
      'Palmilla','Peralillo','Placilla','Pumanque','Lolol',
      'Santa Cruz','Pichidegua','Las Cabras','Olivar','Mostazal',
    ],
    vii: [
      'Talca','Curicó','Linares','Constitución','Cauquenes','Parral',
      'San Javier','Villa Alegre','Yerbas Buenas','Longaví','Retiro',
      'San Clemente','Maule','Pelarco','Río Claro','San Rafael',
      'Curepto','Empedrado','Pencahue','Rauco','Romeral',
      'Sagrada Familia','Teno','Vichuquén','Molina',
    ],
    x: [
      'Puerto Montt','Osorno','Castro','Ancud','Quellón','Chonchi',
      'Dalcahue','Queilen','Quemchi','Quinchao','Curaco de Vélez',
      'Puerto Varas','Fresia','Frutillar','Llanquihue','Los Muermos',
      'Maullín','Calbuco','San Pablo','San Juan de la Costa',
      'Río Negro','Purranque','Puyehue','Puerto Octay',
    ],
    xi: [
      'Coyhaique','Aysén','Chile Chico','Cochrane','O\'Higgins',
      'Tortel','Lago Verde','Guaitecas','Cisnes','Río Ibáñez',
    ],
    xii: [
      'Punta Arenas','Puerto Natales','Porvenir','Primavera',
      'Timaukel','Río Verde','Laguna Blanca','San Gregorio',
      'Torres del Paine','Cabo de Hornos','Antártica',
    ],
    i: [
      'Iquique','Alto Hospicio','Pozo Almonte','Colchane',
      'Huara','Camiña','Pica',
    ],
    ii: [
      'Antofagasta','Calama','Tocopilla','Mejillones','Taltal',
      'María Elena','Ollagüe','San Pedro de Atacama','Sierra Gorda',
    ],
    iii: [
      'Copiapó','Caldera','Chañaral','Diego de Almagro',
      'Vallenar','Alto del Carmen','Freirina','Huasco',
      'Tierra Amarilla',
    ],
    xiv: [
      'Valdivia','La Unión','Panguipulli','Los Lagos','Futrono',
      'Lago Ranco','Paillaco','Río Bueno','Corral','Máfil',
      'Lanco','Mariquina',
    ],
    xv: [
      'Arica','Camarones','Putre','General Lagos',
    ],
    xvi: [
      'Chillán','Chillán Viejo','San Carlos','Bulnes','Coihueco',
      'El Carmen','Ninhue','Ñiquén','Pemuco','Pinto','Portezuelo',
      'Quillón','Quirihue','Ranquil','San Fabián','San Ignacio',
      'San Nicolás','Treguaco','Yungay','Cobquecura','Coelemu',
    ],
  };

  // ─── MAPA DE NOMBRES DE REGIÓN ────────────────────────────────────────────
  const REGION_NAMES = {
    rm:   'Región Metropolitana',
    v:    'Región de Valparaíso',
    viii: 'Región del Biobío',
    ix:   'Región de La Araucanía',
    iv:   'Región de Coquimbo',
    vi:   "Región del Libertador B. O'Higgins",
    vii:  'Región del Maule',
    x:    'Región de Los Lagos',
    xi:   'Región de Aysén',
    xii:  'Región de Magallanes',
    i:    'Región de Tarapacá',
    ii:   'Región de Antofagasta',
    iii:  'Región de Atacama',
    xiv:  'Región de Los Ríos',
    xv:   'Región de Arica y Parinacota',
    xvi:  'Región de Ñuble',
  };

  // ─── ESTADO ───────────────────────────────────────────────────────────────
  let currentStep = 1;
  const TOTAL_STEPS = STEPS_CONFIG.length;

  // ─── ANTIGRAVITY ENGINE ───────────────────────────────────────────────────
  // Referencia al engine de Matter.js para poder destruirlo/restaurarlo
  let _matterRunner = null;
  let _matterEngine = null;
  let _matterRender = null;
  let _mouseConstraint = null;

  // ─── INICIALIZACIÓN ───────────────────────────────────────────────────────
  function init() {
    setMaxBirthDate();           // REQ 2: Bloquear fechas futuras en el date input
    attachNextButtons();
    attachBackButtons();
    attachLoginButton();
    attachRutFormatter();        // REQ 1: Formateador + limitador estricto RUT
    attachSerieFormatter();
    attachPhoneFormatter();
    attachTooltip();
    attachInlineValidation();
    attachRegionComunaSync();    // REQ 3: Select dinámico de comunas
    initAntigravity();           // REQ 6: Motor de físicas
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
    var formData = {
      rut:              getValue('rut'),
      serie:            getValue('serie'),
      nombres:          getValue('nombres'),
      apellidos:        getValue('apellidos'),
      fecha_nacimiento: getValue('fecha_nacimiento'),
      region:           regionCode,
      regionNombre:     REGION_NAMES[regionCode] || regionCode,
      comuna:           getValue('comuna'),
      calle:            getValue('calle'),
      numero:           getValue('numero'),
      email:            getValue('email'),
      telefono:         getValue('telefono'),
      fechaSolicitud:   new Date().toISOString(),
      numeroCuenta:     generateAccountNumber(),
      cuentaActiva:     true,    // REQ 5: Estado inicial de cuenta
    };

    try {
      localStorage.setItem('bancogn_solicitud', JSON.stringify(formData));
    } catch (e) {
      console.warn('[BancoGN] No se pudo guardar en localStorage:', e);
    }
  }

  function getValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function generateAccountNumber() {
    return '210' + String(Math.floor(Math.random() * 9000000 + 1000000));
  }

  function loadFromLocalStorage() {
    try {
      var stored = localStorage.getItem('bancogn_solicitud');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('[BancoGN] Error leyendo localStorage:', e);
      return {};
    }
  }

  function persistData(data) {
    try {
      localStorage.setItem('bancogn_solicitud', JSON.stringify(data));
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

  // ─── BOTÓN IR A DASHBOARD ─────────────────────────────────────────────────
  function attachLoginButton() {
    var loginBtn = document.getElementById('login-btn');
    if (!loginBtn) return;
    loginBtn.addEventListener('click', function () {
      renderDashboard();
    });
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
    welcomeBlock.innerHTML = [
      '<p class="dashboard-eyebrow">Panel de cliente</p>',
      '<h1 class="page-title">Bienvenido, ',
      '<span class="dashboard-name">' + escapeHtml(data.nombres || 'Cliente') + '</span>',
      '</h1>',
      '<p class="page-subtitle">Tu solicitud de Cuenta Bancaria ha sido procesada exitosamente.</p>',
    ].join('');

    /* ── Tarjeta de cuenta ── */
    var accountCard = document.createElement('div');
    accountCard.className = 'dashboard-account-card';
    accountCard.setAttribute('role', 'region');
    accountCard.setAttribute('aria-label', 'Tu nueva cuenta bancaria');

    var formattedDate = '—';
    if (data.fechaSolicitud) {
      formattedDate = new Date(data.fechaSolicitud).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
    }

    var isActive = data.cuentaActiva !== false;

    accountCard.innerHTML = [
      '<div class="dashboard-account-header">',
      '  <div class="dashboard-bank-logo" aria-hidden="true">',
      '    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '      <rect width="28" height="28" rx="8" fill="white" fill-opacity="0.2"/>',
      '      <path d="M6 20V12L14 7L22 12V20H17V15H11V20H6Z" fill="white"/>',
      '    </svg>',
      '  </div>',
      '  <div>',
      '    <p class="dashboard-account-label">Cuenta Corriente</p>',
      '    <p class="dashboard-account-number">' + escapeHtml(data.numeroCuenta || '—') + '</p>',
      '  </div>',
      '  <div class="dashboard-account-chip' + (isActive ? '' : ' inactive') + '" id="account-chip" ',
      '       role="button" tabindex="0" aria-label="Estado de cuenta: ' + (isActive ? 'Activa' : 'Inactiva') + '">',
      '    <span class="dashboard-chip-dot" aria-hidden="true"></span>',
      '    <span id="chip-label">' + (isActive ? 'Activa' : 'Inactiva') + '</span>',
      '  </div>',
      '</div>',
      // REQ 5: Toggle de estado
      '<div class="dashboard-status-toggle">',
      '  <button class="toggle-track' + (isActive ? '' : ' inactive') + '" id="status-toggle" ',
      '          aria-label="Cambiar estado de cuenta" aria-checked="' + isActive + '" role="switch">',
      '    <span class="toggle-thumb"></span>',
      '  </button>',
      '  <span id="status-label">Estado: <strong>' + (isActive ? 'Activa' : 'Inactiva') + '</strong></span>',
      '</div>',
      '<div class="dashboard-account-meta">',
      '  <div>',
      '    <span class="dashboard-meta-label">Titular</span>',
      '    <span class="dashboard-meta-value">' +
        escapeHtml((data.nombres || '') + ' ' + (data.apellidos || '')) + '</span>',
      '  </div>',
      '  <div>',
      '    <span class="dashboard-meta-label">Fecha de apertura</span>',
      '    <span class="dashboard-meta-value">' + escapeHtml(formattedDate) + '</span>',
      '  </div>',
      '  <div>',
      '    <span class="dashboard-meta-label">RUT</span>',
      '    <span class="dashboard-meta-value">' + escapeHtml(data.rut || '—') + '</span>',
      '  </div>',
      '</div>',
    ].join('');

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
    var dataItems = [
      { label: 'Nombres',            value: data.nombres,          editable: false },
      { label: 'Apellidos',          value: data.apellidos,        editable: false },
      {
        label: 'Fecha de nacimiento',
        value: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-CL')
          : null,
        editable: true, editGroup: 'birthdate', rawValue: data.fecha_nacimiento,
      },
      { label: 'RUT',                value: data.rut,              editable: false },
      { label: 'N° de documento',    value: data.serie,            editable: false },
      {
        label: 'Correo electrónico',
        value: data.email,
        editable: true, editGroup: 'email',
      },
      {
        label: 'Teléfono celular',
        value: data.telefono ? '+56 ' + data.telefono : null,
        editable: true, editGroup: 'phone', rawValue: data.telefono,
      },
      { label: 'Región',             value: data.regionNombre,     editable: false },
      { label: 'Comuna',             value: data.comuna,           editable: false },
      {
        label: 'Dirección',
        value: (data.calle && data.numero) ? data.calle + ' ' + data.numero : null,
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

    /* ── Acciones ── */
    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'step-actions';

    var logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn btn-danger';
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Cerrar sesión';
    logoutBtn.setAttribute('aria-label', 'Cerrar sesión');

    // REQ 7: Logout → pantalla sesión cerrada (NO recarga)
    logoutBtn.addEventListener('click', function () {
      renderSessionClosed();
    });

    actionsDiv.appendChild(logoutBtn);

    // ── Montar en el DOM ─────────────────────────────────────────────────────
    wrapper.appendChild(welcomeBlock);
    wrapper.appendChild(accountCard);
    wrapper.appendChild(summaryCard);
    wrapper.appendChild(actionsDiv);
    mainEl.appendChild(wrapper);

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
      data.cuentaActiva = !data.cuentaActiva;
      persistData(data);
      syncStatusUI(data.cuentaActiva);
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

  // ─── REQ 4: EDICIÓN INLINE DE CAMPOS ─────────────────────────────────────
  function openInlineEdit(itemEl, item, data, editBtn, valueEl) {
    // Evitar duplicar formularios
    if (itemEl.querySelector('.dashboard-edit-form')) return;

    editBtn.style.display = 'none';

    var editForm = document.createElement('div');
    editForm.className = 'dashboard-edit-form';

    var inputs = [];

    if (item.editGroup === 'email') {
      var inp = buildInput('text', data.email || '', 'Correo electrónico');
      inp.type = 'email';
      editForm.appendChild(inp);
      inputs.push({ el: inp, key: 'email' });

    } else if (item.editGroup === 'phone') {
      var inp2 = buildInput('tel', data.telefono || '', 'Ej: 912345678');
      inp2.maxLength = 9;
      editForm.appendChild(inp2);
      inputs.push({ el: inp2, key: 'telefono' });

    } else if (item.editGroup === 'birthdate') {
      var inp3 = buildInput('date', data.fecha_nacimiento || '', '');
      var today = new Date();
      inp3.max = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
      editForm.appendChild(inp3);
      inputs.push({ el: inp3, key: 'fecha_nacimiento' });

    } else if (item.editGroup === 'address') {
      var wrapRow = document.createElement('div');
      wrapRow.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:8px;';

      var inpCalle = buildInput('text', data.calle || '', 'Calle');
      var inpNum   = buildInput('text', data.numero || '', 'N°');
      inpNum.style.width = '80px';

      wrapRow.appendChild(inpCalle);
      wrapRow.appendChild(inpNum);
      editForm.appendChild(wrapRow);

      // Select de región
      var regionSel = buildRegionSelect(data.region || '');
      editForm.appendChild(regionSel);

      // Select de comunas dinámico
      var comunaSel = buildComunaSelect(data.region || '', data.comuna || '');
      editForm.appendChild(comunaSel);

      // Sincronizar comunas al cambiar región
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

      inputs.push({ el: inpCalle, key: 'calle' });
      inputs.push({ el: inpNum,   key: 'numero' });
      inputs.push({ el: regionSel, key: 'region' });
      inputs.push({ el: comunaSel, key: 'comuna' });
    }

    // Botones guardar / cancelar
    var actRow = document.createElement('div');
    actRow.className = 'dashboard-edit-actions';

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Guardar';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-cancel-edit';
    cancelBtn.textContent = 'Cancelar';

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
        else { inp.el.classList.remove('error'); fresh[inp.key] = val; }
      });

      if (item.editGroup === 'email' && inputs[0]) {
        if (validateEmail(inputs[0].el.value.trim()) !== 'valid') {
          valid = false; inputs[0].el.classList.add('error');
        }
      }
      if (item.editGroup === 'phone' && inputs[0]) {
        if (validatePhone(inputs[0].el.value.trim()) !== 'valid') {
          valid = false; inputs[0].el.classList.add('error');
        }
      }
      if (item.editGroup === 'birthdate' && inputs[0]) {
        if (validateAge(inputs[0].el.value.trim()) !== 'valid') {
          valid = false; inputs[0].el.classList.add('error');
        }
      }

      if (!valid) return;

      // Actualizar nombres derivados
      if (fresh.region) {
        fresh.regionNombre = REGION_NAMES[fresh.region] || fresh.region;
      }

      persistData(fresh);
      // Re-render del dashboard para reflejar los cambios
      renderDashboard();
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

  // ─── REQ 7: PANTALLA SESIÓN CERRADA ──────────────────────────────────────
  function renderSessionClosed() {
    var mainEl = document.querySelector('.main-content');
    if (!mainEl) return;
    mainEl.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper';

    var screen = document.createElement('div');
    screen.className = 'session-closed-screen';

    // Ícono de candado
    screen.innerHTML = [
      '<div class="session-closed-icon" aria-hidden="true">',
      '  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '    <path d="M11 16V12C11 8.13 14.13 5 18 5C21.87 5 25 8.13 25 12V16" stroke="#1A3A6B" stroke-width="2" stroke-linecap="round"/>',
      '    <rect x="6" y="16" width="24" height="16" rx="4" stroke="#1A3A6B" stroke-width="2"/>',
      '    <circle cx="18" cy="25" r="2" fill="#1A3A6B"/>',
      '  </svg>',
      '</div>',
      '<h1 class="session-closed-title">Sesión cerrada</h1>',
      '<p class="session-closed-subtitle">Tu sesión ha sido cerrada correctamente. ¿Qué deseas hacer?</p>',
      '<div class="session-closed-actions">',
      '  <button type="button" class="btn btn-primary" id="sc-login-btn">Iniciar Sesión</button>',
      '  <button type="button" class="btn btn-secondary" id="sc-new-btn">Solicitar Nueva Cuenta</button>',
      '</div>',
    ].join('');

    wrapper.appendChild(screen);
    mainEl.appendChild(wrapper);

    // Botón: Solicitar nueva cuenta → limpia localStorage y reinicia formulario
    var newBtn = document.getElementById('sc-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        localStorage.removeItem('bancogn_solicitud');
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
    var cancelBtn    = document.getElementById('modal-cancel-btn');
    var submitBtn    = document.getElementById('modal-submit-btn');
    var rutInput     = document.getElementById('login-rut');
    var rutError     = document.getElementById('login-rut-error');
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

    // Submit: verificar RUT contra localStorage
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        attemptLogin(rutInput, rutError);
      });
    }
    if (rutInput) {
      rutInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') attemptLogin(rutInput, rutError);
      });
      // Formateador RUT en el modal
      rutInput.addEventListener('input', function () {
        var val = rutInput.value.replace(/[^0-9kK]/g, '');
        if (val.length === 0) { rutInput.value = ''; return; }
        if (val.length > 9) val = val.slice(0, 9);
        var body = val.slice(0, -1);
        var dv   = val.slice(-1).toUpperCase();
        var formatted = '';
        var reversed  = body.split('').reverse();
        reversed.forEach(function (char, index) {
          if (index > 0 && index % 3 === 0) formatted = '.' + formatted;
          formatted = char + formatted;
        });
        rutInput.value = formatted ? formatted + '-' + dv : dv;
      });
    }
  }

  function openLoginModal() {
    var modal = document.getElementById('login-modal');
    var rutInput = document.getElementById('login-rut');
    var rutError = document.getElementById('login-rut-error');
    if (!modal) return;
    if (rutInput) rutInput.value = '';
    if (rutError) { rutError.textContent = ''; rutError.classList.remove('visible'); }
    modal.classList.remove('hidden');
    if (rutInput) setTimeout(function () { rutInput.focus(); }, 50);
  }

  function closeLoginModal() {
    var modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
  }

  function attemptLogin(rutInput, rutError) {
    var enteredRut = rutInput ? rutInput.value.trim() : '';
    var stored = loadFromLocalStorage();

    // Limpiar error previo
    if (rutInput) rutInput.classList.remove('error');
    if (rutError) { rutError.textContent = ''; rutError.classList.remove('visible'); }

    if (!enteredRut) {
      showModalError(rutInput, rutError, 'Ingresa tu RUT.');
      return;
    }
    if (validateRut(enteredRut) !== 'valid') {
      showModalError(rutInput, rutError, 'Ingresa un RUT válido.');
      return;
    }
    if (!stored.rut) {
      showModalError(rutInput, rutError, 'No existe una cuenta registrada. Solicita una cuenta primero.');
      return;
    }

    // Normalizar RUT para comparación (solo dígitos + DV)
    var normalizeRut = function (r) { return r.replace(/[.\-]/g, '').toUpperCase(); };
    if (normalizeRut(enteredRut) !== normalizeRut(stored.rut)) {
      showModalError(rutInput, rutError, 'El RUT no coincide con ninguna cuenta registrada.');
      return;
    }

    // Login exitoso
    closeLoginModal();
    renderDashboard();
  }

  function showModalError(input, errorEl, message) {
    if (input) input.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  // ─── REQ 6: MOTOR DE FÍSICAS ANTIGRAVITY (Matter.js) ─────────────────────
  function initAntigravity() {
    var canvas = document.getElementById('antigravity-canvas');
    if (!canvas || typeof Matter === 'undefined') return;

    var Engine     = Matter.Engine;
    var Render     = Matter.Render;
    var Runner     = Matter.Runner;
    var Bodies     = Matter.Bodies;
    var Body       = Matter.Body;
    var World      = Matter.World;
    var Events     = Matter.Events;
    var Mouse      = Matter.Mouse;
    var MouseConstraint = Matter.MouseConstraint;

    var W = window.innerWidth;
    var H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    var engine = Engine.create({ gravity: { x: 0, y: 1.2 } });
    _matterEngine = engine;

    var render = Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width:             W,
        height:            H,
        background:        'transparent',
        wireframes:        false,
        pixelRatio:        window.devicePixelRatio || 1,
      },
    });
    _matterRender = render;

    // ── Suelo y paredes invisibles ───────────────────────────────────────────
    var wallOpts = { isStatic: true, render: { visible: false } };
    var ground   = Bodies.rectangle(W / 2, H + 25, W * 2, 50, wallOpts);
    var wallL    = Bodies.rectangle(-25,   H / 2, 50, H * 2, wallOpts);
    var wallR    = Bodies.rectangle(W + 25, H / 2, 50, H * 2, wallOpts);
    World.add(engine.world, [ground, wallL, wallR]);

    // ── Definición de elementos flotantes ────────────────────────────────────
    // Paleta de colores institucionales con baja opacidad
    var SHAPES = [];

    // Logotipos del banco (rectángulos redondeados con ícono)
    var logoColor  = 'rgba(26, 58, 107, 0.12)';
    var accentColor = 'rgba(232, 78, 15, 0.10)';
    var grayColor  = 'rgba(160, 173, 192, 0.18)';

    // Crear cuerpos: mezcla de círculos, rectángulos y polígonos
    var bodyDefs = [
      // Escudos / rectángulos (representan tarjetas bancarias)
      { type: 'rect', w: 56, h: 36, color: logoColor,   label: 'card' },
      { type: 'rect', w: 56, h: 36, color: logoColor,   label: 'card' },
      { type: 'rect', w: 48, h: 30, color: accentColor, label: 'card-accent' },
      { type: 'rect', w: 44, h: 28, color: grayColor,   label: 'card-gray' },
      { type: 'rect', w: 44, h: 28, color: grayColor,   label: 'card-gray' },
      // Círculos (monedas)
      { type: 'circle', r: 18, color: logoColor,        label: 'coin' },
      { type: 'circle', r: 14, color: accentColor,      label: 'coin-accent' },
      { type: 'circle', r: 12, color: grayColor,        label: 'coin-gray' },
      { type: 'circle', r: 20, color: logoColor,        label: 'coin' },
      { type: 'circle', r: 10, color: grayColor,        label: 'coin-gray' },
      // Diamantes / rombos (polígonos de 4 lados)
      { type: 'poly', sides: 4, r: 20, color: logoColor,   label: 'diamond' },
      { type: 'poly', sides: 4, r: 16, color: accentColor, label: 'diamond-accent' },
      { type: 'poly', sides: 6, r: 18, color: grayColor,   label: 'hex' },
      { type: 'poly', sides: 6, r: 14, color: logoColor,   label: 'hex' },
      // Extra pequeños para densidad
      { type: 'circle', r: 8,  color: accentColor, label: 'dot' },
      { type: 'circle', r: 6,  color: logoColor,   label: 'dot' },
      { type: 'circle', r: 8,  color: grayColor,   label: 'dot' },
      { type: 'rect', w: 32, h: 20, color: grayColor, label: 'card-sm' },
      { type: 'rect', w: 28, h: 18, color: logoColor, label: 'card-sm' },
    ];

    var bodies = [];
    bodyDefs.forEach(function (def, i) {
      var x = 80 + Math.random() * (W - 160);
      var y = -60 - Math.random() * 400;
      var body;

      var physOpts = {
        restitution: 0.55,
        friction:    0.05,
        frictionAir: 0.008,
        density:     0.003,
        label:       def.label,
        render: {
          fillStyle:        def.color,
          strokeStyle:      'transparent',
          lineWidth:        0,
        },
      };

      if (def.type === 'circle') {
        body = Bodies.circle(x, y, def.r, physOpts);
      } else if (def.type === 'rect') {
        body = Bodies.rectangle(x, y, def.w, def.h, Object.assign({}, physOpts, {
          chamfer: { radius: 6 },
        }));
      } else {
        body = Bodies.polygon(x, y, def.sides, def.r, physOpts);
      }

      // Velocidad angular aleatoria sutil
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 2,
      });

      bodies.push(body);
    });

    World.add(engine.world, bodies);

    // ── Interacción con el mouse (atracción sutil, no agarra) ─────────────
    var mouse = Mouse.create(canvas);

    // Efecto de viento/atracción sutil hacia el cursor
    Events.on(engine, 'beforeUpdate', function () {
      var mx = mouse.position.x;
      var my = mouse.position.y;
      bodies.forEach(function (b) {
        var dx = mx - b.position.x;
        var dy = my - b.position.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 1) {
          var strength = 0.000015 * (180 - dist);
          Body.applyForce(b, b.position, {
            x: dx * strength,
            y: dy * strength,
          });
        }
      });
    });

    // ── Dibujo personalizado con canvas 2D (sobre el render de Matter) ─────
    // Usamos afterRender para dibujar íconos encima de los cuerpos
    Events.on(render, 'afterRender', function () {
      var ctx = render.context;
      bodies.forEach(function (b) {
        var pos = b.position;
        var angle = b.angle;
        var label = b.label;

        if (label === 'coin' || label === 'coin-accent' || label === 'coin-gray') {
          // Dibujar símbolo $ dentro de las monedas
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(angle);
          ctx.font = 'bold 10px DM Sans, sans-serif';
          ctx.fillStyle = label === 'coin-accent'
            ? 'rgba(232, 78, 15, 0.45)'
            : 'rgba(26, 58, 107, 0.35)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          ctx.restore();
        } else if (label === 'card' || label === 'card-accent' || label === 'card-sm') {
          // Dibujar mini-líneas simulando una tarjeta bancaria
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(angle);
          ctx.strokeStyle = label === 'card-accent'
            ? 'rgba(232, 78, 15, 0.3)'
            : 'rgba(26, 58, 107, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-14, -4); ctx.lineTo(14, -4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-14, 2); ctx.lineTo(6, 2);
          ctx.stroke();
          ctx.restore();
        }
      });
    });

    var runner = Runner.create();
    _matterRunner = runner;
    Runner.run(runner, engine);
    Render.run(render);

    // ── Responsividad ────────────────────────────────────────────────────────
    window.addEventListener('resize', function () {
      var nW = window.innerWidth;
      var nH = window.innerHeight;
      canvas.width  = nW;
      canvas.height = nH;
      render.options.width  = nW;
      render.options.height = nH;
      render.canvas.width   = nW;
      render.canvas.height  = nH;
      // Mover el suelo al nuevo fondo
      Body.setPosition(ground, { x: nW / 2, y: nH + 25 });
      Body.setPosition(wallR,  { x: nW + 25, y: nH / 2 });
    });
  }

  // ─── VALIDACIÓN POR PASO ──────────────────────────────────────────────────
  function validateStep(stepConfig) {
    var allValid = true;

    stepConfig.fields.forEach(function (field) {
      var el      = document.getElementById(field.id);
      var errorEl = document.getElementById(field.id + '-error');
      if (!el || !errorEl) return;

      var value  = el.value.trim();
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
      var el      = document.getElementById(field.id);
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
        var el      = document.getElementById(field.id);
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

  // ─── REQ 1: FORMATEO Y LÍMITE ESTRICTO RUT ───────────────────────────────
  /**
   * Formatea el RUT en tiempo real y bloquea más de 12 caracteres
   * (máximo para el formato XX.XXX.XXX-X).
   */
  function attachRutFormatter() {
    var rutInput = document.getElementById('rut');
    if (!rutInput) return;

    var ALLOWED_KEYS = [
      'Backspace','Delete','Tab','Escape','Enter',
      'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',
    ];

    // Capa 1: bloqueo en keydown antes de insertar
    rutInput.addEventListener('keydown', function (e) {
      if (ALLOWED_KEYS.indexOf(e.key) !== -1) return;
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
    rutInput.addEventListener('input', function () {
      var val = rutInput.value.replace(/[^0-9kK]/gi, '');

      // Máximo 9 chars raw (8 dígitos + 1 DV) → 12 chars formateados
      if (val.length > 9) val = val.slice(0, 9);

      if (val.length === 0) { rutInput.value = ''; return; }

      var body = val.slice(0, -1);
      var dv   = val.slice(-1).toUpperCase();

      var formatted = '';
      var reversed  = body.split('').reverse();
      reversed.forEach(function (char, index) {
        if (index > 0 && index % 3 === 0) formatted = '.' + formatted;
        formatted = char + formatted;
      });

      rutInput.value = formatted ? formatted + '-' + dv : dv;
    });
  }

  // ─── FORMATEO SERIE ───────────────────────────────────────────────────────
  function attachSerieFormatter() {
    var serieInput = document.getElementById('serie');
    if (!serieInput) return;

    var ALLOWED_KEYS = [
      'Backspace','Delete','Tab','Escape','Enter',
      'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',
    ];

    serieInput.addEventListener('keydown', function (e) {
      if (ALLOWED_KEYS.indexOf(e.key) !== -1) return;
      if (e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    serieInput.addEventListener('input', function () {
      var clean = serieInput.value.replace(/\D/g, '');
      if (serieInput.value !== clean) {
        var pos = serieInput.selectionStart - (serieInput.value.length - clean.length);
        serieInput.value = clean;
        serieInput.setSelectionRange(pos, pos);
      }
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
      var tooltipEl = document.getElementById('serie-tooltip');
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
    if (!value || value.length === 0) return 'empty';
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
    var m   = today.getMonth() - birthDate.getMonth();
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
    var dv   = clean.slice(-1);

    if (!/^\d+$/.test(body)) return 'invalid';

    var calculated = calculateRutDv(parseInt(body, 10));
    return calculated === dv ? 'valid' : 'invalid';
  }

  function calculateRutDv(rut) {
    var sum        = 0;
    var multiplier = 2;

    while (rut > 0) {
      sum += (rut % 10) * multiplier;
      rut  = Math.floor(rut / 10);
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    var remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
  }

  function validateSerie(value) {
    if (!value || value.length === 0) return 'empty';
    return /^\d{9}$/.test(value) ? 'valid' : 'invalid';
  }

  function validateEmail(value) {
    if (!value || value.length === 0) return 'empty';
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(value) ? 'valid' : 'invalid';
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
