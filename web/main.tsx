import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../slides/ai-video-planner';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const useCanvasScale = () => {
  const [scale, setScale] = useState(() => Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT));

  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
};

const StandaloneShell = () => {
  const scale = useCanvasScale();

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        background: '#eef4ff',
      }}
    >
      <div
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          borderRadius: scale < 0.99 ? 18 : 0,
          overflow: 'hidden',
          boxShadow: scale < 0.99 ? '0 24px 80px rgba(16, 42, 86, 0.18)' : 'none',
        }}
      >
        <App />
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneShell />);
