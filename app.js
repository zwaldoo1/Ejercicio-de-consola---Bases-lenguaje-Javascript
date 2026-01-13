document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  const el = (id) => document.getElementById(id);

  const toast = el("toast");
  const themeBtn = el("themeBtn");
  const logoutBtn = el("logoutBtn");

  const screens = [...document.querySelectorAll(".screen")];

  // ====== State (localStorage) ======
  const init = () => {
    if (!localStorage.getItem("wallet")) {
      const data = {
        logged: false,
        saldo: 10000,
        lastAction: "—",
        aliasDemo: "mi.alias.wallet",
        contacts: [
          { name:"Contacto Demo", cbu:"000000000000", alias:"demo.wallet", bank:"Banco Demo" }
        ],
        tx: []
      };
      localStorage.setItem("wallet", JSON.stringify(data));
    }
  };

  const get = () => JSON.parse(localStorage.getItem("wallet"));
  const set = (data) => localStorage.setItem("wallet", JSON.stringify(data));

  init();

  // ====== Toast ======
  let tmr = null;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("toastx--show");
    clearTimeout(tmr);
    tmr = setTimeout(() => toast.classList.remove("toastx--show"), 2200);
  };

  // ====== Router (pantallas) ======
  const go = (name) => {
    screens.forEach(s => s.classList.toggle("d-none", s.dataset.screen !== name));
    const data = get();

    // si está logueado, muestra salir
    logoutBtn.classList.toggle("d-none", !data.logged);

    // refresh UI según pantalla
    if (name === "menu") renderMenu();
    if (name === "send") renderContacts();
    if (name === "tx") renderTx();
  };

  // ====== Micro: Ripple ======
  const addRipple = (node) => {
    node.classList.add("ripple");
    node.addEventListener("click", (e) => {
      const r = node.getBoundingClientRect();
      const wave = document.createElement("span");
      wave.className = "ripple__wave";
      const size = Math.max(r.width, r.height);
      wave.style.width = wave.style.height = size + "px";
      wave.style.left = (e.clientX - r.left - size/2) + "px";
      wave.style.top = (e.clientY - r.top - size/2) + "px";
      node.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove());
    });
  };
  document.querySelectorAll("button, a").forEach(addRipple);

  // ====== Micro: Magnetic buttons ======
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".magnetic").forEach(btn => {
    if (reduceMotion) return;
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width/2);
      const dy = e.clientY - (r.top + r.height/2);
      btn.style.transform = `translate(${dx * 0.06}px, ${dy * 0.06}px)`;
    });
    btn.addEventListener("mouseleave", () => btn.style.transform = "translate(0,0)");
  });

  // ====== Theme ======
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  const updateThemeIcon = () => {
    const isLight = root.getAttribute("data-theme") === "light";
    themeBtn.textContent = isLight ? "☀️" : "🌙";
  };
  updateThemeIcon();

  themeBtn.addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    const next = isLight ? "" : "light";
    if (next) root.setAttribute("data-theme", next);
    else root.removeAttribute("data-theme");
    localStorage.setItem("theme", next || "");
    updateThemeIcon();
    showToast(isLight ? "🌙 Tema oscuro" : "☀️ Tema claro");
  });

  // ====== Login ======
  const login = () => {
    const u = el("user").value.trim();
    const p = el("pass").value.trim();

    if (u === "admin" && p === "1234") {
      const data = get();
      data.logged = true;
      data.lastAction = "Login correcto";
      set(data);
      showToast("✅ Login exitoso");
      go("menu");
    } else {
      showToast("❌ Credenciales incorrectas");
    }
  };

  el("loginBtn").addEventListener("click", login);
  document.addEventListener("keydown", (e) => {
    const current = screens.find(s => !s.classList.contains("d-none"))?.dataset.screen;
    if (current === "login" && e.key === "Enter") login();
  });

  // ====== Menu UI ======
  const renderMenu = () => {
    const data = get();
    el("saldo").textContent = data.saldo;
    el("lastAction").textContent = data.lastAction || "—";

    // preview tx
    const ul = el("previewTx");
    ul.innerHTML = "";
    data.tx.slice(0,3).forEach(t => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = t;
      ul.appendChild(li);
    });
    if (data.tx.length === 0) {
      const li = document.createElement("li");
      li.className = "list-group-item text-secondary";
      li.textContent = "Aún no hay movimientos.";
      ul.appendChild(li);
    }
  };

  // ====== Navigation buttons ======
  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.go;
      showToast(`➡️ Redirigiendo a ${target}`);
      go(target);
    });
  });

  // ====== Deposit ======
  el("depBtn").addEventListener("click", () => {
    const amount = Number(el("depAmount").value);
    if (!amount || amount <= 0) return showToast("⚠️ Monto inválido");

    const data = get();
    data.saldo += amount;
    const msg = `Depósito +$${amount} (saldo: $${data.saldo})`;
    data.tx.unshift(msg);
    data.lastAction = `Depósito $${amount}`;
    set(data);

    showToast("✅ Depósito realizado");
    el("depAmount").value = "";
    go("menu");
  });

  // ====== Contacts (Send Money) ======
  const renderContacts = () => {
    const data = get();
    const select = el("contactSelect");
    select.innerHTML = "";
    data.contacts.forEach((c, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${c.name} · ${c.alias} · ${c.bank}`;
      select.appendChild(opt);
    });
  };

  // Modal
  const modal = el("contactModal");
  const openModal = () => modal.classList.remove("d-none");
  const closeModal = () => modal.classList.add("d-none");

  el("newContactBtn").addEventListener("click", () => {
    openModal();
    showToast("🧾 Agregar nuevo contacto");
  });
  el("closeModalBtn").addEventListener("click", closeModal);

  el("saveContactBtn").addEventListener("click", () => {
    const name = el("cName").value.trim();
    const cbu = el("cCbu").value.trim();
    const alias = el("cAlias").value.trim();
    const bank = el("cBank").value.trim();

    if (!name || !cbu || !alias || !bank) return showToast("⚠️ Completa todos los campos");

    const data = get();
    data.contacts.push({ name, cbu, alias, bank });
    data.lastAction = `Contacto agregado: ${name}`;
    set(data);

    el("cName").value = el("cCbu").value = el("cAlias").value = el("cBank").value = "";
    closeModal();
    renderContacts();
    showToast("✅ Contacto guardado");
  });

  // Send money
  el("sendBtn").addEventListener("click", () => {
    const amount = Number(el("sendAmount").value);
    const data = get();

    if (!amount || amount <= 0) return showToast("⚠️ Monto inválido");
    if (amount > data.saldo) return showToast("❌ Saldo insuficiente");

    const idx = Number(el("contactSelect").value);
    const c = data.contacts[idx];

    data.saldo -= amount;
    const msg = `Envío -$${amount} a ${c.name} (${c.alias}) (saldo: $${data.saldo})`;
    data.tx.unshift(msg);
    data.lastAction = `Envío $${amount} a ${c.name}`;
    set(data);

    el("sendAmount").value = "";
    showToast("✅ Envío realizado");
    go("menu");
  });

  // ====== Transactions ======
  const renderTx = () => {
    const data = get();
    const ul = el("txList");
    ul.innerHTML = "";
    if (data.tx.length === 0) {
      const li = document.createElement("li");
      li.className = "list-group-item text-secondary";
      li.textContent = "No hay movimientos todavía.";
      ul.appendChild(li);
      return;
    }
    data.tx.forEach(t => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = t;
      ul.appendChild(li);
    });
  };

  // ====== Copy alias ======
  el("copyAliasBtn").addEventListener("click", async () => {
    const data = get();
    try{
      await navigator.clipboard.writeText(data.aliasDemo);
      showToast(`📋 Copiado: ${data.aliasDemo}`);
    }catch{
      showToast("⚠️ No se pudo copiar");
    }
  });

  // ====== Reset data ======
  el("resetBtn").addEventListener("click", () => {
    localStorage.removeItem("wallet");
    init();
    showToast("🧹 Datos reseteados");
    go("menu");
  });

  // ====== Logout ======
  logoutBtn.addEventListener("click", () => {
    const data = get();
    data.logged = false;
    data.lastAction = "Sesión cerrada";
    set(data);
    showToast("👋 Sesión cerrada");
    go("login");
  });

  // ====== Start screen ======
  const data = get();
  go(data.logged ? "menu" : "login");
});
