import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import {ToolsData} from "../components/tools/ToolsData";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

// Tool data with descriptions

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
          {ToolsData.map((tool) => (
            <Link key={tool.id} to={tool.path} className="block">
              <Card
                className="h-full transition-shadow hover:shadow-lg"
                hoverable
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 text-primary-600">
                    <FontAwesomeIcon icon={tool.icon} />
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
