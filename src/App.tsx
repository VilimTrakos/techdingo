import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DailyChallengePage } from './pages/DailyChallengePage';
import { ScoreStrikePage } from './pages/ScoreStrikePage';
import { StatsPage } from './pages/StatsPage';
import { TopicPage } from './pages/TopicPage';

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="topic/:topicId" element={<TopicPage />} />
        <Route path="lesson/:topicId" element={<LessonPage />} />
        <Route path="lesson/:topicId/:unitId" element={<LessonPage />} />
        <Route path="score-strike/:topicId" element={<ScoreStrikePage />} />
        <Route path="daily" element={<DailyChallengePage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
