import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const BiasVisualizer = ({ biasedTerms }) => {
    // Skip rendering if no data
    if (!biasedTerms || biasedTerms.length === 0) {
        return (
            <div className="flex items-center justify-center p-10 text-neutral-600">
                No biased terms detected for visualization
            </div>
        );
    }

    // Count biased terms by category
    const categoryCounts = biasedTerms.reduce((acc, term) => {
        const category = term.category.toLowerCase();
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    // Prepare data for the pie chart
    const data = Object.entries(categoryCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
    }));

    // Colors for categories
    const COLORS = {
        gender: '#EC4899',
        age: '#3B82F6',
        race: '#8B5CF6',
        other: '#EAB308'
    };

    // Get color based on category name
    const getColor = (name) => {
        const lowerName = name.toLowerCase();
        return COLORS[lowerName] || COLORS.other;
    };

    return (
        <div className="w-full">
            <h3 className="text-lg font-medium text-neutral-700 mb-4 text-center">Bias Categories Distribution</h3>

            <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} term${value !== 1 ? 's' : ''}`, 'Count']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 mt-6 md:mt-0">
                    <div className="bg-white p-4 rounded-md border border-neutral-200 h-full">
                        <h4 className="text-sm font-medium text-neutral-700 mb-3">Summary</h4>
                        <ul className="space-y-2">
                            {data.map((item, index) => (
                                <li key={index} className="flex items-center">
                  <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getColor(item.name) }}
                  ></span>
                                    <span className="text-sm">
                    <span className="font-medium">{item.name}:</span> {item.value} term{item.value !== 1 ? 's' : ''}
                                        {item.name === 'Gender' && (
                                            <span className="ml-1 text-xs text-neutral-500">
                        (e.g., rockstar, ninja, guys)
                      </span>
                                        )}
                                        {item.name === 'Age' && (
                                            <span className="ml-1 text-xs text-neutral-500">
                        (e.g., young, energetic, seasoned)
                      </span>
                                        )}
                                        {item.name === 'Race' && (
                                            <span className="ml-1 text-xs text-neutral-500">
                        (e.g., cultural fit, articulate)
                      </span>
                                        )}
                  </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 text-xs text-neutral-600">
                            <p className="mb-2">Tips for inclusive job descriptions:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Use gender-neutral language (e.g., "professional" instead of "rockstar" or "ninja")</li>
                                <li>Avoid age-related terms that may discourage certain age groups</li>
                                <li>Focus on specific skills and qualifications instead of cultural fit</li>
                                <li>Consider using inclusive job description templates</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BiasVisualizer;
