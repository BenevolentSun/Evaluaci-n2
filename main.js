/**
 * banco - Solicitud banco
 * Formulario multi-paso con validación por paso
 */

(function () {
  'use strict';

  // ─── CONFIGURACIÓN DE PASOS ─────────────────────────────────────────────
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
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
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
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
        },
      ],
    },
    {
      id: 3,
      fields: [
        {
          id: 'region',
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
        },
        {
          id: 'comuna',
          validate: validateNotEmpty,
          errorMsg: 'El campo es obligatorio.',
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
          customError: 'Ingresa un teléfono válido (9 dígitos).',
        },
      ],
    },
  ];

  // ─── ESTADO ──────────────────────────────────────────────────────────────
  let currentStep = 1;
  const TOTAL_STEPS = STEPS_CONFIG.length;

  // ─── INICIALIZACIÓN ──────────────────────────────────────────────────────
  function init() {
    attachNextButtons();
    attachBackButtons();
    attachRestartButton();
    attachRutFormatter();
    attachPhoneFormatter();
    attachTooltip();
    attachInlineValidation();
  }

  // ─── NAVEGACIÓN ──────────────────────────────────────────────────────────
  function goToStep(stepNumber) {
    const prevStep = currentStep;

    // Ocultar paso actual
    const currentEl = document.getElementById('step-' + prevStep);
    if (currentEl) currentEl.classList.add('hidden');

    // Marcar indicador del paso anterior según corresponda
    const prevIndicator = document.getElementById('step-indicator-' + prevStep);
    if (prevIndicator) {
      if (stepNumber > prevStep) {
        // Avanzando: marcar como completado
        prevIndicator.classList.remove('active');
        prevIndicator.classList.add('completed');
      } else {
        // Retrocediendo: quitar estados
        prevIndicator.classList.remove('active', 'completed');
      }
    }

    // Actualizar estado
    currentStep = stepNumber;

    // Mostrar nuevo paso con animación
    const nextEl = document.getElementById('step-' + currentStep);
    if (nextEl) {
      nextEl.classList.remove('hidden');
      // Re-trigger animation
      nextEl.style.animation = 'none';
      nextEl.offsetHeight; // reflow
      nextEl.style.animation = '';
    }

    // Activar nuevo indicador
    const nextIndicator = document.getElementById('step-indicator-' + currentStep);
    if (nextIndicator) {
      nextIndicator.classList.add('active');
      nextIndicator.classList.remove('completed');
    }

    // Scroll al inicio del formulario (móvil)
    const formArea = document.querySelector('.form-area');
    if (formArea) {
      formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function showSuccess() {
    // Ocultar último paso
    const lastStepEl = document.getElementById('step-' + currentStep);
    if (lastStepEl) lastStepEl.classList.add('hidden');

    // Completar último indicador
    const lastIndicator = document.getElementById('step-indicator-' + currentStep);
    if (lastIndicator) {
      lastIndicator.classList.remove('active');
      lastIndicator.classList.add('completed');
    }

    // Mostrar pantalla de éxito
    const successEl = document.getElementById('step-success');
    if (successEl) {
      successEl.classList.remove('hidden');
      successEl.style.animation = 'none';
      successEl.offsetHeight;
      successEl.style.animation = '';
    }
  }

  // ─── BOTONES CONTINUAR ───────────────────────────────────────────────────
  function attachNextButtons() {
    const nextBtns = document.querySelectorAll('.btn-next');
    nextBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const stepId = parseInt(btn.getAttribute('data-step'), 10);
        const stepConfig = STEPS_CONFIG.find(function (s) { return s.id === stepId; });
        if (!stepConfig) return;

        const isValid = validateStep(stepConfig);
        if (isValid) {
          if (stepId < TOTAL_STEPS) {
            goToStep(stepId + 1);
          }
        }
      });
    });

    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        const stepConfig = STEPS_CONFIG.find(function (s) { return s.id === TOTAL_STEPS; });
        if (!stepConfig) return;
        const isValid = validateStep(stepConfig);
        if (isValid) {
          showSuccess();
        }
      });
    }
  }

  // ─── BOTONES VOLVER ──────────────────────────────────────────────────────
  function attachBackButtons() {
    const backBtns = document.querySelectorAll('.btn-back');
    backBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const stepId = parseInt(btn.getAttribute('data-step'), 10);
        if (stepId > 1) {
          // Limpiar errores del paso actual
          clearStepErrors(STEPS_CONFIG.find(function (s) { return s.id === stepId; }));
          goToStep(stepId - 1);
        }
      });
    });
  }

  // ─── BOTÓN REINICIAR ─────────────────────────────────────────────────────
  function attachRestartButton() {
    const restartBtn = document.getElementById('restart-btn');
    if (!restartBtn) return;
    restartBtn.addEventListener('click', function () {
      // Ocultar éxito
      const successEl = document.getElementById('step-success');
      if (successEl) successEl.classList.add('hidden');

      // Resetear todos los indicadores
      for (let i = 1; i <= TOTAL_STEPS; i++) {
        const indicator = document.getElementById('step-indicator-' + i);
        if (indicator) indicator.classList.remove('active', 'completed');
      }

      // Limpiar todos los campos
      STEPS_CONFIG.forEach(function (stepConfig) {
        clearStepErrors(stepConfig);
        stepConfig.fields.forEach(function (field) {
          const el = document.getElementById(field.id);
          if (el) el.value = '';
        });
      });

      // Volver al paso 1
      currentStep = 1;
      const firstStepEl = document.getElementById('step-1');
      if (firstStepEl) firstStepEl.classList.remove('hidden');
      const firstIndicator = document.getElementById('step-indicator-1');
      if (firstIndicator) firstIndicator.classList.add('active');
    });
  }

  // ─── VALIDACIÓN POR PASO ─────────────────────────────────────────────────
  function validateStep(stepConfig) {
    let allValid = true;

    stepConfig.fields.forEach(function (field) {
      const el = document.getElementById(field.id);
      const errorEl = document.getElementById(field.id + '-error');
      if (!el || !errorEl) return;

      const value = el.value.trim();
      const result = field.validate(value);

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
      const el = document.getElementById(field.id);
      const errorEl = document.getElementById(field.id + '-error');
      if (el && errorEl) clearFieldError(el, errorEl);
    });
  }

  // ─── MOSTRAR / OCULTAR ERRORES ───────────────────────────────────────────
  function showFieldError(input, errorEl, message) {
    // Manejo especial para phone wrapper
    const wrapper = input.closest('.phone-wrapper');
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
    const wrapper = input.closest('.phone-wrapper');
    if (wrapper) {
      wrapper.classList.remove('error');
    } else {
      input.classList.remove('error');
    }
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
    input.removeAttribute('aria-invalid');
  }

  // ─── VALIDACIÓN INLINE (al escribir) ─────────────────────────────────────
  function attachInlineValidation() {
    STEPS_CONFIG.forEach(function (stepConfig) {
      stepConfig.fields.forEach(function (field) {
        const el = document.getElementById(field.id);
        const errorEl = document.getElementById(field.id + '-error');
        if (!el || !errorEl) return;

        // Solo limpia el error mientras escribe; no valida proactivamente
        el.addEventListener('input', function () {
          if (el.classList.contains('error') || (el.closest('.phone-wrapper') && el.closest('.phone-wrapper').classList.contains('error'))) {
            const value = el.value.trim();
            const result = field.validate(value);
            if (result === 'valid') {
              clearFieldError(el, errorEl);
            }
          }
        });

        el.addEventListener('change', function () {
          if (el.classList.contains('error') || (el.closest('.phone-wrapper') && el.closest('.phone-wrapper').classList.contains('error'))) {
            const value = el.value.trim();
            const result = field.validate(value);
            if (result === 'valid') {
              clearFieldError(el, errorEl);
            }
          }
        });
      });
    });
  }

  // ─── FORMATEO RUT CHILENO ─────────────────────────────────────────────────
  function attachRutFormatter() {
    const rutInput = document.getElementById('rut');
    if (!rutInput) return;

    rutInput.addEventListener('input', function () {
      let val = rutInput.value.replace(/[^0-9kK]/g, '');
      if (val.length === 0) {
        rutInput.value = '';
        return;
      }

      // Separar dígito verificador
      let body = val.slice(0, -1);
      let dv = val.slice(-1).toUpperCase();

      // Formatear el cuerpo con puntos
      let formatted = '';
      const reversed = body.split('').reverse();
      reversed.forEach(function (char, index) {
        if (index > 0 && index % 3 === 0) formatted = '.' + formatted;
        formatted = char + formatted;
      });

      rutInput.value = formatted ? formatted + '-' + dv : dv;
    });
  }

  // ─── FORMATEO TELÉFONO ───────────────────────────────────────────────────
  function attachPhoneFormatter() {
    const phoneInput = document.getElementById('telefono');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function () {
      // Solo números
      let val = phoneInput.value.replace(/\D/g, '');
      if (val.length > 9) val = val.slice(0, 9);
      phoneInput.value = val;
    });
  }

  // ─── TOOLTIP ─────────────────────────────────────────────────────────────
  function attachTooltip() {
    const triggers = document.querySelectorAll('.tooltip-trigger');
    triggers.forEach(function (trigger) {
      const tooltipEl = document.getElementById('serie-tooltip');
      if (!tooltipEl) return;

      function showTooltip() {
        tooltipEl.classList.add('visible');
      }

      function hideTooltip() {
        tooltipEl.classList.remove('visible');
      }

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

  // ─── FUNCIONES DE VALIDACIÓN ─────────────────────────────────────────────

  /**
   * Retorna 'empty' | 'invalid' | 'valid'
   */
  function validateNotEmpty(value) {
    if (!value || value.length === 0) return 'empty';
    return 'valid';
  }

  function validateRut(value) {
    if (!value || value.length === 0) return 'empty';

    // Limpiar formato
    const clean = value.replace(/[.\-]/g, '').toUpperCase();
    if (clean.length < 2) return 'invalid';

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    if (!/^\d+$/.test(body)) return 'invalid';

    // Calcular dígito verificador
    const calculated = calculateRutDv(parseInt(body, 10));
    return calculated === dv ? 'valid' : 'invalid';
  }

  function calculateRutDv(rut) {
    let sum = 0;
    let multiplier = 2;

    while (rut > 0) {
      sum += (rut % 10) * multiplier;
      rut = Math.floor(rut / 10);
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
  }

  function validateEmail(value) {
    if (!value || value.length === 0) return 'empty';
    // RFC-compatible simple regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(value) ? 'valid' : 'invalid';
  }

  function validatePhone(value) {
    if (!value || value.length === 0) return 'empty';
    // Teléfono chileno: 9 dígitos, comienza en 9
    const phoneRegex = /^9\d{8}$/;
    return phoneRegex.test(value) ? 'valid' : 'invalid';
  }

  // ─── ARRANCAR ────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
