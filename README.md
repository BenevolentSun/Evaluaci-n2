# Evaluaci-n2
Pagina web para un formulario de registro de un banco llamado "G&amp;N"

index.html — Estructura semántica completa:

Header con logo y navegación secundaria
Stepper vertical (<aside> con <ol>) con 4 ítems y conectores
4 <section> de pasos, cada uno con su <div class="form-card"> interno
Pantalla de éxito (#step-success) oculta por defecto
Roles ARIA correctos (role="group", aria-required, aria-describedby, aria-live, role="alert")

styles.css — Diseño corporativo bancario con CSS Variables:

Paleta: azul oscuro #1A3A6B, fondo #F2F4F7, error #C9351F
Tipografía: DM Serif Display para títulos + DM Sans para cuerpo
Stepper con 3 estados visuales: inactivo · activo (glow azul) · completado (check verde)
Grid 2 columnas (sidebar fijo + área de formulario), colapsa a 1 columna en tablet y a layout apilado en móvil
Inputs con :focus ring, estado .error con fondo rosado, <select> custom, prefijo +56 para teléfono

main.js — Lógica encapsulada en IIFE:

Navegación entre pasos con animación fadeSlideIn re-triggered
Validación RUT chileno real (algoritmo módulo 11 + dígito verificador)
Validación de email (regex RFC-compatible) y teléfono chileno (9 dígitos, empieza en 9)
Auto-formateo del RUT mientras se escribe (12.345.678-9)
Limpieza de errores inline al corregir el campo
Tooltip para el campo "N° documento o serie"
Botón "Volver al inicio" que resetea todo el formulario
