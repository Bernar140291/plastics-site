/* Визуальный редактор каталога ExaPolymer.
   Работает поверх public/data/catalog.json: перетаскивание/кнопки для порядка,
   инлайн-правка текста, добавление и удаление материалов/артикулов.
   Сохранение — File System Access API (Chrome/Edge): пользователь один раз
   подключает папку сайта целиком (запоминается между сессиями через IndexedDB),
   дальше каждое "Сохранить" пишет напрямую в public/data/catalog.json этой папки,
   с проверкой записи чтением обратно и явным статусом "куда и когда" на экране.
   Запасной вариант при отсутствии API — скачать файл. */

const IDB_NAME = "exapolymer-editor";
const IDB_STORE = "handles";
const IDB_KEY = "siteDir";

const state = {
  catalog: null,
  selected: null, // {m: materialCode, a: artikulCode|null}
  dirHandle: null,
  dirty: false,
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function markDirty() {
  state.dirty = true;
  updateSaveStatus();
}

function updateSaveStatus(override) {
  const el = document.getElementById("saveStatus");
  if (!el) return;
  if (override) {
    el.textContent = override.text;
    el.className = "save-status " + (override.ok ? "saved" : "dirty");
    return;
  }
  if (state.dirty) {
    el.textContent = "Есть несохранённые изменения";
    el.className = "save-status dirty";
  } else {
    el.textContent = "Сохранено";
    el.className = "save-status saved";
  }
}

function updateFolderStatus() {
  const el = document.getElementById("folderStatus");
  if (!el) return;
  if (state.dirHandle) {
    el.textContent = `Папка: «${state.dirHandle.name}»`;
    el.className = "folder-status connected";
  } else if (window.showDirectoryPicker) {
    el.textContent = "Папка сайта не подключена";
    el.title = "Нажмите «📁 Папка сайта» и выберите: C:\\Users\\Bernarilya\\Desktop\\Cloude\\Сайт инженерных пластиков";
    el.className = "folder-status missing";
  } else {
    el.textContent = "Браузер не поддерживает прямую запись — файл будет скачиваться";
    el.className = "folder-status missing";
  }
}

/* ---------------- IndexedDB: запоминаем папку сайта между сессиями ---------------- */

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------------- Подключение папки сайта ---------------- */

async function verifyIsSiteFolder(dirHandle) {
  try {
    const publicDir = await dirHandle.getDirectoryHandle("public", { create: false });
    const dataDir = await publicDir.getDirectoryHandle("data", { create: false });
    await dataDir.getFileHandle("catalog.json", { create: false });
    return true;
  } catch (err) {
    return false;
  }
}

async function pickSiteFolder() {
  const handle = await window.showDirectoryPicker({
    mode: "readwrite",
    id: "exapolymer-site-root",
    startIn: "desktop",
  });
  const ok = await verifyIsSiteFolder(handle);
  if (!ok) {
    alert(
      `В папке «${handle.name}» не нашлось public/data/catalog.json — это не похоже на папку сайта.\n\n` +
      `Нужная папка лежит по пути:\n` +
      `C:\\Users\\Bernarilya\\Desktop\\Cloude\\Сайт инженерных пластиков\n\n` +
      `В открывшемся системном окне выберите именно эту папку (там, где лежат index.html, папки data и js) — ` +
      `просто выделите её одним кликом и нажмите «Выбор папки», не заходя внутрь неё.`
    );
    return null;
  }
  await idbSet(IDB_KEY, handle);
  return handle;
}

async function ensureSiteFolder(forcePick) {
  if (!window.showDirectoryPicker) return null;
  if (!forcePick && state.dirHandle) {
    const perm = await state.dirHandle.queryPermission({ mode: "readwrite" });
    if (perm === "granted") return state.dirHandle;
  }
  if (!forcePick) {
    const stored = await idbGet(IDB_KEY).catch(() => null);
    if (stored) {
      let perm = await stored.queryPermission({ mode: "readwrite" }).catch(() => "denied");
      if (perm === "prompt") {
        perm = await stored.requestPermission({ mode: "readwrite" }).catch(() => "denied");
      }
      if (perm === "granted" && (await verifyIsSiteFolder(stored))) {
        state.dirHandle = stored;
        updateFolderStatus();
        return stored;
      }
    }
  }
  const handle = await pickSiteFolder();
  if (handle) {
    state.dirHandle = handle;
    updateFolderStatus();
  }
  return handle;
}

async function tryReconnectSiteFolderSilently() {
  if (!window.showDirectoryPicker) {
    updateFolderStatus();
    return;
  }
  try {
    const stored = await idbGet(IDB_KEY);
    if (stored && (await stored.queryPermission({ mode: "readwrite" })) === "granted" && (await verifyIsSiteFolder(stored))) {
      state.dirHandle = stored;
    }
  } catch (err) {
    console.warn("Не удалось восстановить папку сайта:", err);
  }
  updateFolderStatus();
}

async function changeSiteFolder() {
  const handle = await ensureSiteFolder(true);
  if (handle) {
    updateSaveStatus({ ok: true, text: `Папка подключена — нажмите «Сохранить»` });
  }
}

/* ---------------- Загрузка ---------------- */

async function boot() {
  const manualInput = document.getElementById("manualLoad");
  try {
    const res = await fetch("/data/catalog.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.catalog = await res.json();
    afterLoad();
  } catch (err) {
    document.getElementById("editorSidebar").innerHTML =
      `<p class="editor-empty">Не удалось загрузить /data/catalog.json автоматически (${escapeHtml(err.message)}).<br><br>Откройте файл вручную:</p>`;
    manualInput.style.display = "block";
  }
}

function afterLoad() {
  state.dirty = false;
  updateSaveStatus();
  renderSidebar();
  const first = state.catalog.materials[0];
  if (first) {
    if (first.artikuls[0]) selectArtikul(first.code, first.artikuls[0].code);
    else selectMaterial(first.code);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  boot();
  tryReconnectSiteFolderSilently();
  document.getElementById("manualLoad").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.catalog = JSON.parse(reader.result);
        document.getElementById("manualLoad").style.display = "none";
        afterLoad();
      } catch (err) {
        alert("Файл не похож на catalog.json: " + err.message);
      }
    };
    reader.readAsText(file, "utf-8");
  });
  document.getElementById("saveBtn").addEventListener("click", () => saveCatalog(false));
  document.getElementById("changeFolderBtn").addEventListener("click", changeSiteFolder);
});

