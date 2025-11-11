//alumno/ruta1/acceso/aula_virtual/WhiteboardPro.js

import React, { useEffect, useRef, useState, useCallback } from "react";
import "./WhiteboardPro.css";

/* ==========================================================
   Pizarrón extendido SIN perder ninguna función existente
   - Mantiene: pluma/marcador/borrador, textos, imágenes, simuladores,
               exportación PNG, autosave (según CLEAR_ON_MOUNT)
   - Añade:    Figuras (línea, rect, cuadrado, círculo, elipse, triángulo)
               Estilos de línea (sólida, punteada, puntos, guion‑punto)
               Gradilla (rejilla) configurable
               Color de fondo del pizarrón
   ========================================================== */;

const TOOLS = { PEN:"pen", HIGHLIGHTER:"highlighter", ERASER:"eraser", TEXT:"text", SHAPE:"shape" };
const SHAPES = { LINE:"line", RECT:"rect", SQUARE:"square", CIRCLE:"circle", ELLIPSE:"ellipse", TRIANGLE:"triangle" };
const LINE_STYLES = {
  SOLID: [],
  DASHED: [8,6],
  DOTTED: [2,6],
  DASH_DOT: [10,5,2,5]
};
const LS_KEY = "wbpro_v1";
const CLEAR_ON_MOUNT = true; // igual que el original

/* ---------- Simuladores: 2 endpoints de fallback ---------- */
const CDN_INDEX = "https://cdn.jsdelivr.net/gh/vec70rr/EditorDeLibro@main/simuladores/manifest.json";
const RAW_INDEX = "https://raw.githubusercontent.com/vec70rr/EditorDeLibro/main/simuladores/manifest.json";
const CDN_BASE  = "https://cdn.jsdelivr.net/gh/vec70rr/EditorDeLibro@main/simuladores/";
const RAW_BASE  = "https://raw.githubusercontent.com/vec70rr/EditorDeLibro/main/simuladores/";

/* ---------- helpers ---------- */
const relXYOf = (el, e) => {
  const r = el.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
  return { x, y };
};
const safeFetchJSON = async (url) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch { throw new Error(`Bad JSON from ${url}`); }
};

