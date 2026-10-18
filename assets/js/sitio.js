/* =========================================================================
   Familia Piemontesa de Freyre — Comportamiento del sitio
   JS vanilla, sin dependencias. Todo degrada con gracia si no se ejecuta.
   ========================================================================= */
(function () {
  "use strict";

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------------
     1. Navbar: sombra/compactado al hacer scroll + menú mobile
     --------------------------------------------------------------------- */
  function nav() {
    var shell = $("[data-nav]");
    var btn   = $("[data-menu-btn]");
    var panel = $("[data-menu-panel]");
    if (!shell) return;

    var ultimo = window.scrollY;
    function alScroll() {
      var y = window.scrollY;
      var bajando = y > ultimo;
      shell.classList.toggle("glass", y > 12);
      shell.classList.toggle("glass-fuerte", y > 12 && panel && !panel.hidden);
      if (y > 220 && bajando) shell.style.transform = "translateY(calc(-100% - 28px))";
      else shell.style.transform = "";
      ultimo = y;
    }
    window.addEventListener("scroll", alScroll, { passive: true });
    alScroll();

    if (!btn || !panel) return;
    function cerrar() {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      shell.classList.remove("glass-fuerte");
    }
    function abrir() {
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      shell.classList.add("glass-fuerte");
    }
    btn.addEventListener("click", function () {
      if (panel.hidden) abrir(); else cerrar();
    });
    $$("a", panel).forEach(function (a) { a.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) cerrar();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && !panel.hidden) cerrar();
    });
  }

  /* ---------------------------------------------------------------------
     2. Revelado por scroll
     --------------------------------------------------------------------- */
  function revelar() {
    var objetivos = $$(".reveal, .reveal-suave, .reveal-linea");
    if (!objetivos.length) return;

    if (reducido || !("IntersectionObserver" in window)) {
      objetivos.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var d = en.target.getAttribute("data-retardo");
        if (d) en.target.style.setProperty("--retardo", d + "ms");
        en.target.classList.add("visible");
        obs.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    objetivos.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------------------------------------------------------------
     3. Línea de tiempo: barra de progreso + ítem activo
     --------------------------------------------------------------------- */
  function timeline() {
    var riel = $("[data-timeline]");
    if (!riel) return;
    var progreso = $(".tl-progreso", riel);
    var items = $$(".tl-item", riel);
    if (!items.length) return;

    function pintar() {
      var r = riel.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = r.height;
      var recorrido = Math.min(Math.max(vh * 0.55 - r.top, 0), total);
      if (progreso) progreso.style.height = recorrido + "px";

      var eje = vh * 0.5;
      items.forEach(function (it) {
        var b = it.getBoundingClientRect();
        var centro = b.top + b.height / 2;
        it.classList.toggle("activo", centro < eje + 40 && b.bottom > eje - 40);
      });
    }
    window.addEventListener("scroll", pintar, { passive: true });
    window.addEventListener("resize", pintar);
    pintar();
  }

  /* ---------------------------------------------------------------------
     4. Contadores numéricos
     --------------------------------------------------------------------- */
  function contadores() {
    var nodos = $$("[data-contador]");
    if (!nodos.length) return;

    function animar(el) {
      var destino = parseFloat(el.getAttribute("data-contador")) || 0;
      var sufijo  = el.getAttribute("data-sufijo") || "";
      if (reducido) { el.textContent = destino + sufijo; return; }
      var inicio = performance.now(), dur = 1500;
      function paso(t) {
        var p = Math.min((t - inicio) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(destino * e) + sufijo;
        if (p < 1) requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    }

    if (!("IntersectionObserver" in window)) { nodos.forEach(animar); return; }
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        animar(en.target); obs.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  /* ---------------------------------------------------------------------
     5. Filtros de feed (crónicas / memorias / videos)
     --------------------------------------------------------------------- */
  function filtros() {
    $$("[data-filtros]").forEach(function (grupo) {
      var botones = $$("[data-filtro]", grupo);
      var diana = document.querySelector(grupo.getAttribute("data-filtros"));
      if (!diana) return;
      var items = $$("[data-categoria]", diana);

      botones.forEach(function (b) {
        b.addEventListener("click", function () {
          var f = b.getAttribute("data-filtro");
          botones.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
          items.forEach(function (it) {
            var cats = (it.getAttribute("data-categoria") || "").split(/\s+/);
            it.hidden = !(f === "todas" || cats.indexOf(f) !== -1);
          });
          var contar = items.filter(function (i) { return !i.hidden; }).length;
          var aviso = $("#filtro-vacio");
          if (aviso) aviso.hidden = contar !== 0;
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     6. Modal "Aportar una Memoria"
     --------------------------------------------------------------------- */
  function modal() {
    var fondo = $("#modal-memoria");
    if (!fondo) return;
    var caja = $(".modal-caja", fondo);
    var previo = null;

    function abrir(disparador) {
      previo = disparador || document.activeElement;
      fondo.hidden = false;
      requestAnimationFrame(function () { fondo.classList.add("abierto"); });
      document.body.classList.add("sin-scroll");
      var primer = caja.querySelector("input, textarea, button, select");
      if (primer) setTimeout(function () { primer.focus(); }, 320);
    }
    function cerrar() {
      fondo.classList.remove("abierto");
      document.body.classList.remove("sin-scroll");
      setTimeout(function () { fondo.hidden = true; }, 420);
      if (previo && previo.focus) previo.focus();
    }

    $$("[data-abrir-memoria]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); abrir(b); });
    });
    $$("[data-cerrar-memoria]").forEach(function (b) {
      b.addEventListener("click", cerrar);
    });
    fondo.addEventListener("click", function (e) { if (e.target === fondo) cerrar(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !fondo.hidden) cerrar();
      if (e.key !== "Tab" || fondo.hidden || !caja) return;
      var foco = $$("a[href], button:not([disabled]), input:not([disabled]), textarea, select", caja);
      if (!foco.length) return;
      var primero = foco[0], ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
  }

  /* ---------------------------------------------------------------------
     7. Drag & drop de archivos + validación
     --------------------------------------------------------------------- */
  function archivos() {
    var zona = $("[data-zona-soltar]");
    if (!zona) return;
    var input = $("input[type=file]", zona);
    var lista = $("[data-archivos]");
    var MAX = 12 * 1024 * 1024;
    var TIPOS = /^(image\/(jpeg|png|webp|tiff|heic)|application\/pdf)$/i;
    var seleccion = [];

    function pintar() {
      if (!lista) return;
      lista.innerHTML = "";
      seleccion.forEach(function (f, i) {
        var chip = document.createElement("div");
        chip.className = "archivo-chip";
        var mb = (f.size / 1048576).toFixed(1);
        chip.innerHTML =
          '<span class="truncate max-w-[190px]">' + f.name.replace(/[<>&"]/g, "") + "</span>" +
          '<span class="text-[11px] text-[#9A9A9E] shrink-0">' + mb + " MB</span>" +
          '<button type="button" class="w-6 h-6 grid place-items-center rounded-full hover:bg-black/5 shrink-0" aria-label="Quitar archivo">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          "</button>";
        chip.querySelector("button").addEventListener("click", function () {
          seleccion.splice(i, 1); pintar();
        });
        lista.appendChild(chip);
      });
    }

    function agregar(files) {
      Array.prototype.slice.call(files).forEach(function (f) {
        if (!TIPOS.test(f.type)) return;
        if (f.size > MAX) return;
        if (seleccion.length >= 8) return;
        seleccion.push(f);
      });
      pintar();
    }

    zona.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      if (input) input.click();
    });
    if (input) {
      input.addEventListener("change", function () { agregar(input.files); input.value = ""; });
    }
    ["dragenter", "dragover"].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add("encima"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); if (ev === "drop" || !zona.contains(e.relatedTarget)) zona.classList.remove("encima"); });
    });
    zona.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) agregar(e.dataTransfer.files);
    });
  }

  /* ---------------------------------------------------------------------
     8. Envío del formulario (Formspree con fallback a mailto)
     --------------------------------------------------------------------- */
  function formulario() {
    var form = $("#form-memoria");
    if (!form) return;
    var aviso = $("#form-aviso");
    var correo = form.getAttribute("data-correo") || "familiapiemontesafreyre@gmail.com";
    var accion = form.getAttribute("action") || "";
    var sinEndpoint = !accion || /XXXXXXX/.test(accion);

    function mensaje(txt, ok) {
      if (!aviso) return;
      aviso.hidden = false;
      aviso.textContent = txt;
      aviso.className = "text-[13.5px] leading-relaxed " + (ok ? "text-[#585A40]" : "text-[#A2683F]");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var boton = form.querySelector("[type=submit]");
      var datos = new FormData(form);
      datos.append("origen", location.href);
      datos.append("_subject", "Nueva memoria para el álbum familiar");

      if (sinEndpoint) {
        var cuerpo = [];
        datos.forEach(function (v, k) {
          if (v instanceof File) return;
          cuerpo.push(k + ": " + v);
        });
        var asunto = encodeURIComponent("Aportar una memoria — Familia Piemontesa de Freyre");
        var texto = encodeURIComponent(cuerpo.join("\n") + "\n\n(Recordá adjuntar manualmente las imágenes en este correo.)");
        window.location.href = "mailto:" + correo + "?subject=" + asunto + "&body=" + texto;
        mensaje("Abrimos tu cliente de correo con los datos cargados. Adjuntá las imágenes y enviá el mensaje.", true);
        return;
      }

      if (boton) { boton.disabled = true; boton.dataset.txt = boton.textContent; boton.textContent = "Enviando…"; }
      fetch(accion, { method: "POST", body: datos, headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
        .then(function () {
          form.reset();
          var lista = $("[data-archivos]"); if (lista) lista.innerHTML = "";
          mensaje("¡Gracias! Recibimos tu aporte. Lo revisaremos antes de publicarlo en el álbum.", true);
        })
        .catch(function () {
          mensaje("No pudimos enviarlo. Escribinos a " + correo + " y lo cargamos nosotros.", false);
        })
        .then(function () {
          if (boton) { boton.disabled = false; boton.textContent = boton.dataset.txt || "Enviar"; }
        });
    });
  }

  /* ---------------------------------------------------------------------
     9. Detalles finales
     --------------------------------------------------------------------- */
  function detalles() {
    $$("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

    var arriba = $("[data-volver-arriba]");
    if (arriba) {
      window.addEventListener("scroll", function () {
        arriba.classList.toggle("opacity-0", window.scrollY < 700);
        arriba.classList.toggle("pointer-events-none", window.scrollY < 700);
      }, { passive: true });
      arriba.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reducido ? "auto" : "smooth" });
      });
    }
  }

  function iniciar() {
    nav(); revelar(); timeline(); contadores(); filtros();
    modal(); archivos(); formulario(); detalles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
