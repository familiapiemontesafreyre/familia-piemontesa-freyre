(function () {
  var RAW_ALBUM = "https://raw.githubusercontent.com/familiapiemontesafreyre/familia-piemontesa-freyre/main/content/album.json?c=" + Date.now();

  var catalogo = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function imgDe(clave, fallback) {
    if (catalogo && catalogo.claves && catalogo.claves[clave] && catalogo.claves[clave].url) {
      return catalogo.claves[clave].url;
    }
    return fallback || "";
  }

  function tarjetaFoto(t) {
    return '<figure class="memoria grupo-foto tarjeta" data-categoria="' + esc(t.categoria) + '">' +
      '<div class="relative overflow-hidden"><img src="' + esc(imgDe(t.clave, t.src)) + '" alt="' + esc(t.alt) + '" class="foto-historica w-full object-cover" loading="lazy" decoding="async" data-imgkey="' + esc(t.clave) + '"></div>' +
      '<figcaption class="p-5"><p class="eyebrow !text-faint">' + esc(t.eyebrow) + "</p>" +
      '<p class="mt-2 text-[14px] leading-relaxed text-ink-soft">' + esc(t.pie) + "</p></figcaption></figure>";
  }

  function tarjetaRelato(t) {
    var serif = (t.eyebrow || "").toLowerCase() === "documento";
    return '<figure class="memoria tarjeta carta-papel" data-categoria="' + esc(t.categoria) + '">' +
      '<div class="p-6 renglon"><p class="eyebrow !text-faint">' + esc(t.eyebrow) + "</p>" +
      (serif
        ? '<p class="serif mt-3 text-[17px] leading-relaxed text-ink">' + esc(t.cita) + "</p>"
        : '<p class="mt-3 text-[14.5px] leading-relaxed text-ink-soft">' + esc(t.cita) + "</p>") +
      '<p class="mt-4 text-[13px] text-muted">' + esc(t.fuente) + "</p></div></figure>";
  }

  function tarjetaFicha(t) {
    return '<article class="tarjeta-plana" data-categoria="' + esc(t.categoria) + '">' +
      '<div class="p-6 md:p-7"><div class="flex flex-wrap items-center gap-2">' +
      (t.codigo ? '<span class="archivo-chip">' + esc(t.codigo) + "</span>" : "") +
      (t.rubro ? '<span class="chip">' + esc(t.rubro) + "</span>" : "") +
      "</div>" +
      '<h3 class="h-carta mt-4 texto-balance">' + esc(t.titulo) + "</h3>" +
      '<p class="mt-3 text-[14.5px] leading-relaxed text-ink-soft">' + esc(t.texto) + "</p></div></article>";
  }

  function tarjetaValija(t) {
    return '<article class="tarjeta-plana overflow-hidden">' +
      '<div class="p-7 md:p-9"><p class="eyebrow !text-faint">' + esc(t.rubro) + "</p>" +
      '<h3 class="h-carta mt-3 texto-balance">' + esc(t.titulo) + "</h3>" +
      '<p class="mt-4 text-[15px] leading-relaxed text-ink-soft">' + esc(t.texto) + "</p></div></article>";
  }

  function tarjetaCta(t) {
    return '<article class="tarjeta-plana grupo-foto overflow-hidden">' +
      '<a href="' + esc(t.href) + '" class="block">' +
      '<div class="relative aspect-[16/10] overflow-hidden"><img src="' + esc(imgDe(t.clave, t.src)) + '" alt="" class="foto-historica h-full w-full object-cover" loading="lazy" decoding="async" data-imgkey="' + esc(t.clave) + '">' +
      (t.chip ? '<span class="absolute left-5 top-5 chip !bg-white/85">' + esc(t.chip) + "</span>" : "") +
      "</div>" +
      '<div class="p-7 md:p-9"><h2 class="h-seccion !text-[clamp(1.5rem,2.6vw,2.1rem)] texto-balance">' + esc(t.titulo) + "</h2>" +
      '<p class="mt-4 text-[15px] leading-relaxed text-ink-soft">' + esc(t.texto) + "</p>" +
      '<span class="enlace mt-6 inline-block text-[13.5px] font-medium">' + esc(t.enlace) + "</span></div></a></article>";
  }

  var constructores = { foto: tarjetaFoto, relato: tarjetaRelato, ficha: tarjetaFicha, valija: tarjetaValija, cta: tarjetaCta };

  function pintarTarjetas(seccion) {
    var diana = document.getElementById(seccion.id);
    if (!diana) return false;
    var html = "";
    (seccion.tarjetas || []).forEach(function (t) {
      var fn = constructores[t.tipo];
      if (fn) html += fn(t);
    });
    if (!html) return false;
    diana.innerHTML = html;
    return true;
  }

  function pintarFiltros(seccion) {
    var diana = document.getElementById(seccion.id);
    var grupo = diana ? document.querySelector('[data-filtros="#' + seccion.id + '"]') : null;
    if (!grupo || !seccion.filtros) return;
    var clon = grupo.cloneNode(false);
    clon.removeAttribute("data-album");
    if (clon.classList.contains("reveal")) clon.classList.add("visible");
    (seccion.filtros || []).forEach(function (f, i) {
      var b = document.createElement("button");
      b.className = "filtro";
      b.type = "button";
      b.setAttribute("data-filtro", f.f);
      b.setAttribute("aria-pressed", String(i === 0));
      b.textContent = f.etiqueta;
      clon.appendChild(b);
    });
    grupo.replaceWith(clon);
    var botones = Array.prototype.slice.call(clon.querySelectorAll("[data-filtro]"));
    var items = Array.prototype.slice.call(diana.querySelectorAll("[data-categoria]"));
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filtro");
        botones.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        items.forEach(function (it) {
          var cats = (it.getAttribute("data-categoria") || "").split(/\s+/);
          it.hidden = !(f === "todas" || cats.indexOf(f) !== -1);
        });
        var aviso = document.getElementById("filtro-vacio");
        if (aviso) aviso.hidden = items.filter(function (i) { return !i.hidden; }).length !== 0;
      });
    });
  }

  function render(paginas) {
    ["memorias", "origenes", "archivo"].forEach(function (pagina) {
      (paginas[pagina] || []).forEach(function (seccion) {
        if (pintarTarjetas(seccion)) pintarFiltros(seccion);
      });
    });
  }

  var datos = fetch(RAW_ALBUM).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("no_album")); });
  var imagen = (window.familiaImagenesListo || Promise.resolve(null));

  Promise.all([
    datos.catch(function () { return null; }),
    imagen.catch(function () { return null; })
  ]).then(function (res) {
    if (!res[0] || !res[0].paginas) return;
    catalogo = res[1];
    render(res[0].paginas);
  });
})();