/* ---------------- Сайдбар / дерево ---------------- */

function renderSidebar() {
  const root = document.getElementById("editorSidebar");
  const mats = state.catalog.materials;
  root.innerHTML =
    `<h2>Материалы и артикулы</h2>` +
    mats
      .map((mat, mi) => {
        const selectedMat = state.selected && state.selected.m === mat.code && !state.selected.a;
        const artRows = mat.artikuls
          .map((art, ai) => {
            const sel = state.selected && state.selected.m === mat.code && state.selected.a === art.code;
            return `
            <div class="tree-art${sel ? " selected" : ""}" draggable="true"
                 data-material="${escapeAttr(mat.code)}" data-artikul="${escapeAttr(art.code)}" data-index="${ai}">
              <span class="tree-handle" title="Перетащите, чтобы изменить порядок">⋮⋮</span>
              <span class="mono-code">${escapeHtml(art.code)}</span>
              <span class="tree-row-btns">
                <button type="button" data-act="up" title="Выше">↑</button>
                <button type="button" data-act="down" title="Ниже">↓</button>
                <button type="button" data-act="del" class="danger" title="Удалить артикул">✕</button>
              </span>
            </div>`;
          })
          .join("");
        return `
        <div class="tree-mat-block" data-material="${escapeAttr(mat.code)}" data-index="${mi}">
          <div class="tree-mat${selectedMat ? " selected" : ""}" draggable="true" data-material="${escapeAttr(mat.code)}">
            <span class="tree-handle" title="Перетащите, чтобы изменить порядок">⋮⋮</span>
            <span>${escapeHtml(mat.name)}</span>
            <span class="tree-mat__count">${mat.artikuls.length}</span>
          </div>
          ${artRows}
          <div class="add-inline">
            <input type="text" placeholder="Новый артикул, напр. K6B" data-add-artikul="${escapeAttr(mat.code)}">
            <button type="button" data-add-artikul-btn="${escapeAttr(mat.code)}">+ Добавить</button>
          </div>
        </div>`;
      })
      .join("") +
    `<div class="add-material-form">
       <input type="text" id="newMatCode" placeholder="Код (напр. pvdf)">
       <input type="text" id="newMatName" placeholder="Название (напр. PVDF)">
       <button type="button" id="addMaterialBtn">+ Добавить материал</button>
     </div>`;

  wireSidebarEvents(root);
}

