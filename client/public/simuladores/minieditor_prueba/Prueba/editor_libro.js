// ========= editor_libro.js — FINAL+SIM v2 (fixes) =========
// Fixes principales:
// 1) “Texto/Fondo/Página” ya NO pinta la UI del editor (solo Vista previa y export).
// 2) Respeta saltos de línea: .paper usa white-space: pre-wrap (preview y export).
// 3) Simuladores (iframes) heredan el color de la página, con borde y border-radius.
// 4) Export seguro: escapa </script> en JSON, para que no rompa el HTML exportado.
// 5) Portada con campos guiados (Autor, Edición, Fecha, Editorial, Imagen).
// 6) Botón “Insertar simulador” (no aparece en Portada).
// 7) Muchos console.log para depurar (puedes quitarlos luego).

/* ============ Helpers ============ */
const $ = (s) => document.querySelector(s);
console.log("✅ [BOOT] editor_libro.js v2 cargado");

function insertAtCursor(textarea, text){
  try{
    const start = textarea.selectionStart ?? textarea.value.length;
    const end   = textarea.selectionEnd ?? textarea.value.length;
    const v = textarea.value || "";
    textarea.value = v.slice(0,start) + text + v.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    console.log("✏ [insertAtCursor] insertado:", text.slice(0,80));
  }catch(err){ console.error("❌ [insertAtCursor]", err); }
}
function escapeHTML(s){
  return (s||"").replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
// Escapa </script> en strings JSON incrustados dentro de <script> del exportador
function safeJSONStringify(obj){
  return JSON.stringify(obj).replace(/<\/script>/gi, '<\\/script>');
}

/* ============ Estado + Historial ============ */
let pages = [];        // Inicia VACÍO
let selectedId = null;
let idSeq = 1;
const historyStack = [];

function pushHistory(){
  try{
    historyStack.push(JSON.stringify(pages));
    const undoBtn = $('#btnDeshacer');
    if (undoBtn) undoBtn.disabled = historyStack.length <= 1;
    console.log("🧠 [pushHistory] tamaño:", historyStack.length);
  }catch(err){ console.error("❌ [pushHistory]", err); }
}
function undo(){
  try{
    if(historyStack.length > 1){
      historyStack.pop();
      pages = JSON.parse(historyStack[historyStack.length-1]);
      selectedId = null;
      console.log("↩ [undo] restaurado, páginas:", pages.length);
      renderPagesList(); renderPreview(); dumpHTML();
    }
  }catch(err){ console.error("❌ [undo]", err); }
}
$('#btnDeshacer')?.addEventListener('click', ()=>{ console.log("🟨 [click] Deshacer"); undo(); });

/* ============ Lista de páginas ============ */
const pagesList = $('#pagesList');
function newPage(tipo="generico"){ return { id: "p"+(idSeq++), tipo, titulo: "Nueva página", contenido: "" }; }

function renderPagesList(){
  try{
    pagesList.innerHTML = "";
    pages.forEach(p=>{
      const li = document.createElement('li');
      li.className = "page-item" + (p.id === selectedId ? " selected" : "");
      li.dataset.id = p.id;

      const dot = document.createElement('span');
      dot.style.width="8px"; dot.style.height="8px"; dot.style.borderRadius="999px";
      dot.style.background = p.contenido.trim()? "var(--good)":"#334155";

      const title = document.createElement('div');
      title.className="page-title"; title.textContent = (p.tipo==='portada'?'📘 ':'') + (p.titulo || "(sin título)");

      const actions = document.createElement('div');
      actions.className = "page-actions";

      const bEdit = document.createElement('button'); bEdit.type="button"; bEdit.textContent="Editar";
      const bUp   = document.createElement('button'); bUp.type="button"; bUp.textContent="↑";
      const bDown = document.createElement('button'); bDown.type="button"; bDown.textContent="↓";
      const bDel  = document.createElement('button'); bDel.type="button"; bDel.textContent="Borrar"; bDel.className="danger";

      bEdit.onclick = (e)=>{ e.stopPropagation(); console.log("✏ [click] Editar", p.id); openEditorForEdit(p.id); };
      bUp.onclick   = (e)=>{ e.stopPropagation(); console.log("⬆ [click] Subir", p.id); select(p.id); moveSelected(-1); };
      bDown.onclick = (e)=>{ e.stopPropagation(); console.log("⬇ [click] Bajar", p.id); select(p.id); moveSelected(1); };
      bDel.onclick  = (e)=>{ e.stopPropagation(); console.log("🗑 [click] Borrar", p.id); select(p.id); deleteSelected(); };

      actions.append(bEdit,bUp,bDown,bDel);
      li.append(dot, title, actions);

      li.onclick = ()=>{ console.log("👆 [click] item índice", p.id); select(p.id); openEditorForEdit(p.id); };
      pagesList.appendChild(li);
    });
    console.log("📑 [renderPagesList] total:", pages.length);
  }catch(err){ console.error("❌ [renderPagesList]", err); }
}
function select(id){ selectedId = id; renderPagesList(); }

function moveSelected(delta){
  try{
    const idx = pages.findIndex(p=>p.id===selectedId);
    if(idx<0) return;
    const newIdx = idx + delta;
    if(newIdx<0 || newIdx>=pages.length) return;
    const [it] = pages.splice(idx,1);
    pages.splice(newIdx,0,it);
    console.log("🔀 [moveSelected] movido a", newIdx);
    pushHistory(); renderPagesList(); renderPreview(); dumpHTML();
  }catch(err){ console.error("❌ [moveSelected]", err); }
}

function deleteSelected(){
  try{
    const idx = pages.findIndex(p=>p.id===selectedId);
    if(idx<0) return;
    if(!confirm("¿Eliminar la página seleccionada?")) return;
    pages.splice(idx,1);
    selectedId = null;
    console.log("❎ [deleteSelected] restante:", pages.length);
    pushHistory(); renderPagesList(); renderPreview(); dumpHTML();
  }catch(err){ console.error("❌ [deleteSelected]", err); }
}

/* ============ Modal ============ */
const modalBg = $('#modalEditorBg');
const modalTitulo = $('#modalTitulo');
const inpTitulo = $('#inpTitulo');
const inpContenido = $('#inpContenido');
const modalRow = inpContenido?.closest('.row');
const modalToolbar = modalRow?.querySelector('.toolbar-line');

// Barra existente
const btnMathSimbolos = $('#btnMathSimbolos');
const btnMathEqs = $('#btnMathEqs');
const menuSimbolos = $('#menuSimbolos');
const menuEqs = $('#menuEqs');
const btnImagen = $('#btnImagen');
const inpImagen = $('#inpImagen');

// Botón Simulador
let btnSimulador = document.createElement('button');
btnSimulador.id = 'btnSimulador';
btnSimulador.type = 'button';
btnSimulador.textContent = 'Insertar Simulador';
modalToolbar?.appendChild(btnSimulador);

// Campos Portada
let portadaBox = document.createElement('div');
portadaBox.id = 'portadaFields';
portadaBox.style.display = 'none';
portadaBox.innerHTML = `
  <div class="portada-grid">
    <div class="pf-item"><label>Autor</label><input id="pf_autor" type="text" placeholder="Nombre del autor"></div>
    <div class="pf-item"><label>Edición</label><input id="pf_edicion" type="text" placeholder="1ª, 2ª..."></div>
    <div class="pf-item"><label>Fecha</label><input id="pf_fecha" type="date"></div>
    <div class="pf-item"><label>Editorial</label><input id="pf_editorial" type="text" placeholder="Editorial"></div>
    <div class="pf-item"><label>Imagen</label><input id="pf_img" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png"></div>
    <div class="pf-item"><small>La portada genera el contenido automáticamente.</small></div>
  </div>
`;
modalRow?.insertBefore(portadaBox, modalToolbar);

let portadaImgDataURL = "";
portadaBox.querySelector('#pf_img')?.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  if(!/^image\/(jpeg|png)$/i.test(f.type)){ alert('Selecciona JPG o PNG'); e.target.value=''; return; }
  const r = new FileReader();
  r.onload = ev => { portadaImgDataURL = ev.target.result; console.log("🖼 [portada] imagen lista"); };
  r.readAsDataURL(f);
});

