/* ==========================================================
   Simulador del router · equipos.js
   Las dos PC (Símbolo del sistema y Conexiones de red), el celular y el router físico.
   Las salidas de ipconfig y ping copian el formato de Windows 11 en español.
   ========================================================== */
(function (S) {
  "use strict";
  var esc = function (t) { return S.esc(t); };
  var PROMPT = "C:\\Users\\Alumno>";
  var vistas = { pc1: { vista: "cmd", red: "conexiones", salida: [], historial: [], pos: 0, ocupada: false },
    pc2: { vista: "cmd", red: "conexiones", salida: [], historial: [], pos: 0, ocupada: false } };
  var cel = { pantalla: "lista", red: null, aviso: null };
  var boton = { inicio: 0, timer: null };

  function rellenar(t, n) { t = String(t); while (t.length < n) { t = " " + t; } return t; }
  function sorteo(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function fecha(ms) {
    var d = new Date(ms);
    var dia = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return dia + " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }

  /* ==========================================================
     ipconfig
     ========================================================== */
  function ipconfig(id, todo) {
    var eq = S.equipo(id), c = S.configDe(id), l = ["", "Configuración IP de Windows", ""];
    if (todo) {
      l.push("   Nombre de host. . . . . . . . . : " + eq.nombre, "   Sufijo DNS principal  . . . . . : ", "   Tipo de nodo. . . . . . . . . . : híbrido",
        "   Enrutamiento IP habilitado. . . : no", "   Proxy WINS habilitado . . . . . : no");
    } else { l.push(""); }
    l.push("", "Adaptador de Ethernet Ethernet:", "", "   Sufijo DNS específico para la conexión. . : ");
    if (todo) {
      l.push("   Descripción . . . . . . . . . . . . . . . : " + eq.placa, "   Dirección física. . . . . . . . . . . . . : " + eq.mac,
        "   DHCP habilitado . . . . . . . . . . . . . : " + (c.modo === "fija" ? "no" : "sí"), "   Configuración automática habilitada . . . : sí");
    }
    l.push("   Vínculo: dirección IPv6 local. . . : " + eq.v6 + (todo ? "(Preferido) " : ""));
    if (c.modo === "dhcp" || c.modo === "fija") {
      l.push("   Dirección IPv4. . . . . . . . . . . . . . : " + c.ip + (todo ? "(Preferido) " : ""));
      l.push("   Máscara de subred . . . . . . . . . . . . : " + c.mascara);
      if (todo && c.modo === "dhcp") {
        l.push("   Concesión obtenida. . . . . . . . . . . . : " + fecha(c.obtenida),
          "   La concesión expira . . . . . . . . . . . : " + fecha(c.obtenida + S.estado.router.dhcp.lease * 60000));
      }
      l.push("   Puerta de enlace predeterminada . . . . . : " + (c.puerta || ""));
      if (todo && c.modo === "dhcp") { l.push("   Servidor DHCP . . . . . . . . . . . . . . : " + c.servidor); }
    } else if (c.modo === "apipa") {
      l.push("   Dirección IPv4 de configuración automática: " + c.ip + (todo ? "(Preferido) " : ""));
      l.push("   Máscara de subred . . . . . . . . . . . . : " + c.mascara, "   Puerta de enlace predeterminada . . . . . : ");
    } else {
      l.push("   Puerta de enlace predeterminada . . . . . : ");
    }
    if (todo) {
      l.push("   IAID DHCPv6 . . . . . . . . . . . . . . . : " + eq.iaid, "   DUID de cliente DHCPv6. . . . . . . . . . : " + eq.duid);
      var dns = c.dns || [];
      if (dns.length) {
        l.push("   Servidores DNS. . . . . . . . . . . . . . : " + dns[0]);
        dns.slice(1).forEach(function (x) { l.push("                                       " + x); });
      }
      l.push("   NetBIOS sobre TCP/IP. . . . . . . . . . . : habilitado");
    }
    return l;
  }

  /* ==========================================================
     ping
     ========================================================== */
  function ping(id, destino) {
    var mia = S.configDe(id), l = [];
    var nombre = null, ip = destino;
    if (!S.partes(destino)) {
      if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(destino) && S.llegaAlRouter(id)) {
        nombre = destino;
        ip = destino.toLowerCase() === S.ROUTER.dominio ? S.ROUTER.lanIp : "203.0.113." + (20 + destino.length * 7 % 200);
      } else {
        return ["La solicitud de ping no pudo encontrar el host " + destino + ". Compruebe el nombre y", "vuelva a intentarlo."];
      }
    }
    l.push("", "Haciendo ping a " + (nombre ? nombre + " [" + ip + "]" : ip) + " con 32 bytes de datos:");
    var respuestas = [], tipo = "nada";
    var p = S.partes(ip);
    var propia = (mia.modo === "dhcp" || mia.modo === "fija") ? mia.ip : null;
    var enRed = p[0] === 192 && p[1] === 168 && p[2] === 0;
    var otro = S.EQUIPOS.filter(function (eq) {
      if (eq.id === id || !S.conectado(eq.id)) { return false; }
      var c = S.configDe(eq.id);
      return (c.modo === "dhcp" || c.modo === "fija") && c.ip === ip;
    })[0];
    if (mia.modo === "liberada" || p[0] === 0 || p[0] >= 224) {
      tipo = "general";
    } else if (ip === propia || p[0] === 127) {
      tipo = "si"; respuestas = [[0, 128], [0, 128], [0, 128], [0, 128]];
    } else if (!S.conectado(id) || mia.modo === "apipa") {
      tipo = "nada";
    } else if (enRed && S.llegaAlRouter(id)) {
      if (ip === S.ROUTER.lanIp) { tipo = "si"; respuestas = [0, 1, 2, 3].map(function () { return [sorteo(1, 3), 64]; }); }
      else if (otro) { tipo = "si"; respuestas = [0, 1, 2, 3].map(function () { return [sorteo(0, 4), otro.tipo === "cable" ? 128 : 64]; }); }
      else { tipo = "inaccesible"; }
    } else if (!enRed && S.llegaAlRouter(id) && mia.puerta === S.ROUTER.lanIp) {
      tipo = "si"; respuestas = [0, 1, 2, 3].map(function () { return [sorteo(28, 40), 115]; });
    } else if (!enRed && !mia.puerta) {
      tipo = "general";
    }
    var recibidos = 0;
    for (var i = 0; i < 4; i++) {
      if (tipo === "si") {
        var t = respuestas[i][0];
        l.push("Respuesta desde " + ip + ": bytes=32 " + (t < 1 ? "tiempo<1m" : "tiempo=" + t + "ms") + " TTL=" + respuestas[i][1]);
        recibidos++;
      } else if (tipo === "inaccesible") {
        l.push("Respuesta desde " + propia + ": Host de destino inaccesible.");
        recibidos++;
      } else if (tipo === "general") {
        l.push("PING: error en la transmisión. Error general. ");
      } else {
        l.push("Tiempo de espera agotado para esta solicitud.");
      }
    }
    var perdidos = 4 - recibidos;
    l.push("", "Estadísticas de ping para " + ip + ":", "    Paquetes: enviados = 4, recibidos = " + recibidos + ", perdidos = " + perdidos, "    (" + perdidos * 25 + "% perdidos),");
    if (tipo === "si") {
      var tiempos = respuestas.map(function (x) { return x[0]; });
      var suma = tiempos.reduce(function (a, b) { return a + b; }, 0);
      l.push("Tiempos aproximados de ida y vuelta en milisegundos:", "    Mínimo = " + Math.min.apply(null, tiempos) + "ms, Máximo = " + Math.max.apply(null, tiempos) + "ms, Media = " + Math.floor(suma / 4) + "ms");
    }
    return l;
  }

  /* ==========================================================
     Símbolo del sistema
     ========================================================== */
  function ejecutar(id, texto) {
    var v = vistas[id], est = S.estado.equipos[id], eq = S.equipo(id);
    var cmd = texto.trim().replace(/\s+/g, " ");
    var bajo = cmd.toLowerCase();
    v.salida.push({ t: PROMPT + texto, c: "t-cmd" });
    if (cmd) { v.historial.push(cmd); v.pos = v.historial.length; }
    function salida(lineas, clase) { lineas.forEach(function (x) { v.salida.push({ t: x, c: clase || "" }); }); v.salida.push({ t: "", c: "" }); }

    if (!cmd) { return; }
    if (bajo === "cls") { v.salida = []; return; }
    if (bajo === "ipconfig") {
      salida(ipconfig(id, false));
      if (id === "pc1" && S.configDe(id).puerta) { S.marcar("ipconfig"); }
      if (id === "pc2") { revisarFija(); }
      return;
    }
    if (bajo === "ipconfig /all") {
      salida(ipconfig(id, true));
      if (id === "pc1") { S.marcar("vioMac"); if (S.configDe(id).puerta) { S.marcar("ipconfig"); } }
      if (id === "pc2") { revisarFija(); }
      return;
    }
    if (bajo === "ipconfig /release") {
      if (est.conf.modo === "fija") { salida(["", "Configuración IP de Windows", "", "El adaptador Ethernet no está habilitado para DHCP."]); return; }
      if (est.liberada) { salida(["", "Configuración IP de Windows", "", "Ya se liberó la dirección IP para el adaptador Ethernet."]); return; }
      S.liberar(id);
      salida(ipconfig(id, false));
      S.guardar(); refrescarTodo();
      return;
    }
    if (bajo === "ipconfig /renew") {
      if (est.conf.modo === "fija") { salida(["", "Configuración IP de Windows", "", "El adaptador Ethernet no está habilitado para DHCP."]); return; }
      v.ocupada = true;
      var ok = S.pedirIp(id);
      setTimeout(function () {
        v.ocupada = false;
        if (ok) {
          salida(ipconfig(id, false));
          var res = S.estado.router.reservas.filter(function (x) { return x.activa && x.mac === eq.mac; })[0];
          if (id === "pc1" && res && est.ip === res.ip) { S.marcar("reservaComprobada"); }
        } else {
          est.liberada = false;
          salida(["", "Configuración IP de Windows", "", "Error al renovar la interfaz Ethernet: no se puede establecer contacto con el", "servidor DHCP. La solicitud superó el tiempo de espera."], "t-error");
        }
        S.guardar(); refrescarTodo();
      }, ok ? 1200 : 3000);
      return;
    }
    if (/^ipconfig\b/.test(bajo)) { salida(["Simulador: ipconfig funciona con /all, /release y /renew. Por ejemplo: ipconfig /all"], "t-nota"); return; }
    if (/^ping\b/.test(bajo)) {
      var dest = cmd.split(" ").filter(function (x) { return x && x.charAt(0) !== "-"; })[1];
      if (!dest) { salida(["Simulador: escribí ping y una IP, por ejemplo: ping 192.168.0.1"], "t-nota"); return; }
      v.ocupada = true;
      setTimeout(function () { v.ocupada = false; salida(ping(id, dest)); refrescarTodo(); }, 900);
      return;
    }
    if (bajo === "help" || bajo === "ayuda") {
      salida(["Simulador: los comandos de esta PC son ipconfig, ipconfig /all, ipconfig /release, ipconfig /renew, ping y cls."], "t-nota");
      return;
    }
    salida(['"' + cmd.split(" ")[0] + '" no se reconoce como un comando interno o externo,', "programa o archivo por lotes ejecutable."]);
  }

  /* Comprueba la IP fija de la otra PC al ejecutar ipconfig (paso 4 a) */
  function revisarFija() {
    var r = S.Practica && S.Practica.revisarIpFija();
    if (r && r.ok) { S.marcar("ipFijaComprobada"); }
  }

  /* ==========================================================
     Conexiones de red y TCP/IPv4
     ========================================================== */
  var ELEMENTOS = ["Cliente para redes Microsoft", "Uso compartido de archivos e impresoras para redes Microsoft", "Programador de paquetes QoS",
    "Protocolo de Internet versión 4 (TCP/IPv4)", "Protocolo de multiplexor de adaptador de red de Microsoft", "Controlador de protocolo LLDP de Microsoft",
    "Protocolo de Internet versión 6 (TCP/IPv6)", "Respondedor de detección de topologías de nivel de vínculo", "Controlador de E/S del asignador de detección de topologías de nivel de vínculo"];

  function ventana(titulo, cuerpo, cerrar) {
    return '<div class="win"><div class="win__barra"><span>' + esc(titulo) + "</span>" +
      (cerrar ? '<button type="button" class="win__x" data-eq="' + cerrar + '" aria-label="Cerrar">×</button>' : "") + '</div><div class="win__cuerpo">' + cuerpo + "</div></div>";
  }
  function vistaRed(id) {
    var v = vistas[id], eq = S.equipo(id), est = S.estado.equipos[id];
    if (v.red === "conexiones") {
      return ventana("Conexiones de red", '<p class="win__ayuda">Clic derecho (o Enter) en el adaptador para ver sus propiedades.</p>' +
        '<button type="button" class="win-adap" data-eq="adaptador">' + '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="4" y="8" width="26" height="18" rx="2"/><path d="M10 26v6M24 26v6M8 32h18M30 14h6v6"/></svg>' +
        '<span><b>Ethernet</b><br>' + (S.conectado(id) ? "Red" : "Sin conexión") + "<br>" + esc(eq.placa) + "</span></button>" +
        (v.menu ? '<div class="win-menu" role="menu"><button type="button" role="menuitem" data-eq="propiedades">Propiedades</button></div>' : ""));
    }
    if (v.red === "propiedades") {
      return ventana("Propiedades de Ethernet", '<div class="win-tabs"><span class="es-activo">Funciones de red</span></div>' +
        '<p>Conectar con:</p><p class="win-caja">' + esc(eq.placa) + "</p>" +
        "<p>Esta conexión usa los siguientes elementos:</p>" +
        '<ul class="win-lista" role="listbox" aria-label="Elementos de la conexión">' + ELEMENTOS.map(function (x, i) {
          var sel = v.elemento === i;
          return '<li><label class="win-check"><input type="checkbox"' + (i === 4 ? "" : " checked") + ' disabled aria-hidden="true"></label><button type="button" role="option" aria-selected="' + sel + '" class="win-lista__it' + (sel ? " es-activo" : "") + '" data-eq="elemento" data-i="' + i + '">' + esc(x) + "</button></li>";
        }).join("") + "</ul>" +
        '<div class="win-botones win-botones--izq"><button type="button" disabled>Instalar...</button><button type="button" disabled>Desinstalar</button><button type="button" data-eq="tcpip"' + (v.elemento === 3 ? "" : " disabled") + ">Propiedades</button></div>" +
        '<fieldset class="win-desc"><legend>Descripción</legend><p>' + (v.elemento === 3 ? "Protocolo TCP/IP. El protocolo de red de área extensa predeterminado que permite la comunicación entre varias redes conectadas entre sí." : "Elegí «Protocolo de Internet versión 4 (TCP/IPv4)» y tocá Propiedades.") + "</p></fieldset>" +
        '<div class="win-botones"><button type="button" data-eq="cerrar-red">Aceptar</button><button type="button" data-eq="cerrar-red">Cancelar</button></div>', "cerrar-red");
    }
    var c = est.conf, fija = c.modo === "fija";
    var dnsFijo = fija || !!c.dns1;
    function campo(nombre, rotulo, valor, activo) {
      return '<div class="win-campo"><label for="' + id + "-" + nombre + '">' + rotulo + '</label><input id="' + id + "-" + nombre + '" name="' + nombre + '" value="' + esc(valor) + '" inputmode="decimal" autocomplete="off"' + (activo ? "" : " disabled") + "></div>";
    }
    return ventana("Propiedades de Protocolo de Internet versión 4 (TCP/IPv4)", '<form data-eq-form="tcpip" novalidate><div class="win-tabs"><span class="es-activo">General</span></div>' +
      '<p class="win__ayuda">Puede hacer que la configuración IP se asigne automáticamente si la red es compatible con esta funcionalidad. De lo contrario, deberá consultar con el administrador de red cuál es la configuración IP apropiada.</p>' +
      '<label class="win-radio"><input type="radio" name="modo" value="dhcp"' + (fija ? "" : " checked") + "> Obtener una dirección IP automáticamente</label>" +
      '<fieldset class="win-grupo"><legend><label class="win-radio"><input type="radio" name="modo" value="fija"' + (fija ? " checked" : "") + "> Usar la siguiente dirección IP:</label></legend>" +
      campo("ip", "Dirección IP:", c.ip, fija) + campo("mascara", "Máscara de subred:", c.mascara, fija) + campo("puerta", "Puerta de enlace predeterminada:", c.puerta, fija) + "</fieldset>" +
      '<label class="win-radio"><input type="radio" name="dnsmodo" value="auto"' + (dnsFijo ? "" : " checked") + (fija ? " disabled" : "") + "> Obtener la dirección del servidor DNS automáticamente</label>" +
      '<fieldset class="win-grupo"><legend><label class="win-radio"><input type="radio" name="dnsmodo" value="fijo"' + (dnsFijo ? " checked" : "") + "> Usar las siguientes direcciones de servidor DNS:</label></legend>" +
      campo("dns1", "Servidor DNS preferido:", c.dns1, dnsFijo) + campo("dns2", "Servidor DNS alternativo:", c.dns2, dnsFijo) + "</fieldset>" +
      '<label class="win-check"><input type="checkbox" disabled> Validar configuración al salir</label>' +
      (v.aviso ? '<p class="win-aviso" role="alert">' + esc(v.aviso) + "</p>" : "") +
      '<div class="win-botones"><button type="submit">Aceptar</button><button type="button" data-eq="cancelar-tcpip">Cancelar</button></div></form>', "cancelar-tcpip");
  }

  function guardarTcpip(id, f) {
    var v = vistas[id], est = S.estado.equipos[id];
    var modo = f.elements.modo.value;
    v.aviso = null;
    if (modo === "dhcp") {
      est.conf = { modo: "dhcp", ip: "", mascara: "", puerta: "", dns1: "", dns2: "" };
      est.liberada = false;
      S.pedirIp(id);
    } else {
      var ip = f.elements.ip.value.trim(), mascara = f.elements.mascara.value.trim(), puerta = f.elements.puerta.value.trim();
      var dns1 = f.elements.dns1.value.trim(), dns2 = f.elements.dns2.value.trim();
      if (!S.partes(ip)) { v.aviso = "Simulador: escribí una dirección IP completa, por ejemplo 192.168.0.20."; return; }
      if (!S.partes(mascara)) { v.aviso = "Simulador: falta la máscara de subred (255.255.255.0)."; return; }
      if (puerta && !S.partes(puerta)) { v.aviso = "Simulador: la puerta de enlace no es una IP válida."; return; }
      if ((dns1 && !S.partes(dns1)) || (dns2 && !S.partes(dns2))) { v.aviso = "Simulador: revisá los servidores DNS."; return; }
      est.conf = { modo: "fija", ip: ip, mascara: mascara, puerta: puerta, dns1: dns1, dns2: dns2 };
      S.liberar(id);
      est.liberada = false;
    }
    v.red = "conexiones"; v.menu = false;
    S.guardar();
    refrescarTodo();
  }

  /* ==========================================================
     Celular
     ========================================================== */
  var VECINAS = [{ ssid: "Red-Vecina", segura: true }, { ssid: "Wi-Fi-Kiosco", segura: true }];
  function redesVisibles() {
    var r = S.estado.router, lista = [];
    if (r.wifi.radio && !r.wifi.oculta && !S.reiniciando) { lista.push({ ssid: r.wifi.ssid, segura: r.wifi.seguridad !== "No Security", nuestra: true }); }
    return lista.concat(VECINAS);
  }
  function vistaCelular() {
    var est = S.estado.equipos.cel, conectado = S.conectado("cel");
    var h = '<div class="cel"><div class="cel__pantalla"><div class="cel__barra"><span>Ajustes</span><span aria-hidden="true">' + (conectado ? "📶" : "") + "</span></div>";
    h += '<div class="cel__fila"><b>Wi-Fi</b><label class="pn-switch"><input type="checkbox" data-cel="wifi"' + (est.wifi ? " checked" : "") + '><span class="pn-switch__riel" aria-hidden="true"></span><span class="sr-only">Wi-Fi del celular</span></label></div>';
    if (!est.wifi) { return h + '<p class="cel__nota">El Wi-Fi está apagado.</p></div></div>'; }
    if (cel.pantalla === "clave") {
      h += '<form class="cel__form" data-cel-form="conectar" novalidate><p><b>' + esc(cel.red) + '</b></p><label class="cel__campo">Contraseña<input type="password" name="clave" autocomplete="off"></label>' +
        '<div class="cel__botones"><button type="button" data-cel="volver">Cancelar</button><button type="submit">Conectar</button></div></form>';
    } else if (cel.pantalla === "agregar") {
      h += '<form class="cel__form" data-cel-form="agregar" novalidate><p><b>Agregar red</b></p><label class="cel__campo">Nombre de la red (SSID)<input name="ssid" autocomplete="off" spellcheck="false"></label>' +
        '<label class="cel__campo">Contraseña<input type="password" name="clave" autocomplete="off"></label><div class="cel__botones"><button type="button" data-cel="volver">Cancelar</button><button type="submit">Guardar</button></div></form>';
    } else {
      if (conectado) {
        h += '<div class="cel__actual"><span class="cel__tit">Red actual</span><b>' + esc(est.red.ssid) + "</b><span>Conectado · IP " + S.RED + est.ip + '</span><button type="button" data-cel="olvidar">Olvidar esta red</button></div>';
      }
      h += '<span class="cel__tit">Redes disponibles</span><ul class="cel__redes">' + redesVisibles().filter(function (x) { return !(conectado && x.nuestra && est.red.ssid === x.ssid); }).map(function (x) {
        return '<li><button type="button" data-cel="red" data-ssid="' + esc(x.ssid) + '">' + esc(x.ssid) + (x.segura ? ' <span aria-label="con contraseña">🔒</span>' : "") + "</button></li>";
      }).join("") + '</ul><button type="button" class="cel__agregar" data-cel="agregar">+ Agregar red</button>';
    }
    if (cel.aviso) { h += '<p class="cel__aviso" role="status">' + esc(cel.aviso) + "</p>"; }
    return h + "</div></div>";
  }
  function conectarCelular(ssid, clave) {
    var est = S.estado.equipos.cel, r = S.estado.router;
    var nuestra = r.wifi.radio && !S.reiniciando && ssid === r.wifi.ssid;
    if (!nuestra) { cel.aviso = VECINAS.some(function (x) { return x.ssid === ssid; }) ? "Contraseña incorrecta. (Es una red vecina: no tenés su clave.)" : "No se encontró esa red."; return; }
    if (r.wifi.seguridad !== "No Security" && clave !== r.wifi.clave) { cel.aviso = "Contraseña incorrecta."; return; }
    est.red = { ssid: ssid, clave: clave };
    est.guardadas = est.guardadas.filter(function (x) { return x.ssid !== ssid; }).concat([{ ssid: ssid, clave: clave }]);
    if (S.bloqueado(S.equipo("cel").mac)) { cel.aviso = "No se pudo conectar a la red."; return; }
    S.pedirIp("cel");
    cel.aviso = est.ip !== null ? "Conectado a " + ssid + "." : "Conectado, pero sin IP: el servidor DHCP no le dio ninguna.";
    cel.pantalla = "lista";
  }

  /* ==========================================================
     Router físico: luces y botón WPS/RESET
     ========================================================== */
  function vistaRouter() {
    var r = S.estado.router, reini = S.reiniciando;
    var luces = [["Power", true], ["Wi-Fi", r.wifi.radio], ["LAN", S.EQUIPOS.some(function (eq) { return eq.tipo === "cable"; })], ["Internet", true]];
    var seg = boton.inicio ? Math.min(10, (Date.now() - boton.inicio) / 1000) : 0;
    return '<div class="rf"><div class="rf__frente' + (reini ? " es-reiniciando" : "") + '" aria-label="Luces del router">' + luces.map(function (x) {
      return '<span class="rf__luz' + (x[1] ? " es-prendida" : "") + '"><i aria-hidden="true"></i>' + x[0] + "</span>";
    }).join("") + "</div>" +
      '<div class="rf__atras"><span class="rf__puerto">Internet</span><span class="rf__puerto">LAN</span><span class="rf__puerto">LAN</span>' +
      '<button type="button" class="rf__boton" data-rf="boton" aria-describedby="rf-ayuda">WPS/<br>RESET</button></div>' +
      '<p class="rf__ayuda" id="rf-ayuda">Reset de fábrica: mantené apretado el botón WPS/RESET (con el mouse, o con la barra espaciadora) más de 5 segundos y soltalo.</p>' +
      '<div class="rf__medidor" aria-hidden="true"><span style="width:' + Math.min(100, seg / 5 * 100) + '%"></span></div>' +
      '<p class="rf__estado" role="status">' + (reini ? "El router se está reiniciando…" : boton.inicio ? "Apretado: " + seg.toFixed(1) + " s" : boton.aviso || "") + "</p>" +
      '<div class="rf__etiqueta"><b>Etiqueta del router</b><span>Panel: http://' + S.ROUTER.dominio + "</span><span>SSID de fábrica: " + S.fabrica().wifi.ssid + "</span><span>Clave Wi-Fi de fábrica: " + S.fabrica().wifi.clave + "</span><span>MAC: " + S.ROUTER.mac + "</span></div></div>";
  }
  /* Mientras está apretado solo se actualizan el medidor y el texto (el botón no se redibuja: no pierde el foco) */
  function medir() {
    var seg = (Date.now() - boton.inicio) / 1000;
    var barra = document.querySelector(".rf__medidor span"), texto = document.querySelector(".rf__estado");
    if (barra) { barra.style.width = Math.min(100, seg / 5 * 100) + "%"; }
    if (texto) { texto.textContent = "Apretado: " + seg.toFixed(1) + " s" + (seg >= 5 ? ". Ya podés soltarlo." : ""); }
  }
  function apretar() {
    if (boton.inicio || S.reiniciando) { return; }
    boton.inicio = Date.now();
    boton.aviso = "";
    boton.timer = setInterval(medir, 100);
  }
  function soltar() {
    if (!boton.inicio) { return; }
    clearInterval(boton.timer);
    var seg = (Date.now() - boton.inicio) / 1000;
    boton.inicio = 0;
    if (seg >= 5) {
      boton.aviso = "Reset de fábrica: el router vuelve a la configuración de fábrica y se reinicia.";
      S.Panel.salir();
      S.resetFabrica(function () { S.marcar("reset"); });
    } else {
      boton.aviso = "Lo soltaste a los " + seg.toFixed(1) + " s: no se hizo el reset. (En el router real, un toque corto activa WPS.)";
    }
    refrescarTodo();
  }

  /* ==========================================================
     Dibujo y eventos
     ========================================================== */
  function vistaPc(id) {
    var v = vistas[id], eq = S.equipo(id);
    var h = '<div class="pc-cab"><p>' + esc(eq.nombre) + " · conectada por cable al router</p>" +
      '<div class="pc-vistas" role="tablist"><button type="button" role="tab" aria-selected="' + (v.vista === "cmd") + '" class="' + (v.vista === "cmd" ? "es-activo" : "") + '" data-eq="vista" data-vista="cmd">Símbolo del sistema</button>' +
      '<button type="button" role="tab" aria-selected="' + (v.vista === "red") + '" class="' + (v.vista === "red" ? "es-activo" : "") + '" data-eq="vista" data-vista="red">Conexiones de red</button></div></div>';
    if (v.vista === "red") { return h + vistaRed(id); }
    return h + '<div class="term"><div class="term__barra" aria-hidden="true">Símbolo del sistema</div><pre class="term__salida" tabindex="0" aria-label="Salida del Símbolo del sistema">' +
      v.salida.map(function (x) { return x.c ? '<span class="' + x.c + '">' + esc(x.t) + "</span>" : esc(x.t); }).join("\n") +
      '</pre><form class="term__linea" data-eq-form="cmd" novalidate><label for="' + id + '-cmd" class="term__prompt">' + esc(PROMPT) + '</label><input id="' + id + '-cmd" name="cmd" autocomplete="off" spellcheck="false" autocapitalize="none"' + (v.ocupada ? " disabled" : "") + "></form></div>";
  }

  var actual = null;
  function refrescarTodo() { if (S.alCambiar) { S.alCambiar(); } }

  S.Equipos = {
    dibujar: function (cual, cont) {
      cont = cont || document.querySelector("[data-equipo='" + cual + "']");
      if (!cont) { return; }
      actual = cual;
      var enfocado = document.activeElement && cont.contains(document.activeElement) ? document.activeElement.id : null;
      if (cual === "pc1" || cual === "pc2") { cont.innerHTML = vistaPc(cual); }
      else if (cual === "cel") { cont.innerHTML = vistaCelular(); }
      else if (cual === "router") { cont.innerHTML = vistaRouter(); }
      var salida = cont.querySelector(".term__salida");
      if (salida) { salida.scrollTop = salida.scrollHeight; }
      if (enfocado && document.getElementById(enfocado)) { document.getElementById(enfocado).focus(); }
    },
    conectar: function (raiz) {
      raiz.addEventListener("click", function (e) {
        var b = e.target.closest("[data-eq],[data-cel],[data-rf]");
        if (!b) { return; }
        var caja = b.closest("[data-equipo]"), id = caja && caja.getAttribute("data-equipo");
        if (b.hasAttribute("data-rf")) { return; }
        if (b.hasAttribute("data-cel")) {
          var a = b.getAttribute("data-cel");
          if (a === "wifi") {
            S.estado.equipos.cel.wifi = b.checked;
            S.reconectarTodo();
          } else if (a === "red") {
            cel.red = b.getAttribute("data-ssid"); cel.aviso = null;
            var guardada = S.estado.equipos.cel.guardadas.filter(function (x) { return x.ssid === cel.red; })[0];
            var r = S.estado.router;
            if (guardada && cel.red === r.wifi.ssid && (r.wifi.seguridad === "No Security" || guardada.clave === r.wifi.clave)) { conectarCelular(cel.red, guardada.clave); }
            else if (r.wifi.ssid === cel.red && r.wifi.seguridad === "No Security") { conectarCelular(cel.red, ""); }
            else { cel.pantalla = "clave"; }
          } else if (a === "volver") { cel.pantalla = "lista"; cel.aviso = null; }
          else if (a === "agregar") { cel.pantalla = "agregar"; cel.aviso = null; }
          else if (a === "olvidar") {
            var est = S.estado.equipos.cel;
            est.guardadas = est.guardadas.filter(function (x) { return x.ssid !== est.red.ssid; });
            est.red = null; S.reconectarTodo(); cel.aviso = "Se olvidó la red.";
          }
          S.guardar(); refrescarTodo();
          return;
        }
        var v = vistas[id], acc = b.getAttribute("data-eq");
        if (acc === "vista") { v.vista = b.getAttribute("data-vista"); v.red = "conexiones"; v.menu = false; }
        else if (acc === "adaptador") { v.menu = !v.menu; }
        else if (acc === "propiedades") { v.red = "propiedades"; v.menu = false; v.elemento = null; }
        else if (acc === "elemento") {
          var i = Number(b.getAttribute("data-i"));
          if (e.detail === 2 && i === 3) { v.red = "tcpip"; v.aviso = null; } else { v.elemento = i; }
        }
        else if (acc === "tcpip") { v.red = "tcpip"; v.aviso = null; }
        else if (acc === "cancelar-tcpip") { v.red = "propiedades"; v.aviso = null; }
        else if (acc === "cerrar-red") { v.red = "conexiones"; v.menu = false; }
        S.Equipos.dibujar(id);
      });
      raiz.addEventListener("contextmenu", function (e) {
        var b = e.target.closest("[data-eq=adaptador]");
        if (!b) { return; }
        e.preventDefault();
        var id = b.closest("[data-equipo]").getAttribute("data-equipo");
        vistas[id].menu = true;
        S.Equipos.dibujar(id);
      });
      raiz.addEventListener("change", function (e) {
        var f = e.target.closest("[data-eq-form=tcpip]");
        if (!f) { return; }
        var fija = f.elements.modo.value === "fija";
        ["ip", "mascara", "puerta"].forEach(function (n) { f.elements[n].disabled = !fija; });
        if (fija) { f.querySelector("input[name=dnsmodo][value=fijo]").checked = true; }
        f.querySelector("input[name=dnsmodo][value=auto]").disabled = fija;
        var dnsFijo = f.elements.dnsmodo.value === "fijo";
        f.elements.dns1.disabled = !dnsFijo; f.elements.dns2.disabled = !dnsFijo;
        if (fija && !f.elements.mascara.value) { f.elements.mascara.value = "255.255.255.0"; }
      });
      raiz.addEventListener("submit", function (e) {
        var f = e.target;
        var caja = f.closest("[data-equipo]");
        if (!caja) { return; }
        e.preventDefault();
        var id = caja.getAttribute("data-equipo");
        if (f.getAttribute("data-eq-form") === "cmd") {
          var texto = f.elements.cmd.value;
          f.elements.cmd.value = "";
          ejecutar(id, texto);
          S.Equipos.dibujar(id);
          var nuevo = document.getElementById(id + "-cmd");
          if (nuevo) { nuevo.focus(); }
        } else if (f.getAttribute("data-eq-form") === "tcpip") {
          guardarTcpip(id, f);
          S.Equipos.dibujar(id);
        } else if (f.getAttribute("data-cel-form") === "conectar") {
          conectarCelular(cel.red, f.elements.clave.value);
          S.guardar(); refrescarTodo();
        } else if (f.getAttribute("data-cel-form") === "agregar") {
          conectarCelular(f.elements.ssid.value.trim(), f.elements.clave.value);
          S.guardar(); refrescarTodo();
        }
      });
      raiz.addEventListener("keydown", function (e) {
        if (e.target.name === "cmd" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
          var id = e.target.closest("[data-equipo]").getAttribute("data-equipo"), v = vistas[id];
          v.pos = Math.max(0, Math.min(v.historial.length, v.pos + (e.key === "ArrowUp" ? -1 : 1)));
          e.target.value = v.historial[v.pos] || "";
          e.preventDefault();
        }
        if (e.target.matches && e.target.matches("[data-rf=boton]") && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          if (!e.repeat) { apretar(); }
        }
        if (e.target.matches && e.target.matches("[data-eq=adaptador]") && (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10"))) {
          e.preventDefault();
          var idA = e.target.closest("[data-equipo]").getAttribute("data-equipo");
          vistas[idA].menu = true; S.Equipos.dibujar(idA);
        }
      });
      document.addEventListener("keyup", function (e) {
        if (boton.inicio && (e.key === " " || e.key === "Enter")) { soltar(); }
      });
      raiz.addEventListener("pointerdown", function (e) {
        if (e.target.closest("[data-rf=boton]")) { e.preventDefault(); apretar(); }
      });
      document.addEventListener("pointerup", soltar);
    }
  };
})(Sim);
