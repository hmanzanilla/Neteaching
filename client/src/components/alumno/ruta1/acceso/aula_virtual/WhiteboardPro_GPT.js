import React, { useEffect, useRef, useState, useCallback } from "react";
import "./WhiteboardPro.css";

/* ==========================================================
   WHITEBOARD PRO - VERSIÓN CORREGIDA Y COMENTADA
   - Fix: Ghost/Preview de figuras y líneas estable (no se borra)
   - Fix: Undo/Redo consistente (Ctrl+Z / Ctrl+Y)
   - Fix: Z-index y capas separadas para overlay de borrador y ghost
   - Historial más confiable (guardar al finalizar acciones)
   - Comentarios por secciones (botones, herramientas, eventos, etc.)
   ========================================================== */

/* ============================
   [SECCIÓN] CONSTANTES GLOBALES
   ============================ */
const TOOLS = {
  PEN: "pen",
  HIGHLIGHTER: "highlighter",
  ERASER: "eraser",
  TEXT: "text",
  SHAPES: "shapes",
  LINES: "lines",
};

const SHAPES = {
  RECT: "rect",
  SQUARE: "square",
  CIRCLE: "circle",
  ELLIPSE: "ellipse",
  TRIANGLE: "triangle",
};

const LINES = {
  SOLID: "solid",
  DASHED: "dashed",
  DOTTED: "dotted",
  DASH_DOT: "dash_dot",
  ARROW_RIGHT: "arrow_right",
  ARROW_LEFT: "arrow_left",
  ARROW_BOTH: "arrow_both",
};

const LINE_STYLES = {
  SOLID: [],
  DASHED: [8, 6],
  DOTTED: [2, 6],
  DASH_DOT: [10, 5, 2, 5],
};

const LS_KEY = "wbpro_v2";
/** IMPORTANTE: antes estaba `true` y vaciaba historial en cada montaje */
const CLEAR_ON_MOUNT = false;
const HISTORY_LIMIT = 20;

/* ---------- Simuladores (sin cambios funcionales) ---------- */
const CDN_INDEX =
  "https://cdn.jsdelivr.net/gh/vec70rr/EditorDeLibro@main/simuladores/manifest.json";
const RAW_INDEX =
  "https://raw.githubusercontent.com/vec70rr/EditorDeLibro/main/simuladores/manifest.json";
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/vec70rr/EditorDeLibro@main/simuladores/";
const RAW_BASE =
  "https://raw.githubusercontent.com/vec70rr/EditorDeLibro/main/simuladores/";

/* ============================
   [SECCIÓN] HELPERS GENERALES
   ============================ */
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
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(`Bad JSON from ${url}`);
  }
};

/* =========================================================================
   [COMPONENTE] WhiteboardPro
   Estructura de capas (canvas + overlays) separadas y con z-index correcto.
   ========================================================================= */
