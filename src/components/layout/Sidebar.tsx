import React, {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useUser} from '../../context/UserContext';
import {useApp} from '../../context/AppContext';
import {ToolsData} from "../tools/ToolsData";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";


const Sidebar: React.FC = () => {
    const location = useLocation();
    const {state: userState, dispatch: userDispatch} = useUser();
    const {dispatch} = useApp();
    const {sidebarCollapsed} = userState?.preferences || {sidebarCollapsed: false};
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [showTooltip, setShowTooltip] = useState<string | null>(null);

    // Use ToolsData if available, otherwise use mockToolsData
    const tools = ToolsData;

    // Filter tools based on search query and active category
    const filteredTools = tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !activeCategory || tool.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Recent tools
    const recentTools = userState?.preferences?.recentTools || [];
    const recentToolsData = recentTools
        .slice(0, 3)
        .map(toolId => tools.find(tool => tool.id === toolId))
        .filter(Boolean);

    const toggleSidebar = () => {
        userDispatch({type: 'TOGGLE_SIDEBAR'});
    };

    const handleToolClick = (toolId: string) => {
        dispatch({type: 'SET_CURRENT_TOOL', payload: toolId});
        userDispatch({type: 'ADD_RECENT_TOOL', payload: toolId});
    };

    // Handle mouse enter/leave for tooltips (when sidebar is collapsed)
    const handleMouseEnter = (toolId: string) => {
        if (sidebarCollapsed) {
            setShowTooltip(toolId);
        }
    };

    const handleMouseLeave = () => {
        setShowTooltip(null);
    };

    return (
        <div
            className={`h-full flex flex-col bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'w-16' : 'w-64'
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >

            {/* Search input (only when expanded) */}
            {!sidebarCollapsed && (
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full py-2 pl-10 pr-3 text-sm bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-neutral-900 dark:text-white placeholder-neutral-400"
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Tools list */}
            <div className="flex-1 overflow-y-auto p-2">
                <nav className="space-y-1">
                    {filteredTools.map((tool) => (
                        <div key={tool.id} className="relative" onMouseEnter={() => handleMouseEnter(tool.id)}
                             onMouseLeave={handleMouseLeave}>
                            <Link
                                to={tool.path}
                                className={`${
                                    location.pathname === tool.path
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
                                } group flex items-center rounded-md ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2'}`}
                                onClick={() => handleToolClick(tool.id)}
                            >
                                <div className={`${
                                    location.pathname === tool.path
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'
                                } flex-shrink-0`}>
                                    <FontAwesomeIcon icon={tool.icon}/>
                                </div>
                                {!sidebarCollapsed && (
                                    <span className="ml-3 text-sm font-medium truncate">{tool.name}</span>
                                )}
                            </Link>

                            {/* Tooltip for collapsed sidebar */}
                            {sidebarCollapsed && showTooltip === tool.id && (
                                <div
                                    className="absolute left-full top-0 ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded-md whitespace-nowrap z-50">
                                    {tool.name}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Recent Tools section */}
            {!sidebarCollapsed && recentToolsData.length > 0 && (
                <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Recent Tools
                    </h3>
                    <nav className="space-y-1">
                        {recentToolsData.map((tool) => {
                            if (!tool) return null;
                            return (
                                <Link
                                    key={tool.id}
                                    to={tool.path}
                                    className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100"
                                    onClick={() => handleToolClick(tool.id)}
                                >
                                    <div
                                        className="text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 mr-3 flex-shrink-0">
                                        <FontAwesomeIcon icon={tool.icon}/>
                                    </div>
                                    <span className="truncate">{tool.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
