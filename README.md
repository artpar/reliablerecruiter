# Project Instructions: RR.Space - React & Tailwind Project

## Project Overview

RR.Space is a web application consisting of several independent mini-tools designed to assist recruiters and HR professionals. Each tool is accessible on its own page and can be used independently without dependencies on other tools. The application will focus on delivering immediate value through one-shot utilities that leverage existing HR/recruiter data.

## Core Requirements

1. **Single-Page Application**: React-based SPA with multiple routes for each mini-tool
2. **Responsive Design**: Fully responsive UI that works on desktop and mobile devices
3. **Independent Tools**: Each mini-tool functions independently on its own page
4. **Consistent UI/UX**: Unified design system across all tools
5. **Code Reusability**: Shared components, hooks, and utilities across tools
6. **Maintainability**: Clean architecture with separation of concerns
7. **Performance**: Optimized for quick loading and interactions

## Mini-Tools to Implement

Based on the provided document, implement the following tools:

1. **Inclusive JD Checker**: Scans job descriptions for biased language and suggests alternatives
2. **Resume Anonymizer**: Removes personal identifiers from resumes to reduce unconscious bias
3. **Diverse Panel Planner**: Visualizes demographic representation in interview panels
4. **Layoff Impact Analyzer**: Shows diversity and skill impacts of planned layoffs
5. **Boomerang Talent Finder**: Identifies former employees suitable for rehire
6. **AI Outreach Personalizer**: Enhances personalization in recruitment outreach templates
7. **Interview Load Balancer**: Visualizes interviewer workload distribution
8. **Candidate Experience Pulse**: Aggregates candidate feedback to identify pain points
9. **Hybrid Office Day Planner**: Identifies optimal days for hybrid team meetings
10. **Offer Comparator**: Benchmarks candidate offers against internal standards

## Project Structure