function wireSidebarEvents(root) {
  root.querySelectorAll(".tree-mat").forEach((el) => {
    el.addEventListener("click", () => selectMaterial(el.getAttribute("data-material")));
  });
  root.querySelectorAll(".tree-art").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      selectArtikul(el.getAttribute("data-material"), el.getAttribute("data-artikul"));
    });
  });
  root.querySelectorAll(".tree-art .tree-row-btns button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const row = btn.closest(".tree-art");
      const m = row.getAttribute("data-material");
      const a = row.getAttribute("data-artikul");
      const act = btn.getAttribute("data-act");
      if (act === "del") removeArtikul(m, a);
      else moveArtikul(m, a, act === "up" ? -1 : 1);
    });
  });
  root.querySelectorAll("[data-add-artikul-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mCode = btn.getAttribute("data-add-artikul-btn");
      const input = root.querySelector(`[data-add-artikul="${cssEscape(mCode)}"]`);
      addArtikul(mCode, input.value.trim());
      input.value = "";
    });
  });
  root.querySelectorAll("[data-add-artikul]").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addArtikul(input.getAttribute("data-add-artikul"), input.value.trim());
        input.value = "";
      }
    });
  });
  document.getElementById("addMaterialBtn").addEventListener("click", () => {
    const codeEl = document.getElementById("newMatCode");
    const nameEl = document.getElementById("newMatName");
    addMaterial(codeEl.value.trim(), nameEl.value.trim());
    codeEl.value = "";
    nameEl.value = "";
  });

  attachDrag(root);
}

/* ---------------- Drag & drop (внутри списка материалов / внутри артикулов одного материала) ---------------- */

let dragCtx = null;

function attachDrag(root) {
  root.querySelectorAll(".tree-mat[draggable], .tree-art[draggable]").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      const isArt = el.classList.contains("tree-art");
      dragCtx = isArt
        ? { type: "artikul", material: el.getAttribute("data-material"), artikul: el.getAttribute("data-artikul") }
        : { type: "material", material: el.getAttribute("data-material") };
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      root.querySelectorAll(".drag-over-top,.drag-over-bottom").forEach((n) => n.classList.remove("drag-over-top", "drag-over-bottom"));
    });
    el.addEventListener("dragover", (e) => {
      if (!dragCtx) return;
      const isArt = el.classList.contains("tree-art");
      if (isArt && (dragCtx.type !== "artikul" || dragCtx.material !== el.getAttribute("data-material"))) return;
      if (!isArt && dragCtx.type !== "material") return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const before = e.clientY - rect.top < rect.height / 2;
      el.classList.toggle("drag-over-top", before);
      el.classList.toggle("drag-over-bottom", !before);
    });
    el.addEventListener("dragleave", () => el.classList.remove("drag-over-top", "drag-over-bottom"));
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      const before = el.classList.contains("drag-over-top");
      el.classList.remove("drag-over-top", "drag-over-bottom");
      if (!dragCtx) return;
      if (el.classList.contains("tree-art")) {
        dropArtikul(el.getAttribute("data-material"), el.getAttribute("data-artikul"), before);
      } else {
        dropMaterial(el.getAttribute("data-material"), before);
      }
      dragCtx = null;
    });
  });
}

