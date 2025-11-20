import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PanelMember {
    id: string;
    name: string;
    role: string;
    department: string;
    gender: string;
    ethnicity: string;
    yearsExperience: number;
}

interface DiversityMetrics {
    genderDistribution: { name: string; value: number }[];
    ethnicityDistribution: { name: string; value: number }[];
    departmentDistribution: { name: string; value: number }[];
    experienceDistribution: { name: string; value: number }[];
    diversityScore: number;
    suggestions: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c43'];

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-Binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const ETHNICITY_OPTIONS = [
    { value: 'asian', label: 'Asian' },
    { value: 'black', label: 'Black/African American' },
    { value: 'hispanic', label: 'Hispanic/Latino' },
    { value: 'white', label: 'White/Caucasian' },
    { value: 'middle-eastern', label: 'Middle Eastern' },
    { value: 'native-american', label: 'Native American' },
    { value: 'pacific-islander', label: 'Pacific Islander' },
    { value: 'multiracial', label: 'Multiracial' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const DEPARTMENT_OPTIONS = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'product', label: 'Product' },
    { value: 'design', label: 'Design' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
    { value: 'legal', label: 'Legal' },
    { value: 'other', label: 'Other' },
];

const DiversePanelPlanner: React.FC = () => {
    const { showToast } = useToast();
    const [panelMembers, setPanelMembers] = useState<PanelMember[]>([]);
    const [metrics, setMetrics] = useState<DiversityMetrics | null>(null);

    // Form state for adding new member
    const [newMember, setNewMember] = useState<Omit<PanelMember, 'id'>>({
        name: '',
        role: '',
        department: '',
        gender: '',
        ethnicity: '',
        yearsExperience: 0,
    });

    const handleAddMember = () => {
        if (!newMember.name || !newMember.role || !newMember.department || !newMember.gender || !newMember.ethnicity) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        const member: PanelMember = {
            ...newMember,
            id: `member-${Date.now()}`,
        };

        setPanelMembers([...panelMembers, member]);
        setNewMember({
            name: '',
            role: '',
            department: '',
            gender: '',
            ethnicity: '',
            yearsExperience: 0,
        });
        showToast('Panel member added', 'success');
    };

    const handleRemoveMember = (id: string) => {
        setPanelMembers(panelMembers.filter(m => m.id !== id));
        showToast('Panel member removed', 'info');
    };

    const calculateDistribution = (items: string[]): { name: string; value: number }[] => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
            value
        }));
    };

    const analyzePanel = () => {
        if (panelMembers.length < 2) {
            showToast('Please add at least 2 panel members to analyze', 'warning');
            return;
        }

        const genderDistribution = calculateDistribution(panelMembers.map(m => m.gender));
        const ethnicityDistribution = calculateDistribution(panelMembers.map(m => m.ethnicity));
        const departmentDistribution = calculateDistribution(panelMembers.map(m => m.department));

        // Experience distribution by ranges
        const experienceRanges = panelMembers.map(m => {
            if (m.yearsExperience < 2) return '0-2 years';
            if (m.yearsExperience < 5) return '2-5 years';
            if (m.yearsExperience < 10) return '5-10 years';
            return '10+ years';
        });
        const experienceDistribution = calculateDistribution(experienceRanges);

        // Calculate diversity score (0-100)
        const calculateDiversityIndex = (distribution: { name: string; value: number }[]) => {
            const total = distribution.reduce((sum, d) => sum + d.value, 0);
            if (total === 0) return 0;
            // Shannon diversity index normalized to 0-100
            const entropy = distribution.reduce((sum, d) => {
                const p = d.value / total;
                return p > 0 ? sum - (p * Math.log2(p)) : sum;
            }, 0);
            const maxEntropy = Math.log2(distribution.length || 1);
            return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
        };

        const genderDiversity = calculateDiversityIndex(genderDistribution);
        const ethnicityDiversity = calculateDiversityIndex(ethnicityDistribution);
        const departmentDiversity = calculateDiversityIndex(departmentDistribution);
        const experienceDiversity = calculateDiversityIndex(experienceDistribution);

        const diversityScore = Math.round((genderDiversity + ethnicityDiversity + departmentDiversity + experienceDiversity) / 4);

        // Generate suggestions
        const suggestions: string[] = [];

        // Gender balance check
        const genderCounts = genderDistribution.reduce((acc, g) => {
            acc[g.name.toLowerCase()] = g.value;
            return acc;
        }, {} as Record<string, number>);

        const totalMembers = panelMembers.length;
        const dominantGender = genderDistribution.reduce((max, g) => g.value > max.value ? g : max, { name: '', value: 0 });
        if (dominantGender.value / totalMembers > 0.7) {
            suggestions.push(`Consider adding more gender diversity. ${dominantGender.name} represents ${Math.round(dominantGender.value / totalMembers * 100)}% of the panel.`);
        }

        // Ethnicity diversity check
        if (ethnicityDistribution.length < 3 && totalMembers >= 4) {
            suggestions.push('Consider adding members from more diverse ethnic backgrounds to improve representation.');
        }

        // Department diversity check
        if (departmentDistribution.length === 1) {
            suggestions.push('All panel members are from the same department. Consider adding cross-functional perspectives.');
        }

        // Experience diversity check
        const hasJunior = panelMembers.some(m => m.yearsExperience < 3);
        const hasSenior = panelMembers.some(m => m.yearsExperience >= 10);
        if (!hasJunior && totalMembers >= 3) {
            suggestions.push('Consider adding a panel member with less than 3 years of experience for fresh perspectives.');
        }
        if (!hasSenior && totalMembers >= 3) {
            suggestions.push('Consider adding a panel member with 10+ years of experience for seasoned insights.');
        }

        if (suggestions.length === 0) {
            suggestions.push('Great job! Your panel shows good diversity across multiple dimensions.');
        }

        setMetrics({
            genderDistribution,
            ethnicityDistribution,
            departmentDistribution,
            experienceDistribution,
            diversityScore,
            suggestions,
        });

        showToast('Panel analysis complete', 'success');
    };

    const loadSampleData = () => {
        const sampleMembers: PanelMember[] = [
            { id: '1', name: 'Sarah Chen', role: 'Engineering Manager', department: 'engineering', gender: 'female', ethnicity: 'asian', yearsExperience: 8 },
            { id: '2', name: 'Marcus Johnson', role: 'Senior Developer', department: 'engineering', gender: 'male', ethnicity: 'black', yearsExperience: 6 },
            { id: '3', name: 'Emily Rodriguez', role: 'Product Manager', department: 'product', gender: 'female', ethnicity: 'hispanic', yearsExperience: 5 },
            { id: '4', name: 'James Wilson', role: 'Tech Lead', department: 'engineering', gender: 'male', ethnicity: 'white', yearsExperience: 12 },
            { id: '5', name: 'Priya Patel', role: 'UX Designer', department: 'design', gender: 'female', ethnicity: 'asian', yearsExperience: 4 },
        ];
        setPanelMembers(sampleMembers);
        showToast('Sample data loaded', 'info');
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Diverse Panel Planner</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Visualize and balance demographic representation in interview panels to ensure fair and inclusive hiring.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Panel Member Form */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Add Panel Member</h2>
                    <div className="space-y-4">
                        <Input
                            label="Name"
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            placeholder="Enter member name"
                        />
                        <Input
                            label="Role"
                            value={newMember.role}
                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                            placeholder="e.g., Engineering Manager"
                        />
                        <Select
                            label="Department"
                            value={newMember.department}
                            onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                            options={DEPARTMENT_OPTIONS}
                        />
                        <Select
                            label="Gender"
                            value={newMember.gender}
                            onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                            options={GENDER_OPTIONS}
                        />
                        <Select
                            label="Ethnicity"
                            value={newMember.ethnicity}
                            onChange={(e) => setNewMember({ ...newMember, ethnicity: e.target.value })}
                            options={ETHNICITY_OPTIONS}
                        />
                        <Input
                            label="Years of Experience"
                            type="number"
                            value={newMember.yearsExperience.toString()}
                            onChange={(e) => setNewMember({ ...newMember, yearsExperience: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                        />
                        <div className="flex gap-2">
                            <Button variant="primary" onClick={handleAddMember}>
                                Add Member
                            </Button>
                            <Button variant="outline" onClick={loadSampleData}>
                                Load Sample Data
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Current Panel Members */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                            Panel Members ({panelMembers.length})
                        </h2>
                        <Button
                            variant="primary"
                            onClick={analyzePanel}
                            disabled={panelMembers.length < 2}
                        >
                            Analyze Panel
                        </Button>
                    </div>

                    {panelMembers.length === 0 ? (
                        <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                            No panel members added yet. Add members or load sample data to get started.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {panelMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-neutral-800 dark:text-neutral-100">{member.name}</p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {member.role} • {member.department} • {member.yearsExperience} yrs
                                        </p>
                                    </div>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleRemoveMember(member.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Analysis Results */}
            {metrics && (
                <div className="mt-6 space-y-6">
                    {/* Diversity Score */}
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Diversity Score</h2>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Based on gender, ethnicity, department, and experience diversity
                                </p>
                            </div>
                            <div className={`text-4xl font-bold ${
                                metrics.diversityScore >= 70 ? 'text-green-600' :
                                metrics.diversityScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {metrics.diversityScore}/100
                            </div>
                        </div>
                    </Card>

                    {/* Suggestions */}
                    <Card>
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Recommendations</h2>
                        <ul className="space-y-2">
                            {metrics.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                        suggestion.includes('Great job') ? 'bg-green-500' : 'bg-yellow-500'
                                    }`} />
                                    <span className="text-neutral-700 dark:text-neutral-300">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gender Distribution */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Gender Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={metrics.genderDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {metrics.genderDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Ethnicity Distribution */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Ethnicity Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={metrics.ethnicityDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {metrics.ethnicityDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Department Distribution */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Department Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={metrics.departmentDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8">
                                        {metrics.departmentDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Experience Distribution */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Experience Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={metrics.experienceDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#82ca9d">
                                        {metrics.experienceDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiversePanelPlanner;
