/*!
 * html2pdf.js — fallback local para exportacao via impressao
 * Uso compativel basico com: html2pdf().set(opt).from(element).save()
 * Observacao: navegadores nao permitem gerar PDF real sem biblioteca/renderizador;
 * este fallback abre a janela de impressao para "Salvar como PDF".
 */
(function (window, document) {
  "use strict";

  function cleanText(value) {
    return String(value || "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getFilename(options) {
    var name = options && (options.filename || options.fileName || options.name);
    name = cleanText(name || "documento.pdf");
    return /\.pdf$/i.test(name) ? name : name + ".pdf";
  }

  function collectStyles() {
    var styles = "";
    Array.prototype.forEach.call(document.querySelectorAll("style"), function (style) {
      styles += "\n" + style.outerHTML;
    });
    Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"]'), function (link) {
      styles += "\n" + link.outerHTML;
    });
    return styles;
  }

  function removeUnwanted(content) {
    Array.prototype.forEach.call(content.querySelectorAll("script"), function (s) { s.remove(); });
    Array.prototype.forEach.call(content.querySelectorAll(".app-bar,.barra-progresso,.painel,.no-print,[data-no-print]"), function (el) { el.remove(); });
  }

  function buildPrintDocument(source, options) {
    var title = getFilename(options);
    var content = source ? source.cloneNode(true) : document.body.cloneNode(true);
    removeUnwanted(content);

    var baseHref = document.baseURI || window.location.href;
    var safeBase = String(baseHref).replace(/'/g, "&#39;");
    var safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return "<!doctype html>" +
      "<html lang='pt-br'>" +
      "<head>" +
      "<meta charset='utf-8'>" +
      "<meta name='viewport' content='width=device-width, initial-scale=1'>" +
      "<base href='" + safeBase + "'>" +
      "<title>" + safeTitle + "</title>" +
      collectStyles() +
      "<style>" +
      "@page{size:A4;margin:12mm;}" +
      "html,body{background:#fff!important;}" +
      "body{margin:0!important;padding:0!important;overflow:visible!important;}" +
      ".capitulo,.cap-corpo,.artigo{break-inside:auto;page-break-inside:auto;}" +
      "h1,h2,h3{break-after:avoid;page-break-after:avoid;}" +
      "p,.versiculo,.bloco-aluno,.aplicacao,.dialogo,.questao,.leituras{break-inside:avoid;page-break-inside:avoid;}" +
      "a{color:inherit;text-decoration:none;}" +
      "@media print{.app-bar,.barra-progresso,.painel,.no-print,[data-no-print]{display:none!important;} body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}" +
      "</style>" +
      "</head>" +
      "<body>" + content.outerHTML + "</body>" +
      "</html>";
  }

  function Html2PdfWorker() {
    this.options = {};
    this.source = null;
  }

  Html2PdfWorker.prototype.set = function (options) {
    this.options = options || {};
    return this;
  };

  Html2PdfWorker.prototype.from = function (source) {
    if (typeof source === "string") {
      this.source = document.querySelector(source);
    } else {
      this.source = source;
    }
    return this;
  };

  Html2PdfWorker.prototype.toPdf = function () { return this; };
  Html2PdfWorker.prototype.outputPdf = function () { return Promise.resolve(null); };

  Html2PdfWorker.prototype.save = function (filename) {
    if (filename) this.options.filename = filename;

    var html = buildPrintDocument(this.source || document.body, this.options);
    var printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("O navegador bloqueou a janela de impressao. Libere pop-ups para este arquivo e tente novamente.");
      return Promise.resolve(false);
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    var doPrint = function () {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error("Falha ao abrir impressao:", e);
      }
    };

    if (printWindow.document.readyState === "complete") {
      setTimeout(doPrint, 400);
    } else {
      printWindow.onload = function () { setTimeout(doPrint, 400); };
      setTimeout(doPrint, 1200);
    }

    return Promise.resolve(true);
  };

  Html2PdfWorker.prototype.then = function (resolve, reject) {
    return Promise.resolve(this).then(resolve, reject);
  };

  function html2pdf() { return new Html2PdfWorker(); }

  html2pdf.Worker = Html2PdfWorker;
  html2pdf.version = "local-fallback-1.1.0";

  window.html2pdf = html2pdf;
})(window, document);