```
hr-toolkit/
├── public/
├── src/
│   ├── assets/             # Static assets like images and icons
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Shared components (buttons, inputs, cards, etc.)
│   │   ├── layout/         # Layout components (Navbar, Footer, etc.)
│   │   └── tools/          # Tool-specific components
│   ├── context/            # React context providers
│   ├── data/               # Mock data and constants
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components for each tool and main pages
│   ├── services/           # API and utility services
│   ├── styles/             # Global styles and Tailwind customization
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Entry point
│   └── routes.tsx          # Route definitions
├── .eslintrc.js            # ESLint configuration
├── .prettierrc             # Prettier configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Component Architecture

1. **Core Layout Components**:
    - `Layout`: Main layout wrapper with navigation and content area
    - `Navbar`: Navigation with links to all tools and app settings
    - `Footer`: App information and links
    - `Sidebar`: Optional collapsible sidebar for navigation on larger screens

2. **Common UI Components**:
    - `Button`: Reusable button component with variants (primary, secondary, etc.)
    - `Card`: Container for content with consistent styling
    - `Input`: Form input components with validation
    - `FileUpload`: Reusable file upload component for CSV, PDF, etc.
    - `Select`: Dropdown selection component
    - `Modal`: Dialog component for confirmations and forms
    - `Alert`: Notification component for success/error messages
    - `Tabs`: Tab navigation component for sectioned content
    - `DataTable`: Reusable table component with sorting and filtering
    - `Visualization`: Chart and graph components (bar, line, pie charts)

3. **Tool-Specific Components**:
    - Modular components for each tool's unique functionality
    - Each tool should have its components in a dedicated folder

## Shared Hooks and Services

1. **Custom Hooks**:
    - `useFileUpload`: Handle file uploads with validation
    - `useLocalStorage`: Persist data locally between sessions
    - `useForm`: Form handling with validation
    - `useToast`: Display toast notifications
    - `useAnalytics`: Track user interactions (optional)

2. **Services**:
    - `FileProcessingService`: Process uploaded files (CSV, PDF, etc.)
    - `AnalysisService`: Analyze text for bias, skills, etc.
    - `VisualizationService`: Generate visualization data
    - `ExportService`: Export results to CSV, PDF, etc.

## State Management

1. **React Context**:
    - `AppContext`: Global application state
    - `UserContext`: User preferences and settings
    - `FileContext`: Manage file uploads across components

2. **Local Component State**:
    - Use `useState` for component-specific state
    - Use `useReducer` for more complex state logic

## Styling Strategy

1. **Tailwind Configuration**:
    - Create a custom theme with brand colors, typography, and spacing
    - Define reusable classes for common patterns
    - Set up dark mode support (optional)

2. **Component Styling**:
    - Use composition of Tailwind utility classes
    - Create component-specific styles when needed
    - Ensure responsive design across all components

3. **Global Styles**:
    - Minimal global styles
    - CSS variables for theme customization

## Routing and Navigation

1. **Route Structure**:
    - Home page with overview of all tools
    - Individual routes for each tool (/tools/jd-checker, /tools/resume-anonymizer, etc.)
    - Settings and help pages

2. **Navigation Component**:
    - Responsive navigation with mobile menu
    - Breadcrumbs for navigation context
    - Active states for current tool

## File Handling and Processing

1. **File Upload**:
    - Support for multiple file formats (CSV, XLSX, PDF, DOCX)
    - Validation for file types and sizes
    - Progress indicators for uploads

2. **Data Processing**:
    - Process files client-side where possible
    - Clear error handling for invalid files
    - Preview functionality before processing

3. **Results Handling**:
    - Save results temporarily in local storage
    - Export options (CSV, PDF, etc.)
    - Clear data option for privacy

## Implementation Guidelines

### Phase 1: Project Setup and Core Components

- [x] Initialize React project with TypeScript and Tailwind CSS
- [x] Set up project structure and routing
- [x] Create core layout components
- [x] Implement common UI components
- [x] Configure global styling and theme

### Phase 2: Shared Services and Hooks

- [x] Implement file upload and processing services
- [x] Create context providers for global state
- [x] Develop custom hooks for shared functionality
- [x] Set up utilities for text analysis and data processing

### Phase 3: Individual Tool Implementation

For each tool:
- [ ] Create dedicated page component
- [ ] Implement tool-specific components
- [ ] Connect to shared services and hooks
- [ ] Add tool-specific logic and processing
- [ ] Implement results visualization and export

### Phase 4: Testing and Optimization

- [ ] Unit testing for core components and services
- [ ] Integration testing for each tool
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Cross-browser testing

## Tool-Specific Implementation Details

### 1. Inclusive JD Checker

**Functionality**:
- Upload/paste job description text
- Scan for biased or exclusionary language
- Highlight problematic phrases
- Suggest inclusive alternatives
- Generate improved job description

**Components**:
- `JDInput`: Text area or file upload for job descriptions
- `BiasHighlighter`: Component to highlight biased terms
- `SuggestionList`: Display alternative phrases
- `JDPreview`: Preview improved job description

### 2. Resume Anonymizer

**Functionality**:
- Upload single or batch of resumes
- Detect and remove personal identifiers
- Preview anonymized resumes
- Download or export anonymized versions

**Components**:
- `ResumeUploader`: Batch file upload for resumes
- `AnonymizationSettings`: Configure what information to remove
- `AnonymizedPreview`: Preview anonymized content
- `BatchExport`: Export multiple processed files

### 3. Diverse Panel Planner

**Functionality**:
- Upload or input interviewer list with attributes
- Visualize demographic representation
- Suggest panel adjustments
- Save and export balanced panels

**Components**:
- `InterviewerInput`: Input form for interviewer details
- `DiversityVisualization`: Charts showing representation
- `PanelSuggestions`: Suggested panel combinations
- `PanelExport`: Export panel assignments

### 4. Layoff Impact Analyzer

**Functionality**:
- Upload layoff list data
- Visualize diversity and skill impacts
- Show alerts for disproportionate impacts
- Generate impact reports

**Components**:
- `LayoffDataUpload`: File upload for layoff lists
- `ImpactDashboard`: Visualizations of layoff impacts
- `AlertPanel`: Alerts for concerning trends
- `ImpactReport`: Detailed report of analysis

### 5. Boomerang Talent Finder

**Functionality**:
- Upload alumni data and open roles
- Match former employees to current openings
- Rank potential matches
- Generate outreach messages

**Components**:
- `AlumniUpload`: Upload alumni database
- `RoleInput`: Input current open positions
- `MatchGrid`: Display ranked matches
- `OutreachTemplates`: Generate reconnection messages

### 6. AI Outreach Personalizer

**Functionality**:
- Input template outreach message
- Upload or input candidate information
- Generate personalized outreach drafts
- Preview and export personalized messages

**Components**:
- `TemplateInput`: Text area for outreach templates
- `CandidateInfo`: Input candidate details
- `PersonalizationSettings`: Configure personalization depth
- `MessagePreview`: Preview generated messages

### 7. Interview Load Balancer

**Functionality**:
- Import interviewer schedule data
- Visualize workload distribution
- Identify overloaded interviewers
- Suggest redistribution of interviews

**Components**:
- `ScheduleImport`: Import calendar/schedule data
- `WorkloadDashboard`: Visual representation of interviewer loads
- `RedistributionSuggestions`: Balanced schedule options
- `ScheduleExport`: Export adjusted schedules

### 8. Candidate Experience Pulse

**Functionality**:
- Import candidate feedback data
- Analyze sentiment and identify patterns
- Visualize pain points in the process
- Generate insight report

**Components**:
- `FeedbackImport`: Import survey responses
- `SentimentAnalysis`: Analyze feedback sentiment
- `PainPointVisualization`: Highlight process issues
- `InsightGenerator`: Create actionable insights

### 9. Hybrid Office Day Planner

**Functionality**:
- Import team availability data
- Visualize optimal meeting days
- Configure team preferences
- Generate meeting schedule suggestions

**Components**:
- `AvailabilityImport`: Import calendar/availability data
- `TeamPreferences`: Set team meeting requirements
- `OptimalDayVisualization`: Show best meeting days
- `ScheduleSuggestions`: Generate meeting schedule options

### 10. Offer Comparator

**Functionality**:
- Input candidate offer details
- Import internal or market salary data
- Visualize offer competitiveness
- Generate equity analysis report

**Components**:
- `OfferInput`: Form for offer details
- `ComparisonImport`: Import comparison data
- `EquityVisualization`: Charts showing offer fairness
- `ComparisonReport`: Detailed equity analysis

## Performance and Best Practices

1. **Code Splitting**:
    - Lazy load each tool page
    - Split code by feature

2. **Memoization**:
    - Use React.memo, useMemo, and useCallback
    - Optimize expensive calculations

3. **File Processing**:
    - Use Web Workers for heavy processing
    - Process files in chunks for large datasets

4. **State Management**:
    - Keep state close to where it's used
    - Minimize context updates

5. **Accessibility**:
    - Semantic HTML elements
    - ARIA attributes where needed
    - Keyboard navigation support

## Deployment and CI/CD

1. **Build Process**:
    - Optimize bundle size
    - Generate source maps for production debugging

2. **Continuous Integration**:
    - Run tests on each commit
    - Verify build success

3. **Deployment Options**:
    - Static hosting (Netlify, Vercel, GitHub Pages)
    - Containerization for more complex deployments

## Documentation

1. **Component Documentation**:
    - Document props and usage
    - Provide examples

2. **Tool Documentation**:
    - Document each tool's functionality
    - Include usage instructions

3. **Code Comments**:
    - Comment complex logic
    - Document assumptions and edge cases

## Conclusion

This RR.Space project provides a suite of independent yet visually cohesive tools for HR professionals and recruiters. By focusing on component reusability, consistent design, and maintainable architecture, the project will be both flexible and sustainable long-term.

Each mini-tool delivers immediate value by solving specific HR problems quickly using existing data, making this a practical and impactful application for the target users.
