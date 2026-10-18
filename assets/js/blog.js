/* Blog de la familia — render simple desde blog/posts.json */
(async function () {
  const lista = document.getElementById("lista-entradas");
  const vacia = document.getElementById("lista-vacia");
  const vistaLista = document.getElementById("vista-lista");
  const vistaEntrada = document.getElementById("vista-entrada");

  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function fechaLarga(iso) {
    try {
      return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    } catch { return iso; }
  }

  function md(cuerpo) {
    let t = esc(cuerpo || "");
    t = t.replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, (_, alt, src) =>
      `<img src="${src}" alt="${alt}" class="rounded-2xl my-6 w-full object-cover max-h-[520px]" loading="lazy">`);
    t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a class="enlace" href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/https?:\/\/open\.spotify\.com\/(\w+)\/(\w+)/,
      (m0, tipo, id) => `<iframe class="my-6" style="border-radius:12px" src="https://open.spotify.com/embed/${tipo}/${id}" width="100%" height="152" frameborder="0" allow="encrypted-media" loading="lazy"></iframe>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/^### (.+)$/gm, '<h3 class="serif mt-10 mb-3 text-[22px]">$1</h3>');
    t = t.replace(/^- (.+)$/gm, "<li>$1</li>").replace(/\n(<li>[\s\S]*?<\/li>)(?!\n<li>)/g, "<ul>$1</ul>");
    const parrafos = t.split(/\n{2,}/).map(p =>
      /^\s*<(h3|ul|img|iframe)/.test(p.trim()) ? p.trim() : `<p>${p.trim().replace(/\n/g, "<br>")}</p>`).join("\n");
    return parrafos;
  }

  let posts = [];
  try {
    const r = await fetch("blog/posts.json", { cache: "no-store" });
    posts = (await r.json()).posts || [];
  } catch { posts = []; }

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");

  if (slug) {
    const p = posts.find(x => x.slug === slug);
    if (p) {
      vistaLista.classList.add("hidden");
      vistaEntrada.classList.remove("hidden");
      document.getElementById("entrada-titulo").textContent = p.titulo;
      document.getElementById("entrada-fecha").textContent = fechaLarga(p.fecha);
      document.getElementById("entrada-cuerpo").innerHTML = md(p.cuerpo);
      document.title = p.titulo + " — Familia Piemontesa de Freyre";
    }
  }

  if (!slug) {
    const ordenados = [...posts].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    if (!ordenados.length) {
      vacia.classList.remove("hidden");
      return;
    }
    lista.innerHTML = ordenados.map((p, i) => `
      <a href="blog.html?slug=${encodeURIComponent(p.slug)}" class="block group ${i < 2 ? "sm:col-span-1" : ""}">
        <div class="overflow-hidden rounded-3xl border border-hair bg-surface/50 transition-transform duration-500 group-hover:-translate-y-1">
          <div class="px-7 py-8">
            <p class="versalitas text-faint">${fechaLarga(p.fecha)}</p>
            <h2 class="serif mt-3 text-[24px] leading-snug texto-balance group-hover:text-olive-deep transition-colors">${esc(p.titulo)}</h2>
            <p class="prosa mt-4 !text-[15px] line-clamp-3">${esc(p.resumen || p.cuerpo.slice(0, 160))}</p>
            <span class="enlace mt-6 inline-block text-[13.5px] font-medium">Leer entrada</span>
          </div>
        </div>
      </a>`).join("");
  }
})();
