(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const peso = n => "$ " + n.toLocaleString("es-CO");
  const P = CONFIG.productos, pedido = {};
  let cat = "Todos";

  const wa = txt => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;
  $("#wa-pie").href = wa("Hola FloraEterna, quiero información sobre sus flores eternas.");

  $("#wa-flot").href = wa("Hola FloraEterna, quiero información sobre sus flores eternas.");
  new IntersectionObserver(([e]) => $("#barra").classList.toggle("oculta", e.isIntersecting)).observe($("#pedido"));

  // Catálogo
  const cats = ["Todos", ...new Set(P.map(p => p.cat))];
  $("#chips").innerHTML = cats.map(c => `<button class="chip" aria-pressed="${c === cat}" data-c="${c}">${c}</button>`).join("");
  $("#chips").addEventListener("click", e => {
    const b = e.target.closest("[data-c]"); if (!b) return;
    cat = b.dataset.c;
    document.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x === b));
    pintar();
  });
  function pintar() {
    $("#grid").innerHTML = P.filter(p => cat === "Todos" || p.cat === cat).map(p => `
      <article class="card">
        <div class="img">${p.badge ? `<span class="tag">${p.badge}</span>` : ""}<img src="${p.img}" alt="${p.nombre}" loading="lazy" width="720" height="900"></div>
        <div class="info"><small>${p.cat}</small><h3>${p.nombre}</h3><p class="desc">${p.desc}</p>
          <span class="precio">${peso(p.precio)}</span>
          <button class="btn" data-add="${p.id}">Agregar al pedido</button></div>
      </article>`).join("");
  }
  $("#grid").addEventListener("click", e => {
    const im = e.target.closest(".img img");
    if (im) { $("#vista img").src = im.src; $("#vista img").alt = im.alt; $("#vista").showModal(); return; }
    const b = e.target.closest("[data-add]"); if (!b) return;
    pedido[b.dataset.add] = (pedido[b.dataset.add] || 0) + 1;
    const p = P.find(x => x.id === b.dataset.add);
    $("#aviso").textContent = `${p.nombre} agregado a su pedido.`;
    lista();
    b.textContent = "Agregado"; setTimeout(() => b.textContent = "Agregar al pedido", 1200);
  });

  $("#vista").addEventListener("click", () => $("#vista").close());

  // Lista del pedido
  function lista() {
    const ids = Object.keys(pedido);
    $("#items").innerHTML = ids.length ? ids.map(id => {
      const p = P.find(x => x.id === id);
      return `<li><span>${p.nombre}<br><small>${peso(p.precio * pedido[id])}</small></span>
        <span class="q"><button data-m="${id}" aria-label="Quitar una unidad de ${p.nombre}">−</button>${pedido[id]}<button data-s="${id}" aria-label="Agregar una unidad de ${p.nombre}">+</button></span></li>`;
    }).join("") : `<li class="vacio">Aún no ha escogido productos. Agréguelos desde el catálogo o describa su arreglo en el formulario.</li>`;
    const total = ids.reduce((t, id) => t + P.find(x => x.id === id).precio * pedido[id], 0);
    $("#total").textContent = peso(total);
    const n = ids.reduce((t, id) => t + pedido[id], 0);
    $("#cuenta").textContent = n;
    $("#barra").hidden = !n; $("#b-n").textContent = n + (n === 1 ? " producto" : " productos"); $("#b-t").textContent = peso(total);
  }
  $("#items").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.s) pedido[b.dataset.s]++;
    if (b.dataset.m && --pedido[b.dataset.m] <= 0) delete pedido[b.dataset.m];
    lista();
  });

  // Formulario
  const f = $("#form");
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  f.fecha.min = hoy;
  const reglas = {
    nombre: v => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,60}$/.test(v) || "Escriba su nombre completo, solo con letras.",
    celular: v => /^3\d{9}$/.test(v) || "Escriba el celular con 10 números, empezando por 3. Ejemplo: 3001234567",
    fecha: v => (v && v >= hoy) || "Escoja la fecha de entrega. No puede ser una fecha pasada.",
    pago: v => !!v || "Escoja una forma de pago de la lista.",
    direccion: v => v.trim().length >= 5 || "Escriba la dirección de entrega o la palabra Tienda si recoge el pedido."
  };
  function validar() {
    let ok = true;
    for (const [k, fn] of Object.entries(reglas)) {
      const campo = f[k], r = fn(campo.value);
      campo.setAttribute("aria-invalid", r !== true);
      campo.parentElement.querySelector(".err").textContent = r === true ? "" : r;
      if (r !== true) ok = false;
    }
    const d = f.detalle.value.trim(), e = f.detalle.parentElement.querySelector(".err");
    const sin = !Object.keys(pedido).length && d.length < 10;
    e.textContent = sin ? "Escoja productos del catálogo o describa su pedido con al menos 10 letras." : "";
    f.detalle.setAttribute("aria-invalid", sin);
    return ok && !sin;
  }
  f.addEventListener("submit", e => {
    e.preventDefault();
    if (!validar()) { const m = f.querySelector("[aria-invalid=true]"); m && m.focus(); return; }
    const ids = Object.keys(pedido);
    const l = ids.map(id => { const p = P.find(x => x.id === id); return `• ${pedido[id]} x ${p.nombre} (${peso(p.precio * pedido[id])})`; });
    const txt = ["Hola FloraEterna, quiero hacer este pedido:", ...l,
      ids.length ? `Total estimado: ${$("#total").textContent}` : "",
      f.detalle.value.trim() && `Detalle: ${f.detalle.value.trim()}`,
      f.tarjeta.value.trim() && `Mensaje de la tarjeta: ${f.tarjeta.value.trim()}`,
      `Entrega: ${f.fecha.value.split("-").reverse().join("/")} en ${f.direccion.value.trim()}`,
      `Pago: ${f.pago.value}`, `A nombre de ${f.nombre.value.trim()} · Cel. ${f.celular.value}`].filter(Boolean).join("\n");
    window.open(wa(txt), "_blank", "noopener"); $("#ok").hidden = false;
  });
  $("#limpiar").addEventListener("click", () => {
    f.reset(); f.querySelectorAll(".err").forEach(x => x.textContent = "");
    f.querySelectorAll("[aria-invalid]").forEach(x => x.removeAttribute("aria-invalid"));
  });

  // Textos para compartir
  const textos = [
    ["Para estados de WhatsApp", `🌹 Flores que no se marchitan. En FloraEterna hacemos ramos de rosas de satín con perlas y mariposas doradas, a su gusto y con su mensaje. ${CONFIG.sitio}`],
    ["Para Instagram", `Un regalo que dura años 🌻 Ramos de rosas eternas para cumpleaños, aniversarios y fechas especiales. Pedidos personalizados y entrega a domicilio. Pida el suyo en el link de la bio. #FloresEternas #FloraEterna #RegalosConAmor`],
    ["Para escribirle a un cliente", `Hola 👋 Le cuento que en FloraEterna tenemos ramos de rosas eternas que no se marchitan ni necesitan agua. ¿Para qué fecha especial las necesita? Aquí puede ver el catálogo: ${CONFIG.sitio}`]
  ];
  $("#textos").innerHTML = textos.map(([t, c], i) => `<article><h3>${t}</h3><p>${c}</p>
    <button class="btn ghost" data-t="${i}">Copiar texto</button></article>`).join("");
  $("#textos").addEventListener("click", async e => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    try { await navigator.clipboard.writeText(textos[b.dataset.t][1]); b.textContent = "Texto copiado"; }
    catch { b.textContent = "Seleccione el texto y cópielo"; }
    setTimeout(() => b.textContent = "Copiar texto", 2000);
  });

  pintar(); lista();
})();
