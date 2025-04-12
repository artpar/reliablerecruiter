// Import the specific icons you need
import {
    faCheckCircle,
    faUserSecret,
    faUsers,
    faChartBar,
    faUndo,
    faEnvelope,
    faBalanceScale,
    faHeartbeat,
    faCalendarAlt,
    faBalanceScaleRight
} from '@fortawesome/free-solid-svg-icons';

export const ToolsData = [
    {
        id: 'inclusive-jd-checker',
        name: 'Inclusive JD Checker',
        path: '/tools/inclusive-jd-checker',
        icon: faCheckCircle,
        description: 'Scan job descriptions for biased language and get suggestions for more inclusive alternatives.'
    },
    {
        id: 'resume-anonymizer',
        name: 'Resume Anonymizer',
        path: '/tools/resume-anonymizer',
        icon: faUserSecret,
        description: 'Remove personal identifiers from resumes to reduce unconscious bias in the hiring process.'
    },
    {
        id: 'diverse-panel-planner',
        name: 'Diverse Panel Planner',
        path: '/tools/diverse-panel-planner',
        icon: faUsers,
        description: 'Visualize and balance demographic representation in interview panels.'
    },
    {
        id: 'layoff-impact-analyzer',
        name: 'Layoff Impact Analyzer',
        path: '/tools/layoff-impact-analyzer',
        icon: faChartBar,
        description: 'Analyze the diversity and skill impact of planned layoffs.'
    },
    {
        id: 'boomerang-talent-finder',
        name: 'Boomerang Talent Finder',
        path: '/tools/boomerang-talent-finder',
        icon: faUndo,
        description: 'Identify former employees suitable for rehire based on skills and past performance.'
    },
    {
        id: 'ai-outreach-personalizer',
        name: 'AI Outreach Personalizer',
        path: '/tools/ai-outreach-personalizer',
        icon: faEnvelope,
        description: 'Enhance personalization in recruitment outreach templates.'
    },
    {
        id: 'interview-load-balancer',
        name: 'Interview Load Balancer',
        path: '/tools/interview-load-balancer',
        icon: faBalanceScale,
        description: 'Visualize and balance interviewer workload distribution.'
    },
    {
        id: 'candidate-experience-pulse',
        name: 'Candidate Experience Pulse',
        path: '/tools/candidate-experience-pulse',
        icon: faHeartbeat,
        description: 'Aggregate candidate feedback to identify pain points in the hiring process.'
    },
    {
        id: 'hybrid-office-day-planner',
        name: 'Hybrid Office Day Planner',
        path: '/tools/hybrid-office-day-planner',
        icon: faCalendarAlt,
        description: 'Identify optimal days for hybrid team meetings based on employee schedules.'
    },
    {
        id: 'offer-comparator',
        name: 'Offer Comparator',
        path: '/tools/offer-comparator',
        icon: faBalanceScaleRight,
        description: 'Benchmark candidate offers against internal standards for equity.'
    },
];