function dropArtikul(targetMaterial, targetArtikul, before) {
  if (dragCtx.material !== targetMaterial) return;
  const mat = state.catalog.materials.find((m) => m.code === targetMaterial);
  const fromIdx = mat.artikuls.findIndex((a) => a.code === dragCtx.artikul);
  let toIdx = mat.artikuls.findIndex((a) => a.code === targetArtikul);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
  const [item] = mat.artikuls.splice(fromIdx, 1);
  toIdx = mat.artikuls.findIndex((a) => a.code === targetArtikul);
  mat.artikuls.splice(before ? toIdx : toIdx + 1, 0, item);
  markDirty();
  renderSidebar();
}

function dropMaterial(targetMaterial, before) {
  const fromIdx = state.catalog.materials.findIndex((m) => m.code === dragCtx.material);
  let toIdx = state.catalog.materials.findIndex((m) => m.code === targetMaterial);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
  const [item] = state.catalog.materials.splice(fromIdx, 1);
  toIdx = state.catalog.materials.findIndex((m) => m.code === targetMaterial);
  state.catalog.materials.splice(before ? toIdx : toIdx + 1, 0, item);
  markDirty();
  renderSidebar();
}

function moveArtikul(materialCode, artikulCode, dir) {
  const mat = state.catalog.materials.find((m) => m.code === materialCode);
  const idx = mat.artikuls.findIndex((a) => a.code === artikulCode);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= mat.artikuls.length) return;
  const [item] = mat.artikuls.splice(idx, 1);
  mat.artikuls.splice(newIdx, 0, item);
  markDirty();
  renderSidebar();
}

/* ---------------- Добавление / удаление ---------------- */

function addMaterial(code, name) {
  if (!code || !name) {
    alert("Укажите код и название материала.");
    return;
  }
  if (state.catalog.materials.some((m) => m.code === code)) {
    alert("Материал с таким кодом уже есть.");
    return;
  }
  state.catalog.materials.push({ code, name, fullName: "", artikuls: [] });
  markDirty();
  renderSidebar();
  selectMaterial(code);
}

function removeMaterial(code) {
  const mat = state.catalog.materials.find((m) => m.code === code);
  if (!mat) return;
  const msg = mat.artikuls.length
    ? `Удалить материал «${mat.name}» вместе со всеми артикулами (${mat.artikuls.length})? Это нельзя отменить.`
    : `Удалить материал «${mat.name}»?`;
  if (!confirm(msg)) return;
  state.catalog.materials = state.catalog.materials.filter((m) => m.code !== code);
  markDirty();
  state.selected = null;
  renderSidebar();
  const first = state.catalog.materials[0];
  if (first) (first.artikuls[0] ? selectArtikul(first.code, first.artikuls[0].code) : selectMaterial(first.code));
  else {
    document.getElementById("editorForm").innerHTML = `<p class="editor-empty">Каталог пуст — добавьте материал слева.</p>`;
    document.getElementById("editorPreview").innerHTML = "";
  }
}

function addArtikul(materialCode, code) {
  if (!code) return;
  const mat = state.catalog.materials.find((m) => m.code === materialCode);
  if (!mat) return;
  if (mat.artikuls.some((a) => a.code === code)) {
    alert("Такой артикул уже есть в этом материале.");
    return;
  }
  mat.artikuls.push({
    code,
    form: "",
    colors: [],
    kind: "",
    photo: "",
    shortDescription: "",
    description: "",
    applications: [],
    workPhotos: [],
    physicalParams: clonePhysicalTemplate(),
    sizeGrid: [],
  });
  markDirty();
  renderSidebar();
  selectArtikul(materialCode, code);
}

function removeArtikul(materialCode, artikulCode) {
  const mat = state.catalog.materials.find((m) => m.code === materialCode);
  if (!mat) return;
  if (!confirm(`Удалить артикул ${artikulCode}?`)) return;
  mat.artikuls = mat.artikuls.filter((a) => a.code !== artikulCode);
  markDirty();
  if (state.selected && state.selected.m === materialCode && state.selected.a === artikulCode) {
    state.selected = null;
    selectMaterial(materialCode);
  }
  renderSidebar();
}

/* ---------------- Выбор и рендер формы ---------------- */

function selectMaterial(code) {
  state.selected = { m: code, a: null };
  renderSidebarSelection();
  renderForm();
  renderPreview();
}

