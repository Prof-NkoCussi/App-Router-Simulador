/* ==========================================================
   Simulador del router · panel.js
   El panel web del router (lo que se ve en el navegador al entrar a 192.168.0.1).
   Estructura y nombres de los menús: los del TP-Link TL-WR850N v3. El diseño es propio.
   ========================================================== */
(function (S) {
  "use strict";

  var nav = { sesion: false, tab: "basic", menu: "networkmap", sub: null, ver: null, aviso: null, form: null };
  S.nav = nav;

  /* Traducción que se muestra debajo de cada menú y de los campos principales */
  var TRAD = {
    "Quick Setup": "Configuración rápida", "Basic": "Básico", "Advanced": "Avanzado", "Log out": "Cerrar sesión", "Reboot": "Reiniciar",
    "Network Map": "Mapa de red", "Internet": "Internet", "Wireless": "Inalámbrico", "Parental Controls": "Control parental",
    "Status": "Estado", "Operation Mode": "Modo de funcionamiento", "Network": "Red", "LAN Settings": "Configuración de LAN",
    "Interface Grouping": "Agrupación de interfaces", "Dynamic DNS": "DNS dinámico", "Static Routing": "Rutas estáticas",
    "IPv6 Tunnel": "Túnel IPv6", "IGMP": "IGMP", "Wireless Settings": "Configuración inalámbrica", "WPS": "WPS",
    "Wireless Schedule": "Horario del Wi-Fi", "Statistics": "Estadísticas", "Advanced Settings": "Configuración avanzada",
    "NAT Forwarding": "Reenvío NAT", "Bandwidth Control": "Control de ancho de banda", "Security": "Seguridad",
    "Firewall & DoS Protection": "Firewall y protección DoS", "Service Filtering": "Filtrado de servicios",
    "Access Control": "Control de acceso", "IP & MAC Binding": "Vínculo de IP y MAC", "System Tools": "Herramientas del sistema",
    "Time Settings": "Fecha y hora", "Diagnostics": "Diagnóstico", "Firmware Upgrade": "Actualización de firmware",
    "Backup & Restore": "Copia de seguridad y restauración", "Administration": "Administración", "System Log": "Registro del sistema",
    "CWMP Settings": "Configuración CWMP", "SNMP Settings": "Configuración SNMP",
    "Network Name (SSID):": "Nombre de la red", "Password:": "Clave", "Security:": "Seguridad", "Hide SSID": "Ocultar el SSID",
    "IP Address Pool:": "Rango de direcciones (rango DHCP)", "Address Lease Time:": "Tiempo de concesión",
    "Client List": "Lista de clientes", "Address Reservation": "Reserva de direcciones", "MAC Address": "Dirección MAC",
    "Reserved IP Address": "IP reservada", "DHCP Server": "Servidor DHCP", "Wireless Clients": "Clientes Wi-Fi",
    "Wired Clients": "Clientes con cable", "Access Mode:": "Modo de acceso", "Blacklist": "Lista negra", "Whitelist": "Lista blanca",
    "Devices in Blacklist": "Equipos en la lista negra", "Devices in Whitelist": "Equipos en la lista blanca", "Online Devices": "Equipos conectados",
    "Manual Reboot": "Reinicio manual", "Auto Reboot": "Reinicio automático", "Backup": "Copia de seguridad", "Restore": "Restaurar",
    "Factory Default Restore": "Volver a la configuración de fábrica", "Account Management": "Cuenta de administrador",
    "New Password": "Contraseña nueva", "Confirm Password": "Repetir la contraseña", "Let's Get Started": "Empezar"
  };
  function tr(texto) { return S.estado.traduccion && TRAD[texto] ? '<span class="trad">' + TRAD[texto] + "</span>" : ""; }
  function esc(t) {
    return String(t === undefined || t === null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  S.esc = esc;

  /* Íconos de los menús (dibujos propios) */
  var ICO = {
    networkmap: '<path d="M10 3v5M4 13V9h12v4"/><rect x="7.5" y="1" width="5" height="4" rx="1"/><rect x="1.5" y="13" width="5" height="4" rx="1"/><rect x="13.5" y="13" width="5" height="4" rx="1"/>',
    globo: '<circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2c2.5 2.5 2.5 13.5 0 16M10 2c-2.5 2.5-2.5 13.5 0 16"/>',
    wifi: '<path d="M3 8a10 10 0 0 1 14 0M5.5 11a6.5 6.5 0 0 1 9 0M8 14a3 3 0 0 1 4 0"/><circle cx="10" cy="16.5" r=".8"/>',
    corazon: '<path d="M10 17s-7-4.3-7-9a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2c0 4.7-7 9-7 9z"/>',
    pulso: '<path d="M1 10h4l2-5 3 10 2-5h7"/>',
    modo: '<path d="M3 7h12l-3-3M17 13H5l3 3"/>',
    nat: '<path d="M16 7a6.5 6.5 0 0 0-11.5-1M4 13a6.5 6.5 0 0 0 11.5 1M4.5 2v4h4M15.5 18v-4h-4"/>',
    banda: '<path d="M6 17V3M3 6l3-3 3 3M14 3v14M11 14l3 3 3-3"/>',
    escudo: '<path d="M10 2 3 5v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V5z"/>',
    engranaje: '<circle cx="10" cy="10" r="3"/><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3M4 4l2.1 2.1M13.9 13.9 16 16M4 16l2.1-2.1M13.9 6.1 16 4"/>'
  };
  function ico(nombre) { return '<svg class="pn-ico" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' + ICO[nombre] + "</svg>"; }

  var MENUS = {
    basic: [
      { id: "networkmap", txt: "Network Map", ico: "networkmap" },
      { id: "b-internet", txt: "Internet", ico: "globo" },
      { id: "b-wireless", txt: "Wireless", ico: "wifi" },
      { id: "b-parental", txt: "Parental Controls", ico: "corazon" }
    ],
    advanced: [
      { id: "status", txt: "Status", ico: "pulso" },
      { id: "opmode", txt: "Operation Mode", ico: "modo" },
      { id: "network", txt: "Network", ico: "globo", sub: ["Internet", "LAN Settings", "Interface Grouping", "Dynamic DNS", "Static Routing", "IPv6 Tunnel", "IGMP"] },
      { id: "wireless", txt: "Wireless", ico: "wifi", sub: ["Wireless Settings", "WPS", "Wireless Schedule", "Statistics", "Advanced Settings"] },
      { id: "nat", txt: "NAT Forwarding", ico: "nat" },
      { id: "parental", txt: "Parental Controls", ico: "corazon" },
      { id: "bandwidth", txt: "Bandwidth Control", ico: "banda" },
      { id: "security", txt: "Security", ico: "escudo", sub: ["Firewall & DoS Protection", "Service Filtering", "Access Control", "IP & MAC Binding"] },
      { id: "systools", txt: "System Tools", ico: "engranaje", sub: ["Time Settings", "Diagnostics", "Firmware Upgrade", "Backup & Restore", "Reboot", "Administration", "System Log", "CWMP Settings", "SNMP Settings", "Statistics"] }
    ]
  };

  /* ---- Piezas de formulario ---- */
  function fila(rotulo, control, extra) {
    return '<div class="pn-fila"><div class="pn-rot">' + esc(rotulo) + tr(rotulo) + '</div><div class="pn-ctl">' + control + (extra || "") + "</div></div>";
  }
  function campoIp(nombre, valor, desactivado) {
    var p = String(valor || "").split(".");
    var html = '<span class="pn-ip" role="group" aria-label="' + esc(nombre) + '">';
    for (var i = 0; i < 4; i++) {
      html += '<input class="pn-ip__n" name="' + nombre + i + '" value="' + esc(p[i] || "") + '" inputmode="numeric" maxlength="3" aria-label="' + esc(nombre) + ", número " + (i + 1) + '"' + (desactivado ? " disabled" : "") + ">";
      if (i < 3) { html += '<span aria-hidden="true">.</span>'; }
    }
    return html + "</span>";
  }
  function leerIp(form, nombre) {
    var p = [];
    for (var i = 0; i < 4; i++) { p.push(String(form.elements[nombre + i].value).trim()); }
    return p.join(".");
  }
  function boton(texto, accion, extra) {
    return '<button class="pn-boton" type="' + (accion === "submit" ? "submit" : "button") + '"' + (accion && accion !== "submit" ? ' data-accion="' + accion + '"' : "") + (extra || "") + ">" + esc(texto) + "</button>";
  }
  function interruptor(nombre, activo, rotulo) {
    return '<label class="pn-switch"><input type="checkbox" name="' + nombre + '"' + (activo ? " checked" : "") + '><span class="pn-switch__riel" aria-hidden="true"></span><span class="sr-only">' + esc(rotulo) + "</span></label>";
  }
  function seccion(titulo, cuerpo, provisoria) {
    return '<section class="pn-sec"><h2 class="pn-sec__tit">' + esc(titulo) + tr(titulo) +
      (provisoria ? ' <span class="pn-provisoria" title="Falta confirmar esta pantalla con el router real">pantalla provisoria</span>' : "") +
      "</h2>" + cuerpo + "</section>";
  }
  function aviso() {
    if (!nav.aviso) { return ""; }
    return '<p class="pn-aviso pn-aviso--' + nav.aviso.tipo + '" role="status"><b>Simulador:</b> ' + esc(nav.aviso.texto) + "</p>";
  }
  function noSeUsa(titulo) {
    return seccion(titulo, '<p class="pn-nota">Esta opción no se usa en la práctica. En el router real, acá hay más configuraciones.</p>');
  }
  function tabla(columnas, filas, vacia) {
    var h = '<table class="pn-tabla"><thead><tr>' + columnas.map(function (c) { return '<th scope="col">' + c + "</th>"; }).join("") + "</tr></thead><tbody>";
    if (!filas.length) {
      h += "<tr>" + columnas.map(function () { return "<td>--</td>"; }).join("") + "</tr>";
    } else {
      h += filas.map(function (f) { return "<tr>" + f.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("");
    }
    return h + "</tbody></table>" + (vacia && !filas.length ? "" : "");
  }
  function duracion(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    return h + ":" + String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }

  /* ==========================================================
     Pantallas antes de entrar
     ========================================================== */
  function fuerza(clave) {
    var clases = 0;
    if (/[a-z]/.test(clave)) { clases++; }
    if (/[A-Z]/.test(clave)) { clases++; }
    if (/\d/.test(clave)) { clases++; }
    if (/[^a-zA-Z0-9]/.test(clave)) { clases++; }
    if (!clave) { return 0; }
    if (clave.length >= 10 && clases >= 3) { return 3; }
    if (clave.length >= 8 && clases >= 2) { return 2; }
    return 1;
  }
  function pCrear() {
    return '<div class="pn-ingreso"><form class="pn-ingreso__caja" data-form="crear" novalidate>' +
      '<h1 class="sr-only">Crear la contraseña de administrador</h1>' +
      '<p class="pn-ingreso__ayuda">Primer ingreso: creá la contraseña de administrador del router.</p>' +
      '<label class="pn-clave"><span class="sr-only">New Password</span><input type="password" name="nueva" placeholder="New Password" autocomplete="new-password"><button type="button" class="pn-ojo" data-accion="ver-clave" aria-label="Mostrar la contraseña">' + ojo() + "</button></label>" +
      '<div class="pn-fuerza" data-fuerza="0" aria-hidden="true"><span>Low</span><span>Middle</span><span>High</span></div>' +
      '<label class="pn-clave"><span class="sr-only">Confirm Password</span><input type="password" name="repetir" placeholder="Confirm Password" autocomplete="new-password"><button type="button" class="pn-ojo" data-accion="ver-clave" aria-label="Mostrar la contraseña">' + ojo() + "</button></label>" +
      '<button class="pn-boton pn-boton--ancho" type="submit">Let\'s Get Started</button>' +
      (S.estado.traduccion ? '<p class="trad trad--centro">New Password: contraseña nueva · Confirm Password: repetirla · Let\'s Get Started: empezar</p>' : "") +
      aviso() + "</form></div>";
  }
  function pIngreso() {
    return '<div class="pn-ingreso"><form class="pn-ingreso__caja" data-form="ingreso" novalidate>' +
      '<h1 class="sr-only">Ingresar al router</h1>' +
      '<div class="pn-ingreso__fila"><label class="pn-clave"><span class="sr-only">Contraseña de administrador</span><input type="password" name="clave" autocomplete="current-password"><button type="button" class="pn-ojo" data-accion="ver-clave" aria-label="Mostrar la contraseña">' + ojo() + "</button></label>" +
      '<button type="button" class="pn-link" data-accion="olvide">Forgot password?</button></div>' +
      '<button class="pn-boton pn-boton--ancho" type="submit">Log in</button>' +
      (S.estado.traduccion ? '<p class="trad trad--centro">Log in: ingresar · Forgot password?: ¿olvidaste la contraseña?</p>' : "") +
      aviso() + "</form></div>";
  }
  function ojo() { return '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M1.5 10S5 4 10 4s8.5 6 8.5 6-3.5 6-8.5 6-8.5-6-8.5-6z"/><circle cx="10" cy="10" r="2.6"/></svg>'; }

  /* ==========================================================
     Pantallas del panel
     ========================================================== */
  function pNetworkMap() {
    var cl = S.clientes();
    var wifi = cl.filter(function (c) { return c.eq.tipo === "wifi"; }), cable = cl.filter(function (c) { return c.eq.tipo === "cable"; });
    S.marcar("vioDispositivos");
    var lista = "";
    if (nav.ver === "wifi" || nav.ver === "cable") {
      var cuales = nav.ver === "wifi" ? wifi : cable;
      lista = seccion(nav.ver === "wifi" ? "Wireless Clients" : "Wired Clients",
        tabla(["Name", "IP Address", "MAC Address"], cuales.map(function (c) { return [esc(c.eq.nombre), esc(c.ip), esc(c.eq.mac)]; })));
    }
    var w = S.ROUTER.wan;
    return '<div class="pn-mapa" aria-label="Mapa de red">' +
      '<div class="pn-mapa__fila"><div class="pn-mapa__nodo">' + ico("globo") + '<span>Internet</span></div><span class="pn-mapa__linea" aria-hidden="true"></span>' +
      '<div class="pn-mapa__nodo">' + ico("networkmap") + "<span>" + S.ROUTER.modelo + "</span></div></div>" +
      '<div class="pn-mapa__clientes">' +
      '<button type="button" class="pn-mapa__cli' + (nav.ver === "wifi" ? " es-activo" : "") + '" data-accion="ver" data-ver="wifi">' + ico("wifi") + '<b class="pn-globo">' + wifi.length + "</b><span>Wireless Clients" + tr("Wireless Clients") + "</span></button>" +
      '<button type="button" class="pn-mapa__cli' + (nav.ver === "cable" ? " es-activo" : "") + '" data-accion="ver" data-ver="cable">' + ico("networkmap") + '<b class="pn-globo">' + cable.length + "</b><span>Wired Clients" + tr("Wired Clients") + "</span></button>" +
      "</div></div>" + lista +
      seccion("Internet", fila("Internet Status:", '<span class="pn-valor">Connected</span>') + fila("Connection Type:", '<span class="pn-valor">' + w.tipo + "</span>") +
        fila("IP Address:", '<span class="pn-valor">' + w.ip + "</span>") + fila("DNS Server:", '<span class="pn-valor">' + w.dns1 + " " + w.dns2 + "</span>") +
        fila("Gateway:", '<span class="pn-valor">' + w.puerta + "</span>"));
  }

  function pWirelessBasico() {
    var wf = S.estado.router.wifi;
    return '<form data-form="wifi-basico" novalidate>' + seccion("Wireless Settings",
      fila("2.4GHz Wireless Network:", '<label class="pn-check"><input type="checkbox" name="radio"' + (wf.radio ? " checked" : "") + "> Enable</label>") +
      fila("Network Name (SSID):", '<input class="pn-campo" name="ssid" value="' + esc(wf.ssid) + '" autocomplete="off" spellcheck="false">',
        ' <label class="pn-check"><input type="checkbox" name="oculta"' + (wf.oculta ? " checked" : "") + "> Hide SSID</label>") +
      fila("Password:", '<input class="pn-campo" name="clave" value="' + esc(wf.clave) + '" autocomplete="off" spellcheck="false">') +
      '<div class="pn-acciones">' + boton("Save", "submit") + "</div>") + "</form>";
  }

  function pStatus() {
    var r = S.estado.router, w = S.ROUTER.wan, wf = r.wifi;
    function caja(titulo, filas) {
      return '<section class="pn-caja"><h2 class="pn-caja__tit">' + esc(titulo) + tr(titulo) + "</h2>" + filas.map(function (f) { return fila(f[0], '<span class="pn-valor">' + esc(f[1]) + "</span>"); }).join("") + "</section>";
    }
    var arriba = Math.floor((Date.now() - S.estado.arranque) / 1000);
    return '<div class="pn-cajas">' +
      caja("Internet", [["MAC Address:", S.ROUTER.macWan], ["IP Address:", w.ip], ["Subnet Mask:", w.mascara], ["Default Gateway:", w.puerta], ["Primary DNS:", w.dns1], ["Secondary DNS:", w.dns2], ["Connection Type:", w.tipo], ["Connection Speed:", "100Mbps"]]) +
      caja("Wireless", [["Network Name (SSID):", wf.ssid], ["Wireless Radio:", wf.radio ? "On" : "Off"], ["Mode:", "802.11bgn mixed"], ["Channel Width:", wf.ancho], ["Channel:", wf.canal === "Auto" ? "Auto(6)" : wf.canal], ["MAC Address:", S.ROUTER.mac]]) +
      caja("LAN", [["MAC Address:", S.ROUTER.mac], ["IP Address:", S.ROUTER.lanIp], ["Subnet Mask:", S.ROUTER.mascara], ["DHCP:", r.dhcp.activo ? "On" : "Off"]]) +
      caja("Performance", [["System Up Time:", Math.floor(arriba / 86400) + " days " + duracion((arriba % 86400) * 1000).padStart(8, "0")], ["CPU Load:", "3%"], ["Memory Used:", "44%"]]) +
      "</div>";
  }

  function pOperationMode() {
    var modos = [
      ["Router(Current mode)", "In this mode, your router connects to the Internet directly via Dynamic IP, Static IP, PPPoE, L2TP or PPTP and shares the Internet access to multiple wired or wireless devices. NAT, firewall and DHCP server are enabled by default."],
      ["Access Point", "In this mode, your router connects to a wired or wireless router via an Ethernet cable and extends the wireless coverage of your existing network. Functions like NAT, Parental Controls and QoS are not supported in this mode."],
      ["Range Extender", "In this mode, your router connects to a wireless router and extends the wireless coverage of your existing network. Functions like NAT, Parental Controls and QoS are not supported in this mode."]
    ];
    return '<form data-form="opmode" novalidate>' + seccion("Operation Mode", modos.map(function (m, i) {
      return '<div class="pn-modo"><label class="pn-radio"><input type="radio" name="modo" value="' + i + '"' + (i === 0 ? " checked" : "") + "> " + m[0] + '</label><p class="pn-modo__txt">' + m[1] + "</p></div>";
    }).join("") + '<div class="pn-acciones">' + boton("Save", "submit") + "</div>") + "</form>";
  }

  function pLan() {
    var r = S.estado.router, d = r.dhcp;
    S.marcar("vioRango");
    S.marcar("vioDispositivos");
    var cl = S.clientes();
    var filasCli = cl.map(function (c, i) {
      var resta = d.lease * 60000 - (Date.now() - (c.obtenida || Date.now()));
      return [String(i + 1), esc(c.eq.nombre), esc(c.eq.mac), esc(c.ip), duracion(resta)];
    });
    var filasRes = r.reservas.map(function (x, i) {
      return ['<input type="checkbox" name="sel-res" value="' + i + '" aria-label="Elegir la reserva de ' + esc(x.mac) + '">', esc(x.mac), S.RED + x.ip, "--",
        '<span class="pn-estado pn-estado--' + (x.activa ? "si" : "no") + '">' + (x.activa ? "Enabled" : "Disabled") + "</span>",
        '<button type="button" class="pn-mini" data-accion="borrar-res" data-i="' + i + '" aria-label="Borrar la reserva de ' + esc(x.mac) + '">Delete</button>'];
    });
    var formRes = "";
    if (nav.form === "reserva") {
      formRes = '<form class="pn-sub" data-form="reserva" novalidate><p class="pn-provisoria-txt">Formulario provisorio: falta confirmar sus campos con el router real.</p>' +
        fila("MAC Address:", '<input class="pn-campo" name="mac" placeholder="XX-XX-XX-XX-XX-XX" autocomplete="off" spellcheck="false">') +
        fila("Reserved IP Address:", '<input class="pn-campo" name="ip" placeholder="192.168.0.X" inputmode="decimal" autocomplete="off">') +
        fila("", '<label class="pn-check"><input type="checkbox" name="activa" checked> Enable This Entry</label>') +
        '<div class="pn-acciones">' + boton("Cancel", "cancelar-form", ' data-clase="claro"') + boton("OK", "submit") + "</div></form>";
    }
    return '<form data-form="dhcp" novalidate>' + seccion("DHCP Server",
      fila("IP Version:", '<label class="pn-radio"><input type="radio" checked disabled> IPv4</label> <label class="pn-radio"><input type="radio" disabled> IPv6</label>') +
      fila("MAC Address:", '<span class="pn-valor">' + S.ROUTER.mac + "</span>") +
      fila("IP Address:", campoIp("lan", S.ROUTER.lanIp, true), ' <span class="pn-nota-campo">(fija en el simulador)</span>') +
      fila("Subnet Mask:", '<select class="pn-campo" disabled><option>255.255.255.0</option></select>') +
      fila("IGMP Snooping:", '<label class="pn-check"><input type="checkbox" checked disabled> Enable</label>') +
      fila("Second IP:", '<label class="pn-check"><input type="checkbox" disabled> Enable</label>') +
      fila("DHCP:", '<label class="pn-check"><input type="checkbox" name="activo"' + (d.activo ? " checked" : "") + "> Enable</label>") +
      fila("", '<label class="pn-radio"><input type="radio" checked disabled> DHCP Server</label> <label class="pn-radio"><input type="radio" disabled> DHCP Relay</label>') +
      fila("IP Address Pool:", campoIp("desde", S.RED + d.desde) + ' <span aria-hidden="true">-</span> ' + campoIp("hasta", S.RED + d.hasta)) +
      fila("Address Lease Time:", '<input class="pn-campo pn-campo--corto" name="lease" value="' + d.lease + '" inputmode="numeric">', ' <span class="pn-nota-campo">minutes. (1-2880. The default value is 1440.)</span>') +
      fila("Default Gateway:", campoIp("puerta", d.puerta), ' <span class="pn-nota-campo">(Optional)</span>') +
      fila("Default Domain:", '<input class="pn-campo" name="dominio" value="' + esc(d.dominio) + '">', ' <span class="pn-nota-campo">(Optional)</span>') +
      fila("Primary DNS:", campoIp("dns1", d.dns1), ' <span class="pn-nota-campo">(Optional)</span>') +
      fila("Secondary DNS:", campoIp("dns2", d.dns2), ' <span class="pn-nota-campo">(Optional)</span>') +
      '<div class="pn-acciones">' + boton("Save", "submit") + "</div>") + "</form>" +
      seccion("Client List", '<div class="pn-barra-tabla"><span>Total Clients: ' + cl.length + "</span>" + boton("Refresh", "refrescar", ' data-clase="link"') + "</div>" +
        tabla(["ID", "Client Name", "MAC Address", "Assigned IP", "Leased Time"], filasCli)) +
      seccion("Address Reservation", '<div class="pn-barra-tabla"><span></span>' + boton("Add", "agregar-res", ' data-clase="link"') + boton("Delete", "borrar-sel", ' data-clase="link"') + "</div>" + formRes +
        tabla(['<span class="sr-only">Elegir</span>', "MAC Address", "Reserved IP Address", "Group", "Status", "Modify"], filasRes));
  }

  function pWirelessAvanzado() {
    var wf = S.estado.router.wifi;
    function radios(nombre, opciones, actual) {
      return opciones.map(function (o) { return '<label class="pn-radio"><input type="radio" name="' + nombre + '" value="' + o + '"' + (o === actual ? " checked" : "") + "> " + o + "</label>"; }).join(" ");
    }
    function lista(nombre, opciones, actual) {
      return '<select class="pn-campo" name="' + nombre + '">' + opciones.map(function (o) { return "<option" + (o === actual ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select>";
    }
    var conClave = wf.seguridad !== "No Security";
    return '<form data-form="wifi" novalidate>' + seccion("Wireless Settings",
      fila("", '<label class="pn-check"><input type="checkbox" name="radio"' + (wf.radio ? " checked" : "") + "> Enable Wireless Radio</label>") +
      fila("Network Name (SSID):", '<input class="pn-campo" name="ssid" value="' + esc(wf.ssid) + '" autocomplete="off" spellcheck="false">',
        ' <label class="pn-check"><input type="checkbox" name="oculta"' + (wf.oculta ? " checked" : "") + "> Hide SSID</label>") +
      fila("Security:", lista("seguridad", ["No Security", "WPA/WPA2 Personal (Recommended)"], wf.seguridad)) +
      (conClave ? fila("Version:", radios("version", ["Auto", "WPA2-PSK"], wf.version)) +
        fila("Encryption:", radios("cifrado", ["Auto", "TKIP", "AES"], wf.cifrado)) +
        fila("Password:", '<input class="pn-campo" name="clave" value="' + esc(wf.clave) + '" autocomplete="off" spellcheck="false">') : "") +
      fila("Mode:", lista("modo", ["802.11b/g/n mixed", "802.11b/g mixed", "802.11n only"], wf.modo)) +
      fila("Channel:", lista("canal", ["Auto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"], wf.canal)) +
      fila("Channel Width:", lista("ancho", ["Auto", "20MHz", "40MHz"], wf.ancho)) +
      fila("Transmit Power:", radios("potencia", ["Low", "Middle", "High"], wf.potencia)) +
      '<div class="pn-acciones">' + boton("Save", "submit") + "</div>") + "</form>";
  }

  function pAccessControl() {
    var a = S.estado.router.acceso;
    var lista = a.lista.map(function (d, i) {
      return ['<input type="checkbox" name="sel-acc" value="' + i + '" aria-label="Elegir ' + esc(d.nombre) + '">', String(i + 1), esc(d.nombre), esc(d.mac),
        '<button type="button" class="pn-mini" data-accion="borrar-acc" data-i="' + i + '" aria-label="Sacar de la lista a ' + esc(d.nombre) + '">Delete</button>'];
    });
    var enLinea = S.enLinea().map(function (x, i) {
      return ['<input type="checkbox" name="sel-online" value="' + esc(x.eq.mac) + '" aria-label="Elegir ' + esc(x.eq.nombre) + '">', String(i + 1), esc(x.eq.nombre), esc(x.ip), esc(x.eq.mac), x.eq.tipo === "wifi" ? "Wireless" : "Wired"];
    });
    var titLista = a.modo === "Blacklist" ? "Devices in Blacklist" : "Devices in Whitelist";
    var formAcc = nav.form === "acceso" ? '<form class="pn-sub" data-form="acceso-add" novalidate><p class="pn-provisoria-txt">Formulario provisorio: falta confirmar sus campos con el router real.</p>' +
      fila("Device Name:", '<input class="pn-campo" name="nombre" autocomplete="off">') + fila("MAC Address:", '<input class="pn-campo" name="mac" placeholder="XX-XX-XX-XX-XX-XX" autocomplete="off" spellcheck="false">') +
      '<div class="pn-acciones">' + boton("Cancel", "cancelar-form", ' data-clase="claro"') + boton("OK", "submit") + "</div></form>" : "";
    return '<form data-form="acceso" novalidate>' + seccion("Access Control", fila("Access Control:", interruptor("activo", a.activo, "Access Control"))) +
      seccion("Access Mode", fila("Access Mode:", '<label class="pn-radio"><input type="radio" name="modo" value="Blacklist"' + (a.modo === "Blacklist" ? " checked" : "") + "> Blacklist" + tr("Blacklist") + '</label><br><label class="pn-radio"><input type="radio" name="modo" value="Whitelist"' + (a.modo === "Whitelist" ? " checked" : "") + "> Whitelist" + tr("Whitelist") + "</label>") +
        '<div class="pn-acciones">' + boton("Save", "submit") + "</div>") + "</form>" +
      seccion(titLista, '<div class="pn-barra-tabla"><span></span>' + boton("Add", "agregar-acc", ' data-clase="link"') + boton("Delete", "borrar-acc-sel", ' data-clase="link"') + "</div>" + formAcc +
        tabla(['<span class="sr-only">Elegir</span>', "ID", "Device Name", "MAC Address", "Modify"], lista)) +
      seccion("Online Devices", '<div class="pn-barra-tabla"><span></span>' + boton("Refresh", "refrescar", ' data-clase="link"') + boton("Block", "bloquear", ' data-clase="link"') + "</div>" +
        tabla(['<span class="sr-only">Elegir</span>', "ID", "Device Name", "IP Address", "MAC Address", "Connection Type"], enLinea));
  }

  function pReboot() {
    return '<form data-form="autoreboot" novalidate>' + seccion("Manual Reboot", '<div class="pn-acciones">' + boton("Reboot", "reiniciar") + "</div>") +
      seccion("Auto Reboot", fila("Auto Reboot:", interruptor("auto", S.estado.router.autoReboot, "Auto Reboot")) +
        '<p class="pn-nota">Note: The Auto Reboot feature takes effect based on the router\'s system time. Please make sure you have already set up the time of the router.</p>' +
        '<div class="pn-acciones">' + boton("Save", "submit") + "</div>") + "</form>";
  }

  function pBackup() {
    return seccion("Backup", '<p class="pn-nota">Save a copy of the current settings to your computer.</p><div class="pn-acciones pn-acciones--izq">' + boton("Backup", "backup") + "</div>", true) +
      '<form data-form="restore" novalidate>' + seccion("Restore", '<p class="pn-nota">Restore saved settings from a file.</p>' +
        fila("File:", '<input class="pn-campo" type="file" name="archivo" accept=".bin">') + '<div class="pn-acciones pn-acciones--izq">' + boton("Restore", "submit") + "</div>", true) + "</form>" +
      seccion("Factory Default Restore", '<p class="pn-nota">Restore all settings to the default values.</p><div class="pn-acciones pn-acciones--izq">' + boton("Factory Restore", "fabrica") + "</div>", true);
  }

  function pAdministration() {
    return '<form data-form="admin" novalidate>' + seccion("Account Management",
      fila("Old Password:", '<input class="pn-campo" type="password" name="vieja" autocomplete="current-password">') +
      fila("New Password:", '<input class="pn-campo" type="password" name="nueva" autocomplete="new-password">') +
      fila("Confirm New Password:", '<input class="pn-campo" type="password" name="repetir" autocomplete="new-password">') +
      '<div class="pn-acciones">' + boton("Save", "submit") + "</div>", true) + "</form>";
  }

  function pFirmware() {
    return seccion("Firmware Upgrade", fila("Firmware Version:", '<span class="pn-valor">(simulado)</span>') + fila("Hardware Version:", '<span class="pn-valor">' + S.ROUTER.modelo + " v3</span>") +
      '<p class="pn-nota">En el simulador no se actualiza el firmware. En el router real, el archivo se baja de la página del fabricante, para el mismo modelo y la misma versión, y no hay que apagar el router mientras se actualiza.</p>');
  }

  function pQuickSetup() {
    var pasos = ["Connection Type", "Internet Setup", "Wireless Settings", "Summary", "Connection Test"];
    return '<div class="pn-pasos" aria-label="Pasos de Quick Setup">' + pasos.map(function (p, i) { return '<span class="pn-pasos__p' + (i === 0 ? " es-activo" : "") + '">' + p + "</span>"; }).join("") + "</div>" +
      seccion("Connection Type", ["Dynamic IP", "Static IP", "PPPoE", "L2TP", "PPTP"].map(function (t, i) {
        return '<label class="pn-radio pn-radio--bloque"><input type="radio" name="tipo"' + (i === 0 ? " checked" : "") + "> " + t + "</label>";
      }).join("") + '<p class="pn-nota">En la práctica no se usa Quick Setup: configurá todo desde Basic o Advanced.</p>' +
        '<div class="pn-acciones">' + boton("Back", "", " disabled") + boton("Next", "", " disabled") + "</div>");
  }

  function contenido() {
    if (nav.tab === "quick") { return pQuickSetup(); }
    var m = nav.menu, s = nav.sub;
    if (nav.tab === "basic") {
      if (m === "networkmap") { return pNetworkMap(); }
      if (m === "b-wireless") { return pWirelessBasico(); }
      return noSeUsa(m === "b-internet" ? "Internet" : "Parental Controls");
    }
    if (m === "status") { return pStatus(); }
    if (m === "opmode") { return pOperationMode(); }
    if (m === "network" && s === "LAN Settings") { return pLan(); }
    if (m === "wireless" && s === "Wireless Settings") { return pWirelessAvanzado(); }
    if (m === "security" && s === "Access Control") { return pAccessControl(); }
    if (m === "systools" && s === "Reboot") { return pReboot(); }
    if (m === "systools" && s === "Backup & Restore") { return pBackup(); }
    if (m === "systools" && s === "Administration") { return pAdministration(); }
    if (m === "systools" && s === "Firmware Upgrade") { return pFirmware(); }
    var menu = MENUS.advanced.filter(function (x) { return x.id === m; })[0];
    return noSeUsa(s || (menu ? menu.txt : ""));
  }

  function menuLateral() {
    return '<nav class="pn-menu" aria-label="Menú del panel"><ul>' + MENUS[nav.tab].map(function (it) {
      var activo = nav.menu === it.id;
      var h = '<li><button type="button" class="pn-menu__it' + (activo ? " es-activo" : "") + '" data-accion="menu" data-menu="' + it.id + '"' + (activo ? ' aria-current="page"' : "") + ">" + ico(it.ico) + "<span>" + it.txt + tr(it.txt) + "</span></button>";
      if (activo && it.sub) {
        h += '<ul class="pn-menu__sub">' + it.sub.map(function (s) {
          var sa = nav.sub === s;
          return '<li><button type="button" class="pn-menu__sub-it' + (sa ? " es-activo" : "") + '" data-accion="sub" data-sub="' + esc(s) + '"' + (sa ? ' aria-current="page"' : "") + ">- " + esc(s) + tr(s) + "</button></li>";
        }).join("") + "</ul>";
      }
      return h + "</li>";
    }).join("") + "</ul></nav>";
  }

  function cabecera() {
    var tabs = [["quick", "Quick Setup"], ["basic", "Basic"], ["advanced", "Advanced"]];
    return '<header class="pn-cab"><div class="pn-marca">' + ico("networkmap") + '<span>Panel del router<small>Simulador · ' + S.ROUTER.modelo + "</small></span></div>" +
      '<div class="pn-tabs" role="tablist">' + tabs.map(function (t) {
        return '<button type="button" role="tab" class="pn-tab' + (nav.tab === t[0] ? " es-activo" : "") + '" aria-selected="' + (nav.tab === t[0]) + '" data-accion="tab" data-tab="' + t[0] + '">' + t[1] + tr(t[1]) + "</button>";
      }).join("") + "</div>" +
      '<div class="pn-cab__der"><button type="button" class="pn-cab__bt" data-accion="salir">' + '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="3" y="3" width="11" height="14" rx="2"/><path d="M17 10H8M11 7l-3 3 3 3"/></svg>' + "Log out" + tr("Log out") + "</button>" +
      '<button type="button" class="pn-cab__bt" data-accion="reiniciar">' + '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.3 4.3l2.1 2.1M13.6 13.6l2.1 2.1M4.3 15.7l2.1-2.1M13.6 6.4l2.1-2.1"/></svg>' + "Reboot" + tr("Reboot") + "</button></div></header>";
  }

  /* ---- Dibujo ---- */
  S.Panel = {
    dibujar: function (cont) {
      var r = S.estado.router;
      var html;
      if (!r.adminPass) { nav.sesion = false; html = pCrear(); }
      else if (!nav.sesion) { html = pIngreso(); }
      else {
        html = '<div class="pn">' + cabecera() + '<div class="pn-cuerpo">' + (nav.tab === "quick" ? "" : menuLateral()) +
          '<main class="pn-contenido' + (nav.tab === "quick" ? " pn-contenido--ancho" : "") + '">' + aviso() + contenido() + "</main></div></div>";
      }
      cont.innerHTML = html;
      nav.aviso = null;
    },
    salir: function () { nav.sesion = false; nav.tab = "basic"; nav.menu = "networkmap"; nav.sub = null; nav.form = null; nav.ver = null; }
  };

  /* ==========================================================
     Acciones
     ========================================================== */
  function avisar(texto, tipo) { nav.aviso = { texto: texto, tipo: tipo || "ok" }; }
  function redibujar() { if (S.alCambiar) { S.alCambiar(); } }
  function guardando(form, fn) {
    var bt = form.querySelector("button[type=submit]");
    if (bt) { bt.disabled = true; bt.classList.add("es-guardando"); }
    setTimeout(function () { fn(); S.guardar(); redibujar(); }, 700);
  }

  var formularios = {
    crear: function (f) {
      var n = f.elements.nueva.value, rep = f.elements.repetir.value;
      if (n.length < 8) { avisar("para la práctica, la contraseña de administrador tiene que tener al menos 8 caracteres.", "error"); return redibujar(); }
      if (/^admin$/i.test(n)) { avisar("«admin» es una contraseña de fábrica: elegí otra.", "error"); return redibujar(); }
      if (n !== rep) { avisar("las dos contraseñas no coinciden.", "error"); return redibujar(); }
      S.estado.router.adminPass = n;
      nav.sesion = true;
      S.marcar("admin");
      avisar("contraseña de administrador creada. Ya estás dentro del panel.");
      S.guardar();
      redibujar();
    },
    ingreso: function (f) {
      if (f.elements.clave.value !== S.estado.router.adminPass) {
        avisar("la contraseña no es correcta. Si nadie la recuerda, hay que hacer un reset de fábrica en el router.", "error");
        return redibujar();
      }
      nav.sesion = true;
      redibujar();
    },
    "wifi-basico": function (f) { guardarWifi(f, true); },
    wifi: function (f) { guardarWifi(f, false); },
    opmode: function (f) {
      guardando(f, function () {
        if (f.elements.modo.value !== "0") { avisar("en el simulador el router queda en modo Router.", "error"); }
      });
    },
    dhcp: function (f) {
      var desde = S.ultimo(leerIp(f, "desde")), hasta = S.ultimo(leerIp(f, "hasta"));
      var lease = Number(f.elements.lease.value);
      var puerta = leerIp(f, "puerta"), dns1 = leerIp(f, "dns1"), dns2 = leerIp(f, "dns2");
      if (desde === null || hasta === null) { avisar("el rango DHCP tiene que estar en la red del router (192.168.0.…).", "error"); return redibujar(); }
      if (desde > hasta) { avisar("la primera IP del rango tiene que ser menor que la última.", "error"); return redibujar(); }
      if (desde <= 1 || hasta >= 255) { avisar("el rango no puede incluir la IP del router (.1) ni las terminadas en 0 o en 255.", "error"); return redibujar(); }
      if (!(lease >= 1 && lease <= 2880) || Math.floor(lease) !== lease) { avisar("el tiempo de concesión va de 1 a 2880 minutos.", "error"); return redibujar(); }
      if (!S.partes(puerta) || !S.partes(dns1) || !S.partes(dns2)) { avisar("revisá la puerta de enlace y los DNS: cada número va de 0 a 255.", "error"); return redibujar(); }
      guardando(f, function () {
        var d = S.estado.router.dhcp;
        d.activo = f.elements.activo.checked;
        d.desde = desde; d.hasta = hasta; d.lease = lease; d.puerta = puerta; d.dominio = f.elements.dominio.value.trim(); d.dns1 = dns1; d.dns2 = dns2;
        avisar("guardado. Los equipos que ya tienen IP la conservan hasta que la renuevan (ipconfig /renew).");
      });
    },
    reserva: function (f) {
      var mac = S.normalizarMac(f.elements.mac.value), n = S.ultimo(f.elements.ip.value);
      var r = S.estado.router;
      if (!mac) { avisar("la MAC tiene 6 pares de números y letras de la A a la F, separados por guiones: XX-XX-XX-XX-XX-XX.", "error"); return redibujar(); }
      if (n === null || n === 0 || n === 255) { avisar("la IP reservada tiene que ser de la red del router: de 192.168.0.2 a 192.168.0.254.", "error"); return redibujar(); }
      if (n === 1) { avisar("esa es la IP del router: elegí otra.", "error"); return redibujar(); }
      if (r.reservas.some(function (x) { return x.mac === mac; })) { avisar("esa MAC ya tiene una reserva.", "error"); return redibujar(); }
      if (r.reservas.some(function (x) { return x.ip === n; })) { avisar("esa IP ya está reservada para otro equipo.", "error"); return redibujar(); }
      guardando(f, function () {
        r.reservas.push({ mac: mac, ip: n, activa: f.elements.activa.checked });
        nav.form = null;
        var eq = S.equipoPorMac(mac);
        avisar("reserva guardada" + (eq ? " para " + eq.nombre : "") + ". El equipo la recibe la próxima vez que pide IP: en una PC, con ipconfig /release y después ipconfig /renew.");
      });
    },
    acceso: function (f) {
      guardando(f, function () {
        var a = S.estado.router.acceso;
        a.activo = f.elements.activo.checked;
        a.modo = f.elements.modo.value;
        S.reconectarTodo();
        avisar(a.activo ? "control de acceso activado (" + (a.modo === "Blacklist" ? "lista negra" : "lista blanca") + ")." : "control de acceso desactivado.");
      });
    },
    "acceso-add": function (f) {
      var mac = S.normalizarMac(f.elements.mac.value), nombre = f.elements.nombre.value.trim() || "Device";
      if (!mac) { avisar("la MAC tiene 6 pares de números y letras de la A a la F, separados por guiones.", "error"); return redibujar(); }
      if (mac === S.equipo("pc1").mac && S.estado.router.acceso.modo === "Blacklist") { avisar("no bloquees tu propia PC: perderías el acceso al panel.", "error"); return redibujar(); }
      guardando(f, function () { S.estado.router.acceso.lista.push({ nombre: nombre, mac: mac }); nav.form = null; S.reconectarTodo(); });
    },
    autoreboot: function (f) { guardando(f, function () { S.estado.router.autoReboot = f.elements.auto.checked; }); },
    restore: function (f) {
      var archivo = f.elements.archivo.files[0];
      if (!archivo) { avisar("elegí el archivo de la copia de seguridad (config.bin).", "error"); return redibujar(); }
      var lector = new FileReader();
      lector.onload = function () {
        var conf = leerCopia(String(lector.result));
        if (!conf) { avisar("ese archivo no es una copia de seguridad de este router.", "error"); return redibujar(); }
        conf.leases = {};
        S.estado.router = conf;
        S.Panel.salir();
        S.reiniciar(function () { S.marcar("restore"); });
        redibujar();
      };
      lector.readAsText(archivo);
    },
    admin: function (f) {
      var r = S.estado.router, n = f.elements.nueva.value;
      if (f.elements.vieja.value !== r.adminPass) { avisar("la contraseña actual no es correcta.", "error"); return redibujar(); }
      if (n.length < 8) { avisar("para la práctica, la contraseña nueva tiene que tener al menos 8 caracteres.", "error"); return redibujar(); }
      if (n !== f.elements.repetir.value) { avisar("las dos contraseñas nuevas no coinciden.", "error"); return redibujar(); }
      guardando(f, function () { r.adminPass = n; avisar("contraseña de administrador cambiada."); });
    }
  };

  function guardarWifi(f, basico) {
    var wf = S.estado.router.wifi;
    var ssid = f.elements.ssid.value.trim();
    var seguridad = basico ? wf.seguridad : f.elements.seguridad.value;
    var clave = f.elements.clave ? f.elements.clave.value : wf.clave;
    if (!ssid || ssid.length > 32) { avisar("el SSID tiene que tener de 1 a 32 caracteres.", "error"); return redibujar(); }
    if (seguridad !== "No Security" && (clave.length < 8 || clave.length > 63)) { avisar("con WPA/WPA2 Personal, la clave lleva de 8 a 63 caracteres.", "error"); return redibujar(); }
    guardando(f, function () {
      var antes = wf.ssid + "|" + wf.clave + "|" + wf.seguridad + "|" + wf.radio;
      wf.radio = f.elements.radio.checked;
      wf.ssid = ssid;
      wf.oculta = f.elements.oculta.checked;
      wf.clave = clave;
      if (!basico) {
        wf.seguridad = seguridad;
        if (f.elements.version) { wf.version = f.elements.version.value; wf.cifrado = f.elements.cifrado.value; }
        wf.modo = f.elements.modo.value; wf.canal = f.elements.canal.value; wf.ancho = f.elements.ancho.value; wf.potencia = f.elements.potencia.value;
      }
      S.reconectarTodo();
      var cambio = antes !== wf.ssid + "|" + wf.clave + "|" + wf.seguridad + "|" + wf.radio;
      avisar(seguridad === "No Security" ? "guardado, pero la red quedó sin seguridad: cualquiera puede conectarse y ver lo que viaja." :
        cambio ? "guardado. Los equipos conectados por Wi-Fi a la red anterior se desconectaron: hay que volver a conectarlos con el nombre y la clave nuevos." : "guardado.",
        seguridad === "No Security" ? "error" : "ok");
    });
  }

  /* Copia de seguridad: el archivo config.bin lleva la configuración del router */
  function crearCopia() {
    var r = JSON.parse(JSON.stringify(S.estado.router));
    delete r.leases;
    return "ROUTERSIM1\n" + btoa(unescape(encodeURIComponent(JSON.stringify(r))));
  }
  function leerCopia(texto) {
    var partes = texto.split("\n");
    if (partes[0] !== "ROUTERSIM1") { return null; }
    try {
      var r = JSON.parse(decodeURIComponent(escape(atob(partes[1]))));
      return r && r.wifi && r.dhcp && Array.isArray(r.reservas) ? r : null;
    } catch (e) { return null; }
  }
  function descargar(nombre, texto) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto], { type: "application/octet-stream" }));
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  var acciones = {
    tab: function (b) {
      nav.tab = b.getAttribute("data-tab");
      nav.menu = nav.tab === "basic" ? "networkmap" : nav.tab === "advanced" ? "status" : null;
      nav.sub = null; nav.form = null; nav.ver = null;
    },
    menu: function (b) {
      nav.menu = b.getAttribute("data-menu");
      var it = MENUS[nav.tab].filter(function (x) { return x.id === nav.menu; })[0];
      nav.sub = it && it.sub ? (it.id === "network" ? "LAN Settings" : it.id === "wireless" ? "Wireless Settings" : it.id === "security" ? "Access Control" : it.id === "systools" ? "Backup & Restore" : it.sub[0]) : null;
      nav.form = null; nav.ver = null;
    },
    sub: function (b) { nav.sub = b.getAttribute("data-sub"); nav.form = null; },
    ver: function (b) { var v = b.getAttribute("data-ver"); nav.ver = nav.ver === v ? null : v; },
    salir: function () { S.Panel.salir(); },
    reiniciar: function () {
      if (!window.confirm("¿Reiniciar el router? Mientras se reinicia, los equipos pierden la conexión. (Simulador)")) { return; }
      S.Panel.salir();
      S.reiniciar();
    },
    olvide: function () { avisar("si nadie recuerda la contraseña de administrador, hay que hacer un reset de fábrica: mantener apretado el botón WPS/RESET más de 5 segundos (pestaña «Router» de la derecha).", "error"); },
    "ver-clave": function (b) {
      var input = b.parentNode.querySelector("input");
      var ver = input.type === "password";
      input.type = ver ? "text" : "password";
      b.setAttribute("aria-label", ver ? "Ocultar la contraseña" : "Mostrar la contraseña");
      return "sin-dibujo";
    },
    "agregar-res": function () { nav.form = nav.form === "reserva" ? null : "reserva"; },
    "agregar-acc": function () { nav.form = nav.form === "acceso" ? null : "acceso"; },
    "cancelar-form": function () { nav.form = null; },
    "borrar-res": function (b) { S.estado.router.reservas.splice(Number(b.getAttribute("data-i")), 1); S.guardar(); },
    "borrar-sel": function (b) {
      var marcadas = Array.prototype.map.call(document.querySelectorAll("input[name=sel-res]:checked"), function (c) { return Number(c.value); });
      if (!marcadas.length) { avisar("marcá las reservas que querés borrar.", "error"); return; }
      S.estado.router.reservas = S.estado.router.reservas.filter(function (x, i) { return marcadas.indexOf(i) === -1; });
      S.guardar();
    },
    "borrar-acc": function (b) { S.estado.router.acceso.lista.splice(Number(b.getAttribute("data-i")), 1); S.reconectarTodo(); S.guardar(); },
    "borrar-acc-sel": function () {
      var marcadas = Array.prototype.map.call(document.querySelectorAll("input[name=sel-acc]:checked"), function (c) { return Number(c.value); });
      S.estado.router.acceso.lista = S.estado.router.acceso.lista.filter(function (x, i) { return marcadas.indexOf(i) === -1; });
      S.reconectarTodo(); S.guardar();
    },
    bloquear: function () {
      var a = S.estado.router.acceso;
      var macs = Array.prototype.map.call(document.querySelectorAll("input[name=sel-online]:checked"), function (c) { return c.value; });
      if (!macs.length) { avisar("marcá los equipos que querés agregar a la lista.", "error"); return; }
      if (a.modo === "Blacklist" && macs.indexOf(S.equipo("pc1").mac) !== -1) { avisar("no bloquees tu propia PC: perderías el acceso al panel.", "error"); return; }
      macs.forEach(function (mac) {
        if (!a.lista.some(function (d) { return d.mac === mac; })) { a.lista.push({ nombre: S.equipoPorMac(mac).nombre, mac: mac }); }
      });
      S.reconectarTodo(); S.guardar();
      avisar("agregado a la " + (a.modo === "Blacklist" ? "lista negra" : "lista blanca") + (a.activo ? "." : ". Para que se aplique, activá Access Control y guardá."));
    },
    refrescar: function () { },
    backup: function () {
      descargar("config.bin", crearCopia());
      S.marcar("backup");
      avisar("se descargó config.bin con la configuración del router. Guardalo: con «Restore» se vuelve a cargar.");
    },
    fabrica: function () {
      if (!window.confirm("¿Volver a la configuración de fábrica? Se borra todo, también la contraseña de administrador. (Simulador)")) { return; }
      S.Panel.salir();
      S.resetFabrica(function () { S.marcar("reset"); });
    }
  };

  /* Eventos del panel: un solo escuchador para todo el contenido del navegador */
  S.Panel.conectar = function (cont) {
    cont.addEventListener("click", function (e) {
      var b = e.target.closest("[data-accion]");
      if (!b || !cont.contains(b)) { return; }
      var fn = acciones[b.getAttribute("data-accion")];
      if (!fn) { return; }
      e.preventDefault();
      if (fn(b) !== "sin-dibujo") { redibujar(); }
    });
    cont.addEventListener("submit", function (e) {
      var f = e.target.closest("[data-form]");
      if (!f) { return; }
      e.preventDefault();
      var fn = formularios[f.getAttribute("data-form")];
      if (fn) { fn(f); }
    });
    cont.addEventListener("input", function (e) {
      if (e.target.name === "nueva" && e.target.closest("[data-form=crear]")) {
        e.target.closest("form").querySelector(".pn-fuerza").setAttribute("data-fuerza", fuerza(e.target.value));
      }
    });
  };
})(Sim);
