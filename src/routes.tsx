import {lazy, Suspense} from 'react';
import {Route, Routes} from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoadingPage from './pages/LoadingPage';

// Lazily load tool pages for code splitting
import JDChecker from './tools/JDChecker';

const ResumeAnonymizer = lazy(() => import('./tools/ResumeAnonymizer'));
const DiversePanelPlanner = lazy(() => import('./tools/DiversePanelPlanner'));
const LayoffImpactAnalyzer = lazy(() => import('./tools/LayoffImpactAnalyzer'));
const BoomerangTalentFinder = lazy(() => import('./tools/BoomerangTalentFinder'));
const AIOutreachPersonalizer = lazy(() => import('./tools/AIOutreachPersonalizer'));
const InterviewLoadBalancer = lazy(() => import('./tools/InterviewLoadBalancer'));
const CandidateExperiencePulse = lazy(() => import('./tools/CandidateExperiencePulse'));
const HybridOfficeDayPlanner = lazy(() => import('./tools/HybridOfficeDayPlanner'));
const OfferComparator = lazy(() => import('./tools/OfferComparator'));
// const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const AppRoutes = () => {
    return (<Routes>
            <Route path="/" element={<Layout/>}>
                <Route index element={<HomePage/>}/>
                <Route path="tools">
                    <Route
                        path="inclusive-jd-checker"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <JDChecker/>
                        </Suspense>}
                    />
                    <Route
                        path="resume-anonymizer"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <ResumeAnonymizer/>
                        </Suspense>}
                    />
                    <Route
                        path="diverse-panel-planner"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <DiversePanelPlanner/>
                        </Suspense>}
                    />
                    <Route
                        path="layoff-impact-analyzer"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <LayoffImpactAnalyzer/>
                        </Suspense>}
                    />
                    <Route
                        path="boomerang-talent-finder"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <BoomerangTalentFinder/>
                        </Suspense>}
                    />
                    <Route
                        path="ai-outreach-personalizer"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <AIOutreachPersonalizer/>
                        </Suspense>}
                    />
                    <Route
                        path="interview-load-balancer"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <InterviewLoadBalancer/>
                        </Suspense>}
                    />
                    <Route
                        path="candidate-experience-pulse"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <CandidateExperiencePulse/>
                        </Suspense>}
                    />
                    <Route
                        path="hybrid-office-day-planner"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <HybridOfficeDayPlanner/>
                        </Suspense>}
                    />
                    <Route
                        path="offer-comparator"
                        element={<Suspense fallback={<LoadingPage/>}>
                            <OfferComparator/>
                        </Suspense>}
                    />
                </Route>
                {/*<Route*/}
                {/*  path="*"*/}
                {/*  element={*/}
                {/*    <Suspense fallback={<LoadingPage />}>*/}
                {/*      <NotFoundPage />*/}
                {/*    </Suspense>*/}
                {/*  }*/}
                {/*/>*/}
            </Route>
        </Routes>);
};

export default AppRoutes;