export default function WhiteboardPro(){
  /* === Capas === */
  const bgRef   = useRef(null), bgCtxRef   = useRef(null);
  const canvasRef = useRef(null), ctxRef   = useRef(null);
  const ovrRef    = useRef(null), ovrCtxRef= useRef(null);
  const prevRef   = useRef(null), prevCtxRef= useRef(null);
  const dprRef = useRef(window.devicePixelRatio || 1);

  /* UI */
  const [tool, setTool] = useState(TOOLS.PEN);
  const [color, setColor] = useState("#111827");
  const [lineWidth, setLineWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const movedRef = useRef(false);
  const lastPtRef = useRef({ x:0, y:0});

  /* === Nuevos estados === */
  const [shapeType, setShapeType] = useState(SHAPES.LINE);
  const [lineStyleKey, setLineStyleKey] = useState("SOLID");
  const [fillEnabled, setFillEnabled] = useState(false);
  const [fillColor, setFillColor] = useState("#00000010");

  const [boardBg, setBoardBg] = useState("#ffffff");
  const [gridOn, setGridOn] = useState(true);
  const [gridSpacing, setGridSpacing] = useState(24);
  const [gridColor, setGridColor] = useState("#e5e7eb");

  const applyLineDash = (ctx) => { ctx.setLineDash(LINE_STYLES[lineStyleKey] || []); };

  /* text overlay */
  const overlayRef = useRef(null);
  const [textBoxes, setTextBoxes] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const dragTextRef = useRef(null);
  const resizeTextRef = useRef(null);

  /* images overlay */
  const [images, setImages] = useState([]);
  const [activeImgId, setActiveImgId] = useState(null);
  const fileInputRef = useRef(null);
  const dragImgRef = useRef(null);
  const resizeImgRef = useRef(null);

  /* sims */
  const [simPickerOpen, setSimPickerOpen] = useState(false);
  const [simList, setSimList] = useState([]);
  const [simBoxes, setSimBoxes] = useState([]);
  const [activeSimId, setActiveSimId] = useState(null);
  const dragSimRef = useRef(null);
  const resizeSimRef = useRef(null);
  const simIframeRefs = useRef(new Map());

  /* “Más” popover */
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    const close = () => setMoreOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, []);

  /* ---------- init / resize ---------- */
  const resizeCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const parent = c.parentElement;
    const rect = parent.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    // === Fondo ===
    const bg = bgRef.current; if(bg){
      bg.width = Math.floor(cssW * dpr); bg.height = Math.floor(cssH * dpr);
      bg.style.width = cssW+"px"; bg.style.height = cssH+"px";
      const bctx = bg.getContext("2d"); bctx.setTransform(dpr,0,0,dpr,0,0); bgCtxRef.current = bctx;
    }

    // snapshot bitmap
    const tmp = document.createElement("canvas");
    tmp.width = c.width; tmp.height = c.height;
    if (c.width && c.height) tmp.getContext("2d").drawImage(c,0,0);

    // === Canvas principal ===
    c.width = Math.floor(cssW * dpr);
    c.height= Math.floor(cssH * dpr);
    c.style.width = cssW+"px"; c.style.height = cssH+"px";

    const ctx = c.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap="round"; ctx.lineJoin="round";
    ctxRef.current = ctx;

    if (tmp.width && tmp.height) {
      ctx.drawImage(tmp,0,0,tmp.width,tmp.height,0,0,c.width/dpr,c.height/dpr);
    }

    // === Overlay UI ===
    if (ovrRef.current){
      const oc = ovrRef.current;
      oc.width = c.width; oc.height = c.height;
      oc.style.width = cssW+"px"; oc.style.height = cssH+"px";
      ovrCtxRef.current = oc.getContext("2d");
      ovrCtxRef.current.setTransform(dpr,0,0,dpr,0,0);
    }

    // === Previsualización ===
    if (prevRef.current){
      const pc = prevRef.current;
      pc.width = c.width; pc.height = c.height;
      pc.style.width = cssW+"px"; pc.style.height = cssH+"px";
      prevCtxRef.current = pc.getContext("2d");
      prevCtxRef.current.setTransform(dpr,0,0,dpr,0,0);
    }

    drawBackgroundAndGrid();
  }, []);

  const drawBackgroundAndGrid = useCallback(() => {
    const bctx = bgCtxRef.current; if(!bctx) return;
    const bgc = bgRef.current; if(!bgc) return;
    const w = bgc.width / dprRef.current;
    const h = bgc.height / dprRef.current;

    bctx.save();
    bctx.setTransform(dprRef.current,0,0,dprRef.current,0,0);
    bctx.clearRect(0,0,w,h);
    bctx.fillStyle = boardBg; bctx.fillRect(0,0,w,h);

    if (gridOn){
      bctx.strokeStyle = gridColor;
      bctx.lineWidth = 1;
      bctx.setLineDash([]);
      const step = Math.max(8, gridSpacing);
      bctx.beginPath();
      for (let x = 0; x <= w; x += step){ bctx.moveTo(x,0); bctx.lineTo(x,h); }
      for (let y = 0; y <= h; y += step){ bctx.moveTo(0,y); bctx.lineTo(w,y); }
      bctx.stroke();
    }
    bctx.restore();
  }, [boardBg, gridOn, gridSpacing, gridColor]);

  useEffect(() => { drawBackgroundAndGrid(); }, [drawBackgroundAndGrid]);

  useEffect(() => {
    if (CLEAR_ON_MOUNT) localStorage.removeItem(LS_KEY);
    const parent = canvasRef.current?.parentElement;
    const ro = new ResizeObserver(() => resizeCanvas());
    if (parent) ro.observe(parent);
    resizeCanvas(); requestAnimationFrame(resizeCanvas);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  /* ---------- draw libre ---------- */
  const relXY = (e) => relXYOf(canvasRef.current, e);
  const beginDraw = (x,y) => {
    if (![TOOLS.PEN,TOOLS.HIGHLIGHTER,TOOLS.ERASER].includes(tool)) return;
    setIsDrawing(true); movedRef.current=false; lastPtRef.current={x,y};
    const ctx = ctxRef.current;
    ctx.globalCompositeOperation = (tool===TOOLS.ERASER) ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.globalAlpha = (tool===TOOLS.HIGHLIGHTER) ? 0.25 : 1;
    ctx.lineWidth = (tool===TOOLS.HIGHLIGHTER || tool===TOOLS.ERASER) ? lineWidth*3 : lineWidth;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x,y);
  };
  const continueDraw = (x,y) => {
    if (!isDrawing) return;
    movedRef.current=true; lastPtRef.current={x,y};
    const ctx = ctxRef.current; ctx.lineTo(x,y); ctx.stroke();
  };
  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = ctxRef.current;
    if (!movedRef.current){
      const {x,y} = lastPtRef.current;
      if (tool===TOOLS.ERASER){
        ctx.save(); ctx.globalCompositeOperation="destination-out";
        ctx.beginPath(); ctx.arc(x,y,(lineWidth*3)/2,0,Math.PI*2); ctx.fill(); ctx.restore();
      } else {
        ctx.save(); ctx.globalAlpha = (tool===TOOLS.HIGHLIGHTER) ? 0.25 : 1;
        ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,Math.max(1,lineWidth/2),0,Math.PI*2); ctx.fill(); ctx.restore();
      }
    }
    ctx.closePath(); persistToLocalStorage();
  };
  const drawEraserRing = (sx,sy) => {
    const o = ovrCtxRef.current, oc = ovrRef.current; if (!o) return;
    o.save(); o.setTransform(1,0,0,1,0,0); o.clearRect(0,0,oc.width,oc.height); o.restore();
    if (tool!==TOOLS.ERASER) return;
    const r=(lineWidth*3)/2; o.beginPath(); o.arc(sx,sy,r,0,Math.PI*2);
    o.setLineDash([6,4]); o.lineWidth=2; o.strokeStyle="#22c55e"; o.stroke(); o.setLineDash([]);
  };

  /* ---------- Figuras ---------- */
  const shapeStartRef = useRef(null);
  const beginShape = (x,y) => {
    shapeStartRef.current = { x, y };
    const pc = prevCtxRef.current; if(!pc) return;
    pc.clearRect(0,0,prevRef.current.width/dprRef.current, prevRef.current.height/dprRef.current);
  };
  const continueShape = (x,y) => {
    const pc = prevCtxRef.current; if(!pc || !shapeStartRef.current) return;
    const { x:sx, y:sy } = shapeStartRef.current;
    pc.clearRect(0,0,prevRef.current.width/dprRef.current, prevRef.current.height/dprRef.current);
    pc.save(); pc.globalAlpha = 1; pc.lineWidth = lineWidth; pc.strokeStyle = color; pc.fillStyle = fillColor; applyLineDash(pc);

    const minX = Math.min(sx,x), minY = Math.min(sy,y);
    const w = Math.abs(x-sx), h = Math.abs(y-sy);

    pc.beginPath();
    switch (shapeType){
      case SHAPES.LINE:
        pc.moveTo(sx,sy); pc.lineTo(x,y); break;
      case SHAPES.RECT:
        pc.rect(minX, minY, w, h); break;
      case SHAPES.SQUARE: {
        const s = Math.max(w,h);
        pc.rect(sx < x ? sx : sx - s, sy < y ? sy : sy - s, s, s); break;
      }
      case SHAPES.CIRCLE: {
        const r = Math.max(w,h)/2;
        const cx = sx + (x-sx)/2;
        const cy = sy + (y-sy)/2;
        pc.ellipse(cx, cy, r, r, 0, 0, Math.PI*2); break;
      }
      case SHAPES.ELLIPSE:
        pc.ellipse(minX + w/2, minY + h/2, w/2, h/2, 0, 0, Math.PI*2); break;
      case SHAPES.TRIANGLE: {
        const dx = x - sx;
        const dy = y - sy;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const base = len * 0.5;
        const height = len * 0.866; // √3/2
        pc.moveTo(sx, sy);
        pc.lineTo(
          sx + height * Math.cos(angle),
          sy + height * Math.sin(angle)
        );
        pc.lineTo(
          sx + base * Math.cos(angle + Math.PI / 2),
          sy + base * Math.sin(angle + Math.PI / 2)
        );
        pc.lineTo(
          sx + base * Math.cos(angle - Math.PI / 2),
          sy + base * Math.sin(angle - Math.PI / 2)
        );
        pc.closePath();
        break;
      }
      default: break;
    }
    if (fillEnabled && shapeType !== SHAPES.LINE){ pc.fill(); }
    pc.stroke(); pc.restore();
  };
  const commitShape = (x,y) => {
    if(!shapeStartRef.current) return;
    const { x:sx, y:sy } = shapeStartRef.current;
    const ctx = ctxRef.current; const pc = prevCtxRef.current; if(!ctx) return;
    ctx.save(); ctx.globalAlpha = 1; ctx.lineWidth = lineWidth; ctx.strokeStyle = color; ctx.fillStyle = fillColor; applyLineDash(ctx);

    const minX = Math.min(sx,x), minY = Math.min(sy,y);
    const w = Math.abs(x-sx), h = Math.abs(y-sy);

    ctx.beginPath();
    switch (shapeType){
      case SHAPES.LINE:
        ctx.moveTo(sx,sy); ctx.lineTo(x,y); break;
      case SHAPES.RECT:
        ctx.rect(minX, minY, w, h); break;
      case SHAPES.SQUARE: {
        const s = Math.max(w,h);
        ctx.rect(sx < x ? sx : sx - s, sy < y ? sy : sy - s, s, s); break;
      }
      case SHAPES.CIRCLE: {
        const r = Math.max(w,h)/2;
        const cx = sx + (x-sx)/2;
        const cy = sy + (y-sy)/2;
        ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI*2); break;
      }
      case SHAPES.ELLIPSE:
        ctx.ellipse(minX + w/2, minY + h/2, w/2, h/2, 0, 0, Math.PI*2); break;
      case SHAPES.TRIANGLE: {
        const dx = x - sx;
        const dy = y - sy;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const base = len * 0.5;
        const height = len * 0.866;
        ctx.moveTo(sx, sy);
        ctx.lineTo(
          sx + height * Math.cos(angle),
          sy + height * Math.sin(angle)
        );
        ctx.lineTo(
          sx + base * Math.cos(angle + Math.PI / 2),
          sy + base * Math.sin(angle + Math.PI / 2)
        );
        ctx.lineTo(
          sx + base * Math.cos(angle - Math.PI / 2),
          sy + base * Math.sin(angle - Math.PI / 2)
        );
        ctx.closePath();
        break;
      }
      default: break;
    }
    if (fillEnabled && shapeType !== SHAPES.LINE){ ctx.fill(); }
    ctx.stroke(); ctx.restore();

    pc?.clearRect(0,0,prevRef.current.width/dprRef.current, prevRef.current.height/dprRef.current);
    shapeStartRef.current = null;
    persistToLocalStorage();
  };

  /* ---------- text overlay ---------- */
  const createTextboxAt = ({x,y}) => {
    const id = crypto.randomUUID();
    setTextBoxes(a => [...a, {id,x:Math.max(8,x),y:Math.max(8,y),w:240,h:56,color,fontSize:Math.max(12,lineWidth*6),content:""}]);
    setActiveTextId(id);
    setTimeout(()=>overlayRef.current?.querySelector(`[data-tb="${id}"] .wbp-textarea`)?.focus(),0);
  };
  const commitTextbox = (id) => {
    const el = overlayRef.current?.querySelector(`[data-tb="${id}"] .wbp-textarea`);
    if (!el) return;
    const val = el.innerText
      .replace(/\u00A0/g, " ")
      .replace(/\s+$/, ""); // ← CORREGIDO
    setTextBoxes(arr => arr.map(t => 
      t.id===id ? {...t, content:val, color, fontSize:Math.max(12,lineWidth*6)} : t
    ));
    persistToLocalStorage();
  };
  const beginDragText = (id,e) => {
    if (e.target?.classList?.contains("wbp-textarea")) return;
    e.preventDefault(); e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    const tb = textBoxes.find(t=>t.id===id);
    dragTextRef.current={id,dx:sx-tb.x,dy:sy-tb.y};
    setActiveTextId(id); setActiveImgId(null); setActiveSimId(null);
  };
  const moveDragText = (e) => {
    const d=dragTextRef.current; if(!d) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    setTextBoxes(arr => arr.map(t => t.id!==d.id ? t : ({...t,x:sx-d.dx,y:sy-d.dy})));
  };
  const endDragText = () => { if(!dragTextRef.current) return; dragTextRef.current=null; persistToLocalStorage(); };
  const beginResizeText = (id,e) => {
    e.preventDefault(); e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    const tb=textBoxes.find(t=>t.id===id);
    resizeTextRef.current={id,ox:sx,oy:sy,ow:tb.w,oh:tb.h};
    setActiveTextId(id); setActiveImgId(null); setActiveSimId(null);
  };
  const moveResizeText = (e) => {
    const z=resizeTextRef.current; if(!z) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    setTextBoxes(arr => arr.map(t => t.id!==z.id ? t : ({...t,w:Math.max(84,z.ow+(sx-z.ox)),h:Math.max(36,z.oh+(sy-z.oy))})));
  };
  const endResizeText = () => { if(!resizeTextRef.current) return; resizeTextRef.current=null; persistToLocalStorage(); };

  /* ---------- image overlay ---------- */
  const addImage = (file) => {
    const url = URL.createObjectURL(file);
    const r = canvasRef.current.getBoundingClientRect();
    const id = crypto.randomUUID();
    const w = Math.min(480, Math.max(160, r.width*0.4));
    const h = Math.floor(w*0.625);
    setImages(a => [...a, {id, x:(r.width-w)/2, y:(r.height-h)/2, w, h, src:url}]);
    setActiveImgId(id); setActiveTextId(null); setActiveSimId(null); persistToLocalStorage();
  };
  const beginDragImg = (id,e) => {
    e.preventDefault(); e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    const im=images.find(x=>x.id===id);
    dragImgRef.current={id,dx:sx-im.x,dy:sy-im.y};
    setActiveImgId(id); setActiveTextId(null); setActiveSimId(null);
  };
  const moveDragImg = (e) => {
    const z=dragImgRef.current; if(!z) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    setImages(a => a.map(it => it.id!==z.id ? it : ({...it,x:sx-z.dx,y:sy-z.dy})));
  };
  const endDragImg = () => { if(!dragImgRef.current) return; dragImgRef.current=null; persistToLocalStorage(); };
  const beginResizeImg = (id,e) => {
    e.preventDefault(); e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    const im=images.find(x=>x.id===id);
    resizeImgRef.current={id,ox:sx,oy:sy,ow:im.w,oh:im.h};
    setActiveImgId(id); setActiveTextId(null); setActiveSimId(null);
  };
  const moveResizeImg = (e) => {
    const z=resizeImgRef.current; if(!z) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx=e.clientX-r.left, sy=e.clientY-r.top;
    setImages(a => a.map(it => it.id!==z.id ? it : ({...it, w:Math.max(48,z.ow+(sx-z.ox)), h:Math.max(36,z.oh+(sy-z.oy))})));
  };
  const endResizeImg = () => { if(!resizeImgRef.current) return; resizeImgRef.current=null; persistToLocalStorage(); };

  /* ---------- sims ---------- */
  const fetchSimList = useCallback(async () => {
    const tries = [CDN_INDEX, RAW_INDEX];
    for (const u of tries){
      try{
        const data = await safeFetchJSON(u);
        const arr = (data.simuladores || data || []).filter(x => x?.file && x?.name);
        setSimList(arr); return;
      }catch(e){ console.warn("manifest fallo:", u, e.message); }
    }
    setSimList([]);
  }, []);
  useEffect(() => { fetchSimList(); }, [fetchSimList]);

  const dynamicImportFromText = async (code) => {
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    try { return await import(/* @vite-ignore */ url); }
    finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
  };
  const fetchModuleESM = async (file) => {
    const tries = [`${CDN_BASE}${file}`, `${RAW_BASE}${file}`];
    for (const u of tries){
      try{
        const txt = await fetch(u, {cache:"no-store"}).then(r => { if(!r.ok) throw new Error(r.status); return r.text(); });
        return await dynamicImportFromText(txt);
      }catch(e){ console.warn("script fallo:", u, e.message); }
    }
    throw new Error("No pude importar el simulador.");
  };
  const wrapSimHTML = (inner) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>html,body{margin:0;padding:0;height:100%;font:14px/1.4 system-ui,Arial,sans-serif}*{box-sizing:border-box}</style>