function selectArtikul(materialCode, artikulCode) {
  state.selected = { m: materialCode, a: artikulCode };
  renderSidebarSelection();
  renderForm();
  renderPreview();
}

function renderSidebarSelection() {
  document.querySelectorAll(".tree-mat, .tree-art").forEach((el) => el.classList.remove("selected"));
  if (!state.selected) return;
  if (state.selected.a) {
    const el = document.querySelector(`.tree-art[data-material="${cssEscape(state.selected.m)}"][data-artikul="${cssEscape(state.selected.a)}"]`);
    if (el) el.classList.add("selected");
  } else {
    const el = document.querySelector(`.tree-mat[data-material="${cssEscape(state.selected.m)}"]`);
    if (el) el.classList.add("selected");
  }
}

function currentMaterial() {
  if (!state.selected) return null;
  return state.catalog.materials.find((m) => m.code === state.selected.m) || null;
}

function currentArtikul() {
  const mat = currentMaterial();
  if (!mat || !state.selected.a) return null;
  return mat.artikuls.find((a) => a.code === state.selected.a) || null;
}

function renderForm() {
  const form = document.getElementById("editorForm");
  const mat = currentMaterial();
  if (!mat) {
    form.innerHTML = `<p class="editor-empty">Выберите материал или артикул слева.</p>`;
    return;
  }
  const art = currentArtikul();
  if (!art) {
    form.innerHTML = materialFormHTML(mat);
  } else {
    form.innerHTML = artikulFormHTML(mat, art);
  }
  wireFormEvents(mat, art);
}

function materialFormHTML(mat) {
  return `
    <h2>${escapeHtml(mat.name)}</h2>
    <p class="field-hint">Материал · ${mat.artikuls.length} артикул(ов). Выберите артикул слева, чтобы редактировать его карточку.</p>
    <div class="form-row"><label>Код (используется в ссылках)</label><input type="text" data-field="code" value="${escapeAttr(mat.code)}"></div>
    <div class="form-row"><label>Название</label><input type="text" data-field="name" value="${escapeAttr(mat.name)}"></div>
    <div class="form-row"><label>Полное название</label><input type="text" data-field="fullName" value="${escapeAttr(mat.fullName || "")}"></div>
    <div class="danger-zone"><button type="button" class="btn-danger" id="deleteMaterialBtn">Удалить материал «${escapeHtml(mat.name)}»</button></div>`;
}

function physicalFieldsetsHTML(art) {
  if (!art.physicalParams || !art.physicalParams.length) art.physicalParams = clonePhysicalTemplate();
  return art.physicalParams
    .map(
      (g, gi) => `
    <fieldset class="field-group">
      <legend>${escapeHtml(g.group)}</legend>
      <div class="dyn-labels phys-labels"><span>Показатель</span><span>Стандарт</span><span>Условия</span><span>Ед.изм.</span><span>Значение</span><span></span></div>
      <div class="dyn-table" id="physGroup${gi}Table"></div>
      <button type="button" class="dyn-add-btn" data-add-phys-row="${gi}">+ Добавить показатель</button>
    </fieldset>`
    )
    .join("");
}

function renderPhysicalGroupTable(containerId, rows) {
  const el = document.getElementById(containerId);
  const keys = ["label", "std", "condition", "unit", "value"];
  if (!rows.length) {
    el.innerHTML = `<p class="editor-empty" style="padding:8px 0;text-align:left">Пока нет строк.</p>`;
    return;
  }
  el.innerHTML = rows
    .map(
      (row, i) => `
      <div class="dyn-row phys-row" data-i="${i}">
        ${keys.map((k) => `<input type="text" data-key="${k}" value="${escapeAttr(row[k] || "")}">`).join("")}
        <button type="button" class="remove-row" title="Удалить строку">✕</button>
      </div>`
    )
    .join("");
  el.querySelectorAll(".phys-row").forEach((rowEl) => {
    const i = Number(rowEl.getAttribute("data-i"));
    rowEl.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        rows[i][input.getAttribute("data-key")] = input.value;
        markDirty();
        renderPreview();
      });
    });
    rowEl.querySelector(".remove-row").addEventListener("click", () => {
      rows.splice(i, 1);
      markDirty();
      renderPhysicalGroupTable(containerId, rows);
      renderPreview();
    });
  });
}

