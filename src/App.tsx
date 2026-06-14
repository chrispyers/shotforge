import { Sidebar } from './components/Sidebar';
import { CanvasArea } from './components/CanvasArea';
import { ControlPanel } from './components/ControlPanel';

export function App() {
  return (
    <div className="flex h-screen w-screen bg-neutral-900 text-neutral-100 font-sans">
      <Sidebar />
      <CanvasArea />
      <ControlPanel />
    </div>
  );
}