</head><body>${inner}</body></html>`;
  const insertSimulator = async (item) => {
    try{
      const mod = await fetchModuleESM(item.file);
      const html = (mod?.default?.render?.({}, item.name)) || "<div>Simulador no disponible</div>";
      const r = canvasRef.current.getBoundingClientRect();
      const w = Math.min(640, Math.max(320, r.width*0.6));
      const h = Math.min(420, Math.max(240, r.height*0.5));
      const id = crypto.randomUUID();
      setSimBoxes(a => [...a, {id, name:item.name, x:(r.width-w)/2, y:(r.height-h)/2, w, h, html}]);
      setActiveSimId(id); setActiveTextId(null); setActiveImgId(null);
      setSimPickerOpen(false);
    }catch(e){ alert("No se pudo cargar ese simulador desde el repositorio."); }
  };

  const beginDragSim = (id,e)=>{ e.preventDefault(); e.stopPropagation();
    const r=canvasRef.current.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top;
    const sm=simBoxes.find(s=>s.id===id); dragSimRef.current={id,dx:sx-sm.x,dy:sy-sm.y};
    setActiveSimId(id); setActiveTextId(null); setActiveImgId(null);
  };
  const moveDragSim = (e)=>{ const d=dragSimRef.current; if(!d) return;
    const r=canvasRef.current.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top;
    setSimBoxes(a => a.map(s => s.id!==d.id ? s : ({...s,x:sx-d.dx,y:sy-d.dy})));
  };
  const endDragSim = ()=>{ if(!dragSimRef.current) return; dragSimRef.current=null; };
  const beginResizeSim = (id,e)=>{ e.preventDefault(); e.stopPropagation();
    const r=canvasRef.current.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top;
    const sm=simBoxes.find(s=>s.id===id); resizeSimRef.current={id,ox:sx,oy:sy,ow:sm.w,oh:sm.h};
    setActiveSimId(id); setActiveTextId(null); setActiveImgId(null);
  };
  const moveResizeSim = (e)=>{ const z=resizeSimRef.current; if(!z) return;
    const r=canvasRef.current.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top;
    setSimBoxes(a => a.map(s => s.id!==z.id ? s : ({...s, w:Math.max(160,z.ow+(sx-z.ox)), h:Math.max(120,z.oh+(sy-z.oy))})));
  };
  const endResizeSim = ()=>{ if(!resizeSimRef.current) return; resizeSimRef.current=null; };

  /* ---------- export PNG ---------- */
  const exportPNG = async () => {
    const dpr = dprRef.current;
    const c = canvasRef.current; const bgc = bgRef.current;
    const out = document.createElement("canvas"); out.width=c.width; out.height=c.height;
    const tctx = out.getContext("2d");

    if (bgc) tctx.drawImage(bgc,0,0);
    tctx.drawImage(c,0,0);

    for (const im of images){
      const imgEl = new Image();
      await new Promise(res => { imgEl.onload=res; imgEl.src=im.src; });
      tctx.drawImage(imgEl, im.x*dpr, im.y*dpr, im.w*dpr, im.h*dpr);
    }

    tctx.textBaseline="top";
    for (const tb of textBoxes){
      tctx.fillStyle=tb.color; tctx.globalAlpha=1;
      tctx.font=`${tb.fontSize*dpr}px Inter,system-ui,Arial,sans-serif`;
      const lines=(tb.content||"").split("\n"); let y=tb.y*dpr+2;
      for (const ln of lines){ tctx.fillText(ln, tb.x*dpr+2, y); y += tb.fontSize*1.25*dpr; }
    }

    async function ensureH2C(){
      if (window.html2canvas) return;
      await new Promise(res => { const s=document.createElement("script");
        s.src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
        s.onload=res; document.body.appendChild(s); });
    }
    for (const sb of simBoxes){
      const ifr = simIframeRefs.current.get(sb.id);
      try{
        await ensureH2C();
        const c2 = await window.html2canvas(ifr.contentDocument.body, { backgroundColor:null, scale:dpr });
        tctx.drawImage(c2, sb.x*dpr, sb.y*dpr, sb.w*dpr, sb.h*dpr);
      }catch{
        tctx.save();
        tctx.strokeStyle="#9ca3af"; tctx.lineWidth=2; tctx.setLineDash([6,3]);
        tctx.strokeRect(sb.x*dpr, sb.y*dpr, sb.w*dpr, sb.h*dpr);
        tctx.setLineDash([]);
        tctx.font = `${14*dpr}px system-ui, Arial`;
        tctx.fillStyle = "#374151";
        tctx.fillText(`Simulador: ${sb.name}`, sb.x*dpr+8*dpr, sb.y*dpr+18*dpr);
        tctx.restore();
      }
    }

    const a=document.createElement("a"); a.download="pizarron.png"; a.href=out.toDataURL("image/png"); a.click();
  };

  /* ---------- autosave ---------- */
  const persistToLocalStorage = () => {
    if (CLEAR_ON_MOUNT) return;
    try{
      const c = canvasRef.current; const bgc = bgRef.current;
      const payload = {
        bitmap:c.toDataURL("image/png"),
        background: bgc?.toDataURL("image/png"),
        textBoxes, images, simBoxes,
        boardBg, gridOn, gridSpacing, gridColor
      };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    }catch{}
  };
  const restoreFromLocalStorage = async () => {
    if (CLEAR_ON_MOUNT) return;
    try{
      const raw = localStorage.getItem(LS_KEY); if (!raw) return;
      const data = JSON.parse(raw);
      if (data.background){
        const img = new Image();
        await new Promise(res => { img.onload=res; img.src=data.background; });
        bgCtxRef.current.drawImage(img, 0,0, bgRef.current.width/dprRef.current, bgRef.current.height/dprRef.current);
      } else {
        setBoardBg(data.boardBg ?? boardBg);
        setGridOn(!!data.gridOn); setGridSpacing(data.gridSpacing ?? gridSpacing); setGridColor(data.gridColor ?? gridColor);
        drawBackgroundAndGrid();
      }
      if (data.bitmap){
        const img2 = new Image();
        await new Promise(res => { img2.onload=res; img2.src=data.bitmap; });
        ctxRef.current.drawImage(img2, 0,0, canvasRef.current.width/dprRef.current, canvasRef.current.height/dprRef.current);
      }
      setTextBoxes(data.textBoxes||[]); setImages(data.images||[]); setSimBoxes(data.simBoxes||[]);
    }catch{}
  };
  useEffect(() => { restoreFromLocalStorage(); }, []);

  /* ---------- util ---------- */
  const clearAll = () => {
    const c=canvasRef.current, ctx=ctxRef.current;
    ctx.clearRect(0,0,c.width,c.height);
    setTextBoxes([]); setImages([]); setSimBoxes([]);
    setActiveTextId(null); setActiveImgId(null); setActiveSimId(null);
    drawBackgroundAndGrid();
    localStorage.removeItem(LS_KEY);
  };
  const deleteActive = () => {
    if (activeTextId){ setTextBoxes(a=>a.filter(t=>t.id!==activeTextId)); setActiveTextId(null); persistToLocalStorage(); return; }
    if (activeImgId){ setImages(a=>a.filter(i=>i.id!==activeImgId)); setActiveImgId(null); persistToLocalStorage(); return; }
    if (activeSimId){ setSimBoxes(a=>a.filter(s=>s.id!==activeSimId)); setActiveSimId(null); persistToLocalStorage(); return; }
  };

  /* ---------- global listeners ---------- */
  useEffect(() => {
    const mm = (e)=>{ 
      if (tool===TOOLS.ERASER){ const css=relXY(e); drawEraserRing(css.x,css.y); }
      else { const o=ovrCtxRef.current, oc=ovrRef.current; if(o&&oc){ o.save(); o.setTransform(1,0,0,1,0,0); o.clearRect(0,0,oc.width,oc.height); o.restore(); } }
      moveDragText(e); moveResizeText(e); moveDragImg(e); moveResizeImg(e); moveDragSim(e); moveResizeSim(e);
    };
    const mu = ()=>{ endDragText(); endResizeText(); endDragImg(); endResizeImg(); endDragSim(); endResizeSim(); };
    const onKey = (e)=>{
      const el=document.activeElement;
      const isEditing = (el && el.isContentEditable) || ["INPUT","TEXTAREA"].includes(el?.tagName||"");
      if ((e.key==="Delete"||e.key==="Backspace") && !isEditing){ e.preventDefault(); deleteActive(); }
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="p"){ e.preventDefault(); exportPNG(); }
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="l"){ e.preventDefault(); clearAll(); }
    };
    window.addEventListener("mousemove", mm); 
    window.addEventListener("mouseup", mu); 
    window.addEventListener("keydown", onKey);
    return () => { 
      window.removeEventListener("mousemove", mm); 
      window.removeEventListener("mouseup", mu); 
      window.removeEventListener("keydown", onKey); 
    };
  }, [tool, lineWidth, textBoxes, images, simBoxes, activeTextId, activeImgId, activeSimId]);

  /* ---------- handlers de stage ---------- */
  const onStageMouseDown = (e) => {
    const {x,y}=relXY(e);
    if (tool===TOOLS.TEXT){ createTextboxAt({x,y}); return; }
    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)){ beginDraw(x,y); return; }
    if (tool===TOOLS.SHAPE){ beginShape(x,y); }
  };
  const onStageMouseMove = (e) => {
    const {x,y}=relXY(e);
    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)){ continueDraw(x,y); return; }
    if (tool===TOOLS.SHAPE){ continueShape(x,y); }
  };
  const onStageMouseUp = (e) => {
    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)){ endDraw(); return; }
    if (tool===TOOLS.SHAPE){ const {x,y}=relXY(e); commitShape(x,y); }
  };

  const clearPreview = () => {
    prevCtxRef.current?.clearRect(0,0,prevRef.current.width/dprRef.current, prevRef.current.height/dprRef.current);
    shapeStartRef.current = null;
  };

  /* ---------- render ---------- */
  return (
    <div className="wbp-page wbp--edge wbpro-root">
      {/* Modal simuladores */}
      {simPickerOpen && (
        <div className="wbp-modal" onClick={()=>setSimPickerOpen(false)}>
          <div className="wbp-modal__panel" onClick={e=>e.stopPropagation()}>
            <div className="wbp-modal__head">
              <strong>Simuladores del repositorio</strong>
              <button className="wbp-btn" onClick={()=>setSimPickerOpen(false)}>✖</button>
            </div>
            <div className="wbp-modal__body">
              {simList.length===0 && <div>No encontré simuladores en el manifest.</div>}
              {simList.map(s=>(
                <div key={s.file} className="wbp-simrow">
                  <div className="wbp-simrow__name">{s.name}</div>
                  <button className="wbp-btn" onClick={()=>insertSimulator(s)}>Insertar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div className="wbp-topbar wbpro-header" role="toolbar" aria-label="Pizarrón">
        <div className="wbp-brand wbpro-left"><span className="wbp-title wbpro-logo">Neteaching • Pizarrón</span></div>

        <div className="wbp-tools wbpro-tools">
          <button className={`wbp-btn ${tool===TOOLS.PEN?'is-active on':''}`} title="Pluma" onClick={()=>setTool(TOOLS.PEN)}>Pluma</button>
          <button className={`wbp-btn ${tool===TOOLS.HIGHLIGHTER?'is-active on':''}`} title="Marcador" onClick={()=>setTool(TOOLS.HIGHLIGHTER)}>Marcador</button>
          <button className={`wbp-btn ${tool===TOOLS.ERASER?'is-active on':''}`} title="Borrador" onClick={()=>setTool(TOOLS.ERASER)}>Borrador</button>
          <button className={`wbp-btn ${tool===TOOLS.TEXT?'is-active on':''}`} title="Texto" onClick={()=>setTool(TOOLS.TEXT)}>T</button>

          <button className={`wbp-btn ${tool===TOOLS.SHAPE?'is-active on':''}`} title="Figuras" onClick={()=>setTool(TOOLS.SHAPE)}>Figuras</button>
          <select className="wbp-select" value={shapeType} onChange={(e)=>setShapeType(e.target.value)}>
            <option value={SHAPES.LINE}>Línea</option>
            <option value={SHAPES.RECT}>Rectángulo</option>
            <option value={SHAPES.SQUARE}>Cuadrado</option>
            <option value={SHAPES.CIRCLE}>Círculo</option>
            <option value={SHAPES.ELLIPSE}>Elipse</option>
            <option value={SHAPES.TRIANGLE}>Triángulo</option>
          </select>
          <select className="wbp-select" value={lineStyleKey} onChange={(e)=>setLineStyleKey(e.target.value)}>
            <option value="SOLID">Sólida</option>
            <option value="DASHED">Punteada</option>
            <option value="DOTTED">Con puntos</option>
            <option value="DASH_DOT">Guion‑punto</option>
          </select>
          <label style={{display:"inline-flex",alignItems:"center",gap:6}}>
            <input type="checkbox" checked={fillEnabled} onChange={(e)=>setFillEnabled(e.target.checked)} />
            Relleno
          </label>
          <input type="color" value={fillColor} onChange={(e)=>setFillColor(e.target.value)} style={{width:28,height:28}} />

          <button className="wbp-btn" title="Imagen" onClick={()=>fileInputRef.current?.click()}>Imagen</button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}}
                 onChange={(ev)=>{ const f=ev.target.files?.[0]; if(f) addImage(f); ev.target.value=""; }} />

          <button className="wbp-btn" title="Simuladores" onClick={()=>setSimPickerOpen(true)}>Simuladores</button>

          <div style={{position:"relative", display:"inline-block"}}>
            <button className="wbp-btn" onClick={()=>setMoreOpen(v=>!v)}>Más</button>
            {moreOpen && (
              <div style={{
                position:"absolute", right:0, top:"110%", background:"#fff", border:"1px solid #e5e7eb",
                borderRadius:8, boxShadow:"0 12px 30px rgba(0,0,0,.12)", padding:8, zIndex:60, minWidth:220
              }}>
                <div style={{display:"grid", gap:6}}>
                  <button className="wbp-btn" onClick={deleteActive}>Borrar selección</button>
                  <button className="wbp-btn" onClick={clearAll}>Limpiar todo</button>
                  <button className="wbp-btn" onClick={exportPNG}>Exportar PNG</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="wbp-palette wbpro-color">
          <span className="wbp-label">Color</span>
          <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} />
          <div className="wbpro-swatches">
            {["#111827","#ef4444","#22c55e","#3b82f6","#f59e0b","#10b981","#7c3aed"].map(c => (
              <button key={c} title={c} style={{background:c}} onClick={()=>setColor(c)} />
            ))}
          </div>
        </div>

        <div className="wbp-weight wbpro-range">
          <span className="wbp-label">Grosor</span>
          <input type="range" min="1" max="48" value={lineWidth}
                 onChange={(e)=>setLineWidth(Number(e.target.value))} className="wbp-slider" />
          <span className="wbp-chip">{lineWidth}px</span>
        </div>

        <div className="wbp-palette wbpro-color">
          <span className="wbp-label">Fondo</span>
          <input type="color" value={boardBg} onChange={(e)=>{ setBoardBg(e.target.value); drawBackgroundAndGrid(); }} />
          <label style={{display:"inline-flex",alignItems:"center",gap:6,marginLeft:8}}>
            <input type="checkbox" checked={gridOn} onChange={(e)=>{ setGridOn(e.target.checked); drawBackgroundAndGrid(); }} />
            Gradilla
          </label>
          <span className="wbp-label" style={{marginLeft:8}}>Paso</span>
          <input type="number" min={8} max={120} value={gridSpacing} onChange={(e)=>{ setGridSpacing(Number(e.target.value)||24); drawBackgroundAndGrid(); }} style={{width:60}} />
          <input type="color" value={gridColor} onChange={(e)=>{ setGridColor(e.target.value); drawBackgroundAndGrid(); }} style={{width:28,height:28,marginLeft:6}} />
        </div>

        <div className="wbp-right wbpro-right">
          <button className="wbp-btn" onClick={deleteActive}>Borrar</button>
          <button className="wbp-btn" onClick={clearAll}>Limpiar</button>
          <button className="wbp-btn" onClick={exportPNG}>PNG</button>
        </div>
      </div>

      <div className="wbp-stage">
        <div className="wbp-wrap"
             onMouseDown={()=>{ setActiveTextId(null); setActiveImgId(null); setActiveSimId(null); }}
             onClick={(e)=>{ if (tool===TOOLS.TEXT){ const {x,y}=relXY(e); createTextboxAt({x,y}); } }}>

          <canvas ref={bgRef} className="wbp-canvas" aria-hidden />
          <canvas ref={canvasRef} className="wbp-canvas"
                  onMouseDown={onStageMouseDown}
                  onMouseMove={onStageMouseMove}
                  onMouseUp={onStageMouseUp}
                  onMouseLeave={() => {
                    if (tool === TOOLS.SHAPE) clearPreview();
                    else if (isDrawing) endDraw();
                  }} />
          <canvas ref={ovrRef} className="wbp-ovr-canvas" aria-hidden />
          <canvas ref={prevRef} className="wbp-ovr-canvas" aria-hidden />

          <div className="wbp-overlay" aria-hidden>
            {images.map(im=> (
              <div key={im.id} className={`wbp-imgbox ${activeImgId===im.id?'is-active':''}`}
                   style={{left:im.x, top:im.y, width:im.w, height:im.h}}
                   onMouseDown={(e)=>beginDragImg(im.id, e)}>
                <img className="wbp-img" src={im.src} alt="" draggable={false}/>
                <div className="wbp-img-resizer" onMouseDown={(e)=>beginResizeImg(im.id,e)}>Resize</div>
              </div>
            ))}
          </div>

          <div className="wbp-overlay" aria-hidden>
            {simBoxes.map(sb=> (
              <div key={sb.id} className={`wbp-simbox ${activeSimId===sb.id?'is-active':''}`}
                   style={{left:sb.x, top:sb.y, width:sb.w, height:sb.h}}
                   onMouseDown={(e)=>beginDragSim(sb.id, e)}>
                <iframe ref={(el)=>{ if(el) simIframeRefs.current.set(sb.id, el); }}
                        className="wbp-sim-iframe"
                        sandbox="allow-scripts allow-same-origin"
                        srcDoc={wrapSimHTML(sb.html)} title={sb.name} />
                <div className="wbp-sim-resizer" onMouseDown={(e)=>beginResizeSim(sb.id,e)}>Resize</div>
              </div>
            ))}
          </div>

          <div className="wbp-overlay" ref={overlayRef}>
            {textBoxes.map(tb=> (
              <div key={tb.id} data-tb={tb.id}
                   className={`wbp-textbox ${activeTextId===tb.id?'is-active':''}`}
                   style={{left:tb.x, top:tb.y, width:tb.w, height:tb.h}}
                   onMouseDown={(e)=>beginDragText(tb.id,e)}>
                <div className="wbp-textarea" contentEditable suppressContentEditableWarning spellCheck={false}
                     onMouseDown={(e)=>{ e.stopPropagation(); setActiveTextId(tb.id); }}
                     style={{ color: tb.id===activeTextId? color: tb.color,
                              fontSize: tb.id===activeTextId? Math.max(12, lineWidth*6) : tb.fontSize }}
                     onBlur={()=>commitTextbox(tb.id)}>
                  {tb.content}
                </div>
                <div className="wbp-resizer" onMouseDown={(e)=>beginResizeText(tb.id,e)}>Resize</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
