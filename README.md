# Simulador del router · Redes I

Simulador del panel de un router para la práctica del **TP N°8 — Configurando el router** de Redes I (5.º año).

Técnico en Programación · C.T.P. "Olga B. de Arko" · Ushuaia

**Prof. Nicolás A. Cussi**

## Qué es

Una página web que reproduce la estructura del panel del router del laboratorio (TP-Link TL-WR850N v3): las pestañas Quick Setup, Basic y Advanced, y los mismos nombres de los menús, en inglés como en el panel, con la traducción al lado. El diseño es propio, sin el logo ni la marca del fabricante.

Al lado del navegador hay:

- **Tu PC** y **Otra PC**, con el Símbolo del sistema (`ipconfig`, `ipconfig /all`, `ipconfig /release`, `ipconfig /renew`, `ping`) y la ventana de Conexiones de red para poner una IP fija.
- **Celular**, para conectarse a la red Wi-Fi.
- **Router**, con las luces y el botón WPS/RESET (mantenerlo apretado más de 5 segundos hace el reset de fábrica).
- **Práctica**, con los pasos del TP N°8, que se tildan solos, y el resumen para la entrega con un código.

Es una simulación: no es un router real y nada sale de la computadora. El progreso se guarda solo en ese navegador.

## Cómo se usa

1. Abrí el link desde una computadora (no funciona en el celular).
2. Escribí tu nombre y apellido.
3. Seguí los pasos de la pestaña **Práctica**.
4. Al terminar, abrí el resumen, sacá una captura y subila a Classroom.

## Estructura

```
index.html                 la página
assets/css/estilos.css     estilos (paleta del cuadernillo de Redes I)
assets/js/estado.js        la red simulada: router, DHCP, equipos y guardado
assets/js/panel.js         el panel web del router
assets/js/equipos.js       las PC, el celular y el router físico
assets/js/practica.js      los pasos de la práctica y el resumen
assets/js/app.js           arma la pantalla
assets/fonts/              Barlow (SIL Open Font License)
```

HTML, CSS y JavaScript, sin dependencias ni servidor. Para probarlo en la computadora, abrí `index.html` desde un servidor local.

## Pantallas por confirmar

Estas pantallas están armadas sin la captura del router real y llevan el rótulo "pantalla provisoria":

- System Tools › Backup & Restore.
- Network › LAN Settings › Address Reservation › Add (el formulario).
- System Tools › Administration.
- Security › Access Control › Add (el formulario).

## Créditos

- Contenido: Prof. Nicolás A. Cussi.
- Tipografías Barlow y Barlow Semi Condensed, bajo licencia SIL Open Font License (ver `assets/fonts/OFL.txt`).
