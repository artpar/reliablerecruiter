import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface Feedback {
    id: string;
    candidateName: string;
    date: string;
    stage: string;
    overallRating: number;
    communicationRating: number;
    timelinessRating: number;
    interviewerRating: number;
    processRating: number;
    wouldRecommend: boolean;
    positives: string;
    improvements: string;
    sentiment: 'positive' | 'neutral' | 'negative';
}

interface AnalysisResult {
    overallScore: number;
    categoryScores: { category: string; score: number }[];
    sentimentDistribution: { name: string; value: number }[];
    stageScores: { stage: string; score: number; count: number }[];
    trendData: { date: string; score: number }[];
    commonThemes: { theme: string; count: number; sentiment: 'positive' | 'negative' }[];
    nps: number;
    recommendations: string[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const STAGE_OPTIONS = [
    { value: 'application', label: 'Application' },
    { value: 'phone-screen', label: 'Phone Screen' },
    { value: 'technical', label: 'Technical Interview' },
    { value: 'onsite', label: 'Onsite/Virtual Onsite' },
    { value: 'offer', label: 'Offer Stage' },
    { value: 'rejection', label: 'Post-Rejection' },
];

const CandidateExperiencePulse: React.FC = () => {
    const { showToast } = useToast();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    const [newFeedback, setNewFeedback] = useState({
        candidateName: '',
        date: new Date().toISOString().split('T')[0],
        stage: '',
        overallRating: 3,
        communicationRating: 3,
        timelinessRating: 3,
        interviewerRating: 3,
        processRating: 3,
        wouldRecommend: true,
        positives: '',
        improvements: '',
    });

    const calculateSentiment = (ratings: number[], wouldRecommend: boolean): 'positive' | 'neutral' | 'negative' => {
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        if (avgRating >= 4 && wouldRecommend) return 'positive';
        if (avgRating <= 2 || !wouldRecommend) return 'negative';
        return 'neutral';
    };

    const handleAddFeedback = () => {
        if (!newFeedback.candidateName || !newFeedback.stage) {
            showToast('Please fill in required fields', 'warning');
            return;
        }

        const ratings = [
            newFeedback.overallRating,
            newFeedback.communicationRating,
            newFeedback.timelinessRating,
            newFeedback.interviewerRating,
            newFeedback.processRating
        ];

        const feedback: Feedback = {
            id: `fb-${Date.now()}`,
            candidateName: newFeedback.candidateName,
            date: newFeedback.date,
            stage: newFeedback.stage,
            overallRating: newFeedback.overallRating,
            communicationRating: newFeedback.communicationRating,
            timelinessRating: newFeedback.timelinessRating,
            interviewerRating: newFeedback.interviewerRating,
            processRating: newFeedback.processRating,
            wouldRecommend: newFeedback.wouldRecommend,
            positives: newFeedback.positives,
            improvements: newFeedback.improvements,
            sentiment: calculateSentiment(ratings, newFeedback.wouldRecommend),
        };

        setFeedbacks([...feedbacks, feedback]);
        setNewFeedback({
            candidateName: '',
            date: new Date().toISOString().split('T')[0],
            stage: '',
            overallRating: 3,
            communicationRating: 3,
            timelinessRating: 3,
            interviewerRating: 3,
            processRating: 3,
            wouldRecommend: true,
            positives: '',
            improvements: '',
        });
        showToast('Feedback added', 'success');
    };

    const loadSampleData = () => {
        const sampleFeedbacks: Feedback[] = [
            { id: '1', candidateName: 'Alex Johnson', date: '2024-01-15', stage: 'technical', overallRating: 5, communicationRating: 5, timelinessRating: 4, interviewerRating: 5, processRating: 4, wouldRecommend: true, positives: 'Great interviewers, clear expectations', improvements: 'Could share more about team culture', sentiment: 'positive' },
            { id: '2', candidateName: 'Sam Wilson', date: '2024-01-16', stage: 'phone-screen', overallRating: 4, communicationRating: 4, timelinessRating: 5, interviewerRating: 4, processRating: 4, wouldRecommend: true, positives: 'Quick response time', improvements: 'More details about role upfront', sentiment: 'positive' },
            { id: '3', candidateName: 'Jordan Lee', date: '2024-01-17', stage: 'onsite', overallRating: 2, communicationRating: 2, timelinessRating: 1, interviewerRating: 3, processRating: 2, wouldRecommend: false, positives: 'Office was nice', improvements: 'Waited 30 mins for interviewer, no follow-up for 2 weeks', sentiment: 'negative' },
            { id: '4', candidateName: 'Casey Brown', date: '2024-01-18', stage: 'offer', overallRating: 5, communicationRating: 5, timelinessRating: 5, interviewerRating: 5, processRating: 5, wouldRecommend: true, positives: 'Excellent communication throughout, transparent about compensation', improvements: 'Nothing major', sentiment: 'positive' },
            { id: '5', candidateName: 'Riley Chen', date: '2024-01-19', stage: 'rejection', overallRating: 3, communicationRating: 4, timelinessRating: 3, interviewerRating: 3, processRating: 3, wouldRecommend: true, positives: 'Appreciated the detailed feedback', improvements: 'Would have liked feedback sooner', sentiment: 'neutral' },
            { id: '6', candidateName: 'Morgan Taylor', date: '2024-01-20', stage: 'technical', overallRating: 4, communicationRating: 3, timelinessRating: 4, interviewerRating: 5, processRating: 4, wouldRecommend: true, positives: 'Technical questions were relevant and fair', improvements: 'Better coordination between interviewers', sentiment: 'positive' },
            { id: '7', candidateName: 'Drew Martinez', date: '2024-01-21', stage: 'application', overallRating: 2, communicationRating: 1, timelinessRating: 2, interviewerRating: 3, processRating: 2, wouldRecommend: false, positives: 'Easy to apply', improvements: 'No acknowledgment for 3 weeks, generic rejection', sentiment: 'negative' },
            { id: '8', candidateName: 'Jamie Park', date: '2024-01-22', stage: 'phone-screen', overallRating: 4, communicationRating: 5, timelinessRating: 4, interviewerRating: 4, processRating: 4, wouldRecommend: true, positives: 'Recruiter was very helpful and responsive', improvements: 'Call started 5 mins late', sentiment: 'positive' },
            { id: '9', candidateName: 'Quinn Davis', date: '2024-01-23', stage: 'onsite', overallRating: 3, communicationRating: 3, timelinessRating: 3, interviewerRating: 4, processRating: 3, wouldRecommend: true, positives: 'Good technical discussion', improvements: 'Felt rushed, schedule was very tight', sentiment: 'neutral' },
            { id: '10', candidateName: 'Avery Smith', date: '2024-01-24', stage: 'technical', overallRating: 1, communicationRating: 2, timelinessRating: 1, interviewerRating: 2, processRating: 1, wouldRecommend: false, positives: 'None', improvements: 'Interviewer was 15 mins late and unprepared, asked irrelevant questions', sentiment: 'negative' },
        ];
        setFeedbacks(sampleFeedbacks);
        showToast('Sample data loaded', 'info');
    };

    const analyzeFeedback = () => {
        if (feedbacks.length === 0) {
            showToast('Please add feedback first', 'warning');
            return;
        }

        // Overall score
        const overallScore = Math.round(
            feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length * 20
        );

        // Category scores
        const categoryScores = [
            { category: 'Communication', score: Math.round(feedbacks.reduce((sum, f) => sum + f.communicationRating, 0) / feedbacks.length * 20) },
            { category: 'Timeliness', score: Math.round(feedbacks.reduce((sum, f) => sum + f.timelinessRating, 0) / feedbacks.length * 20) },
            { category: 'Interviewers', score: Math.round(feedbacks.reduce((sum, f) => sum + f.interviewerRating, 0) / feedbacks.length * 20) },
            { category: 'Process', score: Math.round(feedbacks.reduce((sum, f) => sum + f.processRating, 0) / feedbacks.length * 20) },
        ];

        // Sentiment distribution
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        feedbacks.forEach(f => sentimentCounts[f.sentiment]++);
        const sentimentDistribution = [
            { name: 'Positive', value: sentimentCounts.positive },
            { name: 'Neutral', value: sentimentCounts.neutral },
            { name: 'Negative', value: sentimentCounts.negative },
        ];

        // Stage scores
        const stageData: Record<string, { total: number; count: number }> = {};
        feedbacks.forEach(f => {
            if (!stageData[f.stage]) {
                stageData[f.stage] = { total: 0, count: 0 };
            }
            stageData[f.stage].total += f.overallRating;
            stageData[f.stage].count++;
        });
        const stageScores = Object.entries(stageData).map(([stage, data]) => ({
            stage: STAGE_OPTIONS.find(s => s.value === stage)?.label || stage,
            score: Math.round((data.total / data.count) * 20),
            count: data.count,
        }));

        // Trend data (by date)
        const dateScores: Record<string, { total: number; count: number }> = {};
        feedbacks.forEach(f => {
            if (!dateScores[f.date]) {
                dateScores[f.date] = { total: 0, count: 0 };
            }
            dateScores[f.date].total += f.overallRating;
            dateScores[f.date].count++;
        });
        const trendData = Object.entries(dateScores)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({
                date: date.slice(5), // MM-DD format
                score: Math.round((data.total / data.count) * 20),
            }));

        // Common themes from text analysis
        const positiveKeywords: Record<string, number> = {};
        const negativeKeywords: Record<string, number> = {};

        const positiveTerms = ['quick', 'responsive', 'clear', 'helpful', 'transparent', 'fair', 'professional', 'friendly', 'organized'];
        const negativeTerms = ['late', 'slow', 'waiting', 'unclear', 'unprepared', 'rude', 'confusing', 'no response', 'generic'];

        feedbacks.forEach(f => {
            const positiveText = f.positives.toLowerCase();
            const improvementText = f.improvements.toLowerCase();

            positiveTerms.forEach(term => {
                if (positiveText.includes(term)) {
                    positiveKeywords[term] = (positiveKeywords[term] || 0) + 1;
                }
            });

            negativeTerms.forEach(term => {
                if (improvementText.includes(term)) {
                    negativeKeywords[term] = (negativeKeywords[term] || 0) + 1;
                }
            });
        });

        const commonThemes: { theme: string; count: number; sentiment: 'positive' | 'negative' }[] = [
            ...Object.entries(positiveKeywords).map(([theme, count]) => ({ theme, count, sentiment: 'positive' as const })),
            ...Object.entries(negativeKeywords).map(([theme, count]) => ({ theme, count, sentiment: 'negative' as const })),
        ].sort((a, b) => b.count - a.count).slice(0, 8);

        // NPS calculation
        const promoters = feedbacks.filter(f => f.overallRating >= 4 && f.wouldRecommend).length;
        const detractors = feedbacks.filter(f => f.overallRating <= 2 || !f.wouldRecommend).length;
        const nps = Math.round(((promoters - detractors) / feedbacks.length) * 100);

        // Recommendations
        const recommendations: string[] = [];

        // Find lowest category
        const lowestCategory = categoryScores.reduce((min, cat) => cat.score < min.score ? cat : min);
        if (lowestCategory.score < 60) {
            recommendations.push(`Focus on improving ${lowestCategory.category.toLowerCase()} - currently scoring ${lowestCategory.score}/100`);
        }

        // Check stage-specific issues
        const lowestStage = stageScores.reduce((min, stage) => stage.score < min.score ? stage : min);
        if (lowestStage.score < 60) {
            recommendations.push(`${lowestStage.stage} stage needs attention with score of ${lowestStage.score}/100`);
        }

        // Communication specific
        if (categoryScores.find(c => c.category === 'Communication')!.score < 70) {
            recommendations.push('Consider implementing automated status updates to improve communication');
        }

        // Timeliness specific
        if (categoryScores.find(c => c.category === 'Timeliness')!.score < 70) {
            recommendations.push('Set SLAs for response times at each stage and track adherence');
        }

        // Based on negative themes
        if (negativeKeywords['late'] || negativeKeywords['waiting']) {
            recommendations.push('Address punctuality issues - multiple candidates reported delays');
        }

        if (sentimentCounts.negative > feedbacks.length * 0.3) {
            recommendations.push('Over 30% negative sentiment - consider urgent process review');
        }

        if (nps < 0) {
            recommendations.push('Negative NPS indicates more detractors than promoters - immediate action needed');
        }

        if (recommendations.length === 0) {
            recommendations.push('Candidate experience is generally positive. Continue monitoring for trends.');
        }

        setAnalysis({
            overallScore,
            categoryScores,
            sentimentDistribution,
            stageScores,
            trendData,
            commonThemes,
            nps,
            recommendations,
        });

        showToast('Analysis complete', 'success');
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Candidate Experience Pulse</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Aggregate and analyze candidate feedback to identify pain points in the hiring process.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Feedback Form */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Add Feedback</h2>
                        <Button variant="outline" size="sm" onClick={loadSampleData}>
                            Load Sample
                        </Button>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Candidate Name *"
                                value={newFeedback.candidateName}
                                onChange={(e) => setNewFeedback({ ...newFeedback, candidateName: e.target.value })}
                                placeholder="Name"
                            />
                            <Input
                                label="Date"
                                type="date"
                                value={newFeedback.date}
                                onChange={(e) => setNewFeedback({ ...newFeedback, date: e.target.value })}
                            />
                        </div>
                        <Select
                            label="Interview Stage *"
                            value={newFeedback.stage}
                            onChange={(e) => setNewFeedback({ ...newFeedback, stage: e.target.value })}
                            options={[{ value: '', label: 'Select stage' }, ...STAGE_OPTIONS]}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Overall (1-5)"
                                type="number"
                                value={newFeedback.overallRating.toString()}
                                onChange={(e) => setNewFeedback({ ...newFeedback, overallRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                            />
                            <Input
                                label="Communication (1-5)"
                                type="number"
                                value={newFeedback.communicationRating.toString()}
                                onChange={(e) => setNewFeedback({ ...newFeedback, communicationRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                            />
                            <Input
                                label="Timeliness (1-5)"
                                type="number"
                                value={newFeedback.timelinessRating.toString()}
                                onChange={(e) => setNewFeedback({ ...newFeedback, timelinessRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                            />
                            <Input
                                label="Interviewer (1-5)"
                                type="number"
                                value={newFeedback.interviewerRating.toString()}
                                onChange={(e) => setNewFeedback({ ...newFeedback, interviewerRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                            />
                            <Input
                                label="Process (1-5)"
                                type="number"
                                value={newFeedback.processRating.toString()}
                                onChange={(e) => setNewFeedback({ ...newFeedback, processRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                            />
                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="wouldRecommend"
                                    checked={newFeedback.wouldRecommend}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, wouldRecommend: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="wouldRecommend" className="text-sm text-neutral-700 dark:text-neutral-300">
                                    Would Recommend
                                </label>
                            </div>
                        </div>

                        <TextArea
                            label="What went well?"
                            value={newFeedback.positives}
                            onChange={(e) => setNewFeedback({ ...newFeedback, positives: e.target.value })}
                            placeholder="Positive aspects of the experience..."
                            rows={2}
                        />
                        <TextArea
                            label="Areas for improvement"
                            value={newFeedback.improvements}
                            onChange={(e) => setNewFeedback({ ...newFeedback, improvements: e.target.value })}
                            placeholder="What could be better..."
                            rows={2}
                        />

                        <Button variant="primary" onClick={handleAddFeedback} className="w-full">
                            Add Feedback
                        </Button>
                    </div>
                </Card>

                {/* Feedback List & Actions */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                            Collected Feedback ({feedbacks.length})
                        </h2>
                        <Button variant="primary" onClick={analyzeFeedback} disabled={feedbacks.length === 0}>
                            Analyze
                        </Button>
                    </div>

                    {feedbacks.length === 0 ? (
                        <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                            No feedback collected yet. Add feedback or load sample data.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[450px] overflow-y-auto">
                            {feedbacks.map(feedback => (
                                <div
                                    key={feedback.id}
                                    className={`p-3 rounded-lg border ${
                                        feedback.sentiment === 'positive' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                        feedback.sentiment === 'negative' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                        'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-neutral-800 dark:text-neutral-100">{feedback.candidateName}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {STAGE_OPTIONS.find(s => s.value === feedback.stage)?.label} • {feedback.date}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-bold ${
                                                feedback.overallRating >= 4 ? 'text-green-600' :
                                                feedback.overallRating <= 2 ? 'text-red-600' : 'text-yellow-600'
                                            }`}>
                                                {feedback.overallRating}/5
                                            </span>
                                        </div>
                                    </div>
                                    {(feedback.positives || feedback.improvements) && (
                                        <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                                            {feedback.positives && <p>+ {feedback.positives.substring(0, 50)}...</p>}
                                            {feedback.improvements && <p>- {feedback.improvements.substring(0, 50)}...</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="mt-6 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Overall Score</h3>
                            <p className={`text-4xl font-bold ${
                                analysis.overallScore >= 70 ? 'text-green-600' :
                                analysis.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {analysis.overallScore}/100
                            </p>
                        </Card>
                        <Card>
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">NPS Score</h3>
                            <p className={`text-4xl font-bold ${
                                analysis.nps >= 50 ? 'text-green-600' :
                                analysis.nps >= 0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {analysis.nps > 0 ? '+' : ''}{analysis.nps}
                            </p>
                        </Card>
                        <Card>
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Responses</h3>
                            <p className="text-4xl font-bold text-neutral-800 dark:text-neutral-100">
                                {feedbacks.length}
                            </p>
                        </Card>
                    </div>

                    {/* Recommendations */}
                    <Card>
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Recommendations</h2>
                        <ul className="space-y-2">
                            {analysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                        rec.includes('positive') || rec.includes('Continue') ? 'bg-green-500' :
                                        rec.includes('urgent') || rec.includes('immediate') ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} />
                                    <span className="text-neutral-700 dark:text-neutral-300">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Scores */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Category Scores</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analysis.categoryScores}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Bar dataKey="score" fill="#8884d8">
                                        {analysis.categoryScores.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                entry.score >= 70 ? '#10b981' :
                                                entry.score >= 50 ? '#f59e0b' : '#ef4444'
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Sentiment Distribution */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Sentiment Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={analysis.sentimentDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analysis.sentimentDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Trend Over Time */}
                        {analysis.trendData.length > 1 && (
                            <Card>
                                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Score Trend</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={analysis.trendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card>
                        )}

                        {/* Stage Scores */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Scores by Stage</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analysis.stageScores}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Bar dataKey="score" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    {/* Common Themes */}
                    {analysis.commonThemes.length > 0 && (
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Common Themes</h3>
                            <div className="flex flex-wrap gap-2">
                                {analysis.commonThemes.map((theme, index) => (
                                    <span
                                        key={index}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            theme.sentiment === 'positive'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        }`}
                                    >
                                        {theme.theme} ({theme.count})
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default CandidateExperiencePulse;