export default function WhiteboardPro() {
  /* ===============================
     [SECCIÓN] REFERENCIAS DE CAPAS
     - Fondo/gradilla: bgRef/bgCtxRef
     - Dibujo final: canvasRef/ctxRef
     - Overlay borrador (anillo): eraseRef/eraseCtxRef
     - Overlay ghost (figuras/lineas): ghostRef/ghostCtxRef
     - DPR: dprRef
     =============================== */
  const bgRef = useRef(null);
  const bgCtxRef = useRef(null);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const eraseRef = useRef(null);
  const eraseCtxRef = useRef(null);

  const ghostRef = useRef(null);
  const ghostCtxRef = useRef(null);

  const dprRef = useRef(window.devicePixelRatio || 1);

  /* ===============================
     [SECCIÓN] ESTADO DE HERRAMIENTAS
     =============================== */
  const [tool, setTool] = useState(TOOLS.PEN);
  const [color, setColor] = useState("#111827");
  const [lineWidth, setLineWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const movedRef = useRef(false);
  const lastPtRef = useRef({ x: 0, y: 0 });

  /* ===============================
     [SECCIÓN] ESTADO AVANZADO DIBUJO
     =============================== */
  const [activeShape, setActiveShape] = useState(SHAPES.RECT);
  const [activeLine, setActiveLine] = useState(LINES.SOLID);
  const [lineStyleKey, setLineStyleKey] = useState("SOLID");
  const [fillEnabled, setFillEnabled] = useState(false);
  const [fillColor, setFillColor] = useState("#00000010");

  const [boardBg, setBoardBg] = useState("#ffffff");
  const [gridOn, setGridOn] = useState(true);
  const [gridSpacing, setGridSpacing] = useState(24);
  const [gridColor, setGridColor] = useState("#e5e7eb");

  const applyLineDash = (ctx) => {
    ctx.setLineDash(LINE_STYLES[lineStyleKey] || []);
  };

  /* ===============================
     [SECCIÓN] OVERLAYS DOM: Textos, Imágenes, Simuladores
     =============================== */
  const overlayRef = useRef(null);

  const [textBoxes, setTextBoxes] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const dragTextRef = useRef(null);
  const resizeTextRef = useRef(null);

  const [images, setImages] = useState([]);
  const [activeImgId, setActiveImgId] = useState(null);
  const fileInputRef = useRef(null);
  const dragImgRef = useRef(null);
  const resizeImgRef = useRef(null);

  const [simPickerOpen, setSimPickerOpen] = useState(false);
  const [simList, setSimList] = useState([]);
  const [simBoxes, setSimBoxes] = useState([]);
  const [activeSimId, setActiveSimId] = useState(null);
  const dragSimRef = useRef(null);
  const resizeSimRef = useRef(null);
  const simIframeRefs = useRef(new Map());

  /* ===============================
     [SECCIÓN] POPOVERS / MENÚS
     =============================== */
  const [shapesOpen, setShapesOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  /* ===============================
     [SECCIÓN] HISTORIAL (UNDO/REDO)
     - Fixes:
       * Snapshot inicial
       * Guardar SOLO al finalizar la acción
       * Limpiar canvas antes de restaurar
       * Esperar imágenes (restore síncrono simplificado)
     =============================== */
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const snapshotState = useCallback(() => {
    // Tomamos bitmap del canvas principal y estados de overlays/control
    const bitmap = canvasRef.current?.toDataURL("image/png") || null;
    return {
      // Nota: mantenemos "background" para compatibilidad, aunque reconstruimos por settings
      background: null,
      bitmap,
      textBoxes: [...textBoxes],
      images: [...images],
      simBoxes: [...simBoxes],
      boardBg,
      gridOn,
      gridSpacing,
      gridColor,
    };
  }, [textBoxes, images, simBoxes, boardBg, gridOn, gridSpacing, gridColor]);

  const pushHistory = useCallback(
    (state) => {
      const s = state || snapshotState();
      // recorta lo que haya “por delante” si hiciste undo y luego algo nuevo
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(s);
      if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
      historyIndexRef.current = historyRef.current.length - 1;
    },
    [snapshotState]
  );

  const saveToHistory = useCallback(() => {
    // Guardar al final de las acciones, no al inicio
    pushHistory();
  }, [pushHistory]);

  const clearCanvasMain = () => {
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;
    ctx.save();
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.clearRect(0, 0, c.width / dprRef.current, c.height / dprRef.current);
    ctx.restore();
  };

  const restoreState = async (state) => {
    // 1) Ajustar settings de fondo/grid y redibujar
    setBoardBg(state.boardBg || "#ffffff");
    setGridOn(state.gridOn ?? true);
    setGridSpacing(state.gridSpacing || 24);
    setGridColor(state.gridColor || "#e5e7eb");
    // Redibuja fondo con settings del snapshot
    drawBackgroundAndGrid(state.boardBg, state.gridOn, state.gridSpacing, state.gridColor);

    // 2) Limpiar canvas principal
    clearCanvasMain();

    // 3) Volcar bitmap de dibujo
    if (state.bitmap) {
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.src = state.bitmap;
      });
      const c = canvasRef.current;
      const ctx = ctxRef.current;
      ctx.drawImage(img, 0, 0, c.width / dprRef.current, c.height / dprRef.current);
    }

    // 4) Restaurar overlays DOM
    setTextBoxes(state.textBoxes || []);
    setImages(state.images || []);
    setSimBoxes(state.simBoxes || []);
  };

  const undo = useCallback(async () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const st = historyRef.current[historyIndexRef.current];
    await restoreState(st);
  }, []);

  const redo = useCallback(async () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const st = historyRef.current[historyIndexRef.current];
    await restoreState(st);
  }, []);

  // Hotkeys globales para Undo/Redo
  useEffect(() => {
    const handleKey = (e) => {
      const el = document.activeElement;
      const isEditing =
        (el && el.isContentEditable) ||
        ["INPUT", "TEXTAREA"].includes(el?.tagName || "");
      // Bloquear cuando escribes en inputs/textarea
      if (isEditing) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo]);

  /* ==========================================
     [SECCIÓN] INIT / RESIZE DE TODAS LAS CAPAS
     - Fix: capas separadas con clases y z-index
     ========================================== */
  const resizeCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement;
    const rect = parent.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const setupLayer = (elRef, ctxStoreRef) => {
      const el = elRef.current;
      if (!el) return null;
      el.width = Math.floor(cssW * dpr);
      el.height = Math.floor(cssH * dpr);
      el.style.width = cssW + "px";
      el.style.height = cssH + "px";
      const ctx = el.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxStoreRef.current = ctx;
      return ctx;
    };

    // Fondo + Gradilla
    setupLayer(bgRef, bgCtxRef);

    // Copia temporal para preservar trazos al redimensionar
    const tmp = document.createElement("canvas");
    tmp.width = c.width;
    tmp.height = c.height;
    if (c.width && c.height) tmp.getContext("2d").drawImage(c, 0, 0);

    // Canvas principal
    c.width = Math.floor(cssW * dpr);
    c.height = Math.floor(cssH * dpr);
    c.style.width = cssW + "px";
    c.style.height = cssH + "px";
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    if (tmp.width && tmp.height) {
      ctx.drawImage(
        tmp,
        0,
        0,
        tmp.width,
        tmp.height,
        0,
        0,
        c.width / dpr,
        c.height / dpr
      );
    }

    // Overlay borrador (anillo)
    setupLayer(eraseRef, eraseCtxRef);
    // Overlay ghost (preview)
    setupLayer(ghostRef, ghostCtxRef);

    // Fondo y grid
    drawBackgroundAndGrid();
  }, []);

  /* ===================================
     [SECCIÓN] DIBUJO DE FONDO + GRADILLA
     (se puede invocar con overrides)
     =================================== */
  const drawBackgroundAndGrid = useCallback(
    (bg = boardBg, useGrid = gridOn, spacing = gridSpacing, gColor = gridColor) => {
      const bctx = bgCtxRef.current;
      const bgc = bgRef.current;
      if (!bctx || !bgc) return;
      const w = bgc.width / dprRef.current;
      const h = bgc.height / dprRef.current;

      bctx.save();
      bctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      bctx.clearRect(0, 0, w, h);
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, w, h);

      if (useGrid) {
        bctx.strokeStyle = gColor;
        bctx.lineWidth = 1;
        bctx.setLineDash([]);
        const step = Math.max(8, spacing);
        bctx.beginPath();
        for (let x = 0; x <= w; x += step) {
          bctx.moveTo(x, 0);
          bctx.lineTo(x, h);
        }
        for (let y = 0; y <= h; y += step) {
          bctx.moveTo(0, y);
          bctx.lineTo(w, y);
        }
        bctx.stroke();
      }
      bctx.restore();
    },
    [boardBg, gridOn, gridSpacing, gridColor]
  );

  // Reaccionar a cambios de fondo/grid
  useEffect(() => {
    drawBackgroundAndGrid();
  }, [drawBackgroundAndGrid]);

  // Mount: configurar resize y snapshot inicial
  useEffect(() => {
    if (CLEAR_ON_MOUNT) {
      localStorage.removeItem(LS_KEY);
      historyRef.current = [];
      historyIndexRef.current = -1;
    }
    const parent = canvasRef.current?.parentElement;
    const ro = new ResizeObserver(() => resizeCanvas());
    if (parent) ro.observe(parent);
    resizeCanvas();
    requestAnimationFrame(() => {
      drawBackgroundAndGrid();
      // Snapshot inicial tras primera pintura
      pushHistory(snapshotState());
    });
    return () => ro.disconnect();
  }, [resizeCanvas, drawBackgroundAndGrid, pushHistory, snapshotState]);

  /* =====================================
     [SECCIÓN] DIBUJO LIBRE (Pluma/Marcador/Borrador)
     - Fix: guardar historia SOLO en endDraw
     - Overlay de borrador y ghost no se pisan
     ===================================== */
  const relXY = (e) => relXYOf(canvasRef.current, e);

  const beginDraw = (x, y) => {
    if (![TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)) return;
    setIsDrawing(true);
    movedRef.current = false;
    lastPtRef.current = { x, y };
    const ctx = ctxRef.current;
    ctx.globalCompositeOperation =
      tool === TOOLS.ERASER ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.globalAlpha = tool === TOOLS.HIGHLIGHTER ? 0.25 : 1;
    ctx.lineWidth =
      tool === TOOLS.HIGHLIGHTER || tool === TOOLS.ERASER ? lineWidth * 3 : lineWidth;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // NO guardamos historia aquí (solo al finalizar)
  };

  const continueDraw = (x, y) => {
    if (!isDrawing) return;
    movedRef.current = true;
    lastPtRef.current = { x, y };
    const ctx = ctxRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = ctxRef.current;
    if (!movedRef.current) {
      const { x, y } = lastPtRef.current;
      if (tool === TOOLS.ERASER) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, (lineWidth * 3) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = tool === TOOLS.HIGHLIGHTER ? 0.25 : 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, lineWidth / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.closePath();
    // Guardar historial al finalizar trazo
    saveToHistory();
  };

  const drawEraserRing = (sx, sy) => {
    const o = eraseCtxRef.current;
    const oc = eraseRef.current;
    if (!o || !oc) return;
    o.save();
    // IMPORTANTE: el ring se borra SOLO en la capa de borrador (no toca al ghost)
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, oc.width, oc.height);
    o.restore();

    if (tool !== TOOLS.ERASER) return;
    const r = (lineWidth * 3) / 2;
    o.beginPath();
    o.arc(sx, sy, r, 0, Math.PI * 2);
    o.setLineDash([6, 4]);
    o.lineWidth = 2;
    o.strokeStyle = "#22c55e";
    o.stroke();
    o.setLineDash([]);
  };

  /* =================================================
     [SECCIÓN] FIGURAS & LÍNEAS con Preview (GHOST FIX)
     - Ghost ahora usa su propia capa (ghostRef/ghostCtxRef)
     - Ya no se limpia erróneamente en mousemove global
     ================================================= */
  const shapeStartRef = useRef(null);

  const beginShape = (x, y) => {
    shapeStartRef.current = { x, y };
    const pc = ghostCtxRef.current;
    if (!pc) return;
    pc.clearRect(0, 0, ghostRef.current.width / dprRef.current, ghostRef.current.height / dprRef.current);
  };

  const continueShape = (x, y) => {
    const pc = ghostCtxRef.current;
    if (!pc || !shapeStartRef.current) return;
    const { x: sx, y: sy } = shapeStartRef.current;
    pc.clearRect(0, 0, ghostRef.current.width / dprRef.current, ghostRef.current.height / dprRef.current);
    pc.save();
    pc.globalAlpha = 0.4;
    pc.lineWidth = lineWidth;
    pc.strokeStyle = color;
    pc.fillStyle = fillColor;
    applyLineDash(pc);

    const minX = Math.min(sx, x),
      minY = Math.min(sy, y);
    const w = Math.abs(x - sx),
      h = Math.abs(y - sy);

    pc.beginPath();
    if (tool === TOOLS.SHAPES) {
      switch (activeShape) {
        case SHAPES.RECT:
          pc.rect(minX, minY, w, h);
          break;
        case SHAPES.SQUARE: {
          const s = Math.max(w, h);
          pc.rect(sx < x ? sx : sx - s, sy < y ? sy : sy - s, s, s);
          break;
        }
        case SHAPES.CIRCLE: {
          const r = Math.max(w, h) / 2;
          const cx = sx + (x - sx) / 2;
          const cy = sy + (y - sy) / 2;
          pc.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
          break;
        }
        case SHAPES.ELLIPSE:
          pc.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          break;
        case SHAPES.TRIANGLE: {
          const dx = x - sx;
          const dy = y - sy;
          const len = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const base = len * 0.5;
          const height = len * 0.866;
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
        default:
          break;
      }
      if (fillEnabled) pc.fill();
      pc.stroke();
    } else if (tool === TOOLS.LINES) {
      // Línea base + flechas
      pc.moveTo(sx, sy);
      pc.lineTo(x, y);
      pc.stroke();
      drawArrow(pc, sx, sy, x, y, activeLine);
    }
    pc.restore();
  };

  const commitShape = (x, y) => {
    if (!shapeStartRef.current) return;
    const { x: sx, y: sy } = shapeStartRef.current;
    const ctx = ctxRef.current;
    const pc = ghostCtxRef.current;
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = fillColor;
    applyLineDash(ctx);

    const minX = Math.min(sx, x),
      minY = Math.min(sy, y);
    const w = Math.abs(x - sx),
      h = Math.abs(y - sy);

    ctx.beginPath();
    if (tool === TOOLS.SHAPES) {
      switch (activeShape) {
        case SHAPES.RECT:
          ctx.rect(minX, minY, w, h);
          break;
        case SHAPES.SQUARE: {
          const s = Math.max(w, h);
          ctx.rect(sx < x ? sx : sx - s, sy < y ? sy : sy - s, s, s);
          break;
        }
        case SHAPES.CIRCLE: {
          const r = Math.max(w, h) / 2;
          const cx = sx + (x - sx) / 2;
          const cy = sy + (y - sy) / 2;
          ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
          break;
        }
        case SHAPES.ELLIPSE:
          ctx.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          break;
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
        default:
          break;
      }
      if (fillEnabled) ctx.fill();
      ctx.stroke();
    } else if (tool === TOOLS.LINES) {
      ctx.moveTo(sx, sy);
      ctx.lineTo(x, y);
      ctx.stroke();
      drawArrow(ctx, sx, sy, x, y, activeLine);
    }
    ctx.restore();

    // Limpiar ghost (SOLO ghost layer)
    pc?.clearRect(
      0,
      0,
      ghostRef.current.width / dprRef.current,
      ghostRef.current.height / dprRef.current
    );
    shapeStartRef.current = null;

    // Guardamos historial al finalizar figura/línea
    saveToHistory();
  };

  const drawArrow = (ctx, x1, y1, x2, y2, type) => {
    const headlen = lineWidth * 3;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    const isRight = type === LINES.ARROW_RIGHT || type === LINES.ARROW_BOTH;
    const isLeft = type === LINES.ARROW_LEFT || type === LINES.ARROW_BOTH;

    if (isRight) {
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headlen * Math.cos(angle - Math.PI / 6),
        y2 - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        x2 - headlen * Math.cos(angle + Math.PI / 6),
        y2 - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
    if (isLeft) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 + headlen * Math.cos(angle - Math.PI / 6),
        y1 + headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        x1 + headlen * Math.cos(angle + Math.PI / 6),
        y1 + headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  /* ====================================
     [SECCIÓN] TEXTOS (overlay DOM)
     ==================================== */
  const createTextboxAt = ({ x, y }) => {
    const id = crypto.randomUUID();
    setTextBoxes((a) => [
      ...a,
      {
        id,
        x: Math.max(8, x),
        y: Math.max(8, y),
        w: 240,
        h: 56,
        color,
        fontSize: Math.max(12, lineWidth * 6),
        content: "",
      },
    ]);
    setActiveTextId(id);
    setTimeout(
      () =>
        overlayRef.current
          ?.querySelector(`[data-tb="${id}"] .wbp-textarea`)
          ?.focus(),
      0
    );
    // Nota: no guardamos en creación vacía; guarda en blur o al mover/redimensionar
  };

  const commitTextbox = (id) => {
    const el = overlayRef.current?.querySelector(
      `[data-tb="${id}"] .wbp-textarea`
    );
    if (!el) return;
    const val = el.innerText.replace(/\u00A0/g, " ").replace(/\s+$/, "");
    setTextBoxes((arr) =>
      arr.map((t) =>
        t.id === id
          ? {
              ...t,
              content: val,
              color,
              fontSize: Math.max(12, lineWidth * 6),
            }
          : t
      )
    );
    saveToHistory();
  };

  const beginDragText = (id, e) => {
    if (e.target?.classList?.contains("wbp-textarea")) return;
    e.preventDefault();
    e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    const tb = textBoxes.find((t) => t.id === id);
    dragTextRef.current = { id, dx: sx - tb.x, dy: sy - tb.y };
    setActiveTextId(id);
    setActiveImgId(null);
    setActiveSimId(null);
  };
  const moveDragText = (e) => {
    const d = dragTextRef.current;
    if (!d) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    setTextBoxes((arr) =>
      arr.map((t) => (t.id !== d.id ? t : { ...t, x: sx - d.dx, y: sy - d.dy }))
    );
  };
  const endDragText = () => {
    if (!dragTextRef.current) return;
    dragTextRef.current = null;
    saveToHistory();
  };

  const beginResizeText = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    const tb = textBoxes.find((t) => t.id === id);
    resizeTextRef.current = { id, ox: sx, oy: sy, ow: tb.w, oh: tb.h };
    setActiveTextId(id);
    setActiveImgId(null);
    setActiveSimId(null);
  };
  const moveResizeText = (e) => {
    const z = resizeTextRef.current;
    if (!z) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    setTextBoxes((arr) =>
      arr.map((t) =>
        t.id !== z.id
          ? t
          : { ...t, w: Math.max(84, z.ow + (sx - z.ox)), h: Math.max(36, z.oh + (sy - z.oy)) }
      )
    );
  };
  const endResizeText = () => {
    if (!resizeTextRef.current) return;
    resizeTextRef.current = null;
    saveToHistory();
  };

  /* ====================================
     [SECCIÓN] IMÁGENES (overlay DOM)
     ==================================== */
  const addImage = (file) => {
    const url = URL.createObjectURL(file);
    const r = canvasRef.current.getBoundingClientRect();
    const id = crypto.randomUUID();
    const w = Math.min(480, Math.max(160, r.width * 0.4));
    const h = Math.floor(w * 0.625);
    setImages((a) => [
      ...a,
      { id, x: (r.width - w) / 2, y: (r.height - h) / 2, w, h, src: url },
    ]);
    setActiveImgId(id);
    setActiveTextId(null);
    setActiveSimId(null);
    saveToHistory();
  };

  const beginDragImg = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    const im = images.find((x) => x.id === id);
    dragImgRef.current = { id, dx: sx - im.x, dy: sy - im.y };
    setActiveImgId(id);
    setActiveTextId(null);
    setActiveSimId(null);
  };
  const moveDragImg = (e) => {
    const z = dragImgRef.current;
    if (!z) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    setImages((a) =>
      a.map((it) => (it.id !== z.id ? it : { ...it, x: sx - z.dx, y: sy - z.dy }))
    );
  };
  const endDragImg = () => {
    if (!dragImgRef.current) return;
    dragImgRef.current = null;
    saveToHistory();
  };

  const beginResizeImg = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    const im = images.find((x) => x.id === id);
    resizeImgRef.current = { id, ox: sx, oy: sy, ow: im.w, oh: im.h };
    setActiveImgId(id);
    setActiveTextId(null);
    setActiveSimId(null);
  };
  const moveResizeImg = (e) => {
    const z = resizeImgRef.current;
    if (!z) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    setImages((a) =>
      a.map((it) =>
        it.id !== z.id
          ? it
          : {
              ...it,
              w: Math.max(48, z.ow + (sx - z.ox)),
              h: Math.max(36, z.oh + (sy - z.oy)),
            }
      )
    );
  };
  const endResizeImg = () => {
    if (!resizeImgRef.current) return;
    resizeImgRef.current = null;
    saveToHistory();
  };

  /* ====================================
     [SECCIÓN] SIMULADORES (overlay DOM)
     ==================================== */
  const fetchSimList = useCallback(async () => {
    const tries = [CDN_INDEX, RAW_INDEX];
    for (const u of tries) {
      try {
        const data = await safeFetchJSON(u);
        const arr = (data.simuladores || data || []).filter((x) => x?.file && x?.name);
        setSimList(arr);
        return;
      } catch (e) {
        console.warn("manifest fallo:", u, e.message);
      }
    }
    setSimList([]);
  }, []);
  useEffect(() => {
    fetchSimList();
  }, [fetchSimList]);

  const dynamicImportFromText = async (code) => {
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    try {
      return await import(/* @vite-ignore */ url);
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  };
  const fetchModuleESM = async (file) => {
    const tries = [`${CDN_BASE}${file}`, `${RAW_BASE}${file}`];
    for (const u of tries) {
      try {
        const txt = await fetch(u, { cache: "no-store" }).then((r) => {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        });
        return await dynamicImportFromText(txt);
      } catch (e) {
        console.warn("script fallo:", u, e.message);
      }
    }
    throw new Error("No pude importar el simulador.");
  };
  const wrapSimHTML = (inner) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>html,body{margin:0;padding:0;height:100%;font:14px/1.4 system-ui,Arial,sans-serif}*{box-sizing:border-box}</style>
</head><body>${inner}</body></html>`;

  const insertSimulator = async (item) => {
    try {
      const mod = await fetchModuleESM(item.file);
      const html = (mod?.default?.render?.({}, item.name)) || "<div>Simulador no disponible</div>";
      const r = canvasRef.current.getBoundingClientRect();
      const w = Math.min(640, Math.max(320, r.width * 0.6));
      const h = Math.min(420, Math.max(240, r.height * 0.5));
      const id = crypto.randomUUID();
      setSimBoxes((a) => [
        ...a,
        {
          id,
          name: item.name,
          x: (r.width - w) / 2,
          y: (r.height - h) / 2,
          w,
          h,
          html,
        },
      ]);
      setActiveSimId(id);
      setActiveTextId(null);
      setActiveImgId(null);
      setSimPickerOpen(false);
      saveToHistory();
    } catch (e) {
      alert("No se pudo cargar ese simulador desde el repositorio.");
    }
  };

  const beginDragSim = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    const sm = simBoxes.find((s) => s.id === id);
    dragSimRef.current = { id, dx: sx - sm.x, dy: sy - sm.y };
    setActiveSimId(id);
    setActiveTextId(null);
    setActiveImgId(null);
  };
  const moveDragSim = (e) => {
    const d = dragSimRef.current;
    if (!d) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    setSimBoxes((a) =>
      a.map((s) => (s.id !== d.id ? s : { ...s, x: sx - d.dx, y: sy - d.dy }))
    );
  };
  const endDragSim = () => {
    if (!dragSimRef.current) return;
    dragSimRef.current = null;
    saveToHistory();
  };

  const beginResizeSim = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    const sm = simBoxes.find((s) => s.id === id);
    resizeSimRef.current = { id, ox: sx, oy: sy, ow: sm.w, oh: sm.h };
    setActiveSimId(id);
    setActiveTextId(null);
    setActiveImgId(null);
  };
  const moveResizeSim = (e) => {
    const z = resizeSimRef.current;
    if (!z) return;
    const r = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    setSimBoxes((a) =>
      a.map((s) =>
        s.id !== z.id
          ? s
          : {
              ...s,
              w: Math.max(160, z.ow + (sx - z.ox)),
              h: Math.max(120, z.oh + (sy - z.oy)),
            }
      )
    );
  };
  const endResizeSim = () => {
    if (!resizeSimRef.current) return;
    resizeSimRef.current = null;
    saveToHistory();
  };

  /* ====================================
     [SECCIÓN] EXPORTAR PNG
     ==================================== */
  const exportPNG = async () => {
    const dpr = dprRef.current;
    const c = canvasRef.current;
    const bgc = bgRef.current;
    const out = document.createElement("canvas");
    out.width = c.width;
    out.height = c.height;
    const tctx = out.getContext("2d");

    if (bgc) tctx.drawImage(bgc, 0, 0);
    tctx.drawImage(c, 0, 0);

    for (const im of images) {
      const imgEl = new Image();
      await new Promise((res) => {
        imgEl.onload = res;
        imgEl.src = im.src;
      });
      tctx.drawImage(imgEl, im.x * dpr, im.y * dpr, im.w * dpr, im.h * dpr);
    }

    tctx.textBaseline = "top";
    for (const tb of textBoxes) {
      tctx.fillStyle = tb.color;
      tctx.globalAlpha = 1;
      tctx.font = `${tb.fontSize * dpr}px Inter,system-ui,Arial,sans-serif`;
      const lines = (tb.content || "").split("\n");
      let y = tb.y * dpr + 2;
      for (const ln of lines) {
        tctx.fillText(ln, tb.x * dpr + 2, y);
        y += tb.fontSize * 1.25 * dpr;
      }
    }

    async function ensureH2C() {
      if (window.html2canvas) return;
      await new Promise((res) => {
        const s = document.createElement("script");
        s.src =
          "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
        s.onload = res;
        document.body.appendChild(s);
      });
    }
    for (const sb of simBoxes) {
      const ifr = simIframeRefs.current.get(sb.id);
      try {
        await ensureH2C();
        const c2 = await window.html2canvas(ifr.contentDocument.body, {
          backgroundColor: null,
          scale: dpr,
        });
        tctx.drawImage(c2, sb.x * dpr, sb.y * dpr, sb.w * dpr, sb.h * dpr);
      } catch {
        tctx.save();
        tctx.strokeStyle = "#9ca3af";
        tctx.lineWidth = 2;
        tctx.setLineDash([6, 3]);
        tctx.strokeRect(sb.x * dpr, sb.y * dpr, sb.w * dpr, sb.h * dpr);
        tctx.setLineDash([]);
        tctx.font = `${14 * dpr}px system-ui, Arial`;
        tctx.fillStyle = "#374151";
        tctx.fillText(
          `Simulador: ${sb.name}`,
          sb.x * dpr + 8 * dpr,
          sb.y * dpr + 18 * dpr
        );
        tctx.restore();
      }
    }

    const a = document.createElement("a");
    a.download = "pizarron.png";
    a.href = out.toDataURL("image/png");
    a.click();
  };

  /* ====================================
     [SECCIÓN] UTILIDADES GLOBALES
     ==================================== */
  const clearAll = () => {
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, c.width, c.height);
    setTextBoxes([]);
    setImages([]);
    setSimBoxes([]);
    setActiveTextId(null);
    setActiveImgId(null);
    setActiveSimId(null);
    drawBackgroundAndGrid();
    localStorage.removeItem(LS_KEY);
    historyRef.current = [];
    historyIndexRef.current = -1;
    // Snapshot del estado "limpio"
    pushHistory(snapshotState());
  };

  const deleteActive = () => {
    if (activeTextId) {
      setTextBoxes((a) => a.filter((t) => t.id !== activeTextId));
      setActiveTextId(null);
      saveToHistory();
      return;
    }
    if (activeImgId) {
      setImages((a) => a.filter((i) => i.id !== activeImgId));
      setActiveImgId(null);
      saveToHistory();
      return;
    }
    if (activeSimId) {
      setSimBoxes((a) => a.filter((s) => s.id !== activeSimId));
      setActiveSimId(null);
      saveToHistory();
      return;
    }
  };

  /* ====================================
     [SECCIÓN] LISTENERS GLOBALES
     - Fix principal: en mousemove NO limpiamos la capa de ghost,
       solo la de borrador si corresponde.
     ==================================== */
  useEffect(() => {
    const mm = (e) => {
      // Eraser ring en su capa dedicada
      if (tool === TOOLS.ERASER) {
        const css = relXY(e);
        drawEraserRing(css.x, css.y);
      } else {
        // Limpia SOLO la capa de borrador (no tocar ghost)
        const o = eraseCtxRef.current;
        const oc = eraseRef.current;
        if (o && oc) {
          o.save();
          o.setTransform(1, 0, 0, 1, 0, 0);
          o.clearRect(0, 0, oc.width, oc.height);
          o.restore();
        }
      }
      // Drags de overlays DOM
      moveDragText(e);
      moveResizeText(e);
      moveDragImg(e);
      moveResizeImg(e);
      moveDragSim(e);
      moveResizeSim(e);
    };
    const mu = () => {
      endDragText();
      endResizeText();
      endDragImg();
      endResizeImg();
      endDragSim();
      endResizeSim();
    };
    const onKey = (e) => {
      const el = document.activeElement;
      const isEditing =
        (el && el.isContentEditable) ||
        ["INPUT", "TEXTAREA"].includes(el?.tagName || "");
      if ((e.key === "Delete" || e.key === "Backspace") && !isEditing) {
        e.preventDefault();
        deleteActive();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        exportPNG();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        clearAll();
      }
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("keydown", onKey);
    };
  }, [
    tool,
    lineWidth,
    textBoxes,
    images,
    simBoxes,
    activeTextId,
    activeImgId,
    activeSimId,
  ]);


  // Cambiar automáticamente el puntero del mouse según la herramienta activa
  useEffect(() => {
    document.body.style.cursor =
      tool === "cursor" ? "default" : "crosshair";
  }, [tool]);





  /* ====================================
     [SECCIÓN] HANDLERS DEL STAGE/CANVAS
     - Modo “cursor”: permite arrastrar, seleccionar o deseleccionar elementos
     - Compatible con texto, imágenes y simuladores (como en PowerPoint)
     ==================================== */
  const onStageMouseDown = (e) => {
    const { x, y } = relXY(e);

    // 🖱️ MODO CURSOR: permite seleccionar o deseleccionar elementos
    if (tool === "cursor") {
      // Si haces clic en una zona vacía del canvas (no sobre texto/imagen/sim), deselecciona todo
      if (e.target.tagName === "CANVAS") {
        setActiveTextId(null);
        setActiveImgId(null);
        setActiveSimId(null);
      }
      // No dibuja nada en modo cursor
      return;
    }

    // ✏️ MODO TEXTO: crea nuevo textbox en la posición clicada
    if (tool === TOOLS.TEXT) {
      createTextboxAt({ x, y });
      return;
    }

    // 🖋️ MODO DIBUJO (pluma, marcador, borrador)
    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)) {
      beginDraw(x, y);
      return;
    }

    // 🔺 MODO FIGURAS / LÍNEAS
    if ([TOOLS.SHAPES, TOOLS.LINES].includes(tool)) {
      beginShape(x, y);
    }
  };

  const onStageMouseMove = (e) => {
    const { x, y } = relXY(e);

    // 🖱️ En modo cursor no se dibuja nada
    if (tool === "cursor") return;

    // 🖋️ Continuar trazado
    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)) {
      continueDraw(x, y);
      return;
    }

    // 🔺 Actualizar preview de figuras/líneas
    if ([TOOLS.SHAPES, TOOLS.LINES].includes(tool)) {
      continueShape(x, y);
    }
  };

  const onStageMouseUp = (e) => {
    // 🖱️ En modo cursor no hay dibujo, así que se ignora
    if (tool === "cursor") return;

    // 🖋️ Terminar trazo
    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)) {
      endDraw();
      return;
    }

    // 🔺 Confirmar figura/línea
    if ([TOOLS.SHAPES, TOOLS.LINES].includes(tool)) {
      const { x, y } = relXY(e);
      commitShape(x, y);
    }
  };







  // No limpiamos el ghost en mouseleave para no “desaparecer” el preview sin querer
  const onStageMouseLeave = () => {
    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool) && isDrawing) {
      endDraw();
    }
    // Si estabas haciendo figura/línea, dejamos el ghost hasta siguiente acción
  };

  const clearPreview = () => {
    const pc = ghostCtxRef.current;
    if (!pc) return;
    pc.clearRect(
      0,
      0,
      ghostRef.current.width / dprRef.current,
      ghostRef.current.height / dprRef.current
    );
    shapeStartRef.current = null;
  };

  /* ==========================================================
     [SECCIÓN UI] RENDER COMPLETO + BOTONES POR SECCIÓN
     - Botones: Undo, Redo, Líneas, Figuras, Texto, Imagen, Simuladores
     - Paletas color/grosor/fondo y menú Más
     ========================================================== */
  return (
    <div className="wbp-page wbp--edge wbpro-root">
      {/* ===========================
          [MODAL] Picker de Simuladores
          =========================== */}
      {simPickerOpen && (
        <div className="wbp-modal" onClick={() => setSimPickerOpen(false)}>
          <div className="wbp-modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="wbp-modal__head">
              <strong>Simuladores del repositorio</strong>
              <button className="wbp-btn" onClick={() => setSimPickerOpen(false)}>
                X
              </button>
            </div>
            <div className="wbp-modal__body">
              {simList.length === 0 && <div>No encontré simuladores en el manifest.</div>}
              {simList.map((s) => (
                <div key={s.file} className="wbp-simrow">
                  <div className="wbp-simrow__name">{s.name}</div>
                  <button className="wbp-btn" onClick={() => insertSimulator(s)}>
                    Insertar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===========================
          [TOPBAR/HEADER] Controles principales
          =========================== */}
      <div className="wbp-topbar wbpro-header">
        <div className="wbp-brand wbpro-left">
          <span className="wbp-title wbpro-logo">Neteaching • Pizarrón PRO</span>
        </div>

        {/* ===========================
            [BOTONES DE HERRAMIENTAS]
            - Botón: Pluma
            - Botón: Marcador
            - Botón: Borrador
            - Botón: Texto
            - Botón: Figuras (popover)
            - Botón: Líneas (popover)
            - Botón: Imagen
            - Botón: Simuladores
            - Botón: Undo
            - Botón: Redo
            - Botón: Más (exportar/limpiar/borrar)
            =========================== */}
        <div className="wbp-tools wbpro-tools">
          {/* Botón: Pluma */}
          <button
            className={`wbp-btn ${tool === TOOLS.PEN ? "is-active" : ""}`}
            onClick={() => setTool(TOOLS.PEN)}
          >
            Pluma
          </button>

          {/* Botón: Marcador */}
          <button
            className={`wbp-btn ${tool === TOOLS.HIGHLIGHTER ? "is-active" : ""}`}
            onClick={() => setTool(TOOLS.HIGHLIGHTER)}
          >
            Marcador
          </button>

          {/* Botón: Borrador */}
          <button
            className={`wbp-btn ${tool === TOOLS.ERASER ? "is-active" : ""}`}
            onClick={() => setTool(TOOLS.ERASER)}
          >
            Borrador
          </button>

          {/* Botón: Texto */}
          <button
            className={`wbp-btn ${tool === TOOLS.TEXT ? "is-active" : ""}`}
            onClick={() => setTool(TOOLS.TEXT)}
          >
            T
          </button>



          {/* Botón: Cursor (selección / volver al puntero) */}
          <button
            className={`wbp-btn ${tool === "cursor" ? "is-active" : ""}`}
            onClick={() => setTool("cursor")}
            title="Cursor / Seleccionar"
          >
          🖱️
        </button>


          {/* Botón: Figuras + Popover */}
          <div className="wbp-popover">
            <button
              className={`wbp-btn ${tool === TOOLS.SHAPES ? "is-active" : ""}`}
              onClick={() => {
                setTool(TOOLS.SHAPES);
                setShapesOpen(!shapesOpen);
                setLinesOpen(false);
              }}
            >
              Figuras
            </button>
            {shapesOpen && (
              <div className="wbp-popover-menu">
                <button
                  onClick={() => {
                    setActiveShape(SHAPES.RECT);
                    setShapesOpen(false);
                  }}
                >
                  Rectángulo
                </button>
                <button
                  onClick={() => {
                    setActiveShape(SHAPES.SQUARE);
                    setShapesOpen(false);
                  }}
                >
                  Cuadrado
                </button>
                <button
                  onClick={() => {
                    setActiveShape(SHAPES.CIRCLE);
                    setShapesOpen(false);
                  }}
                >
                  Círculo
                </button>
                <button
                  onClick={() => {
                    setActiveShape(SHAPES.ELLIPSE);
                    setShapesOpen(false);
                  }}
                >
                  Elipse
                </button>
                <button
                  onClick={() => {
                    setActiveShape(SHAPES.TRIANGLE);
                    setShapesOpen(false);
                  }}
                >
                  Triángulo
                </button>
                <div className="wbp-popover-divider" />
                <label className="wbp-popover-row">
                  <input
                    type="checkbox"
                    checked={fillEnabled}
                    onChange={(e) => setFillEnabled(e.target.checked)}
                  />
                  Rellenar
                </label>
                <label className="wbp-popover-row">
                  <span>Relleno</span>
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Botón: Líneas + Popover */}
          <div className="wbp-popover">
            <button
              className={`wbp-btn ${tool === TOOLS.LINES ? "is-active" : ""}`}
              onClick={() => {
                setTool(TOOLS.LINES);
                setLinesOpen(!linesOpen);
                setShapesOpen(false);
              }}
            >
              Líneas
            </button>
            {linesOpen && (
              <div className="wbp-popover-menu">
                <button
                  onClick={() => {
                    setActiveLine(LINES.SOLID);
                    setLineStyleKey("SOLID");
                    setLinesOpen(false);
                  }}
                >
                  Línea sólida
                </button>
                <button
                  onClick={() => {
                    setActiveLine(LINES.DASHED);
                    setLineStyleKey("DASHED");
                    setLinesOpen(false);
                  }}
                >
                  Punteada
                </button>
                <button
                  onClick={() => {
                    setActiveLine(LINES.DOTTED);
                    setLineStyleKey("DOTTED");
                    setLinesOpen(false);
                  }}
                >
                  Con puntos
                </button>
                <button
                  onClick={() => {
                    setActiveLine(LINES.DASH_DOT);
                    setLineStyleKey("DASH_DOT");
                    setLinesOpen(false);
                  }}
                >
                  Guion-punto
                </button>
                <button
                  onClick={() => {
                    setActiveLine(LINES.ARROW_RIGHT);
                    setLinesOpen(false);
                  }}
                >
                  Flecha →
                </button>
                <button
                  onClick={() => {
                    setActiveLine(LINES.ARROW_LEFT);
                    setLinesOpen(false);
                  }}
                >
                  Flecha ←
                </button>
                <button
                  onClick={() => {
                    setActiveLine(LINES.ARROW_BOTH);
                    setLinesOpen(false);
                  }}
                >
                  Flecha ↔
                </button>
              </div>
            )}
          </div>

          {/* Botón: Imagen */}
          <button className="wbp-btn" onClick={() => fileInputRef.current?.click()}>
            Imagen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) addImage(f);
              ev.target.value = "";
            }}
          />

          {/* Botón: Simuladores */}
          <button className="wbp-btn" onClick={() => setSimPickerOpen(true)}>
            Simuladores
          </button>

          {/* Botón: Undo */}
          <button className="wbp-btn" onClick={undo} title="Deshacer (Ctrl+Z)">
            Undo
          </button>

          {/* Botón: Redo */}
          <button className="wbp-btn" onClick={redo} title="Rehacer (Ctrl+Y)">
            Redo
          </button>

          {/* Popover: Más */}
          <div style={{ position: "relative" }}>
            <button className="wbp-btn" onClick={() => setMoreOpen((v) => !v)}>
              Más
            </button>
            {moreOpen && (
              <div className="wbp-more-popover">
                <button className="wbp-btn" onClick={deleteActive}>
                  Borrar selección
                </button>
                <button className="wbp-btn" onClick={clearAll}>
                  Limpiar todo
                </button>
                <button className="wbp-btn" onClick={exportPNG}>
                  Exportar PNG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===========================
            [PALETA] Color de trazo
            =========================== */}
        <div className="wbp-palette wbpro-color">
          <span className="wbp-label">Color</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <div className="wbpro-swatches">
            {["#111827", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#10b981", "#7c3aed"].map(
              (c) => (
                <button key={c} title={c} style={{ background: c }} onClick={() => setColor(c)} />
              )
            )}
          </div>
        </div>

        {/* ===========================
            [RANGO] Grosor de línea
            =========================== */}
        <div className="wbp-weight wbpro-range">
          <span className="wbp-label">Grosor</span>
          <input
            type="range"
            min="1"
            max="48"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="wbp-slider"
          />
          <span className="wbp-chip">{lineWidth}px</span>
        </div>

        {/* ===========================
            [PALETA] Tamaño de texto
            =========================== */}
        <div className="wbp-palette wbpro-color">
          <span className="wbp-label">Texto</span>
          <input
            type="number"
            min="8"
            max="96"
            value={Math.max(12, lineWidth * 6)}
            onChange={(e) => setLineWidth(Number(e.target.value) / 6)}
            style={{ width: 60 }}
          />
        </div>


        {/* ===========================
            [PALETA] Fondo y Gradilla
            =========================== */}
        <div className="wbp-palette wbpro-color">
         <span className="wbp-label">Fondo</span>

          {/* Selector de color de fondo */}
          <input
            type="color"
            value={boardBg}
            onChange={(e) => {
              const v = e.target.value;
              setBoardBg(v);
              // Redibuja el fondo y la gradilla con el nuevo color
              setTimeout(() => drawBackgroundAndGrid(v, gridOn, gridSpacing, gridColor), 0);
            }}
          />

          {/* Checkbox: mostrar/ocultar gradilla */}
          <label
              style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginLeft: 8,
            }}
  >
            <input
              type="checkbox"
              checked={gridOn}
              onChange={(e) => {
                const v = e.target.checked;
                setGridOn(v);
                // Redibuja tras actualizar el estado de gradilla
                setTimeout(() => drawBackgroundAndGrid(boardBg, v, gridSpacing, gridColor), 0);
              }}
            />
            Gradilla
          </label>

          {/* Control numérico: separación entre líneas de la gradilla */}
          <span className="wbp-label" style={{ marginLeft: 8 }}>
            Paso
          </span>
          <input
            type="number"
            min={8}
            max={120}
            value={gridSpacing}
            onChange={(e) => {
              const v = Number(e.target.value) || 24;
              setGridSpacing(v);
              // Redibuja con el nuevo paso
              setTimeout(() => drawBackgroundAndGrid(boardBg, gridOn, v, gridColor), 0);
            }}
            style={{ width: 60 }}
          />

          {/* Selector de color de la gradilla */}
          <input
            type="color"
            value={gridColor}
            onChange={(e) => {
              const v = e.target.value;
              setGridColor(v);
              // Redibuja con el nuevo color de la gradilla
              setTimeout(() => drawBackgroundAndGrid(boardBg, gridOn, gridSpacing, v), 0);
            }}
            style={{ width: 28, height: 28, marginLeft: 6 }}
          />
        </div>












        {/* ===========================
            [ATAJOS RÁPIDOS] Botonera derecha
            =========================== */}
        <div className="wbp-right wbpro-right">
          <button className="wbp-btn" onClick={deleteActive}>
            Borrar
          </button>
          <button className="wbp-btn" onClick={clearAll}>
            Limpiar
          </button>
          <button className="wbp-btn" onClick={exportPNG}>
            PNG
          </button>
        </div>
      </div>

      {/* ===========================
          [STAGE/CANVASES + OVERLAYS DOM]
          =========================== */}
      <div className="wbp-stage">
        <div
          className="wbp-wrap"
          onMouseDown={() => {
            setActiveTextId(null);
            setActiveImgId(null);
            setActiveSimId(null);
          }}
          onClick={(e) => {
            if (tool === TOOLS.TEXT) {
              const { x, y } = relXY(e);
              createTextboxAt({ x, y });
            }
          }}
        >
          {/* CAPA: Fondo + Gradilla */}
          <canvas ref={bgRef} className="wbp-canvas wbp-bg-canvas" aria-hidden />

          {/* CAPA: Dibujo principal */}
          <canvas
            ref={canvasRef}
            className="wbp-canvas wbp-main-canvas"
            onMouseDown={onStageMouseDown}
            onMouseMove={onStageMouseMove}
            onMouseUp={onStageMouseUp}
            onMouseLeave={onStageMouseLeave}
          />

          {/* CAPA: Overlay de borrador (anillo) */}
          <canvas ref={eraseRef} className="wbp-ovr-canvas wbp-erase-canvas" aria-hidden />

          {/* CAPA: Overlay de ghost (preview figuras/líneas) */}
          <canvas ref={ghostRef} className="wbp-ovr-canvas wbp-ghost-canvas" aria-hidden />

          {/* OVERLAY DOM: Imágenes */}
          <div className="wbp-overlay" aria-hidden>
            {images.map((im) => (
              <div
                key={im.id}
                className={`wbp-imgbox ${activeImgId === im.id ? "is-active" : ""}`}
                style={{ left: im.x, top: im.y, width: im.w, height: im.h }}
                onMouseDown={(e) => beginDragImg(im.id, e)}
              >
                <img className="wbp-img" src={im.src} alt="" draggable={false} />
                <div className="wbp-img-resizer" onMouseDown={(e) => beginResizeImg(im.id, e)}>
                  Resize
                </div>
              </div>
            ))}
          </div>

          {/* OVERLAY DOM: Simuladores */}
          <div className="wbp-overlay" aria-hidden>
            {simBoxes.map((sb) => (
              <div
                key={sb.id}
                className={`wbp-simbox ${activeSimId === sb.id ? "is-active" : ""}`}
                style={{ left: sb.x, top: sb.y, width: sb.w, height: sb.h }}
                onMouseDown={(e) => beginDragSim(sb.id, e)}
              >
                <iframe
                  ref={(el) => {
                    if (el) simIframeRefs.current.set(sb.id, el);
                  }}
                  className="wbp-sim-iframe"
                  sandbox="allow-scripts allow-same-origin"
                  srcDoc={wrapSimHTML(sb.html)}
                  title={sb.name}
                />
                <div className="wbp-sim-resizer" onMouseDown={(e) => beginResizeSim(sb.id, e)}>
                  Resize
                </div>
              </div>
            ))}
          </div>

          {/* OVERLAY DOM: Textos */}
          <div className="wbp-overlay" ref={overlayRef}>
            {textBoxes.map((tb) => (
              <div
                key={tb.id}
                data-tb={tb.id}
                className={`wbp-textbox ${activeTextId === tb.id ? "is-active" : ""}`}
                style={{ left: tb.x, top: tb.y, width: tb.w, height: tb.h }}
                onMouseDown={(e) => beginDragText(tb.id, e)}
              >
                <div
                  className="wbp-textarea"
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setActiveTextId(tb.id);
                  }}
                  style={{
                    color: tb.id === activeTextId ? color : tb.color,
                    fontSize: tb.id === activeTextId ? Math.max(12, lineWidth * 6) : tb.fontSize,
                  }}
                  onBlur={() => commitTextbox(tb.id)}
                >
                  {tb.content}
                </div>
                <div className="wbp-resizer" onMouseDown={(e) => beginResizeText(tb.id, e)}>
                  Resize
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
