import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Offer {
    id: string;
    candidateName: string;
    role: string;
    level: string;
    department: string;
    baseSalary: number;
    bonus: number;
    equity: number;
    signingBonus: number;
    benefits: string[];
    pto: number;
    remotePolicy: string;
}

interface Benchmark {
    role: string;
    level: string;
    minSalary: number;
    midSalary: number;
    maxSalary: number;
    avgBonus: number;
    avgEquity: number;
}

interface ComparisonResult {
    offer: Offer;
    salaryPercentile: number;
    totalCompPercentile: number;
    marketComparison: 'below' | 'competitive' | 'above';
    equityAnalysis: string;
    warnings: string[];
    strengths: string[];
}

const LEVEL_OPTIONS = [
    { value: 'junior', label: 'Junior (L1-L2)' },
    { value: 'mid', label: 'Mid (L3-L4)' },
    { value: 'senior', label: 'Senior (L5)' },
    { value: 'staff', label: 'Staff (L6)' },
    { value: 'principal', label: 'Principal (L7+)' },
];

const DEPARTMENT_OPTIONS = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'product', label: 'Product' },
    { value: 'design', label: 'Design' },
    { value: 'data', label: 'Data Science' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
];

const REMOTE_OPTIONS = [
    { value: 'onsite', label: 'Fully Onsite' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Fully Remote' },
];

const BENEFITS_OPTIONS = [
    '401k Match',
    'Health Insurance',
    'Dental/Vision',
    'Life Insurance',
    'Gym Membership',
    'Learning Budget',
    'Home Office Stipend',
    'Wellness Stipend',
    'Parental Leave',
    'Commuter Benefits',
];

// Sample market benchmarks
const BENCHMARKS: Benchmark[] = [
    { role: 'Software Engineer', level: 'junior', minSalary: 80000, midSalary: 95000, maxSalary: 115000, avgBonus: 5000, avgEquity: 10000 },
    { role: 'Software Engineer', level: 'mid', minSalary: 110000, midSalary: 135000, maxSalary: 160000, avgBonus: 10000, avgEquity: 25000 },
    { role: 'Software Engineer', level: 'senior', minSalary: 150000, midSalary: 180000, maxSalary: 220000, avgBonus: 20000, avgEquity: 50000 },
    { role: 'Software Engineer', level: 'staff', minSalary: 200000, midSalary: 250000, maxSalary: 300000, avgBonus: 40000, avgEquity: 100000 },
    { role: 'Software Engineer', level: 'principal', minSalary: 280000, midSalary: 350000, maxSalary: 450000, avgBonus: 60000, avgEquity: 200000 },
    { role: 'Product Manager', level: 'junior', minSalary: 85000, midSalary: 100000, maxSalary: 120000, avgBonus: 8000, avgEquity: 15000 },
    { role: 'Product Manager', level: 'mid', minSalary: 120000, midSalary: 145000, maxSalary: 170000, avgBonus: 15000, avgEquity: 30000 },
    { role: 'Product Manager', level: 'senior', minSalary: 160000, midSalary: 190000, maxSalary: 230000, avgBonus: 25000, avgEquity: 60000 },
    { role: 'Designer', level: 'junior', minSalary: 70000, midSalary: 85000, maxSalary: 100000, avgBonus: 5000, avgEquity: 8000 },
    { role: 'Designer', level: 'mid', minSalary: 95000, midSalary: 115000, maxSalary: 140000, avgBonus: 8000, avgEquity: 20000 },
    { role: 'Designer', level: 'senior', minSalary: 130000, midSalary: 155000, maxSalary: 185000, avgBonus: 15000, avgEquity: 40000 },
];

const OfferComparator: React.FC = () => {
    const { showToast } = useToast();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);

    const [newOffer, setNewOffer] = useState({
        candidateName: '',
        role: 'Software Engineer',
        level: 'mid',
        department: 'engineering',
        baseSalary: 0,
        bonus: 0,
        equity: 0,
        signingBonus: 0,
        benefits: [] as string[],
        pto: 20,
        remotePolicy: 'hybrid',
    });

    const toggleBenefit = (benefit: string) => {
        const benefits = newOffer.benefits.includes(benefit)
            ? newOffer.benefits.filter(b => b !== benefit)
            : [...newOffer.benefits, benefit];
        setNewOffer({ ...newOffer, benefits });
    };

    const handleAddOffer = () => {
        if (!newOffer.candidateName || newOffer.baseSalary === 0) {
            showToast('Please enter candidate name and base salary', 'warning');
            return;
        }

        const offer: Offer = {
            id: `offer-${Date.now()}`,
            candidateName: newOffer.candidateName,
            role: newOffer.role,
            level: newOffer.level,
            department: newOffer.department,
            baseSalary: newOffer.baseSalary,
            bonus: newOffer.bonus,
            equity: newOffer.equity,
            signingBonus: newOffer.signingBonus,
            benefits: newOffer.benefits,
            pto: newOffer.pto,
            remotePolicy: newOffer.remotePolicy,
        };

        setOffers([...offers, offer]);
        setNewOffer({
            candidateName: '',
            role: 'Software Engineer',
            level: 'mid',
            department: 'engineering',
            baseSalary: 0,
            bonus: 0,
            equity: 0,
            signingBonus: 0,
            benefits: [],
            pto: 20,
            remotePolicy: 'hybrid',
        });
        showToast('Offer added', 'success');
    };

    const loadSampleOffers = () => {
        const samples: Offer[] = [
            {
                id: '1',
                candidateName: 'Alex Rivera',
                role: 'Software Engineer',
                level: 'senior',
                department: 'engineering',
                baseSalary: 185000,
                bonus: 25000,
                equity: 60000,
                signingBonus: 20000,
                benefits: ['401k Match', 'Health Insurance', 'Dental/Vision', 'Learning Budget', 'Home Office Stipend'],
                pto: 20,
                remotePolicy: 'hybrid',
            },
            {
                id: '2',
                candidateName: 'Jordan Lee',
                role: 'Software Engineer',
                level: 'mid',
                department: 'engineering',
                baseSalary: 140000,
                bonus: 12000,
                equity: 30000,
                signingBonus: 10000,
                benefits: ['401k Match', 'Health Insurance', 'Dental/Vision'],
                pto: 15,
                remotePolicy: 'onsite',
            },
            {
                id: '3',
                candidateName: 'Sam Chen',
                role: 'Product Manager',
                level: 'mid',
                department: 'product',
                baseSalary: 155000,
                bonus: 20000,
                equity: 40000,
                signingBonus: 15000,
                benefits: ['401k Match', 'Health Insurance', 'Dental/Vision', 'Parental Leave', 'Commuter Benefits'],
                pto: 25,
                remotePolicy: 'remote',
            },
        ];
        setOffers(samples);
        showToast('Sample offers loaded', 'info');
    };

    const removeOffer = (id: string) => {
        setOffers(offers.filter(o => o.id !== id));
        showToast('Offer removed', 'info');
    };

    const compareOffers = () => {
        if (offers.length === 0) {
            showToast('Please add at least one offer', 'warning');
            return;
        }

        const results: ComparisonResult[] = offers.map(offer => {
            // Find matching benchmark
            const benchmark = BENCHMARKS.find(b =>
                b.role === offer.role && b.level === offer.level
            ) || BENCHMARKS.find(b => b.level === offer.level) || BENCHMARKS[2]; // Default to mid SWE

            // Calculate salary percentile
            const salaryRange = benchmark.maxSalary - benchmark.minSalary;
            const salaryPosition = offer.baseSalary - benchmark.minSalary;
            const salaryPercentile = Math.min(100, Math.max(0, Math.round((salaryPosition / salaryRange) * 100)));

            // Calculate total comp percentile
            const totalComp = offer.baseSalary + offer.bonus + offer.equity;
            const benchmarkTotalComp = benchmark.midSalary + benchmark.avgBonus + benchmark.avgEquity;
            const totalCompPercentile = Math.round((totalComp / benchmarkTotalComp) * 50);

            // Market comparison
            let marketComparison: 'below' | 'competitive' | 'above' = 'competitive';
            if (offer.baseSalary < benchmark.minSalary * 0.95) {
                marketComparison = 'below';
            } else if (offer.baseSalary > benchmark.maxSalary * 1.05) {
                marketComparison = 'above';
            }

            // Equity analysis
            let equityAnalysis = '';
            if (offer.equity > benchmark.avgEquity * 1.3) {
                equityAnalysis = 'Strong equity package - above market average';
            } else if (offer.equity < benchmark.avgEquity * 0.7) {
                equityAnalysis = 'Below market equity - consider negotiating';
            } else {
                equityAnalysis = 'Market-competitive equity package';
            }

            // Warnings
            const warnings: string[] = [];
            if (offer.baseSalary < benchmark.minSalary) {
                warnings.push(`Base salary $${offer.baseSalary.toLocaleString()} is below market minimum of $${benchmark.minSalary.toLocaleString()}`);
            }
            if (offer.pto < 15) {
                warnings.push('PTO below industry standard of 15 days');
            }
            if (offer.benefits.length < 3) {
                warnings.push('Limited benefits package');
            }
            if (!offer.benefits.includes('401k Match')) {
                warnings.push('No 401k match - significant long-term cost');
            }

            // Strengths
            const strengths: string[] = [];
            if (offer.baseSalary > benchmark.midSalary) {
                strengths.push('Above-median base salary for the level');
            }
            if (offer.signingBonus > 10000) {
                strengths.push(`Strong signing bonus of $${offer.signingBonus.toLocaleString()}`);
            }
            if (offer.equity > benchmark.avgEquity) {
                strengths.push('Above-average equity grant');
            }
            if (offer.pto >= 20) {
                strengths.push('Generous PTO policy');
            }
            if (offer.remotePolicy === 'remote') {
                strengths.push('Fully remote flexibility');
            }
            if (offer.benefits.length >= 6) {
                strengths.push('Comprehensive benefits package');
            }

            return {
                offer,
                salaryPercentile,
                totalCompPercentile,
                marketComparison,
                equityAnalysis,
                warnings,
                strengths,
            };
        });

        setComparisons(results);
        showToast('Comparison complete', 'success');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Chart data for comparison
    const chartData = comparisons.map(c => ({
        name: c.offer.candidateName.split(' ')[0],
        base: c.offer.baseSalary,
        bonus: c.offer.bonus,
        equity: c.offer.equity,
        signing: c.offer.signingBonus,
    }));

    // Radar chart data
    const radarData = comparisons.length > 0 ? [
        { category: 'Base', ...Object.fromEntries(comparisons.map(c => [c.offer.candidateName.split(' ')[0], (c.offer.baseSalary / 250000) * 100])) },
        { category: 'Bonus', ...Object.fromEntries(comparisons.map(c => [c.offer.candidateName.split(' ')[0], (c.offer.bonus / 50000) * 100])) },
        { category: 'Equity', ...Object.fromEntries(comparisons.map(c => [c.offer.candidateName.split(' ')[0], (c.offer.equity / 100000) * 100])) },
        { category: 'PTO', ...Object.fromEntries(comparisons.map(c => [c.offer.candidateName.split(' ')[0], (c.offer.pto / 30) * 100])) },
        { category: 'Benefits', ...Object.fromEntries(comparisons.map(c => [c.offer.candidateName.split(' ')[0], (c.offer.benefits.length / 10) * 100])) },
    ] : [];

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Offer Comparator</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Benchmark candidate offers against market standards to ensure competitive and equitable compensation.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Offer Form */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Add Offer</h2>
                        <Button variant="outline" size="sm" onClick={loadSampleOffers}>
                            Load Samples
                        </Button>
                    </div>
                    <div className="space-y-3">
                        <Input
                            label="Candidate Name *"
                            value={newOffer.candidateName}
                            onChange={(e) => setNewOffer({ ...newOffer, candidateName: e.target.value })}
                            placeholder="Full name"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Role"
                                value={newOffer.role}
                                onChange={(e) => setNewOffer({ ...newOffer, role: e.target.value })}
                                options={[
                                    { value: 'Software Engineer', label: 'Software Engineer' },
                                    { value: 'Product Manager', label: 'Product Manager' },
                                    { value: 'Designer', label: 'Designer' },
                                ]}
                            />
                            <Select
                                label="Level"
                                value={newOffer.level}
                                onChange={(e) => setNewOffer({ ...newOffer, level: e.target.value })}
                                options={LEVEL_OPTIONS}
                            />
                        </div>

                        <Input
                            label="Base Salary *"
                            type="number"
                            value={newOffer.baseSalary.toString()}
                            onChange={(e) => setNewOffer({ ...newOffer, baseSalary: parseInt(e.target.value) || 0 })}
                            placeholder="150000"
                        />

                        <div className="grid grid-cols-3 gap-3">
                            <Input
                                label="Annual Bonus"
                                type="number"
                                value={newOffer.bonus.toString()}
                                onChange={(e) => setNewOffer({ ...newOffer, bonus: parseInt(e.target.value) || 0 })}
                            />
                            <Input
                                label="Equity (4yr)"
                                type="number"
                                value={newOffer.equity.toString()}
                                onChange={(e) => setNewOffer({ ...newOffer, equity: parseInt(e.target.value) || 0 })}
                            />
                            <Input
                                label="Signing Bonus"
                                type="number"
                                value={newOffer.signingBonus.toString()}
                                onChange={(e) => setNewOffer({ ...newOffer, signingBonus: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="PTO Days"
                                type="number"
                                value={newOffer.pto.toString()}
                                onChange={(e) => setNewOffer({ ...newOffer, pto: parseInt(e.target.value) || 0 })}
                            />
                            <Select
                                label="Remote Policy"
                                value={newOffer.remotePolicy}
                                onChange={(e) => setNewOffer({ ...newOffer, remotePolicy: e.target.value })}
                                options={REMOTE_OPTIONS}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Benefits
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {BENEFITS_OPTIONS.map(benefit => (
                                    <button
                                        key={benefit}
                                        onClick={() => toggleBenefit(benefit)}
                                        className={`px-2 py-1 rounded text-xs transition-colors ${
                                            newOffer.benefits.includes(benefit)
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                                        }`}
                                    >
                                        {benefit}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button variant="primary" onClick={handleAddOffer} className="w-full">
                            Add Offer
                        </Button>
                    </div>
                </Card>

                {/* Offers List */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                            Offers ({offers.length})
                        </h2>
                        <Button variant="primary" onClick={compareOffers} disabled={offers.length === 0}>
                            Compare
                        </Button>
                    </div>

                    {offers.length === 0 ? (
                        <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                            No offers added yet.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {offers.map(offer => (
                                <div
                                    key={offer.id}
                                    className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-neutral-800 dark:text-neutral-100">{offer.candidateName}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {offer.role} • {LEVEL_OPTIONS.find(l => l.value === offer.level)?.label}
                                            </p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => removeOffer(offer.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                        <p>Base: {formatCurrency(offer.baseSalary)}</p>
                                        <p>Bonus: {formatCurrency(offer.bonus)}</p>
                                        <p>Equity: {formatCurrency(offer.equity)}</p>
                                        <p>Total: {formatCurrency(offer.baseSalary + offer.bonus + offer.equity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Comparison Results */}
            {comparisons.length > 0 && (
                <div className="mt-6 space-y-6">
                    {/* Compensation Chart */}
                    <Card>
                        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Compensation Breakdown</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                                <Bar dataKey="base" stackId="a" fill="#8884d8" name="Base" />
                                <Bar dataKey="bonus" stackId="a" fill="#82ca9d" name="Bonus" />
                                <Bar dataKey="equity" stackId="a" fill="#ffc658" name="Equity" />
                                <Bar dataKey="signing" stackId="a" fill="#ff7c43" name="Signing" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Individual Comparisons */}
                    {comparisons.map(comparison => (
                        <Card key={comparison.offer.id}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                                        {comparison.offer.candidateName}
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {comparison.offer.role} • {LEVEL_OPTIONS.find(l => l.value === comparison.offer.level)?.label}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    comparison.marketComparison === 'above' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                    comparison.marketComparison === 'below' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                }`}>
                                    {comparison.marketComparison === 'above' ? 'Above Market' :
                                     comparison.marketComparison === 'below' ? 'Below Market' : 'Competitive'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Compensation</p>
                                    <p className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                                        {formatCurrency(comparison.offer.baseSalary + comparison.offer.bonus + comparison.offer.equity + comparison.offer.signingBonus)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Salary Percentile</p>
                                    <p className={`text-xl font-bold ${
                                        comparison.salaryPercentile >= 50 ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                        {comparison.salaryPercentile}th
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Benefits</p>
                                    <p className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                                        {comparison.offer.benefits.length} items
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {comparison.strengths.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Strengths</h4>
                                        <ul className="space-y-1">
                                            {comparison.strengths.map((strength, i) => (
                                                <li key={i} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                                                    <span className="text-green-500">+</span>
                                                    {strength}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {comparison.warnings.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Concerns</h4>
                                        <ul className="space-y-1">
                                            {comparison.warnings.map((warning, i) => (
                                                <li key={i} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                                                    <span className="text-red-500">!</span>
                                                    {warning}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    <strong>Equity Analysis:</strong> {comparison.equityAnalysis}
                                </p>
                            </div>
                        </Card>
                    ))}

                    {/* Radar Chart for Multi-offer Comparison */}
                    {comparisons.length > 1 && (
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Multi-Offer Comparison</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="category" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    {comparisons.map((c, index) => (
                                        <Radar
                                            key={c.offer.id}
                                            name={c.offer.candidateName.split(' ')[0]}
                                            dataKey={c.offer.candidateName.split(' ')[0]}
                                            stroke={['#8884d8', '#82ca9d', '#ffc658'][index % 3]}
                                            fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]}
                                            fillOpacity={0.3}
                                        />
                                    ))}
                                    <Legend />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default OfferComparator;
