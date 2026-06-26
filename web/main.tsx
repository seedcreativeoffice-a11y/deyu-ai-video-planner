import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../slides/ai-video-planner';

const DESKTOP_CANVAS = { width: 1920, height: 1080 };
const MOBILE_CANVAS = { width: 720, height: 1080 };
const MOBILE_BREAKPOINT = 760;

const getViewport = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

const useViewport = () => {
  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    const update = () => setViewport(getViewport());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return viewport;
};

const StandaloneShell = () => {
  const viewport = useViewport();
  const isMobile = viewport.width <= MOBILE_BREAKPOINT;
  const canvas = isMobile ? MOBILE_CANVAS : DESKTOP_CANVAS;
  const scale = useMemo(() => {
    if (isMobile) {
      return Math.min(viewport.width / canvas.width, 1);
    }
    return Math.min(viewport.width / canvas.width, viewport.height / canvas.height, 1);
  }, [canvas.height, canvas.width, isMobile, viewport.height, viewport.width]);

  return (
    <main
      style={{
        minHeight: '100svh',
        width: '100%',
        display: 'grid',
        placeItems: isMobile ? 'start center' : 'center',
        overflow: isMobile ? 'auto' : 'hidden',
        padding: isMobile ? '10px 0 24px' : 0,
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #f7f9fc 0%, #eef4ff 55%, #ffffff 100%)',
      }}
    >
      <div
        style={{
          width: canvas.width * scale,
          height: canvas.height * scale,
        }}
      >
        <div
          style={{
            width: canvas.width,
            height: canvas.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            borderRadius: isMobile || scale < 0.99 ? 18 : 0,
            overflow: 'hidden',
            boxShadow: isMobile || scale < 0.99 ? '0 24px 80px rgba(16, 42, 86, 0.18)' : 'none',
          }}
        >
          <App />
        </div>
      </div>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneShell />);
