/**
 * tienda-stablecoin-pay — widget de checkout embebible.
 *
 * Uso: pega esto en cualquier sitio (no depende de Shopify/WooCommerce ni de
 * ningún framework):
 *
 *   <button
 *     class="tienda-pay-btn"
 *     data-api="http://localhost:3000"
 *     data-monto="15"
 *     data-moneda="USDC"
 *     data-nota="Camisa azul"
 *   >Pagar con stablecoin</button>
 *   <script src="widget.js"></script>
 *
 * El script escanea el documento por botones con la clase `tienda-pay-btn`,
 * les agrega un listener de click que abre un modal con el QR generado por
 * POST /checkout, y hace polling de GET /checkout/:id hasta ver la
 * confirmación onchain.
 */
(function () {
  "use strict";

  var STYLE_ID = "tienda-pay-styles";
  var POLL_INTERVAL_MS = 3000;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".tienda-pay-overlay{position:fixed;inset:0;background:rgba(15,15,25,.6);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif;}",
      ".tienda-pay-modal{background:#fff;border-radius:16px;padding:28px;max-width:320px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);}",
      ".tienda-pay-modal h3{margin:0 0 4px;font-size:18px;color:#1a1a2e;}",
      ".tienda-pay-modal .tienda-pay-monto{font-size:32px;font-weight:700;color:#1a1a2e;margin:8px 0;}",
      ".tienda-pay-modal .tienda-pay-nota{color:#666;font-size:14px;margin-bottom:16px;}",
      ".tienda-pay-modal img{width:200px;height:200px;margin:0 auto 16px;display:block;}",
      ".tienda-pay-status{font-size:14px;color:#666;margin-top:8px;}",
      ".tienda-pay-status.confirmed{color:#0f766e;font-weight:700;}",
      ".tienda-pay-status.error{color:#b91c1c;}",
      ".tienda-pay-close{margin-top:16px;background:#1a1a2e;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;cursor:pointer;}",
      ".tienda-pay-spinner{width:20px;height:20px;border:3px solid #ddd;border-top-color:#0f766e;border-radius:50%;display:inline-block;animation:tienda-pay-spin 0.8s linear infinite;}",
      "@keyframes tienda-pay-spin{to{transform:rotate(360deg);}}",
    ].join("\n");
    document.head.appendChild(style);
  }

  function apiRequest(apiBase, path, options) {
    return fetch(apiBase + path, options).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) throw new Error(body && body.error ? body.error : "Error " + res.status);
        return body;
      });
    });
  }

  function openCheckoutModal(button) {
    var apiBase = button.getAttribute("data-api") || "http://localhost:3000";
    var monto = parseFloat(button.getAttribute("data-monto"));
    var moneda = button.getAttribute("data-moneda") || "USDC";
    var nota = button.getAttribute("data-nota") || "";

    injectStyles();

    var overlay = document.createElement("div");
    overlay.className = "tienda-pay-overlay";

    var modal = document.createElement("div");
    modal.className = "tienda-pay-modal";
    modal.innerHTML =
      '<h3>Pagar con stablecoin</h3>' +
      '<div class="tienda-pay-monto">$' + monto.toFixed(2) + " " + moneda + "</div>" +
      (nota ? '<div class="tienda-pay-nota">' + nota + "</div>" : "") +
      '<div class="tienda-pay-body"><span class="tienda-pay-spinner"></span></div>' +
      '<button class="tienda-pay-close">Cancelar</button>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var body = modal.querySelector(".tienda-pay-body");
    var closeBtn = modal.querySelector(".tienda-pay-close");
    var pollHandle = null;

    function close() {
      if (pollHandle) clearInterval(pollHandle);
      document.body.removeChild(overlay);
    }
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    apiRequest(apiBase, "/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto: monto, moneda: moneda, nota: nota }),
    })
      .then(function (session) {
        body.innerHTML =
          '<img src="' + session.qrDataUrl + '" alt="QR de pago" />' +
          '<div class="tienda-pay-status">Escanea el QR con tu wallet para pagar</div>';

        pollHandle = setInterval(function () {
          apiRequest(apiBase, "/checkout/" + session.sessionId)
            .then(function (updated) {
              if (updated.status === "confirmed") {
                clearInterval(pollHandle);
                var statusEl = body.querySelector(".tienda-pay-status");
                statusEl.textContent = "✓ Pagado y confirmado onchain";
                statusEl.className = "tienda-pay-status confirmed";
                closeBtn.textContent = "Listo";
              }
            })
            .catch(function () {
              // errores transitorios de red durante el polling se ignoran
            });
        }, POLL_INTERVAL_MS);
      })
      .catch(function (err) {
        body.innerHTML = '<div class="tienda-pay-status error">' + err.message + "</div>";
      });
  }

  function init() {
    var buttons = document.querySelectorAll(".tienda-pay-btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (e) {
        openCheckoutModal(e.currentTarget);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
