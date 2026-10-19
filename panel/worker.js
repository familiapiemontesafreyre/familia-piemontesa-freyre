const OWNER = "familiapiemontesafreyre";
const REPO = "familia-piemontesa-freyre";
const PATH_JSON = "blog/posts.json";
const PATH_ALBUM = "content/album.json";
const PATH_VIDEOS = "content/videos.json";
const BRANCH = "main";

function b64u(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64u_json(obj) { return b64u(new TextEncoder().encode(JSON.stringify(obj))); }
function fromB64u(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)));
}

async function firmar(payload, secret) {
  const header = b64u_json({ alg: "HS256", typ: "JWT" });
  const body = b64u_json(payload);
  const sig = await hmac(secret, `${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

async function verificar(token, secret) {
  if (!token || token.split(".").length !== 3) return null;
  const [h, b, s] = token.split(".");
  const esperada = await hmac(secret, `${h}.${b}`);
  if (s !== esperada) return null;
  const payload = JSON.parse(fromB64u(b));
  if (!payload.exp || payload.exp < Date.now() / 1000) return null;
  return payload;
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "authorization,content-type"
    }
  });
}

function slugDe(titulo) {
  return (titulo || "entrada").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/\s+/g, "-").slice(0, 60);
}

function resumenDe(cuerpo) {
  return ((cuerpo || "").replace(/[#*_>\-!>\[\]()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200));
}

async function ghGetJson(env) {
  const ghHeaders = {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "familia-piemontesa-panel"
  };
  const r = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PATH_JSON}`, {
    headers: { "user-agent": "familia-piemontesa-panel" }, cf: { cacheTtl: 0 }
  });
  if (!r.ok) return { posts: [] };
  return await r.json();
}

async function ghGetMetaYContenido(env, ruta) {
  const ghHeaders = {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "familia-piemontesa-panel"
  };
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${ruta || PATH_JSON}?ref=${BRANCH}`,
    { headers: ghHeaders });
  if (r.status === 404) return { data: { posts: [] }, sha: undefined };
  const j = await r.json();
  const binario = atob((j.content || "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binario, c => c.charCodeAt(0));
  return { data: JSON.parse(new TextDecoder().decode(bytes)), sha: j.sha };
}

async function ghPutContenido(env, ruta, data, sha, mensaje) {
  const ghHeaders = {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "familia-piemontesa-panel"
  };
  const body = {
    message: mensaje,
    branch: BRANCH,
    content: btoa(new TextEncoder().encode(JSON.stringify(data, null, 2) + "\n").reduce((s, c) => s + String.fromCharCode(c), ""))
  };
  if (sha) body.sha = sha;
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${ruta || PATH_JSON}`,
    { method: "PUT", headers: ghHeaders, body: JSON.stringify(body) });
  return r.ok;
}

async function ghPutBinario(env, ruta, b64, mensaje) {
  const ghHeaders = {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "familia-piemontesa-panel"
  };
  let sha;
  const rExiste = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${ruta}?ref=${BRANCH}`, { headers: ghHeaders });
  if (rExiste.ok) sha = (await rExiste.json()).sha;
  const body = { message: mensaje, branch: BRANCH, content: b64 };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${ruta}`,
    { method: "PUT", headers: ghHeaders, body: JSON.stringify(body) });
  return { ok: r.ok, codigo: r.status };
}

async function ghGetImagenes(env) {
  const r = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/content/imagenes.json`, {
    headers: { "user-agent": "familia-piemontesa-panel" }, cf: { cacheTtl: 0 }
  });
  if (!r.ok) return { claves: {} };
  return await r.json();
}

async function ghPutImagenes(env, data, sha, mensaje) {
  const ghHeaders = {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "familia-piemontesa-panel"
  };
  const body = {
    message: mensaje,
    branch: BRANCH,
    content: btoa(new TextEncoder().encode(JSON.stringify(data, null, 2) + "\n").reduce((s, c) => s + String.fromCharCode(c), ""))
  };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/content/imagenes.json`,
    { method: "PUT", headers: ghHeaders, body: JSON.stringify(body) });
  return r.ok;
}

async function manejarImagenes(request, env) {
  if (request.method === "GET") return jsonResp(await ghGetImagenes(env));

  const token = await verificar((request.headers.get("authorization") || "").replace("Bearer ", ""), env.TOKEN_SECRET);
  if (!token) return jsonResp({ error: "sesion_invalida" }, 401);

  const cuerpo = await request.json();
  const clave = (cuerpo.clave || "").trim();
  if (!clave) return jsonResp({ error: "falta_clave" }, 400);

    let datos, sha;
    try {
      const meta = await ghGetMetaYContenido(env, "content/imagenes.json");
      datos = meta.data; sha = meta.sha;
      if (!datos || !datos.claves) throw new Error("resp_sin_claves");
    } catch (e) { return jsonResp({ error: "no_se_pudo_leer_catalogo", detalle: String(e && e.message) }, 500); }
  if (!datos.claves || !(clave in datos.claves)) return jsonResp({ error: "clave_desconocida" }, 400);

  let urlFoto = null;
  if (cuerpo.dataB64) {
    const ruta = `images/${clave}.jpg`;
    const rBin = await ghPutBinario(env, ruta, cuerpo.dataB64, `panel: foto nueva para ${clave}`);
    if (!rBin.ok) return jsonResp({ error: "commit_foto_fallido", codigo: rBin.codigo }, 500);
    urlFoto = `https://familiapiemontesafreyre.github.io/familia-piemontesa-freyre/${ruta}`;
  } else if (cuerpo.url && /^https:\/\//.test(cuerpo.url)) {
    urlFoto = cuerpo.url;
  }

  datos.claves[clave].url = urlFoto;
  const ok = await ghPutImagenes(env, datos, sha, `panel: imagen "${clave}" ${urlFoto ? "actualizada" : "restaurada al total"}`);
  return ok ? jsonResp({ ok: true, clave, url: urlFoto }) : jsonResp({ error: "commit_fallido" }, 500);
}

