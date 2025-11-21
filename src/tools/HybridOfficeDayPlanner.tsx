import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    timezone: string;
    officeDays: string[];
    preferredMeetingTimes: string[];
}

interface DayAnalysis {
    day: string;
    availableCount: number;
    availableMembers: string[];
    availabilityPercent: number;
    bestTimeSlots: string[];
}

interface ScheduleRecommendation {
    day: string;
    timeSlot: string;
    attendees: number;
    attendeeNames: string[];
    score: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TIME_SLOTS = [
    { value: 'morning', label: 'Morning (9-12)' },
    { value: 'lunch', label: 'Lunch (12-1)' },
    { value: 'afternoon', label: 'Afternoon (1-5)' },
    { value: 'evening', label: 'Evening (5-7)' },
];

const TIMEZONE_OPTIONS = [
    { value: 'PST', label: 'PST (Pacific)' },
    { value: 'MST', label: 'MST (Mountain)' },
    { value: 'CST', label: 'CST (Central)' },
    { value: 'EST', label: 'EST (Eastern)' },
    { value: 'GMT', label: 'GMT (London)' },
    { value: 'CET', label: 'CET (Paris)' },
    { value: 'IST', label: 'IST (India)' },
];

const HybridOfficeDayPlanner: React.FC = () => {
    const { showToast } = useToast();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [dayAnalysis, setDayAnalysis] = useState<DayAnalysis[]>([]);
    const [recommendations, setRecommendations] = useState<ScheduleRecommendation[]>([]);
    const [meetingDuration, setMeetingDuration] = useState(60);

    const [newMember, setNewMember] = useState({
        name: '',
        role: '',
        timezone: 'EST',
        officeDays: [] as string[],
        preferredMeetingTimes: [] as string[],
    });

    const toggleDay = (day: string) => {
        const days = newMember.officeDays.includes(day)
            ? newMember.officeDays.filter(d => d !== day)
            : [...newMember.officeDays, day];
        setNewMember({ ...newMember, officeDays: days });
    };

    const toggleTimeSlot = (slot: string) => {
        const slots = newMember.preferredMeetingTimes.includes(slot)
            ? newMember.preferredMeetingTimes.filter(s => s !== slot)
            : [...newMember.preferredMeetingTimes, slot];
        setNewMember({ ...newMember, preferredMeetingTimes: slots });
    };

    const handleAddMember = () => {
        if (!newMember.name || !newMember.role || newMember.officeDays.length === 0) {
            showToast('Please fill in name, role, and select at least one office day', 'warning');
            return;
        }

        const member: TeamMember = {
            id: `member-${Date.now()}`,
            name: newMember.name,
            role: newMember.role,
            timezone: newMember.timezone,
            officeDays: newMember.officeDays,
            preferredMeetingTimes: newMember.preferredMeetingTimes.length > 0 ? newMember.preferredMeetingTimes : ['morning', 'afternoon'],
        };

        setTeamMembers([...teamMembers, member]);
        setNewMember({
            name: '',
            role: '',
            timezone: 'EST',
            officeDays: [],
            preferredMeetingTimes: [],
        });
        showToast('Team member added', 'success');
    };

    const loadSampleData = () => {
        const sampleMembers: TeamMember[] = [
            { id: '1', name: 'Alice Chen', role: 'Engineering Manager', timezone: 'PST', officeDays: ['Monday', 'Tuesday', 'Wednesday'], preferredMeetingTimes: ['morning', 'afternoon'] },
            { id: '2', name: 'Bob Smith', role: 'Senior Engineer', timezone: 'PST', officeDays: ['Tuesday', 'Wednesday', 'Thursday'], preferredMeetingTimes: ['morning'] },
            { id: '3', name: 'Carol Davis', role: 'Product Manager', timezone: 'EST', officeDays: ['Monday', 'Wednesday', 'Friday'], preferredMeetingTimes: ['afternoon'] },
            { id: '4', name: 'David Lee', role: 'Designer', timezone: 'EST', officeDays: ['Tuesday', 'Wednesday', 'Thursday'], preferredMeetingTimes: ['morning', 'afternoon'] },
            { id: '5', name: 'Emma Wilson', role: 'Engineer', timezone: 'CST', officeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], preferredMeetingTimes: ['afternoon'] },
            { id: '6', name: 'Frank Brown', role: 'QA Lead', timezone: 'EST', officeDays: ['Wednesday', 'Thursday', 'Friday'], preferredMeetingTimes: ['morning'] },
            { id: '7', name: 'Grace Kim', role: 'Engineer', timezone: 'PST', officeDays: ['Monday', 'Wednesday'], preferredMeetingTimes: ['morning', 'afternoon'] },
            { id: '8', name: 'Henry Zhang', role: 'Tech Lead', timezone: 'GMT', officeDays: ['Tuesday', 'Wednesday', 'Thursday'], preferredMeetingTimes: ['morning'] },
        ];
        setTeamMembers(sampleMembers);
        showToast('Sample team loaded', 'info');
    };