function artikulFormHTML(mat, art) {
  return `
    <h2>${escapeHtml(mat.name)} · <span class="mono-code">${escapeHtml(art.code)}</span></h2>
    <p class="field-hint">Изменения сразу видны в превью справа.</p>

    <div class="form-row"><label>Артикул</label><input type="text" data-field="code" value="${escapeAttr(art.code)}"></div>
    <div class="form-row"><label>Форма поставки</label><input type="text" data-field="form" value="${escapeAttr(art.form || "")}" placeholder="напр. Лист / стержень"></div>
    <div class="form-row"><label>Тип / модификация</label><input type="text" data-field="kind" value="${escapeAttr(art.kind || "")}" placeholder="напр. Антистатический (ESD)"></div>

    <fieldset class="field-group">
      <legend>Цвета</legend>
      <div class="chip-input-list" id="colorsChips"></div>
      <div class="chip-add-row"><input type="text" id="colorAddInput" placeholder="Добавить цвет и нажать Enter"><button type="button" id="colorAddBtn">Добавить</button></div>
    </fieldset>

    <div class="form-row">
      <label>Фото товара <span class="field-hint-inline">(вкладка «Сведения» — вместо заглушки)</span></label>
      <input type="text" data-field="photo" id="photoPathInput" value="${escapeAttr(art.photo || "")}" placeholder="assets/photos/${escapeAttr((mat.code || "").toLowerCase())}/имя-файла.jpg">
      <p class="field-hint" style="margin:6px 0 0">Сам файл нужно заранее положить в папку сайта по этому пути (спросите, если нужно добавить новое фото).</p>
      <div class="photo-preview" id="photoPreview" style="display:none">
        <img id="photoPreviewImg" ${art.photo ? `src="${escapeAttr(assetUrl(art.photo))}"` : ""} alt="" onerror="document.getElementById('photoPreview').style.display='none'" onload="document.getElementById('photoPreview').style.display='block'">
      </div>
    </div>

    <div class="form-row">
      <label>Короткое описание <span class="field-hint-inline">(превью, карточка в каталоге, шапка страницы артикула)</span></label>
      <textarea data-field="shortDescription" rows="2" placeholder="Одна-две продающие фразы: что это за марка и чем хороша">${escapeHtml(art.shortDescription || "")}</textarea>
    </div>

    <div class="form-row">
      <label>Описание продукта <span class="field-hint-inline">(вкладка «Описание продукта» — можно расписать материал подробнее)</span></label>
      <textarea data-field="description" rows="6">${escapeHtml(art.description || "")}</textarea>
    </div>

    <fieldset class="field-group">
      <legend>Типичное применение</legend>
      <div class="chip-input-list" id="appsChips"></div>
      <div class="chip-add-row"><input type="text" id="appAddInput" placeholder="Добавить применение и нажать Enter"><button type="button" id="appAddBtn">Добавить</button></div>
    </fieldset>

    <fieldset class="field-group">
      <legend>Примеры работ <span class="field-hint-inline">(вкладка «Описание продукта» — фото готовых изделий)</span></legend>
      <p class="field-hint" style="margin:-8px 0 12px">Путь к файлу — как в поле «Фото товара» выше; подпись необязательна.</p>
      <div class="dyn-labels" style="--cols:2"><span>Путь к файлу</span><span>Подпись</span><span></span></div>
      <div class="dyn-table" id="workPhotosTable"></div>
      <button type="button" class="dyn-add-btn" id="addWorkPhotoRow">+ Добавить фото</button>
    </fieldset>

    ${physicalFieldsetsHTML(art)}

    <fieldset class="field-group">
      <legend>Таблица размеров (сетка наличия)</legend>
      <div class="dyn-labels" style="--cols:4"><span>Толщина / Ø, мм</span><span>Лист</span><span>Стержень</span><span>Труба</span><span></span></div>
      <div class="dyn-table" id="sizeGridTable"></div>
      <button type="button" class="dyn-add-btn" id="addSizeRow">+ Добавить строку</button>
    </fieldset>

    <div class="danger-zone"><button type="button" class="btn-danger" id="deleteArtikulBtn">Удалить артикул ${escapeHtml(art.code)}</button></div>`;
}

