(function () {
  var RAW_VIDEOS = "https://raw.githubusercontent.com/familiapiemontesafreyre/familia-piemontesa-freyre/main/content/videos.json?c=" + Date.now();

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function semilla(t) {
    var s = String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return s || "sin-titulo";
  }

  function idYouTube(url) {
    var m = String(url || "").match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : "";
  }

  function chipCat(c) {
    var l = { familia: "Familia", oficios: "Oficios", festejos: "Festejos", entrevistas: "Entrevista" };
    return l[c] || c;
  }

  function primeraCat(v) {
    var c = (v.categoria || "").split(/\s+/).filter(function (x) { return x; });
    return c.length ? chipCat(c[0]) : "Familia";
  }

  function tarjetaVideo(v) {
    var id = idYouTube(v.urlYouTube);
    var src = id
      ? "https://img.youtube.com/vi/" + id + "/hqdefault.jpg"
      : "https://picsum.photos/seed/video-" + semilla(v.titulo) + "/1280/720?grayscale";
    var href = v.urlYouTube || "#";
    var dur = v.duracion
      ? '<span class="absolute bottom-4 right-4 rounded-full bg-black/55 px-3 py-1 text-[11.5px] font-medium tracking-wide text-white backdrop-blur-sm">' + esc(v.duracion) + "</span>"
      : "";
    return '<article class="tarjeta grupo-foto" data-categoria="' + esc(v.categoria) + '">' +
      '<a href="' + esc(href) + '"' + (href === "#" ? "" : ' target="_blank" rel="noopener"') + ' class="block">' +
      '<div class="relative aspect-video overflow-hidden">' +
      '<img src="' + esc(src) + '" alt="" class="foto-historica h-full w-full object-cover" loading="lazy" decoding="async">' +
      '<span class="absolute left-4 top-4 chip !bg-white/85">' + esc(primeraCat(v)) + "</span>" +
      dur +
      '<span class="absolute inset-0 grid place-items-center" aria-hidden="true">' +
      '<span class="grid h-14 w-14 place-items-center rounded-full bg-white/85 backdrop-blur-sm transition-transform duration-500 group-hover:scale-105">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="#1D1D1F" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5z"/></svg>' +
      "</span></span></div>" +
      '<div class="p-6">' +
      '<h3 class="h-carta texto-balance">' + esc(v.titulo) + "</h3>" +
      '<p class="mt-3 text-[14.5px] leading-relaxed text-ink-soft">' + esc(v.descripcion) + "</p>" +
      "</div></a></article>";
  }

  function vincularFiltros() {
    var grupo = document.querySelector('[data-filtros="#grilla-videos"]');
    if (!grupo) return;
    var clon = grupo.cloneNode(false);
    if (clon.classList.contains("reveal")) clon.classList.add("visible");
    Array.prototype.slice.call(grupo.childNodes).forEach(function (n) { clon.appendChild(n); });
    grupo.replaceWith(clon);
    var botones = Array.prototype.slice.call(clon.querySelectorAll("[data-filtro]"));
    var diana = document.getElementById("grilla-videos");
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

  function render(datos) {
    var diana = document.getElementById("grilla-videos");
    if (!diana) return;
    var lista = (datos && datos.videos ? datos.videos : []).filter(function (v) { return !v.oculto; });
    if (!lista.length) {
      diana.innerHTML = '<p class="text-muted text-[14.5px]">Todavía no hay videos publicados.</p>';
      return;
    }
    diana.innerHTML = lista.map(tarjetaVideo).join("");
    vincularFiltros();
  }

  fetch(RAW_VIDEOS)
    .then(function (r) {
      if (!r.ok) throw new Error("no_videos");
      return r.json();
    })
    .then(render)
    .catch(function () {
      var diana = document.getElementById("grilla-videos");
      if (diana) diana.innerHTML = '<p class="text-muted text-[14.5px]">No se pudieron cargar los videos. Probá recargar la página.</p>';
    });
})();
