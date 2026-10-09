/* ==========================================================
   Simulador del router · estado.js
   La red simulada: el router (con su DHCP), los equipos y el guardado.
   Todo queda en este navegador (localStorage); nada se envía.
   ========================================================== */
var Sim = window.Sim || {};
(function (S) {
  "use strict";

  var CLAVE = "routersim:v1";
  S.RED = "192.168.0.";

  /* El router de la práctica. Los nombres de los menús y los valores de fábrica son los del
     TP-Link TL-WR850N v3; las MAC, el SSID y las claves son inventados. */
  S.ROUTER = {
    modelo: "TL-WR850N",
    lanIp: "192.168.0.1",
    mascara: "255.255.255.0",
    mac: "A8-42-A1-27-7A-2B",
    macWan: "A8-42-A1-27-7A-2C",
    dominio: "tplinkwifi.net",
    wan: { tipo: "Dynamic IP", ip: "203.0.113.45", mascara: "255.255.255.0", puerta: "203.0.113.1", dns1: "8.8.8.8", dns2: "8.8.4.4" }
  };

  /* Los equipos de la red. "pc1" es la PC del alumno; "pc2", otra PC del laboratorio. */
  S.EQUIPOS = [
    { id: "pc1", nombre: "PC-ALUMNO", rotulo: "Tu PC", tipo: "cable", mac: "3C-52-82-4A-1F-07",
      placa: "Realtek PCIe GbE Family Controller", v6: "fe80::a1c:2b7e:91d3:6f5%7", iaid: "104617602", duid: "00-01-00-01-2E-11-6B-02-3C-52-82-4A-1F-07" },
    { id: "pc2", nombre: "PC-LAB-2", rotulo: "Otra PC", tipo: "cable", mac: "70-85-C2-1D-6B-34",
      placa: "Intel(R) Ethernet Connection I219-V", v6: "fe80::5d0e:93b1:4c7a:2e19%4", iaid: "91264738", duid: "00-01-00-01-2D-90-14-AF-70-85-C2-1D-6B-34" },
    { id: "note", nombre: "Notebook-Aula", rotulo: "Notebook", tipo: "wifi", mac: "8C-16-45-2B-9E-31" },
    { id: "cel", nombre: "Celular", rotulo: "Celular", tipo: "wifi", mac: "5A-7D-C3-90-12-6E" }
  ];
  S.equipo = function (id) {
    for (var i = 0; i < S.EQUIPOS.length; i++) { if (S.EQUIPOS[i].id === id) { return S.EQUIPOS[i]; } }
    return null;
  };
  S.equipoPorMac = function (mac) {
    for (var i = 0; i < S.EQUIPOS.length; i++) { if (S.EQUIPOS[i].mac === mac) { return S.EQUIPOS[i]; } }
    return null;
  };

  /* Configuración de fábrica (lo que queda después de un reset) */
  S.fabrica = function () {
    return {
      adminPass: null,
      wifi: { radio: true, ssid: "TP-Link_7A2B", oculta: false, seguridad: "WPA/WPA2 Personal (Recommended)",
        version: "WPA2-PSK", cifrado: "AES", clave: "48613927", modo: "802.11b/g/n mixed", canal: "Auto", ancho: "Auto", potencia: "High" },
      dhcp: { activo: true, desde: 100, hasta: 199, lease: 1440, puerta: "192.168.0.1", dominio: "", dns1: "0.0.0.0", dns2: "0.0.0.0" },
      reservas: [],
      acceso: { activo: false, modo: "Blacklist", lista: [] },
      autoReboot: false,
      leases: {}
    };
  };

  /* Al empezar, el router "ya se usó": tiene la contraseña y el Wi-Fi de otro curso */
  S.usado = function () {
    var r = S.fabrica();
    r.adminPass = "Otro-curso-2B";
    r.wifi.ssid = "Aula-Redes";
    r.wifi.clave = "redes-del-aula";
    r.reservas = [{ mac: "70-85-C2-1D-6B-34", ip: 150, activa: true }];
    return r;
  };

  function confDhcp() { return { modo: "dhcp", ip: "", mascara: "", puerta: "", dns1: "", dns2: "" }; }

  S.nuevoEstado = function () {
    var e = {
      version: 1,
      alumno: "",
      router: S.usado(),
      arranque: Date.now(),
      equipos: {
        pc1: { conf: confDhcp(), ip: null, liberada: false, obtenida: null },
        pc2: { conf: confDhcp(), ip: null, liberada: false, obtenida: null },
        note: { red: { ssid: "Aula-Redes", clave: "redes-del-aula" }, ip: null },
        cel: { wifi: true, red: { ssid: "Aula-Redes", clave: "redes-del-aula" }, guardadas: [{ ssid: "Aula-Redes", clave: "redes-del-aula" }], ip: null }
      },
      practica: {},
      traduccion: true
    };
    S.estado = e;
    S.reconectarTodo();
    return e;
  };

  /* ---- Guardado ---- */
  S.guardar = function () {
    try { window.localStorage.setItem(CLAVE, JSON.stringify(S.estado)); } catch (err) { /* sin almacenamiento */ }
  };
  S.cargar = function () {
    var e = null;
    try { e = JSON.parse(window.localStorage.getItem(CLAVE)); } catch (err) { e = null; }
    if (!e || e.version !== 1) { return S.nuevoEstado(); }
    S.estado = e;
    return e;
  };
  S.borrar = function () {
    try { window.localStorage.removeItem(CLAVE); } catch (err) { /* sin almacenamiento */ }
    return S.nuevoEstado();
  };

  /* ---- IP ---- */
  S.partes = function (texto) {
    var t = String(texto || "").trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) { return null; }
    var p = t.split(".").map(Number);
    return p.every(function (n) { return n <= 255; }) ? p : null;
  };
  /* Último número de una IP de la red 192.168.0.0, o null */
  S.ultimo = function (texto) {
    var p = S.partes(texto);
    if (!p || p[0] !== 192 || p[1] !== 168 || p[2] !== 0) { return null; }
    return p[3];
  };
  S.normalizarMac = function (texto) {
    var t = String(texto || "").trim().toUpperCase().replace(/[:.]/g, "-");
    if (/^[0-9A-F]{12}$/.test(t)) { t = t.match(/.{2}/g).join("-"); }
    return /^([0-9A-F]{2}-){5}[0-9A-F]{2}$/.test(t) ? t : null;
  };

  /* ---- Conexión de cada equipo ---- */
  function bloqueado(mac) {
    var a = S.estado.router.acceso;
    if (!a.activo) { return false; }
    var esta = a.lista.some(function (d) { return d.mac === mac; });
    return a.modo === "Blacklist" ? esta : !esta;
  }
  S.bloqueado = bloqueado;

  /* ¿El equipo está conectado a la red del router? */
  S.conectado = function (id) {
    var eq = S.equipo(id), est = S.estado.equipos[id], r = S.estado.router;
    if (S.reiniciando) { return false; }
    if (bloqueado(eq.mac)) { return false; }
    if (eq.tipo === "cable") { return true; }
    if (id === "cel" && !est.wifi) { return false; }
    if (!r.wifi.radio || !est.red || est.red.ssid !== r.wifi.ssid) { return false; }
    return r.wifi.seguridad === "No Security" || est.red.clave === r.wifi.clave;
  };

  /* IP que el servidor DHCP le da a una MAC (último número), o null si no puede */
  function ipLibre(n, mac) {
    var r = S.estado.router;
    if (n === 1) { return false; }
    if (r.reservas.some(function (x) { return x.activa && x.ip === n && x.mac !== mac; })) { return false; }
    for (var m in r.leases) { if (m !== mac && r.leases[m] === n) { return false; } }
    return true;
  }
  S.asignar = function (mac, preferida) {
    var r = S.estado.router;
    if (!r.dhcp.activo) { return null; }
    var res = r.reservas.filter(function (x) { return x.activa && x.mac === mac; })[0];
    if (res) { return res.ip; }
    if (preferida && preferida >= r.dhcp.desde && preferida <= r.dhcp.hasta && ipLibre(preferida, mac)) { return preferida; }
    for (var n = r.dhcp.desde; n <= r.dhcp.hasta; n++) { if (ipLibre(n, mac)) { return n; } }
    return null;
  };

  /* Un equipo con DHCP pide IP (al conectarse o con ipconfig /renew). Devuelve true si la consigue */
  S.pedirIp = function (id) {
    var eq = S.equipo(id), est = S.estado.equipos[id], r = S.estado.router;
    if (est.conf && est.conf.modo === "fija") { return true; }
    if (!S.conectado(id)) { est.ip = null; delete r.leases[eq.mac]; return false; }
    var n = S.asignar(eq.mac, est.ip);
    if (n === null) { est.ip = null; delete r.leases[eq.mac]; if (est.conf) { est.liberada = false; } return false; }
    est.ip = n;
    est.obtenida = Date.now();
    if (est.conf) { est.liberada = false; }
    r.leases[eq.mac] = n;
    return true;
  };

  S.liberar = function (id) {
    var eq = S.equipo(id), est = S.estado.equipos[id];
    delete S.estado.router.leases[eq.mac];
    est.ip = null;
    est.liberada = true;
  };

  /* Después de un cambio en el router: cada equipo con DHCP vuelve a pedir IP si está conectado;
     el que se desconectó pierde la suya. Las PC con cable renuevan solas cuando el router se reinicia
     (el cable pierde la conexión y vuelve). */
  S.reconectarTodo = function (opciones) {
    var cables = opciones && opciones.cables;
    S.EQUIPOS.forEach(function (eq) {
      var est = S.estado.equipos[eq.id];
      if (eq.tipo === "cable") {
        if (est.conf.modo === "fija") { delete S.estado.router.leases[eq.mac]; return; }
        if (cables || (est.ip === null && !est.liberada)) { S.pedirIp(eq.id); }
        else if (est.ip !== null && !S.conectado(eq.id)) { delete S.estado.router.leases[eq.mac]; }
      } else if (S.conectado(eq.id)) {
        S.pedirIp(eq.id);
      } else {
        est.ip = null;
        delete S.estado.router.leases[eq.mac];
      }
    });
  };

  /* Configuración IPv4 que ve el equipo (lo que muestra ipconfig) */
  S.configDe = function (id) {
    var est = S.estado.equipos[id], eq = S.equipo(id);
    if (est.conf && est.conf.modo === "fija") {
      return { modo: "fija", ip: est.conf.ip, mascara: est.conf.mascara, puerta: est.conf.puerta, dns: [est.conf.dns1, est.conf.dns2].filter(Boolean) };
    }
    if (est.ip !== null) {
      var d = S.estado.router.dhcp;
      var dns = [d.dns1, d.dns2].filter(function (x) { return x && x !== "0.0.0.0"; });
      return { modo: "dhcp", ip: S.RED + est.ip, mascara: S.ROUTER.mascara, puerta: d.puerta || S.ROUTER.lanIp,
        dns: dns.length ? dns : [S.ROUTER.lanIp], servidor: S.ROUTER.lanIp, obtenida: est.obtenida };
    }
    if (est.liberada) { return { modo: "liberada" }; }
    /* Sin respuesta del servidor DHCP, Windows se pone una IP 169.254 */
    var h = 0;
    for (var i = 0; i < eq.mac.length; i++) { h = (h * 31 + eq.mac.charCodeAt(i)) % 65000; }
    return { modo: "apipa", ip: "169.254." + (1 + h % 254) + "." + (1 + (h >> 8) % 254), mascara: "255.255.0.0", puerta: "" };
  };

  /* ¿Este equipo llega al router? (para el navegador y el ping) */
  S.llegaAlRouter = function (id) {
    if (!S.conectado(id)) { return false; }
    var c = S.configDe(id);
    if (c.modo === "liberada" || c.modo === "apipa") { return false; }
    var p = S.partes(c.ip);
    return !!p && p[0] === 192 && p[1] === 168 && p[2] === 0 && c.mascara === S.ROUTER.mascara;
  };

  /* IP (texto) de cada equipo conectado, para la lista de clientes */
  S.clientes = function () {
    var r = S.estado.router;
    return S.EQUIPOS.filter(function (eq) { return r.leases[eq.mac] !== undefined && S.conectado(eq.id); }).map(function (eq) {
      return { eq: eq, ip: S.RED + r.leases[eq.mac], obtenida: S.estado.equipos[eq.id].obtenida };
    });
  };
  /* Todos los equipos en línea (también los que tienen IP fija) */
  S.enLinea = function () {
    return S.EQUIPOS.filter(function (eq) { return S.conectado(eq.id); }).map(function (eq) {
      var c = S.configDe(eq.id);
      return { eq: eq, ip: (c.modo === "dhcp" || c.modo === "fija") ? c.ip : "0.0.0.0" };
    });
  };

  /* ---- Reinicio y reset del router ---- */
  S.reiniciando = false;
  S.reiniciar = function (alTerminar, ms) {
    S.reiniciando = true;
    S.estado.router.leases = {};
    S.EQUIPOS.forEach(function (eq) { if (eq.tipo === "wifi") { S.estado.equipos[eq.id].ip = null; } });
    if (S.alCambiar) { S.alCambiar(); }
    setTimeout(function () {
      S.reiniciando = false;
      S.estado.arranque = Date.now();
      S.reconectarTodo({ cables: true });
      S.guardar();
      if (alTerminar) { alTerminar(); }
      if (S.alCambiar) { S.alCambiar(); }
    }, ms || 3500);
  };
  S.resetFabrica = function (alTerminar) {
    S.estado.router = S.fabrica();
    S.reiniciar(alTerminar, 4500);
  };

  /* ---- Práctica: cada paso cumplido queda anotado ---- */
  S.marcar = function (paso) {
    if (!S.estado.practica[paso]) {
      S.estado.practica[paso] = Date.now();
      S.guardar();
      /* Solo se actualiza la lista de la práctica (no la pantalla del navegador, para no borrar sus avisos) */
      if (S.alPracticar) { setTimeout(S.alPracticar, 0); }
    }
  };
})(Sim);