$('#btnCancelar')?.addEventListener('click', (e)=>{ e.preventDefault(); console.log("🟡 [click] Cancelar"); showModal(false); });
$('#btnGuardar')?.addEventListener('click', (e)=>{ e.preventDefault(); console.log("🟢 [click] Guardar"); saveModal(); });

let editingId = null;
let creating = false;
let modalTipo = 'generico'; // 'portada' | 'generico'

function showModal(show){
  try{
    if(show){
      console.log("👉 [showModal] abrir");
      modalBg.style.display = 'flex';
      modalBg.removeAttribute('hidden');
      modalBg.setAttribute('aria-hidden','false');
      setTimeout(()=> inpTitulo?.focus(), 0);
    } else {
      console.log("👈 [showModal] cerrar");
      document.activeElement?.blur();
      modalBg.style.display = 'none';
      modalBg.setAttribute('hidden','');
      modalBg.setAttribute('aria-hidden','true');
    }
  }catch(err){ console.error("❌ [showModal]", err); }
}

function setupModalForTipo(tipo){
  modalTipo = tipo || 'generico';
  console.log("🎛 [setupModalForTipo]", modalTipo);
  if(modalTipo === 'portada'){
    portadaBox.style.display = '';
    modalToolbar.style.display = 'none';
    inpContenido.style.display = 'none';
    btnSimulador.style.display = 'none';
  }else{
    portadaBox.style.display = 'none';
    modalToolbar.style.display = '';
    inpContenido.style.display = '';
    btnSimulador.style.display = '';
  }
}

