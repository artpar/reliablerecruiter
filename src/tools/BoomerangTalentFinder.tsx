import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FormerEmployee {
    id: string;
    name: string;
    email: string;
    department: string;
    lastRole: string;
    skills: string[];
    yearsAtCompany: number;
    departureDate: string;
    departureReason: string;
    performanceRating: number;
    rehireEligible: boolean;
    notes: string;
}

interface RankedCandidate extends FormerEmployee {
    score: number;
    matchReasons: string[];
}

const DEPARTMENT_OPTIONS = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'product', label: 'Product' },
    { value: 'design', label: 'Design' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
];

const DEPARTURE_REASONS = [
    { value: 'better-opportunity', label: 'Better Opportunity' },
    { value: 'relocation', label: 'Relocation' },
    { value: 'family', label: 'Family Reasons' },
    { value: 'education', label: 'Further Education' },
    { value: 'startup', label: 'Started Own Business' },
    { value: 'career-change', label: 'Career Change' },
    { value: 'layoff', label: 'Layoff' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'other', label: 'Other' },
];

const BoomerangTalentFinder: React.FC = () => {
    const { showToast } = useToast();
    const [formerEmployees, setFormerEmployees] = useState<FormerEmployee[]>([]);
    const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>([]);

    // Search/Filter criteria
    const [searchCriteria, setSearchCriteria] = useState({
        skills: '',
        department: '',
        minPerformance: 3,
        minTenure: 1,
        excludeReasons: [] as string[],
    });

    // Form for adding new former employee
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        email: '',
        department: '',
        lastRole: '',
        skills: '',
        yearsAtCompany: 0,
        departureDate: '',
        departureReason: '',
        performanceRating: 3,
        rehireEligible: true,
        notes: '',
    });

    const handleAddEmployee = () => {
        if (!newEmployee.name || !newEmployee.email || !newEmployee.department || !newEmployee.lastRole) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        const employee: FormerEmployee = {
            id: `emp-${Date.now()}`,
            name: newEmployee.name,
            email: newEmployee.email,
            department: newEmployee.department,
            lastRole: newEmployee.lastRole,
            skills: newEmployee.skills.split(',').map(s => s.trim()).filter(s => s),
            yearsAtCompany: newEmployee.yearsAtCompany,
            departureDate: newEmployee.departureDate,
            departureReason: newEmployee.departureReason,
            performanceRating: newEmployee.performanceRating,
            rehireEligible: newEmployee.rehireEligible,
            notes: newEmployee.notes,
        };

        setFormerEmployees([...formerEmployees, employee]);
        setNewEmployee({
            name: '',
            email: '',
            department: '',
            lastRole: '',
            skills: '',
            yearsAtCompany: 0,
            departureDate: '',
            departureReason: '',
            performanceRating: 3,
            rehireEligible: true,
            notes: '',
        });
        showToast('Former employee added', 'success');
    };

    const loadSampleData = () => {
        const sampleEmployees: FormerEmployee[] = [
            {
                id: '1',
                name: 'Sarah Mitchell',
                email: 'sarah.mitchell@email.com',
                department: 'engineering',
                lastRole: 'Senior Software Engineer',
                skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
                yearsAtCompany: 4,
                departureDate: '2023-06-15',
                departureReason: 'better-opportunity',
                performanceRating: 5,
                rehireEligible: true,
                notes: 'Left for a startup CTO role. Expressed interest in returning.',
            },
            {
                id: '2',
                name: 'Michael Chen',
                email: 'michael.chen@email.com',
                department: 'product',
                lastRole: 'Product Manager',
                skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research'],
                yearsAtCompany: 3,
                departureDate: '2023-08-01',
                departureReason: 'relocation',
                performanceRating: 4,
                rehireEligible: true,
                notes: 'Moved to Seattle. Now looking to return to the area.',
            },
            {
                id: '3',
                name: 'Jessica Brown',
                email: 'jessica.brown@email.com',
                department: 'marketing',
                lastRole: 'Marketing Director',
                skills: ['Digital Marketing', 'Brand Strategy', 'Team Leadership', 'Analytics'],
                yearsAtCompany: 6,
                departureDate: '2022-12-01',
                departureReason: 'family',
                performanceRating: 5,
                rehireEligible: true,
                notes: 'Took time off for childcare. Excellent performer.',
            },
            {
                id: '4',
                name: 'David Kim',
                email: 'david.kim@email.com',
                department: 'engineering',
                lastRole: 'DevOps Engineer',
                skills: ['Kubernetes', 'Docker', 'CI/CD', 'Python', 'Terraform'],
                yearsAtCompany: 2,
                departureDate: '2024-01-15',
                departureReason: 'education',
                performanceRating: 4,
                rehireEligible: true,
                notes: 'Pursuing MBA. Expected graduation Dec 2024.',
            },
            {
                id: '5',
                name: 'Amanda Foster',
                email: 'amanda.foster@email.com',
                department: 'sales',
                lastRole: 'Account Executive',
                skills: ['B2B Sales', 'Salesforce', 'Negotiation', 'Relationship Building'],
                yearsAtCompany: 5,
                departureDate: '2023-03-01',
                departureReason: 'startup',
                performanceRating: 4,
                rehireEligible: true,
                notes: 'Co-founded a sales tech startup. Company was acquired.',
            },
            {
                id: '6',
                name: 'Robert Taylor',
                email: 'robert.taylor@email.com',
                department: 'engineering',
                lastRole: 'Junior Developer',
                skills: ['JavaScript', 'React', 'CSS'],
                yearsAtCompany: 1,
                departureDate: '2023-09-01',
                departureReason: 'better-opportunity',
                performanceRating: 2,
                rehireEligible: false,
                notes: 'Performance issues. Not recommended for rehire.',
            },
            {
                id: '7',
                name: 'Lisa Wang',
                email: 'lisa.wang@email.com',
                department: 'design',
                lastRole: 'UX Lead',
                skills: ['UI/UX Design', 'Figma', 'User Testing', 'Design Systems'],
                yearsAtCompany: 4,
                departureDate: '2023-11-01',
                departureReason: 'better-opportunity',
                performanceRating: 5,
                rehireEligible: true,
                notes: 'Left for FAANG company. Recently connected on LinkedIn.',
            },
        ];
        setFormerEmployees(sampleEmployees);
        showToast('Sample data loaded', 'info');
    };

    const findCandidates = () => {
        if (formerEmployees.length === 0) {
            showToast('Please add former employees first', 'warning');
            return;
        }

        const requiredSkills = searchCriteria.skills
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => s);

        const candidates: RankedCandidate[] = formerEmployees
            .filter(emp => {
                // Must be rehire eligible
                if (!emp.rehireEligible) return false;

                // Filter by department if specified
                if (searchCriteria.department && emp.department !== searchCriteria.department) {
                    return false;
                }

                // Filter by minimum performance
                if (emp.performanceRating < searchCriteria.minPerformance) {
                    return false;
                }

                // Filter by minimum tenure
                if (emp.yearsAtCompany < searchCriteria.minTenure) {
                    return false;
                }

                return true;
            })
            .map(emp => {
                let score = 0;
                const matchReasons: string[] = [];

                // Performance score (0-40 points)
                const perfScore = (emp.performanceRating / 5) * 40;
                score += perfScore;
                if (emp.performanceRating >= 4) {
                    matchReasons.push(`High performer (${emp.performanceRating}/5)`);
                }

                // Tenure score (0-20 points)
                const tenureScore = Math.min(emp.yearsAtCompany / 5, 1) * 20;
                score += tenureScore;
                if (emp.yearsAtCompany >= 3) {
                    matchReasons.push(`${emp.yearsAtCompany} years tenure`);
                }

                // Skills match (0-30 points)
                if (requiredSkills.length > 0) {
                    const empSkillsLower = emp.skills.map(s => s.toLowerCase());
                    const matchedSkills = requiredSkills.filter(skill =>
                        empSkillsLower.some(empSkill => empSkill.includes(skill) || skill.includes(empSkill))
                    );
                    const skillScore = (matchedSkills.length / requiredSkills.length) * 30;
                    score += skillScore;
                    if (matchedSkills.length > 0) {
                        matchReasons.push(`Skills match: ${matchedSkills.join(', ')}`);
                    }
                } else {
                    score += 15; // Neutral score if no skills specified
                }

                // Recency bonus (0-10 points)
                const departureDate = new Date(emp.departureDate);
                const now = new Date();
                const monthsAgo = (now.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
                const recencyScore = Math.max(0, 10 - (monthsAgo / 12) * 5);
                score += recencyScore;
                if (monthsAgo < 12) {
                    matchReasons.push('Left within past year');
                }

                // Favorable departure reasons bonus
                if (['relocation', 'family', 'education'].includes(emp.departureReason)) {
                    score += 5;
                    matchReasons.push('Favorable departure reason');
                }

                return {
                    ...emp,
                    score: Math.round(score),
                    matchReasons,
                };
            })
            .sort((a, b) => b.score - a.score);

        setRankedCandidates(candidates);

        if (candidates.length === 0) {
            showToast('No candidates match your criteria', 'info');
        } else {
            showToast(`Found ${candidates.length} potential boomerang candidates`, 'success');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600 dark:text-green-400';
        if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getDepartureReasonLabel = (reason: string) => {
        return DEPARTURE_REASONS.find(r => r.value === reason)?.label || reason;
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Boomerang Talent Finder</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Identify former employees suitable for rehire based on skills, performance, and departure circumstances.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Former Employee */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Add Former Employee</h2>
                    <div className="space-y-3">
                        <Input
                            label="Name *"
                            value={newEmployee.name}
                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            placeholder="Full name"
                        />
                        <Input
                            label="Email *"
                            type="email"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            placeholder="email@example.com"
                        />
                        <Select
                            label="Department *"
                            value={newEmployee.department}
                            onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                            options={DEPARTMENT_OPTIONS}
                        />
                        <Input
                            label="Last Role *"
                            value={newEmployee.lastRole}
                            onChange={(e) => setNewEmployee({ ...newEmployee, lastRole: e.target.value })}
                            placeholder="Job title"
                        />
                        <Input
                            label="Skills (comma-separated)"
                            value={newEmployee.skills}
                            onChange={(e) => setNewEmployee({ ...newEmployee, skills: e.target.value })}
                            placeholder="React, Python, etc."
                        />
                        <Input
                            label="Years at Company"
                            type="number"
                            value={newEmployee.yearsAtCompany.toString()}
                            onChange={(e) => setNewEmployee({ ...newEmployee, yearsAtCompany: parseInt(e.target.value) || 0 })}
                        />
                        <Input
                            label="Departure Date"
                            type="date"
                            value={newEmployee.departureDate}
                            onChange={(e) => setNewEmployee({ ...newEmployee, departureDate: e.target.value })}
                        />
                        <Select
                            label="Departure Reason"
                            value={newEmployee.departureReason}
                            onChange={(e) => setNewEmployee({ ...newEmployee, departureReason: e.target.value })}
                            options={DEPARTURE_REASONS}
                        />
                        <Input
                            label="Performance Rating (1-5)"
                            type="number"
                            value={newEmployee.performanceRating.toString()}
                            onChange={(e) => setNewEmployee({ ...newEmployee, performanceRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rehireEligible"
                                checked={newEmployee.rehireEligible}
                                onChange={(e) => setNewEmployee({ ...newEmployee, rehireEligible: e.target.checked })}
                                className="rounded"
                            />
                            <label htmlFor="rehireEligible" className="text-sm text-neutral-700 dark:text-neutral-300">
                                Eligible for Rehire
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="primary" onClick={handleAddEmployee} size="sm">
                                Add
                            </Button>
                            <Button variant="outline" onClick={loadSampleData} size="sm">
                                Load Sample
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Search Criteria */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Search Criteria</h2>
                    <div className="space-y-4">
                        <Input
                            label="Required Skills (comma-separated)"
                            value={searchCriteria.skills}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, skills: e.target.value })}
                            placeholder="React, AWS, etc."
                        />
                        <Select
                            label="Department"
                            value={searchCriteria.department}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, department: e.target.value })}
                            options={[{ value: '', label: 'All Departments' }, ...DEPARTMENT_OPTIONS]}
                        />
                        <Input
                            label="Minimum Performance Rating"
                            type="number"
                            value={searchCriteria.minPerformance.toString()}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, minPerformance: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                        />
                        <Input
                            label="Minimum Years at Company"
                            type="number"
                            value={searchCriteria.minTenure.toString()}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, minTenure: parseInt(e.target.value) || 0 })}
                        />
                        <Button variant="primary" onClick={findCandidates} className="w-full">
                            Find Candidates
                        </Button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Database: {formerEmployees.length} former employees
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Rehire eligible: {formerEmployees.filter(e => e.rehireEligible).length}
                        </p>
                    </div>
                </Card>

                {/* Ranked Results */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                        Ranked Candidates ({rankedCandidates.length})
                    </h2>

                    {rankedCandidates.length === 0 ? (
                        <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                            Run a search to find boomerang candidates
                        </p>
                    ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {rankedCandidates.map((candidate, index) => (
                                <div
                                    key={candidate.id}
                                    className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-sm text-neutral-500 dark:text-neutral-400">#{index + 1}</span>
                                            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                                                {candidate.name}
                                            </h3>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {candidate.lastRole}
                                            </p>
                                        </div>
                                        <div className={`text-2xl font-bold ${getScoreColor(candidate.score)}`}>
                                            {candidate.score}
                                        </div>
                                    </div>

                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                                        <p>{candidate.department} • {candidate.yearsAtCompany} yrs tenure</p>
                                        <p>Rating: {candidate.performanceRating}/5 • Left: {getDepartureReasonLabel(candidate.departureReason)}</p>
                                        <p className="text-neutral-600 dark:text-neutral-300">
                                            Skills: {candidate.skills.join(', ')}
                                        </p>
                                    </div>

                                    {candidate.matchReasons.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                            <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                                Match factors:
                                            </p>
                                            <ul className="text-xs text-neutral-600 dark:text-neutral-400">
                                                {candidate.matchReasons.map((reason, i) => (
                                                    <li key={i}>• {reason}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {candidate.notes && (
                                        <p className="mt-2 text-xs italic text-neutral-500 dark:text-neutral-400">
                                            "{candidate.notes}"
                                        </p>
                                    )}

                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => {
                                                window.location.href = `mailto:${candidate.email}?subject=Opportunity at Company`;
                                            }}
                                        >
                                            Contact
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Analytics */}
            {rankedCandidates.length > 0 && (
                <Card className="mt-6">
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                        Candidate Score Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={rankedCandidates.map(c => ({ name: c.name.split(' ')[0], score: c.score }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="score" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}
        </div>
    );
};

export default BoomerangTalentFinder;
