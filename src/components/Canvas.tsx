import React, { useEffect, useRef, useState } from "react";
import CommentLayer from "./CommentLayer";
import IdentityBadge from "./IdentityBadge";
import { useComments } from "../context/CommentsContext";

const MIN_ZOOM = 1;
const MAX_ZOOM = 200;
const DEFAULT_ZOOM = 100;

const SENSITIVITY = 0.5;
const SMOOTHING_FACTOR = 0.12;

type PanPoint = { x: number; y: number };

export default function ZoomableCanvas() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState<PanPoint>({ x: 0, y: 0 });

  const targetZoom = useRef(DEFAULT_ZOOM);
  const currentZoom = useRef(DEFAULT_ZOOM);

  const targetPan = useRef<PanPoint>({ x: 0, y: 0 });
  const currentPan = useRef<PanPoint>({ x: 0, y: 0 });

  const animationFrame = useRef<number | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { draft, startDraft, cancelDraft } = useComments();

  const animateZoom = () => {
    const zoomDifference = targetZoom.current - currentZoom.current;
    const panDifference = {
      x: targetPan.current.x - currentPan.current.x,
      y: targetPan.current.y - currentPan.current.y,
    };

    if (
      Math.abs(zoomDifference) < 0.1 &&
      Math.abs(panDifference.x) < 0.1 &&
      Math.abs(panDifference.y) < 0.1
    ) {
      currentZoom.current = targetZoom.current;
      currentPan.current = targetPan.current;
      setZoom(targetZoom.current);
      setPan(targetPan.current);
      animationFrame.current = null;
      return;
    }

    const nextZoom = currentZoom.current + zoomDifference * SMOOTHING_FACTOR;
    const nextPan = {
      x: currentPan.current.x + panDifference.x * SMOOTHING_FACTOR,
      y: currentPan.current.y + panDifference.y * SMOOTHING_FACTOR,
    };

    currentZoom.current = nextZoom;
    currentPan.current = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
    animationFrame.current = requestAnimationFrame(animateZoom);
  };

  const zoomTo = (value: number, anchor?: PanPoint) => {
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

    if (anchor) {
      const currentScale = currentZoom.current / 100;
      const contentPoint = {
        x: (anchor.x - currentPan.current.x) / currentScale,
        y: (anchor.y - currentPan.current.y) / currentScale,
      };
      const nextScale = nextZoom / 100;

      targetPan.current = {
        x: anchor.x - contentPoint.x * nextScale,
        y: anchor.y - contentPoint.y * nextScale,
      };
    }

    targetZoom.current = nextZoom;

    if (!animationFrame.current) {
      // starts animating the zoom - runs animateZoom before next frame/browser repaint
      animationFrame.current = requestAnimationFrame(animateZoom);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    // relace any existing draft
    if (draft) {
      cancelDraft();
      return;
    }

    const scale = zoom / 100;
    const bounds = canvas.getBoundingClientRect();

    startDraft({
      x: (e.clientX - bounds.left) / scale,
      y: (e.clientY - bounds.top) / scale,
    });
  };

  useEffect(() => {
    const element = canvasContainerRef.current;

    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      // if (!e.ctrlKey && !e.metaKey) {
      //   return;
      // }

      // prevent the browser's native zoom
      e.preventDefault();

      const delta = -e.deltaY * SENSITIVITY;
      const bounds = element.getBoundingClientRect();
      zoomTo(targetZoom.current + delta, {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
    };

    // listens to mouse wheel or trackpad scrolls
    element.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    // cleanup: runs on unmount and on effect change
    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    // unmount cleanup
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-auto bg-gray-100 touch-none"
      data-testid="canvas-container"
      ref={canvasContainerRef}
    >
      {/* Zoom controls */}
      <div className="absolute bottom-12 right-12 z-10 flex items-center gap-4 w-fit p-4 rounded-sm bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <button
          disabled={zoom <= MIN_ZOOM}
          onClick={() => zoomTo(targetZoom.current - 10)}
          type="button"
        >
          −
        </button>

        <input
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          onChange={(e) => zoomTo(Number(e.target.value))}
          type="range"
          value={zoom}
        />

        <button
          disabled={zoom >= MAX_ZOOM}
          onClick={() => zoomTo(targetZoom.current + 10)}
          type="button"
        >
          +
        </button>

        <span className="min-w-[55px] text-center font-mono">
          {Math.round(zoom)}%
        </span>

        <button onClick={() => zoomTo(DEFAULT_ZOOM)} type="button">
          Reset
        </button>
      </div>

      {/* Identity badge */}
      <div className="absolute top-12 right-12 z-10 w-fit p-4 rounded-sm bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <IdentityBadge />
      </div>

      {/* Canvas */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-white origin-top-left will-change-transform border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
        data-testid="canvas"
        onClick={handleCanvasClick}
        ref={canvasRef}
        style={{
          transform: `
            translate(${pan.x}px, ${pan.y}px)
            scale(${zoom / 100})
          `,
        }}
      >
        {/* not needed for only the images */}
        {/* <canvas
          className="block w-full h-full bg-white"
          width={800}
          height={500}
        /> */}
        <img src="public/images/lama.jpg" alt="Lama" width={360} height={270} />

        <img src="public/images/lama.jpg" alt="Lama" width={768} height={432} />

        <CommentLayer scale={zoom / 100} />
      </div>
    </div>
  );
}
