/* ==========================================================
   Simulador del router · practica.js
   Los pasos de la práctica del TP N°8 (se tildan solos) y el resumen para la entrega.
   ========================================================== */
(function (S) {
  "use strict";
  var esc = function (t) { return S.esc(t); };
  var VIEJOS = ["TP-Link_7A2B", "Aula-Redes"];

  function wifiConfigurado() {
    var w = S.estado.router.wifi;
    return VIEJOS.indexOf(w.ssid) === -1 && w.seguridad === "WPA/WPA2 Personal (Recommended)" && w.clave.length >= 8 &&
      w.clave !== S.fabrica().wifi.clave && w.clave !== "redes-del-aula";
  }

  /* ¿La IP fija de la otra PC está bien puesta? */
  function revisarIpFija() {
    var est = S.estado.equipos.pc2, c = est.conf, d = S.estado.router.dhcp;
    if (c.modo !== "fija") { return { ok: false, motivo: "La otra PC todavía tiene la IP automática (DHCP)." }; }
    var n = S.ultimo(c.ip);
    if (n === null || n === 0 || n === 255) { return { ok: false, motivo: "La IP " + c.ip + " no es de la red del router (192.168.0.2 a 192.168.0.254)." }; }
    if (n === 1) { return { ok: false, motivo: "192.168.0.1 es la IP del router." }; }
    if (d.activo && n >= d.desde && n <= d.hasta) { return { ok: false, motivo: "La IP " + c.ip + " está dentro del rango DHCP (" + S.RED + d.desde + " a " + S.RED + d.hasta + "): elegí una de afuera." }; }
    var ocupada = S.EQUIPOS.some(function (eq) {
      if (eq.id === "pc2") { return false; }
      var o = S.configDe(eq.id);
      return S.conectado(eq.id) && (o.modo === "dhcp" || o.modo === "fija") && o.ip === c.ip;
    }) || S.estado.router.reservas.some(function (x) { return x.activa && x.ip === n && x.mac !== S.equipo("pc2").mac; });
    if (ocupada) { return { ok: false, motivo: "La IP " + c.ip + " ya la usa (o la tiene reservada) otro equipo." }; }
    if (c.mascara !== "255.255.255.0") { return { ok: false, motivo: "La máscara de subred tiene que ser 255.255.255.0." }; }
    if (c.puerta !== S.ROUTER.lanIp) { return { ok: false, motivo: "La puerta de enlace tiene que ser la IP del router: " + S.ROUTER.lanIp + "." }; }
    return { ok: true };
  }

  /* ¿Qué le falta a la reserva de «Tu PC»? */
  function revisarReserva() {
    var mac = S.equipo("pc1").mac, est = S.estado.equipos.pc1, rs = S.estado.router.reservas;
    var res = rs.filter(function (x) { return x.mac === mac; })[0];
    if (!res) {
      if (!rs.length) { return { ok: false, motivo: "Todavía no hay ninguna reserva: Advanced › Network › LAN Settings › Address Reservation › Add." }; }
      /* La tabla puede tener reservas del alumno o la que dejó el otro curso (router usado) */
      var de = rs.map(function (x) {
        if (x.mac === S.ROUTER.mac) { return "con la MAC del router"; }
        var eq = S.equipoPorMac(x.mac);
        return eq ? "de «" + eq.rotulo + "»" : "";
      }).filter(Boolean)[0];
      return { ok: false, motivo: "Ninguna reserva tiene la MAC de «Tu PC»" + (de ? " (en la tabla hay una " + de + ")" : "") + ". Buscala en «Tu PC» con ipconfig /all: es la «Dirección física»." };
    }
    if (!res.activa) { return { ok: false, motivo: "La reserva de «Tu PC» está desactivada (Disabled). Borrala y cargala de nuevo con «Enable This Entry» tildado." }; }
    if (est.conf.modo === "fija") { return { ok: false, motivo: "«Tu PC» tiene una IP fija: la reserva funciona solo con la IP automática (DHCP)." }; }
    if (est.ip !== res.ip || !S.estado.practica.reservaComprobada) {
      if (est.liberada) { return { ok: false, motivo: "Ya soltaste la IP: falta ipconfig /renew en «Tu PC»." }; }
      return { ok: false, motivo: "Falta comprobarla: en «Tu PC», ipconfig /release e ipconfig /renew. Tiene que aparecer la IP " + S.RED + res.ip + "." };
    }
    return { ok: true };
  }

  /* Los pasos, con el mismo orden y las mismas palabras que la práctica del TP N°8 */
  var GRUPOS = [
    { tit: "1- Entrar al router", pasos: [
      { id: "reset", txt: "Si el router ya se usó, reset de fábrica: en «Router», botón WPS/RESET apretado más de 5 segundos.",
        pista: "El router ya tiene la contraseña de otro curso. En la pestaña «Router», mantené apretado el botón WPS/RESET más de 5 segundos.",
        hecho: function () { return !!S.estado.practica.reset; } },
      { id: "ipconfig", txt: "En «Tu PC», buscá la puerta de enlace con ipconfig.",
        pista: "En «Tu PC», Símbolo del sistema: escribí ipconfig y buscá «Puerta de enlace predeterminada».",
        hecho: function () { return !!S.estado.practica.ipconfig; } },
      { id: "admin", txt: "Entrá a http://tplinkwifi.net o a 192.168.0.1 y creá la contraseña de administrador.",
        pista: "Escribí la dirección en la barra del navegador. Después del reset, el router pide crear la contraseña.",
        hecho: function () { return !!S.estado.practica.admin && !!S.estado.router.adminPass && !!S.estado.practica.reset; } }
    ] },
    { tit: "2- Wi-Fi", pasos: [
      { id: "wifi", txt: "En Advanced › Wireless › Wireless Settings: tu SSID y una clave de 8 caracteres o más, con WPA/WPA2 Personal.",
        pista: "Advanced › Wireless › Wireless Settings (o Basic › Wireless). Poné un SSID propio y una clave nueva, y Save.",
        hecho: wifiConfigurado },
      { id: "celular", txt: "En «Celular», conectate a la red nueva.",
        pista: "En la pestaña «Celular», elegí tu red y escribí la clave nueva.",
        hecho: function () { var c = S.estado.equipos.cel; return wifiConfigurado() && S.conectado("cel") && c.red.ssid === S.estado.router.wifi.ssid; } }
    ] },
    { tit: "3- DHCP e IP fijas", pasos: [
      { id: "rango", txt: "En Advanced › Network › LAN Settings, anotá el rango DHCP. Mirá los dispositivos conectados en Client List o en Basic › Network Map.",
        pista: "Advanced › Network › LAN Settings: «IP Address Pool» es el rango DHCP. Basic › Network Map muestra los clientes.",
        hecho: function () { return !!S.estado.practica.vioRango && !!S.estado.practica.vioDispositivos; } },
      { id: "reserva", txt: "Buscá la MAC de «Tu PC» con ipconfig /all y reservale una IP en Address Reservation. Comprobala con ipconfig /release e ipconfig /renew.",
        pista: "La MAC es la «Dirección física». En LAN Settings › Address Reservation › Add, cargá la MAC y una IP. Después, en «Tu PC»: ipconfig /release e ipconfig /renew.",
        hecho: function () { return revisarReserva().ok; } }
    ] },
    { tit: "4- IP fija y copia de seguridad", pasos: [
      { id: "fija", txt: "En «Otra PC», poné una IP fija en Windows, fuera del rango DHCP, y comprobala con ipconfig.",
        pista: "En «Otra PC» › Conexiones de red: clic derecho en Ethernet › Propiedades › Protocolo de Internet versión 4 (TCP/IPv4) › Propiedades. Después, ipconfig.",
        hecho: function () { return !!S.estado.practica.ipFijaComprobada && revisarIpFija().ok; } },
      { id: "backup", txt: "En Advanced › System Tools › Backup & Restore, guardá la configuración en un archivo.",
        pista: "Advanced › System Tools › Backup & Restore › Backup: se descarga config.bin.",
        hecho: function () { return !!S.estado.practica.backup; } }
    ] }
  ];

  function todos() { return GRUPOS.reduce(function (a, g) { return a.concat(g.pasos); }, []); }

  /* Código de la entrega: sale del nombre y de lo configurado (si se copia la captura de otro, no coincide) */
  function codigo() {
    var e = S.estado, r = e.router, c = e.equipos.pc2.conf;
    var base = [e.alumno.trim().toLowerCase(), r.wifi.ssid, r.dhcp.desde, r.dhcp.hasta,
      r.reservas.map(function (x) { return x.mac + x.ip; }).join(","), c.ip].join("|");
    var h = 2166136261;
    for (var i = 0; i < base.length; i++) { h ^= base.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var t = h.toString(36).toUpperCase();
    while (t.length < 7) { t = "0" + t; }
    return t.slice(0, 4) + "-" + t.slice(4, 7);
  }

  S.Practica = {
    revisarIpFija: revisarIpFija,
    completa: function () { return todos().every(function (p) { return p.hecho(); }); },
    dibujar: function (cont) {
      var lista = todos(), hechos = lista.filter(function (p) { return p.hecho(); }).length;
      var fija = revisarIpFija(), reserva = revisarReserva();
      /* El aviso de la reserva aparece cuando el alumno ya guardó una reserva o probó ipconfig /release o /renew en «Tu PC» */
      var avisarReserva = !reserva.ok && (!!S.estado.practica.reservo || !!S.estado.practica.renovo);
      var h = '<div class="pr"><div class="pr__progreso"><span>Práctica: ' + hechos + " de " + lista.length + ' pasos</span><div class="pr__barra" role="progressbar" aria-valuemin="0" aria-valuemax="' + lista.length + '" aria-valuenow="' + hechos + '"><span style="width:' + (hechos / lista.length * 100) + '%"></span></div></div>';
      GRUPOS.forEach(function (g) {
        h += '<section class="pr__grupo"><h3>' + esc(g.tit) + '</h3><ol class="pr__pasos">';
        g.pasos.forEach(function (p, i) {
          var ok = p.hecho();
          var extra = p.id === "fija" && S.estado.equipos.pc2.conf.modo === "fija" && !fija.ok ? '<span class="pr__falla">' + esc(fija.motivo) + "</span>" :
            p.id === "reserva" && avisarReserva ? '<span class="pr__falla">' + esc(reserva.motivo) + "</span>" : "";
          h += '<li class="pr__paso' + (ok ? " es-hecho" : "") + '"><span class="pr__marca" aria-hidden="true">' + (ok ? "✓" : String.fromCharCode(97 + i) + ")") + "</span>" +
            '<div><p>' + esc(p.txt) + '<span class="sr-only">' + (ok ? " (hecho)" : " (pendiente)") + "</span></p>" + extra +
            (ok ? "" : '<details class="pr__pista"><summary>Pista</summary><p>' + esc(p.pista) + "</p></details>") + "</div></li>";
        });
        h += "</ol></section>";
      });
      h += '<button type="button" class="boton boton--ancho" data-app="resumen">' + (hechos === lista.length ? "Ver el resumen para la entrega" : "Ver el resumen (faltan pasos)") + "</button></div>";
      cont.innerHTML = h;
    },
    resumen: function () {
      var e = S.estado, r = e.router, pc2 = e.equipos.pc2.conf;
      var filas = todos().map(function (p) { return '<li class="' + (p.hecho() ? "es-hecho" : "es-falta") + '"><span aria-hidden="true">' + (p.hecho() ? "✓" : "✗") + "</span> " + esc(p.txt) + '<span class="sr-only">' + (p.hecho() ? " (hecho)" : " (falta)") + "</span></li>"; }).join("");
      var reservas = r.reservas.filter(function (x) { return x.activa; }).map(function (x) { var eq = S.equipoPorMac(x.mac); return (eq ? eq.nombre + " · " : "") + x.mac + " → " + S.RED + x.ip; });
      var ahora = new Date();
      return '<div class="res"><h2 id="modal-tit">Práctica: Configurando el router</h2><p class="res__sub">Redes I · TP N°8 · Simulador del router</p>' +
        '<dl class="res__datos"><dt>Alumno/a</dt><dd>' + esc(e.alumno || "(sin nombre)") + "</dd><dt>Fecha</dt><dd>" + esc(ahora.toLocaleDateString("es-AR") + " " + ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })) + "</dd>" +
        "<dt>Red Wi-Fi (SSID)</dt><dd>" + esc(r.wifi.ssid) + "</dd><dt>Seguridad</dt><dd>" + esc(r.wifi.seguridad) + "</dd>" +
        "<dt>Rango DHCP</dt><dd>" + S.RED + r.dhcp.desde + " a " + S.RED + r.dhcp.hasta + "</dd>" +
        "<dt>Reserva de IP</dt><dd>" + esc(reservas.join("; ") || "ninguna") + "</dd>" +
        "<dt>IP fija de la otra PC</dt><dd>" + (pc2.modo === "fija" ? esc(pc2.ip + " · máscara " + pc2.mascara + " · puerta de enlace " + pc2.puerta) : "no tiene") + "</dd>" +
        "<dt>Copia de seguridad</dt><dd>" + (e.practica.backup ? "config.bin descargado" : "no se hizo") + "</dd>" +
        '<dt>Código</dt><dd class="res__codigo">' + codigo() + "</dd></dl>" +
        '<ol class="res__pasos">' + filas + "</ol>" +
        '<p class="res__entrega">Sacá una captura de esta pantalla (<kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>) y subila a Classroom.</p></div>';
    }
  };
})(Sim);
