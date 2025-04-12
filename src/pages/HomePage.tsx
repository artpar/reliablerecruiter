import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';

// Tool data with descriptions
const tools = [
  {
    id: 'inclusive-jd-checker',
    name: 'Inclusive JD Checker',
    description: 'Scan job descriptions for biased language and get suggestions for more inclusive alternatives.',
    path: '/tools/inclusive-jd-checker',
    icon: 'document-text',
  },
  {
    id: 'resume-anonymizer',
    name: 'Resume Anonymizer',
    description: 'Remove personal identifiers from resumes to reduce unconscious bias in the hiring process.',
    path: '/tools/resume-anonymizer',
    icon: 'user-circle',
  },
  {
    id: 'diverse-panel-planner',
    name: 'Diverse Panel Planner',
    description: 'Visualize and balance demographic representation in interview panels.',
    path: '/tools/diverse-panel-planner',
    icon: 'users',
  },
  {
    id: 'layoff-impact-analyzer',
    name: 'Layoff Impact Analyzer',
    description: 'Analyze the diversity and skill impact of planned layoffs.',
    path: '/tools/layoff-impact-analyzer',
    icon: 'chart-bar',
  },
  {
    id: 'boomerang-talent-finder',
    name: 'Boomerang Talent Finder',
    description: 'Identify former employees suitable for rehire based on skills and past performance.',
    path: '/tools/boomerang-talent-finder',
    icon: 'refresh',
  },
  {
    id: 'ai-outreach-personalizer',
    name: 'AI Outreach Personalizer',
    description: 'Enhance personalization in recruitment outreach templates.',
    path: '/tools/ai-outreach-personalizer',
    icon: 'mail',
  },
  {
    id: 'interview-load-balancer',
    name: 'Interview Load Balancer',
    description: 'Visualize and balance interviewer workload distribution.',
    path: '/tools/interview-load-balancer',
    icon: 'scale',
  },
  {
    id: 'candidate-experience-pulse',
    name: 'Candidate Experience Pulse',
    description: 'Aggregate candidate feedback to identify pain points in the hiring process.',
    path: '/tools/candidate-experience-pulse',
    icon: 'heart',
  },
  {
    id: 'hybrid-office-day-planner',
    name: 'Hybrid Office Day Planner',
    description: 'Identify optimal days for hybrid team meetings based on employee schedules.',
    path: '/tools/hybrid-office-day-planner',
    icon: 'calendar',
  },
  {
    id: 'offer-comparator',
    name: 'Offer Comparator',
    description: 'Benchmark candidate offers against internal standards for equity.',
    path: '/tools/offer-comparator',
    icon: 'currency-dollar',
  },
];

// Simple icon component based on icon name
const Icon: React.FC<{ name: string }> = ({ name }) => {
  // We would normally use a proper icon library here, but for simplicity we're using a switch
  switch (name) {
    case 'document-text':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'user-circle':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'chart-bar':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'refresh':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'mail':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'scale':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      );
    case 'heart':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'currency-dollar':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
  }
};

const HomePage: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">ReliableRecruiter.Space</h1>
        <p className="text-lg text-neutral-600 mt-2">
          A suite of tools designed to assist HR professionals and recruiters with daily tasks.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-700 mb-3">Available Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link key={tool.id} to={tool.path} className="block">
              <Card
                className="h-full transition-shadow hover:shadow-lg"
                hoverable
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 text-primary-600">
                    <Icon name={tool.icon} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-neutral-800">{tool.name}</h3>
                    <p className="mt-1 text-neutral-600">{tool.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12 bg-neutral-50 p-6 rounded-lg border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-700 mb-3">Getting Started</h2>
        <p className="text-neutral-600 mb-4">
          Each tool works independently and is designed to provide immediate value using your existing data.
          Simply click on a tool card above to get started.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-md border border-neutral-200">
            <div className="text-primary-600 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-800">Upload Data</h3>
            <p className="text-sm text-neutral-600 mt-1">Import your existing files or paste text directly into the tools.</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-neutral-200">
            <div className="text-primary-600 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-800">Process and Analyze</h3>
            <p className="text-sm text-neutral-600 mt-1">The tools automatically process your data and generate insights.</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-neutral-200">
            <div className="text-primary-600 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-800">Export Results</h3>
            <p className="text-sm text-neutral-600 mt-1">Download your results or adjusted data for immediate use.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
