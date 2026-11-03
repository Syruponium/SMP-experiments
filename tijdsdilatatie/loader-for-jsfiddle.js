/* Plak dit eenmaal in het JavaScript-paneel van JSFiddle.
   HTML: index.html | CSS: style.css.
   Iedere Run haalt de nieuwste modules op uit GitHub. */
(async function () {
  "use strict";
  const root = "https://raw.githubusercontent.com/Syruponium/SMP-experiments/main/tijdsdilatatie/";
  async function read(file) {
    const response = await fetch(root + file + "?v=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error(file + ": HTTP " + response.status);
    return response.text();
  }
  try {
    const manifest = JSON.parse(await read("manifest.json"));
    for (const file of manifest.files) {
      const script = document.createElement("script");
      script.textContent = await read(file) + "\n//# sourceURL=td-sim/" + file;
      document.head.appendChild(script);
      script.remove();
    }
  } catch (error) {
    console.error("Tijdsdilatatie-simulatie kon niet laden:", error);
    const message = document.createElement("pre");
    message.textContent = "Laden mislukt: " + error.message;
    message.style.color = "#fda4af";
    document.body.prepend(message);
  }
})();