function openEditorForCreate(prefill){
  try{
    creating = true; editingId = null;
    modalTitulo.textContent = "Nueva página";
    inpTitulo.value = prefill?.titulo || "";
    inpContenido.value = prefill?.contenido || "";
    setupModalForTipo(prefill?.tipo || 'generico');
    console.log("🆕 [openEditorForCreate] plantilla", prefill);
    showModal(true);
  }catch(err){ console.error("❌ [openEditorForCreate]", err); }
}
function openEditorForEdit(id){
  try{
    const p = pages.find(x=>x.id===id);
    if(!p){ console.warn("⚠ [openEditorForEdit] no existe", id); return; }
    creating = false; editingId = id;
    modalTitulo.textContent = "Editar página";
    inpTitulo.value = p.titulo || "";
    inpContenido.value = p.contenido || "";
    setupModalForTipo(p.tipo || 'generico');
    console.log("✏ [openEditorForEdit] id", id, "tipo", p.tipo);
    showModal(true);
  }catch(err){ console.error("❌ [openEditorForEdit]", err); }
}

function buildPortadaHTML(titulo){
  const autor = $('#pf_autor')?.value?.trim() || '';
  const edic  = $('#pf_edicion')?.value?.trim() || '';
  const fecha = $('#pf_fecha')?.value || '';
  const edit  = $('#pf_editorial')?.value?.trim() || '';
  const img   = portadaImgDataURL || '';
  return `<div class="portada">
  <h1 style="text-align:center;margin:0 0 .4em 0">${escapeHTML(titulo)}</h1>
  <p style="text-align:center;margin:0"><b>Autor:</b> ${escapeHTML(autor)}</p>
  <p style="text-align:center;margin:.2em 0"><b>Edición:</b> ${escapeHTML(edic)}</p>
  <p style="text-align:center;margin:.2em 0"><b>Fecha:</b> ${escapeHTML(fecha)}</p>
  <p style="text-align:center;margin:.2em 0 .8em 0"><b>Editorial:</b> ${escapeHTML(edit)}</p>
  ${img ? `<img src="${img}" alt="Portada" style="max-width:60%;height:auto;display:block;margin:18px auto;border-radius:8px;">` : ''}
</div>`;
}
function saveModal(){
  try{
    const titulo = (inpTitulo.value || "").trim() || "Página sin título";
    let contenido = inpContenido.value || "";

    if(modalTipo === 'portada'){ contenido = buildPortadaHTML(titulo); }

    if(creating){
      const p = newPage(modalTipo); p.titulo = titulo; p.contenido = contenido;
      pages.push(p); selectedId = p.id;
      console.log("💾 [saveModal] creado", p);
    } else if(editingId){
      const p = pages.find(x=>x.id===editingId);
      if(!p){ console.warn("⚠ [saveModal] no encontró página a editar"); showModal(false); return; }
      p.titulo = titulo; p.contenido = contenido; p.tipo = modalTipo;
      console.log("💾 [saveModal] actualizado", p.id);
    } else {
      console.warn("⚠ [saveModal] sin modo"); showModal(false); return;
    }
    pushHistory(); showModal(false); renderPagesList(); renderPreview(); dumpHTML();
  }catch(err){ console.error("❌ [saveModal]", err); }
}
/* ============ LaTeX + Imagen + Simulador ============ */
function smartToggleMenu(menu, anchorBtn){
  try{
    if(!menu || !anchorBtn) return;
    if(menu.style.display==='block'){ menu.style.display='none'; return; }
    menu.style.display='block';
    const rect = anchorBtn.getBoundingClientRect();
    setTimeout(()=>{
      const mH = menu.offsetHeight || 0;
      const top = (rect.top - mH - 8 < 8) ? rect.bottom + 6 : rect.top - mH - 8;
      menu.style.left = Math.max(8, Math.min(window.innerWidth - (menu.offsetWidth||280) - 8, rect.left)) + 'px';
      menu.style.top  = top + 'px';
    },0);
  }catch(err){ console.error("❌ [smartToggleMenu]", err); }
}