function wireFormEvents(mat, art) {
  const form = document.getElementById("editorForm");

  if (!art) {
    form.querySelectorAll("[data-field]").forEach((input) => {
      const field = input.getAttribute("data-field");
      input.addEventListener("input", () => {
        mat[field] = input.value;
        if (field === "code") state.selected.m = input.value; // держим выбор в синхроне при переименовании
        markDirty();
      });
      // Пересобираем список слева только для полей, которые там показаны (иначе теряем фокус на каждый чих)
      if (field === "code" || field === "name") input.addEventListener("blur", () => renderSidebar());
    });
    document.getElementById("deleteMaterialBtn").addEventListener("click", () => removeMaterial(mat.code));
    return;
  }

  form.querySelectorAll("[data-field]").forEach((input) => {
    const field = input.getAttribute("data-field");
    input.addEventListener("input", () => {
      art[field] = input.value;
      if (field === "code") state.selected.a = input.value;
      markDirty();
      renderPreview();
    });
    if (field === "code") input.addEventListener("blur", () => renderSidebar());
  });

  renderChips("colorsChips", art.colors || (art.colors = []));
  wireChipAdd("colorAddInput", "colorAddBtn", art.colors, "colorsChips");

  renderChips("appsChips", art.applications || (art.applications = []));
  wireChipAdd("appAddInput", "appAddBtn", art.applications, "appsChips");

  if (!art.physicalParams || !art.physicalParams.length) art.physicalParams = clonePhysicalTemplate();
  art.physicalParams.forEach((g, gi) => renderPhysicalGroupTable(`physGroup${gi}Table`, g.rows));
  form.querySelectorAll("[data-add-phys-row]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const gi = Number(btn.getAttribute("data-add-phys-row"));
      art.physicalParams[gi].rows.push({ label: "", std: "", condition: "", unit: "", value: "" });
      markDirty();
      renderPhysicalGroupTable(`physGroup${gi}Table`, art.physicalParams[gi].rows);
      renderPreview();
    });
  });

  renderDynTable("sizeGridTable", art.sizeGrid || (art.sizeGrid = []), ["range", "sheet", "rod", "pipe"]);
  document.getElementById("addSizeRow").addEventListener("click", () => {
    art.sizeGrid.push({ range: "", sheet: "", rod: "", pipe: "" });
    markDirty();
    renderDynTable("sizeGridTable", art.sizeGrid, ["range", "sheet", "rod", "pipe"]);
    renderPreview();
  });

  renderDynTable("workPhotosTable", art.workPhotos || (art.workPhotos = []), ["src", "caption"]);
  document.getElementById("addWorkPhotoRow").addEventListener("click", () => {
    art.workPhotos.push({ src: "", caption: "" });
    markDirty();
    renderDynTable("workPhotosTable", art.workPhotos, ["src", "caption"]);
    renderPreview();
  });

  const photoInput = document.getElementById("photoPathInput");
  const photoPreviewImg = document.getElementById("photoPreviewImg");
  if (photoInput && photoPreviewImg) {
    photoInput.addEventListener("input", () => {
      photoPreviewImg.src = assetUrl(photoInput.value);
    });
    if (art.photo) photoPreviewImg.src = assetUrl(art.photo);
  }

  document.getElementById("deleteArtikulBtn").addEventListener("click", () => removeArtikul(mat.code, art.code));
}

function renderChips(containerId, arr) {
  const el = document.getElementById(containerId);
  el.innerHTML = arr
    .map((val, i) => `<span class="chip-editable">${escapeHtml(val)}<button type="button" data-i="${i}">×</button></span>`)
    .join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      arr.splice(Number(btn.getAttribute("data-i")), 1);
      markDirty();
      renderChips(containerId, arr);
      renderPreview();
    });
  });
}

