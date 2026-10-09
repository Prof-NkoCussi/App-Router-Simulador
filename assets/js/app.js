/* ==========================================================
   Simulador del router · app.js
   Arma la pantalla: el navegador (con el panel del router), las pestañas de la derecha
   (práctica, las dos PC, el celular y el router) y la bienvenida.
   ========================================================== */
(function (S) {
  "use strict";
  var esc = function (t) { return S.esc(t); };

  var nav = { url: "", pagina: "inicio", pestana: "practica" };
  var $ = function (sel) { return document.querySelector(sel); };

  /* ---- Navegador ---- */
  function normalizar(texto) {
    return String(texto || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }
  function ir(texto) {
    var dir = normalizar(texto);
    nav.url = dir ? "http://" + dir + "/" : "";
    if (!dir) { nav.pagina = "inicio"; }
    else if (dir === S.ROUTER.dominio || dir === S.ROUTER.lanIp) { nav.pagina = "router"; S.marcar("entro"); }
    else { nav.pagina = "otra"; nav.otra = dir; }
    dibujarNavegador();
  }
  function paginaError(titulo, detalle, pista) {
    return '<div class="nv-error"><svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="6" y="8" width="36" height="28" rx="3"/><path d="M18 18l12 12M30 18 18 30"/></svg>' +
      "<h1>" + esc(titulo) + "</h1><p>" + esc(detalle) + "</p>" + (pista ? '<p class="nv-error__pista"><b>Simulador:</b> ' + esc(pista) + "</p>" : "") + "</div>";
  }
  function dibujarNavegador() {
    var cont = $("#nv-contenido");
    $("#nv-url").value = nav.url;
    if (S.reiniciando) {
      cont.innerHTML = '<div class="nv-reinicio" role="status"><p>El router se está reiniciando…</p><div class="nv-reinicio__barra"><span></span></div><p class="nv-reinicio__nota">Mientras tanto, los equipos no tienen conexión.</p></div>';
      return;
    }
    if (nav.pagina === "inicio") {
      cont.innerHTML = '<div class="nv-inicio"><h1>Navegador de tu PC</h1><p>Para entrar al panel del router, escribí su dirección en la barra de arriba: la puerta de enlace que muestra <code>ipconfig</code> o <code>tplinkwifi.net</code>.</p></div>';
      return;
    }
    if (nav.pagina === "otra") {
      cont.innerHTML = paginaError("No se puede acceder a este sitio", nav.otra + " tardó demasiado en responder.",
        "en este navegador solo se puede entrar al panel del router. Revisá la dirección: es la puerta de enlace de tu PC.");
      return;
    }
    if (!S.llegaAlRouter("pc1")) {
      var c = S.configDe("pc1");
      cont.innerHTML = paginaError("No se puede acceder a este sitio", normalizar(nav.url) + " tardó demasiado en responder.",
        c.modo === "liberada" ? "tu PC no tiene IP (la liberaste con ipconfig /release). Pedí una con ipconfig /renew." :
          c.modo === "apipa" ? "tu PC tiene una IP 169.254: no recibió IP del servidor DHCP. Revisá el DHCP del router y pedí otra con ipconfig /renew." :
            S.bloqueado(S.equipo("pc1").mac) ? "el control de acceso del router bloquea a tu PC. Hacé un reset de fábrica para recuperar el acceso." :
              "tu PC no está en la red del router. Revisá su IP con ipconfig.");
      return;
    }
    S.Panel.dibujar(cont);
  }

  /* ---- Pestañas de la derecha ---- */
  var PESTANAS = [["practica", "Práctica"], ["pc1", "Tu PC"], ["pc2", "Otra PC"], ["cel", "Celular"], ["router", "Router"]];
  function dibujarPestanas() {
    $("#lat-tabs").innerHTML = PESTANAS.map(function (p) {
      var sel = nav.pestana === p[0];
      return '<button type="button" role="tab" id="tab-' + p[0] + '" aria-controls="lat-panel" aria-selected="' + sel + '" class="lat-tab' + (sel ? " es-activo" : "") + '" data-app="pestana" data-p="' + p[0] + '"' + (sel ? "" : ' tabindex="-1"') + ">" + p[1] + "</button>";
    }).join("");
    var panel = $("#lat-panel");
    panel.setAttribute("aria-labelledby", "tab-" + nav.pestana);
    panel.setAttribute("data-equipo", nav.pestana);
  }
  function dibujarLateral() {
    var panel = $("#lat-panel");
    if (nav.pestana === "practica") { S.Practica.dibujar(panel); }
    else { S.Equipos.dibujar(nav.pestana, panel); }
  }
  function dibujarCabecera() {
    $("#app-alumno").textContent = S.estado.alumno ? S.estado.alumno : "";
    var t = $("#app-trad");
    t.setAttribute("aria-pressed", String(!!S.estado.traduccion));
    t.textContent = S.estado.traduccion ? "Traducción: sí" : "Traducción: no";
  }

  S.alCambiar = function () { dibujarNavegador(); dibujarLateral(); dibujarCabecera(); };
  S.alPracticar = function () { if (nav.pestana === "practica") { dibujarLateral(); } };

  /* ---- Ventanas: bienvenida y resumen ---- */
  function abrirModal(html) {
    var m = $("#modal");
    m.querySelector(".modal__cuerpo").innerHTML = html;
    m.hidden = false;
    var primero = m.querySelector("input, button");
    if (primero) { primero.focus(); }
  }
  function cerrarModal() { $("#modal").hidden = true; }
  function bienvenida() {
    abrirModal('<form class="bienv" data-app-form="nombre" novalidate><h2 id="modal-tit">Simulador del router</h2>' +
      "<p>Vas a configurar un router como el del laboratorio (TP-Link TL-WR850N v3): entrar al panel, cambiar el Wi-Fi, ver el DHCP, reservar una IP, poner una IP fija y guardar una copia de seguridad.</p>" +
      "<p>Usás tres cosas: el <b>navegador</b> de tu PC (a la izquierda), las <b>PC</b> con su Símbolo del sistema, y el <b>celular</b> y el <b>router</b> (pestañas de la derecha). La lista de la pestaña <b>Práctica</b> se va tildando sola.</p>" +
      '<p class="bienv__aviso">Es una simulación: no es un router real y nada sale de esta computadora. No escribas contraseñas que uses en otro lado.</p>' +
      '<label class="bienv__campo">Tu nombre y apellido<input name="alumno" autocomplete="name" value="' + esc(S.estado.alumno) + '" required></label>' +
      '<p class="bienv__error" role="alert" hidden>Escribí tu nombre y apellido: van en el resumen de la entrega.</p>' +
      '<button class="boton" type="submit">Empezar</button></form>');
  }

  /* ---- Eventos generales ---- */
  function conectar() {
    $("#nv-form").addEventListener("submit", function (e) { e.preventDefault(); ir($("#nv-url").value); });
    $("#nv-recargar").addEventListener("click", function () { dibujarNavegador(); });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-app]");
      if (!b) { return; }
      var a = b.getAttribute("data-app");
      if (a === "pestana") { nav.pestana = b.getAttribute("data-p"); dibujarPestanas(); dibujarLateral(); }
      else if (a === "resumen") { abrirModal(S.Practica.resumen() + '<div class="modal__botones"><button type="button" class="boton boton--claro" data-app="imprimir">Imprimir</button><button type="button" class="boton" data-app="cerrar">Cerrar</button></div>'); }
      else if (a === "cerrar") { cerrarModal(); }
      else if (a === "imprimir") { window.print(); }
      else if (a === "traduccion") { S.estado.traduccion = !S.estado.traduccion; S.guardar(); S.alCambiar(); }
      else if (a === "nombre") { bienvenida(); }
      else if (a === "de-nuevo") {
        if (window.confirm("¿Empezar la práctica de nuevo? Se borra todo lo que configuraste (tu nombre queda).")) {
          var nombre = S.estado.alumno;
          S.borrar();
          S.estado.alumno = nombre;
          S.Panel.salir();
          nav.url = ""; nav.pagina = "inicio";
          S.guardar();
          S.alCambiar();
        }
      }
    });
    /* Pestañas con el teclado: flechas izquierda y derecha */
    $("#lat-tabs").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") { return; }
      var i = PESTANAS.map(function (p) { return p[0]; }).indexOf(nav.pestana);
      i = (i + (e.key === "ArrowRight" ? 1 : PESTANAS.length - 1)) % PESTANAS.length;
      nav.pestana = PESTANAS[i][0];
      dibujarPestanas(); dibujarLateral();
      document.getElementById("tab-" + nav.pestana).focus();
    });
    document.addEventListener("submit", function (e) {
      var f = e.target.closest("[data-app-form=nombre]");
      if (!f) { return; }
      e.preventDefault();
      var nombre = f.elements.alumno.value.trim();
      if (nombre.split(/\s+/).length < 2) { f.querySelector(".bienv__error").hidden = false; f.elements.alumno.focus(); return; }
      S.estado.alumno = nombre;
      S.guardar();
      cerrarModal();
      dibujarCabecera();
      $("#nv-url").focus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#modal").hidden && S.estado.alumno) { cerrarModal(); }
    });
    S.Panel.conectar($("#nv-contenido"));
    S.Equipos.conectar($("#lat-panel"));
  }

  /* ---- Inicio ---- */
  S.cargar();
  S.Panel.salir();
  conectar();
  dibujarPestanas();
  S.alCambiar();
  if (!S.estado.alumno) { bienvenida(); }
})(Sim);
