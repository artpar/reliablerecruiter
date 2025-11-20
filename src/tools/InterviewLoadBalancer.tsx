import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Interviewer {
    id: string;
    name: string;
    department: string;
    role: string;
    maxHoursPerWeek: number;
    specialties: string[];
}

interface Interview {
    id: string;
    candidateName: string;
    interviewerId: string;
    date: string;
    duration: number; // in minutes
    type: string;
}

interface WorkloadAnalysis {
    interviewerStats: {
        id: string;
        name: string;
        totalHours: number;
        interviewCount: number;
        utilizationPercent: number;
        isOverloaded: boolean;
    }[];
    departmentStats: { name: string; hours: number }[];
    typeDistribution: { name: string; value: number }[];
    recommendations: string[];
    overallUtilization: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DEPARTMENT_OPTIONS = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'product', label: 'Product' },
    { value: 'design', label: 'Design' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'sales', label: 'Sales' },
];

const INTERVIEW_TYPES = [
    { value: 'technical', label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'culture', label: 'Culture Fit' },
    { value: 'system-design', label: 'System Design' },
    { value: 'manager', label: 'Manager Round' },
    { value: 'phone-screen', label: 'Phone Screen' },
];

const InterviewLoadBalancer: React.FC = () => {
    const { showToast } = useToast();
    const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);

    // Form states
    const [newInterviewer, setNewInterviewer] = useState({
        name: '',
        department: '',
        role: '',
        maxHoursPerWeek: 4,
        specialties: '',
    });

    const [newInterview, setNewInterview] = useState({
        candidateName: '',
        interviewerId: '',
        date: '',
        duration: 60,
        type: '',
    });

    const handleAddInterviewer = () => {
        if (!newInterviewer.name || !newInterviewer.department || !newInterviewer.role) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        const interviewer: Interviewer = {
            id: `int-${Date.now()}`,
            name: newInterviewer.name,
            department: newInterviewer.department,
            role: newInterviewer.role,
            maxHoursPerWeek: newInterviewer.maxHoursPerWeek,
            specialties: newInterviewer.specialties.split(',').map(s => s.trim()).filter(s => s),
        };

        setInterviewers([...interviewers, interviewer]);
        setNewInterviewer({
            name: '',
            department: '',
            role: '',
            maxHoursPerWeek: 4,
            specialties: '',
        });
        showToast('Interviewer added', 'success');
    };

    const handleAddInterview = () => {
        if (!newInterview.candidateName || !newInterview.interviewerId || !newInterview.date || !newInterview.type) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        const interview: Interview = {
            id: `interview-${Date.now()}`,
            candidateName: newInterview.candidateName,
            interviewerId: newInterview.interviewerId,
            date: newInterview.date,
            duration: newInterview.duration,
            type: newInterview.type,
        };

        setInterviews([...interviews, interview]);
        setNewInterview({
            candidateName: '',
            interviewerId: '',
            date: '',
            duration: 60,
            type: '',
        });
        showToast('Interview scheduled', 'success');
    };

    const loadSampleData = () => {
        const sampleInterviewers: Interviewer[] = [
            { id: '1', name: 'Alice Chen', department: 'engineering', role: 'Senior Engineer', maxHoursPerWeek: 4, specialties: ['Technical', 'System Design'] },
            { id: '2', name: 'Bob Smith', department: 'engineering', role: 'Tech Lead', maxHoursPerWeek: 3, specialties: ['Technical', 'Behavioral'] },
            { id: '3', name: 'Carol Davis', department: 'product', role: 'Product Manager', maxHoursPerWeek: 5, specialties: ['Behavioral', 'Culture'] },
            { id: '4', name: 'David Lee', department: 'engineering', role: 'Staff Engineer', maxHoursPerWeek: 2, specialties: ['System Design'] },
            { id: '5', name: 'Emma Wilson', department: 'hr', role: 'HR Manager', maxHoursPerWeek: 6, specialties: ['Behavioral', 'Culture'] },
            { id: '6', name: 'Frank Brown', department: 'design', role: 'Design Lead', maxHoursPerWeek: 3, specialties: ['Portfolio Review', 'Culture'] },
        ];

        const today = new Date();
        const sampleInterviews: Interview[] = [
            { id: 'i1', candidateName: 'John Doe', interviewerId: '1', date: new Date(today.getTime() - 86400000).toISOString().split('T')[0], duration: 60, type: 'technical' },
            { id: 'i2', candidateName: 'Jane Roe', interviewerId: '1', date: today.toISOString().split('T')[0], duration: 60, type: 'technical' },
            { id: 'i3', candidateName: 'John Doe', interviewerId: '2', date: today.toISOString().split('T')[0], duration: 45, type: 'behavioral' },
            { id: 'i4', candidateName: 'Mike Johnson', interviewerId: '1', date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], duration: 90, type: 'system-design' },
            { id: 'i5', candidateName: 'Sarah Palmer', interviewerId: '3', date: today.toISOString().split('T')[0], duration: 45, type: 'behavioral' },
            { id: 'i6', candidateName: 'Tom Clark', interviewerId: '4', date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], duration: 90, type: 'system-design' },
            { id: 'i7', candidateName: 'Lisa Wang', interviewerId: '5', date: today.toISOString().split('T')[0], duration: 30, type: 'phone-screen' },
            { id: 'i8', candidateName: 'Chris Evans', interviewerId: '5', date: today.toISOString().split('T')[0], duration: 45, type: 'culture' },
            { id: 'i9', candidateName: 'Amy Taylor', interviewerId: '1', date: new Date(today.getTime() + 172800000).toISOString().split('T')[0], duration: 60, type: 'technical' },
            { id: 'i10', candidateName: 'Ryan Garcia', interviewerId: '2', date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], duration: 60, type: 'technical' },
            { id: 'i11', candidateName: 'Emily Chen', interviewerId: '6', date: today.toISOString().split('T')[0], duration: 60, type: 'culture' },
            { id: 'i12', candidateName: 'Kevin Park', interviewerId: '1', date: new Date(today.getTime() + 259200000).toISOString().split('T')[0], duration: 60, type: 'technical' },
        ];

        setInterviewers(sampleInterviewers);
        setInterviews(sampleInterviews);
        showToast('Sample data loaded', 'info');
    };

    const analyzeWorkload = () => {
        if (interviewers.length === 0) {
            showToast('Please add interviewers first', 'warning');
            return;
        }

        // Calculate hours per interviewer (for current week)
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const interviewerStats = interviewers.map(interviewer => {
            const interviewerInterviews = interviews.filter(i => {
                const interviewDate = new Date(i.date);
                return i.interviewerId === interviewer.id &&
                    interviewDate >= weekStart &&
                    interviewDate < weekEnd;
            });

            const totalMinutes = interviewerInterviews.reduce((sum, i) => sum + i.duration, 0);
            const totalHours = totalMinutes / 60;
            const utilizationPercent = (totalHours / interviewer.maxHoursPerWeek) * 100;

            return {
                id: interviewer.id,
                name: interviewer.name,
                totalHours: Math.round(totalHours * 10) / 10,
                interviewCount: interviewerInterviews.length,
                utilizationPercent: Math.round(utilizationPercent),
                isOverloaded: utilizationPercent > 100,
            };
        });

        // Department statistics
        const deptHours: Record<string, number> = {};
        interviewers.forEach(interviewer => {
            const stats = interviewerStats.find(s => s.id === interviewer.id);
            if (stats) {
                deptHours[interviewer.department] = (deptHours[interviewer.department] || 0) + stats.totalHours;
            }
        });

        const departmentStats = Object.entries(deptHours).map(([name, hours]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            hours: Math.round(hours * 10) / 10,
        }));

        // Interview type distribution
        const typeCounts: Record<string, number> = {};
        interviews.forEach(i => {
            typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
        });

        const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
            name: INTERVIEW_TYPES.find(t => t.value === name)?.label || name,
            value,
        }));

        // Generate recommendations
        const recommendations: string[] = [];

        // Find overloaded interviewers
        const overloaded = interviewerStats.filter(s => s.isOverloaded);
        if (overloaded.length > 0) {
            overloaded.forEach(s => {
                recommendations.push(`${s.name} is at ${s.utilizationPercent}% capacity. Consider reassigning some interviews.`);
            });
        }

        // Find underutilized interviewers
        const underutilized = interviewerStats.filter(s => s.utilizationPercent < 50 && s.utilizationPercent > 0);
        if (underutilized.length > 0 && overloaded.length > 0) {
            const names = underutilized.map(s => s.name).join(', ');
            recommendations.push(`${names} have capacity available. Consider redistributing interviews from overloaded team members.`);
        }

        // Check for unused interviewers
        const unused = interviewerStats.filter(s => s.interviewCount === 0);
        if (unused.length > 0) {
            const names = unused.map(s => s.name).join(', ');
            recommendations.push(`${names} have no interviews scheduled this week.`);
        }

        // Department balance
        const maxDeptHours = Math.max(...departmentStats.map(d => d.hours));
        const minDeptHours = Math.min(...departmentStats.map(d => d.hours));
        if (maxDeptHours > minDeptHours * 3 && minDeptHours > 0) {
            recommendations.push('Interview load is unevenly distributed across departments. Consider cross-training interviewers.');
        }

        // Overall utilization
        const totalCapacity = interviewers.reduce((sum, i) => sum + i.maxHoursPerWeek, 0);
        const totalUsed = interviewerStats.reduce((sum, s) => sum + s.totalHours, 0);
        const overallUtilization = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

        if (overallUtilization > 85) {
            recommendations.push('Overall interview capacity is nearly maxed out. Consider adding more trained interviewers.');
        } else if (overallUtilization < 30 && interviews.length > 0) {
            recommendations.push('Interview capacity is underutilized. Good opportunity to ramp up hiring.');
        }

        if (recommendations.length === 0) {
            recommendations.push('Interview load appears well balanced across the team.');
        }

        setAnalysis({
            interviewerStats,
            departmentStats,
            typeDistribution,
            recommendations,
            overallUtilization,
        });

        showToast('Workload analysis complete', 'success');
    };

    const removeInterview = (id: string) => {
        setInterviews(interviews.filter(i => i.id !== id));
        showToast('Interview removed', 'info');
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Interview Load Balancer</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Visualize and balance interviewer workload distribution to prevent burnout and ensure fair scheduling.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Interviewer */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Add Interviewer</h2>
                    <div className="space-y-3">
                        <Input
                            label="Name *"
                            value={newInterviewer.name}
                            onChange={(e) => setNewInterviewer({ ...newInterviewer, name: e.target.value })}
                            placeholder="Full name"
                        />
                        <Select
                            label="Department *"
                            value={newInterviewer.department}
                            onChange={(e) => setNewInterviewer({ ...newInterviewer, department: e.target.value })}
                            options={DEPARTMENT_OPTIONS}
                        />
                        <Input
                            label="Role *"
                            value={newInterviewer.role}
                            onChange={(e) => setNewInterviewer({ ...newInterviewer, role: e.target.value })}
                            placeholder="Job title"
                        />
                        <Input
                            label="Max Hours/Week"
                            type="number"
                            value={newInterviewer.maxHoursPerWeek.toString()}
                            onChange={(e) => setNewInterviewer({ ...newInterviewer, maxHoursPerWeek: parseInt(e.target.value) || 1 })}
                        />
                        <Input
                            label="Specialties"
                            value={newInterviewer.specialties}
                            onChange={(e) => setNewInterviewer({ ...newInterviewer, specialties: e.target.value })}
                            placeholder="Technical, Behavioral, etc."
                        />
                        <div className="flex gap-2">
                            <Button variant="primary" onClick={handleAddInterviewer} size="sm">
                                Add
                            </Button>
                            <Button variant="outline" onClick={loadSampleData} size="sm">
                                Load Sample
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Schedule Interview */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Schedule Interview</h2>
                    <div className="space-y-3">
                        <Input
                            label="Candidate Name *"
                            value={newInterview.candidateName}
                            onChange={(e) => setNewInterview({ ...newInterview, candidateName: e.target.value })}
                            placeholder="Candidate name"
                        />
                        <Select
                            label="Interviewer *"
                            value={newInterview.interviewerId}
                            onChange={(e) => setNewInterview({ ...newInterview, interviewerId: e.target.value })}
                            options={[
                                { value: '', label: 'Select interviewer' },
                                ...interviewers.map(i => ({ value: i.id, label: i.name }))
                            ]}
                        />
                        <Input
                            label="Date *"
                            type="date"
                            value={newInterview.date}
                            onChange={(e) => setNewInterview({ ...newInterview, date: e.target.value })}
                        />
                        <Input
                            label="Duration (minutes)"
                            type="number"
                            value={newInterview.duration.toString()}
                            onChange={(e) => setNewInterview({ ...newInterview, duration: parseInt(e.target.value) || 30 })}
                        />
                        <Select
                            label="Type *"
                            value={newInterview.type}
                            onChange={(e) => setNewInterview({ ...newInterview, type: e.target.value })}
                            options={[{ value: '', label: 'Select type' }, ...INTERVIEW_TYPES]}
                        />
                        <Button variant="primary" onClick={handleAddInterview} className="w-full">
                            Schedule
                        </Button>
                    </div>
                </Card>

                {/* Quick Stats */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Overview</h2>
                    <div className="space-y-4">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Interviewers</p>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{interviewers.length}</p>
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Interviews</p>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{interviews.length}</p>
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Weekly Capacity</p>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                {interviewers.reduce((sum, i) => sum + i.maxHoursPerWeek, 0)} hrs
                            </p>
                        </div>
                        <Button variant="primary" onClick={analyzeWorkload} className="w-full" disabled={interviewers.length === 0}>
                            Analyze Workload
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Scheduled Interviews List */}
            {interviews.length > 0 && (
                <Card className="mt-6">
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                        Scheduled Interviews ({interviews.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                    <th className="text-left py-2 px-3">Candidate</th>
                                    <th className="text-left py-2 px-3">Interviewer</th>
                                    <th className="text-left py-2 px-3">Date</th>
                                    <th className="text-left py-2 px-3">Duration</th>
                                    <th className="text-left py-2 px-3">Type</th>
                                    <th className="text-left py-2 px-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interviews.slice(0, 10).map(interview => {
                                    const interviewer = interviewers.find(i => i.id === interview.interviewerId);
                                    return (
                                        <tr key={interview.id} className="border-b border-neutral-100 dark:border-neutral-800">
                                            <td className="py-2 px-3">{interview.candidateName}</td>
                                            <td className="py-2 px-3">{interviewer?.name || 'Unknown'}</td>
                                            <td className="py-2 px-3">{interview.date}</td>
                                            <td className="py-2 px-3">{interview.duration} min</td>
                                            <td className="py-2 px-3">{INTERVIEW_TYPES.find(t => t.value === interview.type)?.label}</td>
                                            <td className="py-2 px-3">
                                                <Button variant="danger" size="sm" onClick={() => removeInterview(interview.id)}>
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Analysis Results */}
            {analysis && (
                <div className="mt-6 space-y-6">
                    {/* Overall Utilization */}
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Overall Capacity Utilization</h2>
                                <p className="text-neutral-600 dark:text-neutral-400">This week's interview load vs total capacity</p>
                            </div>
                            <div className={`text-4xl font-bold ${
                                analysis.overallUtilization > 85 ? 'text-red-600' :
                                analysis.overallUtilization > 60 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                                {analysis.overallUtilization}%
                            </div>
                        </div>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Recommendations</h2>
                        <ul className="space-y-2">
                            {analysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                        rec.includes('well balanced') || rec.includes('opportunity') ? 'bg-green-500' :
                                        rec.includes('overloaded') || rec.includes('maxed') ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} />
                                    <span className="text-neutral-700 dark:text-neutral-300">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Interviewer Workload */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Interviewer Workload (This Week)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analysis.interviewerStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="totalHours" fill="#8884d8" name="Hours Scheduled">
                                        {analysis.interviewerStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isOverloaded ? '#ef4444' : '#8884d8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Interview Type Distribution */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Interview Types</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={analysis.typeDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analysis.typeDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    {/* Utilization Table */}
                    <Card>
                        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Interviewer Utilization Details</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                        <th className="text-left py-2 px-3">Interviewer</th>
                                        <th className="text-left py-2 px-3">Interviews</th>
                                        <th className="text-left py-2 px-3">Hours</th>
                                        <th className="text-left py-2 px-3">Utilization</th>
                                        <th className="text-left py-2 px-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.interviewerStats.map(stat => (
                                        <tr key={stat.id} className="border-b border-neutral-100 dark:border-neutral-800">
                                            <td className="py-2 px-3 font-medium">{stat.name}</td>
                                            <td className="py-2 px-3">{stat.interviewCount}</td>
                                            <td className="py-2 px-3">{stat.totalHours} hrs</td>
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                stat.utilizationPercent > 100 ? 'bg-red-500' :
                                                                stat.utilizationPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                            style={{ width: `${Math.min(stat.utilizationPercent, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span>{stat.utilizationPercent}%</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                {stat.isOverloaded ? (
                                                    <span className="text-red-600 font-medium">Overloaded</span>
                                                ) : stat.utilizationPercent === 0 ? (
                                                    <span className="text-neutral-500">Available</span>
                                                ) : (
                                                    <span className="text-green-600">Normal</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default InterviewLoadBalancer;