function wireChipAdd(inputId, btnId, arr, containerId) {
  const input = document.getElementById(inputId);
  const commit = () => {
    const v = input.value.trim();
    if (!v) return;
    arr.push(v);
    input.value = "";
    markDirty();
    renderChips(containerId, arr);
    renderPreview();
  };
  document.getElementById(btnId).addEventListener("click", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  });
}

function renderDynTable(containerId, rows, keys) {
  const el = document.getElementById(containerId);
  if (!rows.length) {
    el.innerHTML = `<p class="editor-empty" style="padding:8px 0;text-align:left">Пока нет строк.</p>`;
    return;
  }
  el.style.setProperty("--cols", keys.length);
  el.innerHTML = rows
    .map(
      (row, i) => `
      <div class="dyn-row" style="--cols:${keys.length}" data-i="${i}">
        ${keys.map((k) => `<input type="text" data-key="${k}" value="${escapeAttr(row[k] || "")}">`).join("")}
        <button type="button" class="remove-row" title="Удалить строку">✕</button>
      </div>`
    )
    .join("");
  el.querySelectorAll(".dyn-row").forEach((rowEl) => {
    const i = Number(rowEl.getAttribute("data-i"));
    rowEl.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        rows[i][input.getAttribute("data-key")] = input.value;
        markDirty();
        renderPreview();
      });
    });
    rowEl.querySelector(".remove-row").addEventListener("click", () => {
      rows.splice(i, 1);
      markDirty();
      renderDynTable(containerId, rows, keys);
      renderPreview();
    });
  });
}

/* ---------------- Превью (переиспользует renderProductInto из catalog.js) ---------------- */

function renderPreview() {
  const root = document.getElementById("editorPreview");
  const mat = currentMaterial();
  const art = currentArtikul();
  if (!mat || !art) {
    root.innerHTML = `<p class="editor-empty">Выберите артикул, чтобы увидеть превью страницы.</p>`;
    return;
  }
  const frame = document.createElement("div");
  frame.className = "preview-frame";
  root.innerHTML = "";
  root.appendChild(frame);
  renderProductInto(frame, state.catalog, mat, art);
}

/* ---------------- Сохранение ---------------- */

async function saveCatalog(forcePick) {
  const json = JSON.stringify(state.catalog, null, 2);

  if (window.showDirectoryPicker) {
    try {
      const dirHandle = await ensureSiteFolder(forcePick);
      if (!dirHandle) return; // пользователь отменил выбор папки или папка не подошла
      const publicDir = await dirHandle.getDirectoryHandle("public", { create: false });
      const dataDir = await publicDir.getDirectoryHandle("data", { create: false });
      const fileHandle = await dataDir.getFileHandle("catalog.json", { create: false });

      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();

      // Проверка: перечитываем файл и сверяем с тем, что только что записали
      const readBack = await (await fileHandle.getFile()).text();
      if (readBack !== json) {
        throw new Error("после записи содержимое файла не совпало — сохранение не подтверждено");
      }

      state.dirty = false;
      const stamp = new Date().toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "medium" });
      updateSaveStatus({ ok: true, text: `Сохранено и проверено · ${stamp}` });
      updateFolderStatus();
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // пользователь закрыл системное окно выбора папки
      console.warn("Не удалось сохранить напрямую в папку сайта, скачиваю файл:", err);
      alert("Не получилось сохранить напрямую в папку сайта (" + err.message + "). Файл будет просто скачан — перенесите его в public/data/catalog.json вручную.");
    }
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "catalog.json";
  a.click();
  URL.revokeObjectURL(url);
  state.dirty = false;
  const stamp = new Date().toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "medium" });
  updateSaveStatus({ ok: false, text: `Скачан файл, перенесите вручную · ${stamp}` });
  alert("Браузер не поддерживает прямую запись в папку сайта. Файл catalog.json скачан — замените им public/data/catalog.json в папке проекта.");
}

/* ---------------- Утилиты ---------------- */

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function cssEscape(str) {
  return String(str).replace(/["\\]/g, "\\$&");
}
