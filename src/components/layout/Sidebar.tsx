import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useApp } from '../../context/AppContext';
import {ToolsData} from "../tools/ToolsData";


// Simple icon component based on icon name
const Icon: React.FC<{ name: string }> = ({ name }) => {
    // We would normally use a proper icon library here, but for simplicity we're using a switch
    switch (name) {
        case 'document-text':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        case 'user-circle':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'users':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            );
        case 'chart-bar':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            );
        case 'refresh':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            );
        case 'mail':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            );
        case 'scale':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
            );
        case 'heart':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            );
        case 'calendar':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        case 'currency-dollar':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            );
    }
};

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { state: userState, dispatch: userDispatch } = useUser();
    const { dispatch } = useApp();
    const { sidebarCollapsed } = userState.preferences;

    const toggleSidebar = () => {
        userDispatch({ type: 'TOGGLE_SIDEBAR' });
    };

    const handleToolClick = (toolId: string) => {
        dispatch({ type: 'SET_CURRENT_TOOL', payload: toolId });
        userDispatch({ type: 'ADD_RECENT_TOOL', payload: toolId });
    };

    return (
        <div className={`bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {sidebarCollapsed ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-2 space-y-1">
                        {ToolsData.map((tool) => (
                            <Link
                                key={tool.id}
                                to={tool.path}
                                className={`${
                                    location.pathname === tool.path
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                onClick={() => handleToolClick(tool.id)}
                            >
                                <div className={`${
                                    location.pathname === tool.path ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'
                                } mr-3 flex-shrink-0`}>
                                    <Icon name={tool.icon} />
                                </div>
                                {!sidebarCollapsed && (
                                    <span className="truncate">{tool.name}</span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                {!sidebarCollapsed && userState.preferences.recentTools.length > 0 && (
                    <div className="px-3 py-4 border-t border-neutral-200">
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                            Recent Tools
                        </h3>
                        <nav className="mt-2 space-y-1">
                            {userState.preferences.recentTools.slice(0, 3).map((toolId) => {
                                const tool = ToolsData.find((t) => t.id === toolId);
                                if (!tool) return null;

                                return (
                                    <Link
                                        key={tool.id}
                                        to={tool.path}
                                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                        onClick={() => handleToolClick(tool.id)}
                                    >
                                        <div className="text-neutral-400 group-hover:text-neutral-500 mr-3 flex-shrink-0">
                                            <Icon name={tool.icon} />
                                        </div>
                                        <span className="truncate">{tool.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