async function manejarPosts(request, env) {
  const lista = await ghGetJson(env);
  if (request.method === "GET") return jsonResp(lista);

  const token = await verificar((request.headers.get("authorization") || "").replace("Bearer ", ""), env.TOKEN_SECRET);
  if (!token) return jsonResp({ error: "sesion_invalida" }, 401);

  const cuerpo = await request.json();

  if (cuerpo.accion === "borrar") {
    const { data, sha } = await ghGetMetaYContenido(env);
    const nueva = { posts: (data.posts || []).filter(p => p.slug !== cuerpo.slug) };
    const ok = await ghPutContenido(env, PATH_JSON, nueva, sha, `panel: borrar entrada ${cuerpo.slug}`);
    return ok ? jsonResp({ ok: true }) : jsonResp({ error: "commit_fallido" }, 500);
  }

  if (!cuerpo.titulo || !cuerpo.cuerpo) return jsonResp({ error: "faltan_campos" }, 400);
  const slug = slugDe(cuerpo.slug || cuerpo.titulo);
  const fecha = cuerpo.fecha || new Date().toISOString().slice(0, 10);
  const { data, sha } = await ghGetMetaYContenido(env);
  const posts = (data.posts || []).filter(p => p.slug !== slug);
  posts.unshift({ slug, titulo: cuerpo.titulo, fecha, cuerpo: cuerpo.cuerpo, resumen: resumenDe(cuerpo.cuerpo), actualizado: new Date().toISOString() });
  const ok = await ghPutContenido(env, PATH_JSON, { posts }, sha, `panel: entrada "${cuerpo.titulo}"`);
  return ok ? jsonResp({ ok: true, slug }) : jsonResp({ error: "commit_fallido" }, 500);
}

async function manejarAlbum(request, env) {
  if (request.method === "GET") {
    try {
      const { data } = await ghGetMetaYContenido(env, PATH_ALBUM);
      return jsonResp(data && data.paginas ? data : { paginas: {} });
    } catch (e) {
      return jsonResp({ error: "no_se_pudo_leer_album", detalle: String(e && e.message) }, 500);
    }
  }

  const token = await verificar((request.headers.get("authorization") || "").replace("Bearer ", ""), env.TOKEN_SECRET);
  if (!token) return jsonResp({ error: "sesion_invalida" }, 401);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch (e) { return jsonResp({ error: "cuerpo_invalido" }, 400); }
  if (!cuerpo || !cuerpo.paginas || typeof cuerpo.paginas !== "object" || Array.isArray(cuerpo.paginas))
    return jsonResp({ error: "formato_invalido" }, 400);

  let sha;
  try {
    const meta = await ghGetMetaYContenido(env, PATH_ALBUM);
    sha = meta.sha;
  } catch (e) { sha = undefined; }
  const ok = await ghPutContenido(env, PATH_ALBUM, cuerpo, sha, `panel: álbum dinámico actualizado (${new Date().toISOString().slice(0, 10)})`);
  return ok ? jsonResp({ ok: true }) : jsonResp({ error: "commit_fallido" }, 500);
}

async function manejarVideos(request, env) {
  if (request.method === "GET") {
    try {
      const { data } = await ghGetMetaYContenido(env, PATH_VIDEOS);
      return jsonResp(data && data.videos ? data : { videos: [] });
    } catch (e) {
      return jsonResp({ error: "no_se_pudo_leer_videos", detalle: String(e && e.message) }, 500);
    }
  }

  const token = await verificar((request.headers.get("authorization") || "").replace("Bearer ", ""), env.TOKEN_SECRET);
  if (!token) return jsonResp({ error: "sesion_invalida" }, 401);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch (e) { return jsonResp({ error: "cuerpo_invalido" }, 400); }
  if (!cuerpo || !Array.isArray(cuerpo.videos))
    return jsonResp({ error: "formato_invalido" }, 400);

  let sha;
  try {
    const meta = await ghGetMetaYContenido(env, PATH_VIDEOS);
    sha = meta.sha;
  } catch (e) { sha = undefined; }
  const ok = await ghPutContenido(env, PATH_VIDEOS, cuerpo, sha, `panel: videos actualizados (${new Date().toISOString().slice(0, 10)})`);
  return ok ? jsonResp({ ok: true }) : jsonResp({ error: "commit_fallido" }, 500);
}

const app = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "authorization,content-type" } });
    const url = new URL(request.url);
    const ruta = url.pathname.replace(/\/+$/, "");

    if (ruta === "/health") return jsonResp({ ok: true });
    if (ruta === "/posts") return manejarPosts(request, env);
    if (ruta === "/imagenes") return manejarImagenes(request, env);
    if (ruta === "/album") return manejarAlbum(request, env);
    if (ruta === "/videos") return manejarVideos(request, env);
    if (ruta === "/login" && request.method === "POST") {
      const { user, pass } = await request.json();
      if (user !== env.PANEL_USER || pass !== env.PANEL_PASS) return jsonResp({ error: "credenciales_invalidas" }, 401);
      const token = await firmar({ sub: user, exp: Math.floor(Date.now() / 1000) + 30 * 86400 }, env.TOKEN_SECRET);
      return jsonResp({ token });
    }
    return jsonResp({ error: "no_encontrado" }, 404);
  }
};
export default app;
