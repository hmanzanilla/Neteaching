// src/components/alumno/ruta1/acceso/aula_virtual/Whiteboard.js
// client/src/components/alumno/ruta1/acceso/aula_virtual/WhiteBoard.js
import React, { useRef, useEffect, useState } from "react";
import "./WhiteBoard.css";

const WhiteBoard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pen");       // pen | eraser | text
  const [color, setColor] = useState("#0ea5e9");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [text, setText] = useState("");

  // Ajusta el tamaño del canvas con DPR para nitidez
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.parentElement.clientWidth;
    const cssHeight = Math.max(320, Math.round(cssWidth * 0.6));
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = lineWidth;
  }, [color, lineWidth]);

  const start = (e) => {
    if (tool === "text") return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing || tool === "text") return;
    const { offsetX, offsetY } = e.nativeEvent;
    if (tool === "pen") {
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
    } else if (tool === "eraser") {
      const size = Math.max(10, lineWidth * 3);
      ctxRef.current.clearRect(offsetX - size / 2, offsetY - size / 2, size, size);
    }
  };
  const end = () => {
    if (tool !== "text") ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const putText = (e) => {
    if (tool !== "text" || !text.trim()) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctxRef.current.fillStyle = color;
    ctxRef.current.font = `${Math.max(14, lineWidth * 6)}px ui-sans-serif, system-ui, Arial`;
    ctxRef.current.fillText(text, x, y);
    setText("");
  };

  const clearAll = () => {
    const c = canvasRef.current;
    ctxRef.current.clearRect(0, 0, c.width, c.height);
  };

  const downloadPNG = () => {
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="wb-container">
      <div className="wb-toolbar">
        <select value={tool} onChange={(e) => setTool(e.target.value)}>
          <option value="pen">✏️ Pluma</option>
          <option value="eraser">🧽 Borrador</option>
          <option value="text">🔤 Texto</option>
        </select>

        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />

        <label className="wb-range">
          <span>Grosor</span>
          <input
            type="range"
            min="1"
            max="16"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
          />
        </label>

        {tool === "text" && (
          <input
            className="wb-textinput"
            type="text"
            placeholder="Escribe y haz click en el lienzo"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        <div className="wb-spacer" />
        <button className="wb-btn" onClick={clearAll}>🧹 Limpiar</button>
        <button className="wb-btn" onClick={downloadPNG}>⬇️ Descargar</button>
      </div>

      <div className="wb-canvaswrap">
        <canvas
          ref={canvasRef}
          className="wb-canvas"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={end}
          onMouseLeave={end}
          onClick={putText}
        />
      </div>
    </div>
  );
};

export default WhiteBoard;