function populateMathMenus(){
  try{
    if(!menuSimbolos || !menuEqs) return;
    menuSimbolos.innerHTML = `
      <div class="menu-cat">Conjuntos</div>
        <span class="math-item" data-insert="\\mathbb{N}">ℕ</span>
        <span class="math-item" data-insert="\\mathbb{Z}">ℤ</span>
        <span class="math-item" data-insert="\\mathbb{Q}">ℚ</span>
        <span class="math-item" data-insert="\\mathbb{R}">ℝ</span>
        <span class="math-item" data-insert="\\mathbb{C}">ℂ</span>
      <div class="menu-cat">Operaciones</div>
        <span class="math-item" data-insert="+">+</span>
        <span class="math-item" data-insert="-">−</span>
        <span class="math-item" data-insert="\\times">×</span>
        <span class="math-item" data-insert="\\cdot">·</span>
        <span class="math-item" data-insert="\\div">÷</span>
        <span class="math-item" data-insert="=">=</span>
        <span class="math-item" data-insert="\\neq">≠</span>
        <span class="math-item" data-insert="\\leq">≤</span>
        <span class="math-item" data-insert="\\geq">≥</span>
      <div class="menu-cat">Especiales</div>
        <span class="math-item" data-insert="\\infty">∞</span>
        <span class="math-item" data-insert="\\in">∈</span>
        <span class="math-item" data-insert="\\notin">∉</span>
        <span class="math-item" data-insert="\\subset">⊂</span>
        <span class="math-item" data-insert="\\varnothing">∅</span>
      <div class="menu-cat">Griego</div>
        <span class="math-item" data-insert="\\alpha">α</span>
        <span class="math-item" data-insert="\\beta">β</span>
        <span class="math-item" data-insert="\\gamma">γ</span>
        <span class="math-item" data-insert="\\delta">δ</span>
        <span class="math-item" data-insert="\\theta">θ</span>
        <span class="math-item" data-insert="\\pi">π</span>
        <span class="math-item" data-insert="\\sigma">σ</span>
        <span class="math-item" data-insert="\\omega">ω</span>
    `;

    menuEqs.innerHTML = `
      <div class="menu-cat">Estructuras</div>
        <span class="math-item" data-insert="\\\\frac{a}{b}">\$begin:math:text$\\\\frac{a}{b}\\$end:math:text$</span>
        <span class="math-item" data-insert="\\\\sqrt{a}">\$begin:math:text$\\\\sqrt{a}\\$end:math:text$</span>
        <span class="math-item" data-insert="a^{n}">\$begin:math:text$a^{n}\\$end:math:text$</span>
        <span class="math-item" data-insert="a_{n}">\$begin:math:text$a_{n}\\$end:math:text$</span>
        <span class="math-item" data-insert="\\\\sum_{i=1}^{n} a_i">\$begin:math:text$\\\\sum_{i=1}^{n} a_i\\$end:math:text$</span>
        <span class="math-item" data-insert="\\\\prod_{i=1}^{n} a_i">\$begin:math:text$\\\\prod_{i=1}^{n} a_i\\$end:math:text$</span>
        <span class="math-item" data-insert="\\\\int_{a}^{b} f(x)\\\\,dx">\$begin:math:text$\\\\int_{a}^{b} f(x)\\\\,dx\\$end:math:text$</span>
        <span class="math-item" data-insert="\\\\lim_{x\\\\to 0} f(x)">\$begin:math:text$\\\\lim_{x\\\\to 0} f(x)\\$end:math:text$</span>
    `;

    if (window.MathJax?.typesetPromise) {
      MathJax.typesetClear && MathJax.typesetClear([menuSimbolos, menuEqs]);
      MathJax.typesetPromise([menuSimbolos, menuEqs]);
    }

    [...menuSimbolos.querySelectorAll('.math-item'),
     ...menuEqs.querySelectorAll('.math-item')].forEach(el=>{
      el.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const val = el.getAttribute('data-insert') || '';
        insertAtCursor($('#inpContenido'), `\$begin:math:text$${val}\\$end:math:text$`);
        menuSimbolos.style.display='none';
        menuEqs.style.display='none';
        $('#inpContenido')?.focus();
      });
    });
    console.log("∑ [populateMathMenus] listos símbolos/estructuras");
  }catch(err){ console.error("❌ [populateMathMenus]", err); }
}

