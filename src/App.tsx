import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/pages/Home';
import { KanaPage } from '@/pages/KanaPage';
import { ScenariosPage } from '@/pages/ScenariosPage';
import { ScenarioPage } from '@/pages/ScenarioPage';
import { MixedTest } from '@/pages/MixedTest';
import { VerbPage } from '@/pages/verb/VerbPage';
import { VerbBasics } from '@/pages/verb/VerbBasics';
import { VerbForms } from '@/pages/verb/VerbForms';
import { VerbPractice } from '@/pages/verb/VerbPractice';
import { VerbCheatsheet } from '@/pages/verb/VerbCheatsheet';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/kana" element={<KanaPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/scenarios/:id" element={<ScenarioPage />} />
        <Route path="/mixed-test" element={<MixedTest />} />
        <Route path="/verbs" element={<VerbPage />} />
        <Route path="/verbs/basics" element={<VerbBasics />} />
        <Route path="/verbs/forms" element={<VerbForms />} />
        <Route path="/verbs/practice" element={<VerbPractice />} />
        <Route path="/verbs/cheatsheet" element={<VerbCheatsheet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
