import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Select from '../components/common/Select';
import useToast from '../hooks/useToast';

interface CandidateInfo {
    name: string;
    currentRole: string;
    currentCompany: string;
    skills: string;
    experience: string;
    education: string;
    achievements: string;
    interests: string;
    mutualConnections: string;
}

interface PersonalizationSuggestion {
    category: string;
    original: string;
    personalized: string;
    reason: string;
}

const TEMPLATE_EXAMPLES = [
    {
        name: 'Initial Outreach',
        template: `Hi [NAME],

I came across your profile and was impressed by your background in [FIELD].

We're building something exciting at [COMPANY] and I think your experience could be a great fit for our [ROLE] position.

Would you be open to a quick chat to learn more?

Best,
[YOUR_NAME]`,
    },
    {
        name: 'Follow-up',
        template: `Hi [NAME],

I wanted to follow up on my previous message about the [ROLE] opportunity at [COMPANY].

I understand you're busy, but I'd love to share more about the exciting projects our team is working on.

Let me know if you'd like to schedule a brief call.

Best,
[YOUR_NAME]`,
    },
    {
        name: 'Referral Outreach',
        template: `Hi [NAME],

[MUTUAL_CONNECTION] suggested I reach out to you regarding an opportunity at [COMPANY].

Based on your background in [FIELD], I think you'd be a fantastic fit for our [ROLE] position.

Would you have 15 minutes this week for a quick chat?

Best,
[YOUR_NAME]`,
    },
];

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly & Casual' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'concise', label: 'Concise & Direct' },
];

