import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Employee {
    id: string;
    name: string;
    department: string;
    gender: string;
    ethnicity: string;
    yearsAtCompany: number;
    skills: string[];
    performanceRating: number;
    selected: boolean;
}

interface ImpactAnalysis {
    diversityImpact: {
        before: { name: string; value: number }[];
        after: { name: string; value: number }[];
        change: number;
    };
    genderImpact: {
        before: { name: string; value: number }[];
        after: { name: string; value: number }[];
    };
    skillsAtRisk: { skill: string; count: number; percentage: number }[];
    departmentImpact: { name: string; before: number; after: number; change: number }[];
    tenureImpact: {
        avgTenureBefore: number;
        avgTenureAfter: number;
        avgTenureLayoff: number;
    };
    performanceImpact: {
        avgBefore: number;
        avgAfter: number;
        avgLayoff: number;
    };
    warnings: string[];
    recommendations: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-Binary' },
];

const ETHNICITY_OPTIONS = [
    { value: 'asian', label: 'Asian' },
    { value: 'black', label: 'Black/African American' },
    { value: 'hispanic', label: 'Hispanic/Latino' },
    { value: 'white', label: 'White/Caucasian' },
    { value: 'other', label: 'Other' },
];

const LayoffImpactAnalyzer: React.FC = () => {
    const { showToast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null);

    const [newEmployee, setNewEmployee] = useState({
        name: '',
        department: '',
        gender: '',
        ethnicity: '',
        yearsAtCompany: 0,
        skills: '',
        performanceRating: 3,
    });

    const handleAddEmployee = () => {
        if (!newEmployee.name || !newEmployee.department || !newEmployee.gender || !newEmployee.ethnicity) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        const employee: Employee = {
            id: `emp-${Date.now()}`,
            name: newEmployee.name,
            department: newEmployee.department,
            gender: newEmployee.gender,
            ethnicity: newEmployee.ethnicity,
            yearsAtCompany: newEmployee.yearsAtCompany,
            skills: newEmployee.skills.split(',').map(s => s.trim()).filter(s => s),
            performanceRating: newEmployee.performanceRating,
            selected: false,
        };

        setEmployees([...employees, employee]);
        setNewEmployee({
            name: '',
            department: '',
            gender: '',
            ethnicity: '',
            yearsAtCompany: 0,
            skills: '',
            performanceRating: 3,
        });
        showToast('Employee added', 'success');
    };

    const toggleEmployeeSelection = (id: string) => {
        setEmployees(employees.map(emp =>
            emp.id === id ? { ...emp, selected: !emp.selected } : emp
        ));
    };

    const loadSampleData = () => {
        const sampleEmployees: Employee[] = [
            { id: '1', name: 'Alice Chen', department: 'engineering', gender: 'female', ethnicity: 'asian', yearsAtCompany: 5, skills: ['React', 'TypeScript', 'Node.js'], performanceRating: 4, selected: false },
            { id: '2', name: 'Bob Smith', department: 'engineering', gender: 'male', ethnicity: 'white', yearsAtCompany: 3, skills: ['Python', 'Machine Learning'], performanceRating: 3, selected: false },
            { id: '3', name: 'Carlos Rodriguez', department: 'sales', gender: 'male', ethnicity: 'hispanic', yearsAtCompany: 7, skills: ['Sales', 'CRM', 'Negotiation'], performanceRating: 5, selected: false },
            { id: '4', name: 'Diana Johnson', department: 'hr', gender: 'female', ethnicity: 'black', yearsAtCompany: 4, skills: ['Recruiting', 'Training', 'HR Systems'], performanceRating: 4, selected: false },
            { id: '5', name: 'Eric Wang', department: 'engineering', gender: 'male', ethnicity: 'asian', yearsAtCompany: 2, skills: ['React', 'JavaScript', 'CSS'], performanceRating: 3, selected: true },
            { id: '6', name: 'Fatima Hassan', department: 'product', gender: 'female', ethnicity: 'other', yearsAtCompany: 6, skills: ['Product Strategy', 'Analytics', 'Agile'], performanceRating: 5, selected: false },
            { id: '7', name: 'George Brown', department: 'marketing', gender: 'male', ethnicity: 'white', yearsAtCompany: 8, skills: ['Digital Marketing', 'SEO', 'Content'], performanceRating: 4, selected: true },
            { id: '8', name: 'Hannah Lee', department: 'design', gender: 'female', ethnicity: 'asian', yearsAtCompany: 1, skills: ['UI Design', 'Figma', 'User Research'], performanceRating: 4, selected: false },
            { id: '9', name: 'Ivan Petrov', department: 'engineering', gender: 'male', ethnicity: 'white', yearsAtCompany: 4, skills: ['DevOps', 'AWS', 'Kubernetes'], performanceRating: 3, selected: true },
            { id: '10', name: 'Julia Martinez', department: 'finance', gender: 'female', ethnicity: 'hispanic', yearsAtCompany: 5, skills: ['Financial Analysis', 'Excel', 'Forecasting'], performanceRating: 5, selected: false },
        ];
        setEmployees(sampleEmployees);
        showToast('Sample data loaded with 3 employees pre-selected for layoff analysis', 'info');
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

    const analyzeImpact = () => {
        const selectedForLayoff = employees.filter(e => e.selected);
        const remaining = employees.filter(e => !e.selected);

        if (selectedForLayoff.length === 0) {
            showToast('Please select at least one employee for layoff analysis', 'warning');
            return;
        }

        if (remaining.length === 0) {
            showToast('Cannot lay off all employees', 'error');
            return;
        }

        // Diversity impact (ethnicity)
        const ethnicityBefore = calculateDistribution(employees.map(e => e.ethnicity));
        const ethnicityAfter = calculateDistribution(remaining.map(e => e.ethnicity));

        // Calculate diversity change using simple ratio
        const diversityBefore = ethnicityBefore.length / employees.length;
        const diversityAfter = ethnicityAfter.length / remaining.length;
        const diversityChange = ((diversityAfter - diversityBefore) / diversityBefore) * 100;

        // Gender impact
        const genderBefore = calculateDistribution(employees.map(e => e.gender));
        const genderAfter = calculateDistribution(remaining.map(e => e.gender));

        // Skills at risk
        const allSkills: Record<string, number> = {};
        employees.forEach(e => e.skills.forEach(s => {
            allSkills[s] = (allSkills[s] || 0) + 1;
        }));

        const layoffSkills: Record<string, number> = {};
        selectedForLayoff.forEach(e => e.skills.forEach(s => {
            layoffSkills[s] = (layoffSkills[s] || 0) + 1;
        }));

        const skillsAtRisk = Object.entries(layoffSkills)
            .map(([skill, count]) => ({
                skill,
                count,
                percentage: Math.round((count / allSkills[skill]) * 100)
            }))
            .filter(s => s.percentage >= 50)
            .sort((a, b) => b.percentage - a.percentage);

        // Department impact
        const deptsBefore: Record<string, number> = {};
        const deptsAfter: Record<string, number> = {};
        employees.forEach(e => deptsBefore[e.department] = (deptsBefore[e.department] || 0) + 1);
        remaining.forEach(e => deptsAfter[e.department] = (deptsAfter[e.department] || 0) + 1);

        const departmentImpact = Object.keys(deptsBefore).map(dept => ({
            name: dept.charAt(0).toUpperCase() + dept.slice(1),
            before: deptsBefore[dept],
            after: deptsAfter[dept] || 0,
            change: ((deptsAfter[dept] || 0) - deptsBefore[dept]) / deptsBefore[dept] * 100
        }));

        // Tenure impact
        const avgTenureBefore = employees.reduce((sum, e) => sum + e.yearsAtCompany, 0) / employees.length;
        const avgTenureAfter = remaining.reduce((sum, e) => sum + e.yearsAtCompany, 0) / remaining.length;
        const avgTenureLayoff = selectedForLayoff.reduce((sum, e) => sum + e.yearsAtCompany, 0) / selectedForLayoff.length;

        // Performance impact
        const avgPerfBefore = employees.reduce((sum, e) => sum + e.performanceRating, 0) / employees.length;
        const avgPerfAfter = remaining.reduce((sum, e) => sum + e.performanceRating, 0) / remaining.length;
        const avgPerfLayoff = selectedForLayoff.reduce((sum, e) => sum + e.performanceRating, 0) / selectedForLayoff.length;

        // Generate warnings and recommendations
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for disproportionate impact on protected groups
        const layoffEthnicityDist = calculateDistribution(selectedForLayoff.map(e => e.ethnicity));
        const totalEthnicityDist = calculateDistribution(employees.map(e => e.ethnicity));

        layoffEthnicityDist.forEach(le => {
            const total = totalEthnicityDist.find(t => t.name === le.name);
            if (total) {
                const layoffRate = le.value / total.value;
                const overallRate = selectedForLayoff.length / employees.length;
                if (layoffRate > overallRate * 1.5) {
                    warnings.push(`${le.name} employees are disproportionately affected (${Math.round(layoffRate * 100)}% vs ${Math.round(overallRate * 100)}% overall rate)`);
                }
            }
        });

        // Gender balance warning
        const femalesBefore = employees.filter(e => e.gender === 'female').length;
        const femalesAfter = remaining.filter(e => e.gender === 'female').length;
        const femaleRateBefore = femalesBefore / employees.length;
        const femaleRateAfter = femalesAfter / remaining.length;
        if (Math.abs(femaleRateAfter - femaleRateBefore) > 0.1) {
            warnings.push(`Gender balance will shift significantly (${Math.round(femaleRateBefore * 100)}% to ${Math.round(femaleRateAfter * 100)}% female)`);
        }

        // Skills at risk warning
        if (skillsAtRisk.length > 0) {
            warnings.push(`${skillsAtRisk.length} critical skill(s) will lose 50% or more of capacity`);
        }

        // Performance warning
        if (avgPerfLayoff > avgPerfBefore) {
            warnings.push(`Average performance of layoff group (${avgPerfLayoff.toFixed(1)}) exceeds company average (${avgPerfBefore.toFixed(1)})`);
        }

        // Recommendations
        if (skillsAtRisk.length > 0) {
            recommendations.push(`Consider retaining employees with critical skills: ${skillsAtRisk.map(s => s.skill).join(', ')}`);
        }

        if (avgPerfLayoff >= avgPerfBefore) {
            recommendations.push('Review selection criteria to ensure high performers are being retained');
        }

        const deptWithHighImpact = departmentImpact.find(d => d.change <= -50);
        if (deptWithHighImpact) {
            recommendations.push(`${deptWithHighImpact.name} department will lose 50%+ of staff - consider redistributing layoffs`);
        }

        if (warnings.length === 0) {
            recommendations.push('The proposed layoffs appear balanced across demographic groups');
        }

        setAnalysis({
            diversityImpact: {
                before: ethnicityBefore,
                after: ethnicityAfter,
                change: diversityChange,
            },
            genderImpact: {
                before: genderBefore,
                after: genderAfter,
            },
            skillsAtRisk,
            departmentImpact,
            tenureImpact: {
                avgTenureBefore,
                avgTenureAfter,
                avgTenureLayoff,
            },
            performanceImpact: {
                avgBefore: avgPerfBefore,
                avgAfter: avgPerfAfter,
                avgLayoff: avgPerfLayoff,
            },
            warnings,
            recommendations,
        });

        showToast('Impact analysis complete', 'success');
    };

    const selectedCount = employees.filter(e => e.selected).length;

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Layoff Impact Analyzer</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Analyze the diversity, skill, and performance impact of planned workforce reductions.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Employee Form */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Add Employee</h2>
                    <div className="space-y-3">
                        <Input
                            label="Name"
                            value={newEmployee.name}
                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            placeholder="Employee name"
                        />
                        <Select
                            label="Department"
                            value={newEmployee.department}
                            onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                            options={DEPARTMENT_OPTIONS}
                        />
                        <Select
                            label="Gender"
                            value={newEmployee.gender}
                            onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                            options={GENDER_OPTIONS}
                        />
                        <Select
                            label="Ethnicity"
                            value={newEmployee.ethnicity}
                            onChange={(e) => setNewEmployee({ ...newEmployee, ethnicity: e.target.value })}
                            options={ETHNICITY_OPTIONS}
                        />
                        <Input
                            label="Years at Company"
                            type="number"
                            value={newEmployee.yearsAtCompany.toString()}
                            onChange={(e) => setNewEmployee({ ...newEmployee, yearsAtCompany: parseInt(e.target.value) || 0 })}
                        />
                        <Input
                            label="Skills (comma-separated)"
                            value={newEmployee.skills}
                            onChange={(e) => setNewEmployee({ ...newEmployee, skills: e.target.value })}
                            placeholder="React, TypeScript, etc."
                        />
                        <Input
                            label="Performance Rating (1-5)"
                            type="number"
                            value={newEmployee.performanceRating.toString()}
                            onChange={(e) => setNewEmployee({ ...newEmployee, performanceRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                        />
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

                {/* Employee List */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                                Employees ({employees.length}) - Selected for Layoff: {selectedCount}
                            </h2>
                            <Button
                                variant="primary"
                                onClick={analyzeImpact}
                                disabled={selectedCount === 0}
                            >
                                Analyze Impact
                            </Button>
                        </div>

                        {employees.length === 0 ? (
                            <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                                No employees added yet. Add employees or load sample data.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {employees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        onClick={() => toggleEmployeeSelection(emp.id)}
                                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                            emp.selected
                                                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
                                                : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-neutral-800 dark:text-neutral-100">
                                                {emp.name}
                                                {emp.selected && <span className="ml-2 text-red-600 text-sm">(Selected)</span>}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {emp.department} • {emp.yearsAtCompany} yrs • Rating: {emp.performanceRating}/5
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                                Skills: {emp.skills.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                            Click on employees to select/deselect them for layoff analysis
                        </p>
                    </Card>
                </div>
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="mt-6 space-y-6">
                    {/* Warnings & Recommendations */}
                    {analysis.warnings.length > 0 && (
                        <Card>
                            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Warnings</h2>
                            <ul className="space-y-2">
                                {analysis.warnings.map((warning, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                        <span className="text-neutral-700 dark:text-neutral-300">{warning}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    <Card>
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Recommendations</h2>
                        <ul className="space-y-2">
                            {analysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    <span className="text-neutral-700 dark:text-neutral-300">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Avg Tenure Impact</h3>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                {analysis.tenureImpact.avgTenureBefore.toFixed(1)} → {analysis.tenureImpact.avgTenureAfter.toFixed(1)} yrs
                            </p>
                            <p className="text-sm text-neutral-500">Layoff group avg: {analysis.tenureImpact.avgTenureLayoff.toFixed(1)} yrs</p>
                        </Card>
                        <Card>
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Avg Performance Impact</h3>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                {analysis.performanceImpact.avgBefore.toFixed(1)} → {analysis.performanceImpact.avgAfter.toFixed(1)}
                            </p>
                            <p className="text-sm text-neutral-500">Layoff group avg: {analysis.performanceImpact.avgLayoff.toFixed(1)}/5</p>
                        </Card>
                        <Card>
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Skills at Risk</h3>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                {analysis.skillsAtRisk.length}
                            </p>
                            <p className="text-sm text-neutral-500">Skills losing 50%+ capacity</p>
                        </Card>
                    </div>

                    {/* Skills at Risk Detail */}
                    {analysis.skillsAtRisk.length > 0 && (
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Critical Skills at Risk</h3>
                            <div className="space-y-2">
                                {analysis.skillsAtRisk.map((skill, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-neutral-700 dark:text-neutral-300">{skill.skill}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                                <div
                                                    className="bg-red-500 h-2 rounded-full"
                                                    style={{ width: `${skill.percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-red-600 font-medium">{skill.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Department Impact */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Department Impact</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analysis.departmentImpact}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="before" fill="#8884d8" name="Before" />
                                    <Bar dataKey="after" fill="#82ca9d" name="After" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Ethnicity Before/After */}
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Ethnicity Distribution (Before)</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={analysis.diversityImpact.before}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analysis.diversityImpact.before.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayoffImpactAnalyzer;
