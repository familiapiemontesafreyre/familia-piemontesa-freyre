# Familia Piemontesa de Freyre — Sitio

Sitio histórico-institucional de la **Familia Piemontesa de Freyre**: orígenes,
crónicas, álbum de memorias colaborativo, videos y archivo digital.

Es un sitio **estático** (HTML + CSS + JS puro, sin build step) pensado para
publicarse en **GitHub Pages**.

---

## Estructura

```
.
├── index.html                              Home (hero, manifiesto, destacados, timeline, CTA)
├── origenes.html                           Historia de la familia (Piamonte → Argentina)
├── cronicas.html                           Índice del blog de crónicas
├── cronica-el-valle-que-dejaron-atras.html
├── cronica-raices-en-la-pampa-gringa.html
├── cronica-la-mesa-larga.html
├── memorias.html                           Álbum colaborativo (formulario "Aportar memoria")
├── videos.html                             Selección de videos de YouTube
├── archivo.html                            Archivo digital (documentos, fotos, objetos)
├── 404.html                                Página no encontrada
├── robots.txt
├── sitemap.xml
├── .nojekyll                               Necesario para que Pages no procese el sitio con Jekyll
└── assets/
    ├── css/sitio.css                       Capa editorial (tokens, tipografía, animaciones)
    └── js/sitio.js                         Comportamiento (nav, reveal, filtros, modal, drag&drop)
```

No hay dependencias que instalar. Tailwind se carga por CDN (`Play CDN`) con la
configuración de tokens inline en cada página, y los estilos propios viven en
`assets/css/sitio.css`.

---

## Publicar en GitHub Pages

El sitio no necesita compilación: se sirve tal cual desde la raíz del repo.

1. Crear el repositorio en GitHub (cuenta de la familia).
2. Desde esta carpeta:

   ```bash
   git add -A
   git commit -m "Sitio inicial"
   git branch -M main
   git remote add origin https://github.com/<usuario>/<repo>.git
   git push -u origin main
   ```

3. En GitHub: **Settings → Pages → Source: `Deploy from a branch`**,
   branch **`main`**, carpeta **`/ (root)`**. Guardar.
4. El sitio queda publicado en `https://<usuario>.github.io/<repo>/`.

> `.nojekyll` ya está incluido para que GitHub Pages no intente procesar el
> contenido con Jekyll (evita que se ignoren archivos con guion bajo, etc.).

---

## Qué reemplazar antes de publicar (placeholders)

Buscar y reemplazar en todo el proyecto:

| Placeholder | Dónde | Reemplazo |
|---|---|---|
| `REEMPLAZAR.github.io/REEMPLAZAR` | `robots.txt`, `sitemap.xml` | URL final del sitio (`https://<usuario>.github.io/<repo>`) |
| `https://formspree.io/f/XXXXXXX` | formularios "Aportar memoria" | ID real de un formulario Formspree (ver abajo) |
| `https://www.youtube.com/` | `videos.html` | URL real de cada video (`<!-- REEMPLAZAR: ... -->` marca cada tarjeta) |
| `https://picsum.photos/seed/...` | todas las páginas | Fotos reales (ver "Imágenes") |

También conviene revisar los textos históricos: están redactados con lenguaje
hedgeado ("hacia fines del siglo XIX") para no afirmar datos no verificados.
**Editá y confirmá todo dato histórico antes de publicar.**

---

## Formulario "Aportar memoria"

El modal de aportes envía a **Formspree** (o hace fallback a `mailto:` si no hay
endpoint configurado).

- Crear un formulario gratuito en <https://formspree.io> y copiar su endpoint
  (`https://formspree.io/f/xxxxxxxx`).
- Reemplazar `XXXXXXX` en el `action` del formulario en **todas** las páginas.
- El JS (`assets/js/sitio.js`) detecta el placeholder `XXXXXXX`: si sigue
  presente, cae al envío por email (`familiapiemontesafreyre@gmail.com`).

**Limitación:** el plan gratuito de Formspree **no permite adjuntar archivos**.
El formulario acepta fotos/documentos vía drag & drop en el navegador, pero para
que esos archivos lleguen hay que usar un plan pago, un backend propio, o subir
los archivos por separado (Drive / WeTransfer) y adjuntar solo el enlace.

---

## Imágenes

Hoy todas las imágenes son **placeholders** de `picsum.photos` (blanco y negro).
Para reemplazarlas:

1. Guardar las fotos reales en `assets/img/` (crear la carpeta).
2. Cambiar cada `src="https://picsum.photos/seed/.../W/H?grayscale"` por
   `src="assets/img/<archivo>"`.
3. Para las fotos históricas se usa la clase `.foto-historica` (efecto B/N →
   cálido al hover) y `.velo-calido` donde corresponda.

Optimizar antes de subir (JPG/WebP, ~1600 px de ancho, <300 KB).

---

## Videos de YouTube

Abrir `videos.html` y reemplazar cada `href="https://www.youtube.com/"`
(marcado con `<!-- REEMPLAZAR: apuntar este enlace a la URL real del video -->`)
por la URL del video correspondiente. Los enlaces abren en pestaña nueva.

---

## Fuentes y comportamiento del JS

`assets/js/sitio.js` es vanilla (sin dependencias) y espera ciertos hooks en el
HTML. Si se agregan secciones nuevas, respetar estos atributos para que funcionen:

- `[data-nav]` / `[data-menu-btn]` / `[data-menu-panel]` — navegación y menú mobile
- `[data-retardo]` — retardo de aparición (se aplica como `--retardo`)
- `[data-timeline]` con `.tl-progreso` y `.tl-item` — línea de tiempo
- `[data-contador]` con `data-sufijo` — números animados
- `[data-filtros]` / `[data-filtro]` / `[data-categoria]` + `#filtro-vacio` —
  filtros de feed (**solo un grupo `#filtro-vacio` por página** — el ID es único)
- `[data-abrir-memoria]` / `[data-cerrar-memoria]` — modal de aportes
  (el modal `#modal-memoria` debe estar presente en la página)
- `[data-zona-soltar]` / `[data-archivos]` — drag & drop de archivos
- `#form-memoria` / `#form-aviso` — envío del formulario
- `[data-anio]` / `[data-volver-arriba]` — año dinámico y botón "volver arriba"

---

## Notas de mantenimiento

- Este sitio fue generado con un script Node **fuera del repositorio**
  (genera HTML estático a partir de plantillas). Si vas a hacer cambios masivos
  en varias páginas a la vez, conviene reutilizarlo en lugar de editar a mano.
- Los archivos `._*` (AppleDouble de macOS) no deben commitearse; se borran por
  ruta explícita (el glob `._*` no matchea en zsh). Ver `.gitignore`.
- Compatibilidad: el menú de escritorio aparece en `≥1024px` (clase `lg:`),
  hamburguesa por debajo. El JS cierra el panel al redimensionar a `≥900px`.