    const removeMember = (id: string) => {
        setTeamMembers(teamMembers.filter(m => m.id !== id));
        showToast('Member removed', 'info');
    };

    const analyzSchedule = () => {
        if (teamMembers.length < 2) {
            showToast('Please add at least 2 team members', 'warning');
            return;
        }

        // Analyze each day
        const analysis: DayAnalysis[] = DAYS.map(day => {
            const available = teamMembers.filter(m => m.officeDays.includes(day));

            // Find best time slots for this day
            const timeSlotCounts: Record<string, number> = {};
            available.forEach(m => {
                m.preferredMeetingTimes.forEach(slot => {
                    timeSlotCounts[slot] = (timeSlotCounts[slot] || 0) + 1;
                });
            });

            const bestTimeSlots = Object.entries(timeSlotCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 2)
                .map(([slot]) => TIME_SLOTS.find(t => t.value === slot)?.label || slot);

            return {
                day,
                availableCount: available.length,
                availableMembers: available.map(m => m.name),
                availabilityPercent: Math.round((available.length / teamMembers.length) * 100),
                bestTimeSlots,
            };
        });

        setDayAnalysis(analysis);

        // Generate recommendations
        const recs: ScheduleRecommendation[] = [];

        DAYS.forEach(day => {
            const dayData = analysis.find(a => a.day === day)!;
            if (dayData.availableCount < 2) return;

            // Check each time slot
            TIME_SLOTS.forEach(slot => {
                const available = teamMembers.filter(m =>
                    m.officeDays.includes(day) &&
                    m.preferredMeetingTimes.includes(slot.value)
                );

                if (available.length >= 2) {
                    // Calculate score based on attendance and time zone compatibility
                    let score = (available.length / teamMembers.length) * 70;

                    // Bonus for high attendance
                    if (available.length >= teamMembers.length * 0.8) score += 20;
                    else if (available.length >= teamMembers.length * 0.6) score += 10;

                    // Timezone compatibility bonus (simplified)
                    const timezones = new Set(available.map(m => m.timezone));
                    if (timezones.size <= 2) score += 10;

                    recs.push({
                        day,
                        timeSlot: slot.label,
                        attendees: available.length,
                        attendeeNames: available.map(m => m.name),
                        score: Math.round(score),
                    });
                }
            });
        });

        // Sort by score
        recs.sort((a, b) => b.score - a.score);
        setRecommendations(recs.slice(0, 10));

        showToast('Schedule analysis complete', 'success');
    };

