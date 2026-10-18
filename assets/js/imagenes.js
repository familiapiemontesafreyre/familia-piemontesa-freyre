(function () {
  var base = "https://familiapiemontesafreyre.github.io/familia-piemontesa-freyre/";
  fetch("https://raw.githubusercontent.com/familiapiemontesafreyre/familia-piemontesa-freyre/main/content/imagenes.json?c=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.claves) return;
      var aplicar = function (doc) {
        Object.keys(j.claves).forEach(function (clave) {
          var url = j.claves[clave] && j.claves[clave].url;
          if (!url) return;
          doc.querySelectorAll('img[data-imgkey="' + clave + '"]').forEach(function (im) { im.src = url; });
        });
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { aplicar(document); });
      else aplicar(document);
    })
    .catch(function () {});
})();