btnMathSimbolos?.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(menuEqs) menuEqs.style.display='none';
  smartToggleMenu(menuSimbolos, e.currentTarget);
  console.log("🔣 [click] Menú Símbolos");
});
btnMathEqs?.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(menuSimbolos) menuSimbolos.style.display='none';
  smartToggleMenu(menuEqs, e.currentTarget);
  console.log("🧮 [click] Menú Estructuras");
});
btnImagen?.addEventListener('click', ()=> { console.log("🖼 [click] Imagen"); inpImagen?.click(); });
inpImagen?.addEventListener('change', ()=>{
  try{
    const file = inpImagen.files && inpImagen.files[0];
    if(!file) return;
    if(!/^image\/(jpeg|png)$/i.test(file.type)){
      alert('Selecciona JPG o PNG'); inpImagen.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = e=>{
      const dataURL = e.target.result;
      const tag = `<img src="${dataURL}" alt="Imagen" style="max-width:100%;height:auto;display:block;margin:8px auto;border-radius:8px">`;
      insertAtCursor($('#inpContenido'), tag);
      inpImagen.value = '';
      $('#inpContenido')?.focus();
      console.log("🖼 [imagen] insertada");
    };
    reader.readAsDataURL(file);
  }catch(err){ console.error("❌ [imagen] error", err); }
});

// Insertar simulador (pegando el código tal cual)
btnSimulador?.addEventListener('click', ()=>{
  try{
    if(modalTipo === 'portada'){ return; }
    const code = prompt("Pega el código del simulador (iframe/script/div…). Se insertará tal cual:", "<iframe ...></iframe>");
    if(code && code.trim()){
      insertAtCursor($('#inpContenido'), "\n" + code.trim() + "\n");
      console.log("🧩 [simulador] insertado");
    }
  }catch(err){ console.error("❌ [simulador]", err); }
});

window.addEventListener('click', (e)=>{
  if(!e.target.closest('.math-menu') && !e.target.closest('button')){
    if(menuSimbolos) menuSimbolos.style.display='none';
    if(menuEqs) menuEqs.style.display='none';
  }
});

/* ============ Vista previa + composición ============ */
const vistaPrevia = $('#vistaPrevia');
const htmlGenerado = $('#htmlGenerado');

const fontSize = $('#fontSize');
const lineHeight = $('#lineHeight');
const margins = $('#margins');
const columns = $('#columns');
const bgColor = $('#bgColor');
const textColor = $('#textColor');
const paperColor = $('#paperColor');
const liveTypesetTag = $('#liveTypeset');

function applyLiveTypeset() {
  try{
    if(!liveTypesetTag) return;
    const f    = parseInt(fontSize?.value ?? 16,10);
    const lh   = parseFloat(lineHeight?.value ?? 1.35);
    const mg   = parseInt(margins?.value ?? 28,10);
    const cols = parseInt(columns?.value ?? 1,10);
    const gap  = cols===2 ? 16 : 0;
    const tx   = textColor?.value || '#e5e7eb';
    const paper= paperColor?.value || '#0a1120';

    // Solo afecta Vista Previa (.paper y .page-proxy), NO la UI del editor
    liveTypesetTag.textContent = `
      #vistaPrevia{color:${tx};}
      #vistaPrevia .page-proxy{ background: ${paper}; color:${tx}; }
      .paper{
        background:${paper};
        margin:${mg}px;
        column-count:${cols};
        column-gap:${gap}px;
        color:${tx};
        white-space: pre-wrap;
      }
      .paper h1,.paper h2,.paper h3,.paper h4{break-inside:avoid; margin:0 0 .4em 0}
      .paper p{break-inside:avoid; orphans:2; widows:2;}
      .paper img{max-width:100%; height:auto; display:block; margin:8px auto; border-radius:8px}
      .paper ul,.paper ol{margin:.5em 0 .5em 1.25em}
      .paper hr{border:0; height:1px; background:#203055; margin:.8em 0}
      .paper iframe{ width:100%; background:${paper}; border:1px solid rgba(0,0,0,.3); border-radius:10px; display:block; margin:10px auto; }
    `;
    if (window.MathJax?.typesetPromise) MathJax.typesetPromise([vistaPrevia]);
    console.log("🪄 [applyLiveTypeset] aplicado (scoped)");
  }catch(err){ console.error("❌ [applyLiveTypeset]", err); }
}

[fontSize, lineHeight, margins, columns, bgColor, textColor, paperColor].forEach(inp=>{
  inp?.addEventListener('input', () => { renderPreview(); applyLiveTypeset(); dumpHTML(); });
});

function renderPreview(){
  try{
    if(!vistaPrevia) return;
    vistaPrevia.innerHTML = "";
    pages.forEach((p, i)=>{
      const card = document.createElement('div');
      card.className = 'page-proxy';
      const h = document.createElement('h4');
      h.textContent = `Pág. ${i+1} — ${p.titulo || '(sin título)'}${p.tipo==='portada'?' [Portada]':''}`;
      const body = document.createElement('div');
      body.className = 'paper';
      body.innerHTML = p.contenido || "";
      card.append(h, body);
      vistaPrevia.appendChild(card);
    });
    if(window.MathJax?.typesetPromise) MathJax.typesetPromise([vistaPrevia]);
    console.log("👁 [renderPreview] páginas:", pages.length);
  }catch(err){ console.error("❌ [renderPreview]", err); }
}

function buildTypesetCSS(){
  const f = parseInt(fontSize?.value ?? 16,10);
  const lh = parseFloat(lineHeight?.value ?? 1.35);
  const mg = parseInt(margins?.value ?? 28,10);
  const cols = parseInt(columns?.value ?? 1,10);
  const gap = cols===2 ? 16 : 0;
  return `
    body{font-size:${f}px; line-height:${lh};}
    .paper{margin:${mg}px; column-count:${cols}; column-gap:${gap}px; white-space: pre-wrap;}
    .paper p{break-inside:avoid; orphans:2; widows:2;}
    .paper h1,.paper h2,.paper h3,.paper h4{break-inside:avoid; margin:0 0 .4em 0}
    .paper img{max-width:100%; height:auto; display:block; margin:8px auto; border-radius:8px}
    .paper ul,.paper ol{margin:.5em 0 .5em 1.25em}
    .paper hr{border:0; height:1px; background:#203055; margin:.8em 0}
    .paper iframe{ width:100%; background:inherit; border:1px solid rgba(0,0,0,.3); border-radius:10px; display:block; margin:10px auto; }
  `;
}

function dumpHTML(){
  try{
    if(!htmlGenerado) return;
    const styleInline = buildTypesetCSS();
    let body = "";
    pages.forEach(p=>{
      body += `<div class="paper">
<h2>${escapeHTML(p.titulo||'(sin título)')}</h2>
<hr/>
${p.contenido}
</div>\n`;
    });
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${escapeHTML(pages[0]?.titulo || 'libro')}</title>
<style>${styleInline}</style>
</head>
<body>
${body}
</body>
</html>`;
    htmlGenerado.value = html;
    console.log("📤 [dumpHTML] actualizado");
  }catch(err){ console.error("❌ [dumpHTML]", err); }
}

/* ============ Exportador ============ */
$('#btnDescargar')?.addEventListener('click', ()=>{
  try{
    const name = (pages[0]?.titulo || "libro").replace(/[\\/:*?"<>|]+/g,'-') || 'libro';
    const archivo = name + '.html';

    // Estilos del lector (usa los valores actuales)
    const f    = parseInt(fontSize?.value ?? 16,10);
    const lh   = parseFloat(lineHeight?.value ?? 1.35);
    const mg   = parseInt(margins?.value ?? 28,10);
    const cols = parseInt(columns?.value ?? 1,10);
    const gap  = cols===2 ? 16 : 0;
    const bg   = (bgColor?.value || '#0f172a');
    const tx   = (textColor?.value || '#e5e7eb');
    const paper= (paperColor?.value || '#0a1120');

    const readerBaseCSS = `
      body{margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial; background:${bg}; color:${tx};}
      .wrap{max-width:1100px;margin:24px auto;padding:0 16px;}
      .nav{display:flex; gap:10px; align-items:center; justify-content:center; margin:14px 0;}
      .nav button{padding:8px 12px; border-radius:8px; border:1px solid #1f2937; background:#0b1324; color:#e5e7eb; cursor:pointer}
      .nav button[disabled]{opacity:.5; cursor:not-allowed}
      .paper{border:1px solid #1a2239; border-radius:8px; min-height:100px; padding:18px; background:${paper}; color:${tx};
             margin:${mg}px; column-count:${cols}; column-gap:${gap}px; white-space: pre-wrap; line-height:${lh}; font-size:${f}px;}
      .paper img{max-width:100%; height:auto; display:block; margin:8px auto; border-radius:8px}
      .paper hr{border:0; height:1px; background:#203055; margin:.8em 0}
      .paper iframe{ width:100%; background:${paper}; border:1px solid rgba(0,0,0,.3); border-radius:10px; display:block; margin:10px auto; }
    `;

    const libroJsonSafe = safeJSONStringify(pages);

    const html =
`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${name}</title>
<script>
  MathJax = { tex: { inlineMath: [['\\\$begin:math:text$','\\\\\\$end:math:text$']], displayMath: [['\\\$begin:math:display$','\\\\\\$end:math:display$']] }, svg: { fontCache: 'global' } };
<\/script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
<style>${readerBaseCSS}</style>
</head>
<body>
  <div class="wrap">
    <div id="nav" class="nav"></div>
    <div id="reader"></div>
  </div>

  <script>
    const pages = ${libroJsonSafe};
    let i = 0;
    function buildNav(){
      const nav = document.getElementById('nav');
      nav.innerHTML = '';
      const prev = document.createElement('button'); prev.textContent = '← Anterior';
      const info = document.createElement('span');   info.textContent = 'Pág. ' + (i+1) + ' / ' + pages.length;
      const next = document.createElement('button'); next.textContent = 'Siguiente →';
      prev.onclick = ()=>{ if(i>0){ i--; render(); } };
      next.onclick = ()=>{ if(i<pages.length-1){ i++; render(); } };
      if(i===0) prev.disabled = true;
      if(i===pages.length-1) next.disabled = true;
      nav.append(prev, info, next);
    }
    function render(){
      const r = document.getElementById('reader');
      r.innerHTML = '';
      const p = pages[i] || {titulo:'(vacío)', contenido:''};
      const paper = document.createElement('div');
      paper.className = 'paper';
      const h = document.createElement('h2'); h.textContent = p.titulo || '(sin título)';
      const hr = document.createElement('hr');
      const body = document.createElement('div'); body.innerHTML = p.contenido || '';
      paper.append(h, hr, body);
      r.appendChild(paper);
      buildNav();
      if (window.MathJax?.typesetPromise) MathJax.typesetPromise([paper]);
    }
    window.addEventListener('load', render);
  <\/script>
</body>
</html>`;

    const blob = new Blob([html], {type:'text/html;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = archivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    console.log("⬇ [Descargar] generado", archivo);
  }catch(err){ console.error("❌ [Descargar]", err); }
});

/* ============ Partes + Plantillas ============ */
const partesPopover = $('#partesPopover');
$('#btnPartes')?.addEventListener('click', ()=> { partesPopover?.removeAttribute('hidden'); console.log("📚 [click] Partes (abrir)"); });
$('#btnCerrarPartes')?.addEventListener('click', ()=> { partesPopover?.setAttribute('hidden',''); console.log("📚 [click] Partes (cerrar)"); });

function plantilla(tipo){
  switch(tipo){
    case 'portada':
      return { tipo:'portada', titulo:'Portada', contenido:'' };
    case 'prefacio':
      return { tipo:'generico', titulo:'Prefacio', contenido:`<p>Bienvenid@. Puedes usar LaTeX como \$begin:math:text$e^{i\\\\pi}+1=0\\$end:math:text$.</p>` };
    case 'capitulo':
      return { tipo:'generico', titulo:'Capítulo 1', contenido:`<h3>Introducción</h3><p>Texto de ejemplo.</p><ul><li>Punto 1</li><li>Punto 2</li></ul>\n` };
    case 'seccion':
      return { tipo:'generico', titulo:'Sección', contenido:`<h4>Tema</h4><p>Contenido de la sección.</p>` };
    case 'subseccion':
      return { tipo:'generico', titulo:'Subsección', contenido:`<h5>Subtema</h5><p>Contenido.</p>` };
  }
}

$('#btnAddPortada')?.addEventListener('click', ()=> { console.log("📘 [click] Portada"); openEditorForCreate(plantilla('portada')); });
$('#btnAddPrefacio')?.addEventListener('click', ()=> { console.log("📗 [click] Prefacio"); openEditorForCreate(plantilla('prefacio')); });
$('#btnAddCapitulo')?.addEventListener('click', ()=> { console.log("📙 [click] Capítulo"); openEditorForCreate(plantilla('capitulo')); });
$('#btnAddSeccion')?.addEventListener('click', ()=> { console.log("📄 [click] Sección"); openEditorForCreate(plantilla('seccion')); });
$('#btnAddSubseccion')?.addEventListener('click', ()=> { console.log("🗂 [click] Subsección"); openEditorForCreate(plantilla('subseccion')); });

/* ============ Boot ============ */
window.addEventListener('load', ()=>{
  try{
    const mbg = document.getElementById('modalEditorBg');
    mbg?.setAttribute('hidden','');
    mbg?.style.setProperty('display','none','important');

    pushHistory(); renderPagesList(); renderPreview(); dumpHTML(); applyLiveTypeset(); populateMathMenus();
    console.log("🚀 [READY] Editor listo v2");
  }catch(err){ console.error("❌ [boot]", err); }
});