const AIOutreachPersonalizer: React.FC = () => {
    const { showToast } = useToast();

    const [template, setTemplate] = useState('');
    const [personalizedMessage, setPersonalizedMessage] = useState('');
    const [suggestions, setSuggestions] = useState<PersonalizationSuggestion[]>([]);
    const [tone, setTone] = useState('professional');

    const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
        name: '',
        currentRole: '',
        currentCompany: '',
        skills: '',
        experience: '',
        education: '',
        achievements: '',
        interests: '',
        mutualConnections: '',
    });

    const loadTemplate = (templateText: string) => {
        setTemplate(templateText);
        showToast('Template loaded', 'info');
    };

    const loadSampleCandidate = () => {
        setCandidateInfo({
            name: 'Alex Rivera',
            currentRole: 'Senior Software Engineer',
            currentCompany: 'TechCorp',
            skills: 'React, TypeScript, Node.js, AWS, System Design',
            experience: '6 years in full-stack development, previously at Google',
            education: 'MS Computer Science, Stanford University',
            achievements: 'Led migration to microservices architecture, 40% performance improvement',
            interests: 'Open source contribution, machine learning, rock climbing',
            mutualConnections: 'Sarah Chen (former colleague)',
        });
        showToast('Sample candidate loaded', 'info');
    };

    const personalizeMessage = () => {
        if (!template.trim()) {
            showToast('Please enter a template message', 'warning');
            return;
        }

        if (!candidateInfo.name) {
            showToast('Please enter candidate name', 'warning');
            return;
        }

        let personalized = template;
        const newSuggestions: PersonalizationSuggestion[] = [];

        // Basic replacements
        personalized = personalized.replace(/\[NAME\]/gi, candidateInfo.name.split(' ')[0]);

        // Role-specific personalization
        if (candidateInfo.currentRole) {
            personalized = personalized.replace(/\[FIELD\]/gi, candidateInfo.currentRole);

            // Add role-based hook
            if (personalized.includes('your profile') || personalized.includes('your background')) {
                const roleHook = `your work as a ${candidateInfo.currentRole}`;
                if (candidateInfo.currentCompany) {
                    personalized = personalized.replace(
                        /your (profile|background)/gi,
                        `${roleHook} at ${candidateInfo.currentCompany}`
                    );
                }
            }
        }

        // Mutual connections
        if (candidateInfo.mutualConnections) {
            personalized = personalized.replace(/\[MUTUAL_CONNECTION\]/gi, candidateInfo.mutualConnections.split('(')[0].trim());
        }

        // Skills personalization
        if (candidateInfo.skills) {
            const skillsList = candidateInfo.skills.split(',').map(s => s.trim());
            const topSkills = skillsList.slice(0, 2).join(' and ');

            if (!personalized.toLowerCase().includes('skill')) {
                newSuggestions.push({
                    category: 'Skills Reference',
                    original: 'Generic message',
                    personalized: `Mention their expertise in ${topSkills}`,
                    reason: 'Referencing specific skills shows you\'ve researched the candidate',
                });
            }
        }

        // Achievements personalization
        if (candidateInfo.achievements) {
            newSuggestions.push({
                category: 'Achievement Recognition',
                original: 'Generic praise',
                personalized: `Reference their achievement: "${candidateInfo.achievements.substring(0, 60)}..."`,
                reason: 'Specific achievements create a stronger personal connection',
            });
        }

        // Interests personalization
        if (candidateInfo.interests) {
            const interests = candidateInfo.interests.split(',').map(s => s.trim());
            if (interests.length > 0) {
                newSuggestions.push({
                    category: 'Common Interest',
                    original: 'No personal touch',
                    personalized: `Mention shared interest in ${interests[0]}`,
                    reason: 'Common interests build rapport and increase response rates',
                });
            }
        }

        // Education personalization
        if (candidateInfo.education && candidateInfo.education.toLowerCase().includes('stanford')) {
            newSuggestions.push({
                category: 'Education Reference',
                original: 'No education mention',
                personalized: 'Reference their Stanford background',
                reason: 'Alma mater connections can be powerful rapport builders',
            });
        }

        // Tone adjustments
        if (tone === 'friendly') {
            personalized = personalized
                .replace(/I wanted to/gi, 'I\'d love to')
                .replace(/Would you be open to/gi, 'Any chance you\'d be up for')
                .replace(/Best,/gi, 'Cheers,');
        } else if (tone === 'enthusiastic') {
            personalized = personalized
                .replace(/impressed by/gi, 'really excited about')
                .replace(/great fit/gi, 'amazing fit')
                .replace(/exciting/gi, 'incredible');
        } else if (tone === 'concise') {
            // Remove filler phrases
            personalized = personalized
                .replace(/I understand you're busy, but /gi, '')
                .replace(/I wanted to follow up on my previous message about /gi, 'Following up on ')
                .replace(/Would you have 15 minutes this week for a quick chat\?/gi, '15 min chat this week?');
        }

        // Add opening hook based on candidate info
        if (candidateInfo.achievements && !personalized.includes(candidateInfo.achievements.substring(0, 20))) {
            const hookSentence = `I was particularly impressed by your work on ${candidateInfo.achievements.split(',')[0].toLowerCase()}.`;

            // Insert after first sentence
            const firstPeriod = personalized.indexOf('.');
            if (firstPeriod > 0 && firstPeriod < 200) {
                personalized = personalized.slice(0, firstPeriod + 1) + ' ' + hookSentence + personalized.slice(firstPeriod + 1);
            }
        }

        // Google experience highlight
        if (candidateInfo.experience && candidateInfo.experience.toLowerCase().includes('google')) {
            newSuggestions.push({
                category: 'Experience Highlight',
                original: 'Generic experience mention',
                personalized: 'Reference their Google experience specifically',
                reason: 'Major company experience is worth calling out',
            });
        }

        setPersonalizedMessage(personalized);
        setSuggestions(newSuggestions);
        showToast('Message personalized', 'success');
    };

    const applySuggestion = (suggestion: PersonalizationSuggestion) => {
        // This would integrate the suggestion into the message
        // For now, we'll just show a toast
        showToast(`Apply "${suggestion.category}" suggestion manually`, 'info');
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(personalizedMessage);
            showToast('Copied to clipboard', 'success');
        } catch (error) {
            showToast('Failed to copy', 'error');
        }
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">AI Outreach Personalizer</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Enhance personalization in recruitment outreach templates based on candidate information.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Input */}
                <div className="space-y-6">
                    {/* Template Selection */}
                    <Card>
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Message Template</h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {TEMPLATE_EXAMPLES.map((t) => (
                                <Button
                                    key={t.name}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadTemplate(t.template)}
                                >
                                    {t.name}
                                </Button>
                            ))}
                        </div>
                        <TextArea
                            label="Template"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            placeholder="Enter your outreach template or select one above..."
                            rows={10}
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                            Use placeholders: [NAME], [FIELD], [COMPANY], [ROLE], [MUTUAL_CONNECTION]
                        </p>
                    </Card>

                    {/* Candidate Information */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Candidate Information</h2>
                            <Button variant="outline" size="sm" onClick={loadSampleCandidate}>
                                Load Sample
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Name *"
                                value={candidateInfo.name}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, name: e.target.value })}
                                placeholder="Full name"
                            />
                            <Input
                                label="Current Role"
                                value={candidateInfo.currentRole}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, currentRole: e.target.value })}
                                placeholder="Job title"
                            />
                            <Input
                                label="Current Company"
                                value={candidateInfo.currentCompany}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, currentCompany: e.target.value })}
                                placeholder="Company name"
                            />
                            <Input
                                label="Skills"
                                value={candidateInfo.skills}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, skills: e.target.value })}
                                placeholder="Key skills"
                            />
                            <Input
                                label="Experience"
                                value={candidateInfo.experience}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, experience: e.target.value })}
                                placeholder="Notable experience"
                            />
                            <Input
                                label="Education"
                                value={candidateInfo.education}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, education: e.target.value })}
                                placeholder="Degree, school"
                            />
                            <div className="col-span-2">
                                <Input
                                    label="Achievements"
                                    value={candidateInfo.achievements}
                                    onChange={(e) => setCandidateInfo({ ...candidateInfo, achievements: e.target.value })}
                                    placeholder="Notable achievements"
                                />
                            </div>
                            <Input
                                label="Interests"
                                value={candidateInfo.interests}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, interests: e.target.value })}
                                placeholder="Hobbies, interests"
                            />
                            <Input
                                label="Mutual Connections"
                                value={candidateInfo.mutualConnections}
                                onChange={(e) => setCandidateInfo({ ...candidateInfo, mutualConnections: e.target.value })}
                                placeholder="Shared connections"
                            />
                        </div>
                    </Card>

                    {/* Tone Selection */}
                    <Card>
                        <div className="flex items-center gap-4">
                            <Select
                                label="Message Tone"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                options={TONE_OPTIONS}
                            />
                            <Button variant="primary" onClick={personalizeMessage} className="mt-6">
                                Personalize Message
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Output */}
                <div className="space-y-6">
                    {/* Personalized Message */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Personalized Message</h2>
                            {personalizedMessage && (
                                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                    Copy
                                </Button>
                            )}
                        </div>
                        {personalizedMessage ? (
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                                <pre className="whitespace-pre-wrap font-sans text-neutral-700 dark:text-neutral-300 text-sm">
                                    {personalizedMessage}
                                </pre>
                            </div>
                        ) : (
                            <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                                Enter a template and candidate info, then click "Personalize Message"
                            </p>
                        )}
                    </Card>

                    {/* Personalization Suggestions */}
                    {suggestions.length > 0 && (
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                                Personalization Suggestions
                            </h2>
                            <div className="space-y-4">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-blue-800 dark:text-blue-300">
                                                {suggestion.category}
                                            </h3>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => applySuggestion(suggestion)}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                                            <strong>Suggestion:</strong> {suggestion.personalized}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {suggestion.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Tips */}
                    <Card>
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                            Outreach Best Practices
                        </h2>
                        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                Keep subject lines under 50 characters
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                Reference specific achievements or projects
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                Mention mutual connections when possible
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                Include a clear call-to-action
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                Keep messages under 150 words for initial outreach
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500">✗</span>
                                Avoid generic phrases like "I found your profile"
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500">✗</span>
                                Don't oversell the position in first contact
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AIOutreachPersonalizer;
