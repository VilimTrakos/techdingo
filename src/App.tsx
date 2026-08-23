import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageFallback } from './components/PageFallback';
import { HomePage } from './pages/HomePage';

// Početna je jedina stranica koja se učitava odmah - ona je odredište svakog
// prvog posjeta, pa bi lazy chunk tu značio spinner umjesto sadržaja.
// Sve ostalo ide u zaseban chunk: posjetitelj koji otvori jednu lekciju ne
// treba kod ljestvice, statistike ni oporavka lozinke.
const TopicPage = lazy(() => import('./pages/TopicPage').then((m) => ({ default: m.TopicPage })));
const LessonPage = lazy(() => import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })));
const ScoreStrikePage = lazy(() =>
  import('./pages/ScoreStrikePage').then((m) => ({ default: m.ScoreStrikePage })),
);
const DailyChallengePage = lazy(() =>
  import('./pages/DailyChallengePage').then((m) => ({ default: m.DailyChallengePage })),
);
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })),
);
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((m) => ({ default: m.ReviewPage })));
const PasswordRecoveryPage = lazy(() =>
  import('./pages/PasswordRecoveryPage').then((m) => ({ default: m.PasswordRecoveryPage })),
);
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function App() {
  return (
    <Routes>
      <Route
        element={
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        }
      >
        <Route index element={<HomePage />} />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="topic/:topicId" element={<TopicPage />} />
                <Route path="lesson/:topicId" element={<LessonPage />} />
                <Route path="lesson/:topicId/:unitId" element={<LessonPage />} />
                <Route path="score-strike/:topicId" element={<ScoreStrikePage />} />
                <Route path="daily" element={<DailyChallengePage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="review" element={<ReviewPage />} />
                <Route path="auth/recovery" element={<PasswordRecoveryPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
