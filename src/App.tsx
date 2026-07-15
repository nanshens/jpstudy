import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/pages/Home';
import { KanaPage } from '@/pages/KanaPage';
import { ScenariosPage } from '@/pages/ScenariosPage';
import { ScenarioPage } from '@/pages/ScenarioPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/kana" element={<KanaPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/scenarios/:id" element={<ScenarioPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