    const chartData = dayAnalysis.map(d => ({
        name: d.day.substring(0, 3),
        available: d.availableCount,
        percent: d.availabilityPercent,
    }));

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Hybrid Office Day Planner</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Identify optimal days for hybrid team meetings based on employee in-office schedules.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Team Member */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Add Team Member</h2>
                    <div className="space-y-4">
                        <Input
                            label="Name *"
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            placeholder="Full name"
                        />
                        <Input
                            label="Role *"
                            value={newMember.role}
                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                            placeholder="Job title"
                        />
                        <Select
                            label="Timezone"
                            value={newMember.timezone}
                            onChange={(e) => setNewMember({ ...newMember, timezone: e.target.value })}
                            options={TIMEZONE_OPTIONS}
                        />

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Office Days *
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                            newMember.officeDays.includes(day)
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                        }`}
                                    >
                                        {day.substring(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Preferred Meeting Times
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TIME_SLOTS.map(slot => (
                                    <button
                                        key={slot.value}
                                        onClick={() => toggleTimeSlot(slot.value)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                            newMember.preferredMeetingTimes.includes(slot.value)
                                                ? 'bg-secondary-600 text-white'
                                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                        }`}
                                    >
                                        {slot.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="primary" onClick={handleAddMember}>
                                Add Member
                            </Button>
                            <Button variant="outline" onClick={loadSampleData}>
                                Load Sample
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Team Members List */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                        Team Members ({teamMembers.length})
                    </h2>

                    {teamMembers.length === 0 ? (
                        <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                            No team members added yet.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {teamMembers.map(member => (
                                <div
                                    key={member.id}
                                    className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-neutral-800 dark:text-neutral-100">{member.name}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {member.role} • {member.timezone}
                                            </p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => removeMember(member.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {member.officeDays.map(day => (
                                            <span
                                                key={day}
                                                className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs rounded"
                                            >
                                                {day.substring(0, 3)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Analysis Actions */}
                <Card>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Find Optimal Times</h2>
                    <div className="space-y-4">
                        <Input
                            label="Meeting Duration (minutes)"
                            type="number"
                            value={meetingDuration.toString()}
                            onChange={(e) => setMeetingDuration(parseInt(e.target.value) || 30)}
                        />
                        <Button
                            variant="primary"
                            onClick={analyzSchedule}
                            disabled={teamMembers.length < 2}
                            className="w-full"
                        >
                            Analyze Schedule
                        </Button>

                        {teamMembers.length > 0 && (
                            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    <strong>Summary:</strong>
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                    {teamMembers.length} team members across {new Set(teamMembers.map(m => m.timezone)).size} timezone(s)
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Analysis Results */}
            {dayAnalysis.length > 0 && (
                <div className="mt-6 space-y-6">
                    {/* Day Availability Chart */}
                    <Card>
                        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Office Availability by Day</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="available" fill="#8884d8" name="Team Members" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Day Details */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {dayAnalysis.map(day => (
                            <Card key={day.day} className={`${
                                day.availabilityPercent >= 70 ? 'border-green-500 border-2' :
                                day.availabilityPercent >= 50 ? 'border-yellow-500 border-2' : ''
                            }`}>
                                <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">{day.day}</h4>
                                <p className={`text-2xl font-bold ${
                                    day.availabilityPercent >= 70 ? 'text-green-600' :
                                    day.availabilityPercent >= 50 ? 'text-yellow-600' : 'text-neutral-600'
                                }`}>
                                    {day.availabilityPercent}%
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {day.availableCount} of {teamMembers.length} available
                                </p>
                                {day.bestTimeSlots.length > 0 && (
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                                        Best: {day.bestTimeSlots[0]}
                                    </p>
                                )}
                            </Card>
                        ))}
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                                Top Meeting Time Recommendations
                            </h3>
                            <div className="space-y-3">
                                {recommendations.slice(0, 5).map((rec, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg ${
                                            index === 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                                            'bg-neutral-50 dark:bg-neutral-800'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                                                    {index === 0 && '⭐ '}{rec.day} - {rec.timeSlot}
                                                </p>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    {rec.attendees} of {teamMembers.length} team members available
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                                    {rec.attendeeNames.join(', ')}
                                                </p>
                                            </div>
                                            <div className={`text-lg font-bold ${
                                                rec.score >= 80 ? 'text-green-600' :
                                                rec.score >= 60 ? 'text-yellow-600' : 'text-neutral-600'
                                            }`}>
                                                {rec.score}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Who's Missing */}
                    {recommendations.length > 0 && recommendations[0].attendees < teamMembers.length && (
                        <Card>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                                Members Not Available for Top Slot
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {teamMembers
                                    .filter(m => !recommendations[0].attendeeNames.includes(m.name))
                                    .map(member => (
                                        <span
                                            key={member.id}
                                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm rounded-full"
                                        >
                                            {member.name} ({member.timezone})
                                        </span>
                                    ))}
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">
                                Consider async updates or recording the meeting for these team members.
                            </p>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default HybridOfficeDayPlanner;
