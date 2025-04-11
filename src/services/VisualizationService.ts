/**
 * Service for generating visualization data
 */

/**
 * Transform category data for pie/donut charts
 */
export const preparePieChartData = (
  data: Record<string, number>,
  options: {
    sortBy?: 'value' | 'label';
    order?: 'asc' | 'desc';
    limit?: number;
    colors?: string[];
  } = {}
): { name: string; value: number; color?: string }[] => {
  const { sortBy = 'value', order = 'desc', limit, colors } = options;
  
  // Convert object to array of { name, value } objects
  let result = Object.entries(data).map(([name, value]) => ({ name, value }));
  
  // Sort data
  result.sort((a, b) => {
    if (sortBy === 'value') {
      return order === 'asc' ? a.value - b.value : b.value - a.value;
    } else {
      return order === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
  });
  
  // Apply limit if specified
  if (limit && result.length > limit) {
    const otherValues = result.slice(limit).reduce((sum, item) => sum + item.value, 0);
    result = result.slice(0, limit);
    
    if (otherValues > 0) {
      result.push({ name: 'Other', value: otherValues });
    }
  }
  
  // Add colors if provided
  if (colors && colors.length > 0) {
    result = result.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
  }
  
  return result;
};

/**
 * Transform category data for bar charts
 */
export const prepareBarChartData = (
  data: Record<string, number>,
  options: {
    sortBy?: 'value' | 'label';
    order?: 'asc' | 'desc';
    limit?: number;
    color?: string;
  } = {}
): { name: string; value: number; color?: string }[] => {
  const { sortBy = 'value', order = 'desc', limit, color } = options;
  
  // Use the same core logic as pie chart data
  let result = preparePieChartData(data, { sortBy, order, limit });
  
  // Apply consistent color if provided
  if (color) {
    result = result.map(item => ({
      ...item,
      color,
    }));
  }
  
  return result;
};

/**
 * Transform time series data for line charts
 */
export const prepareLineChartData = (
  data: Array<{ date: Date | string; [key: string]: any }>,
  valueFields: string[],
  options: {
    dateFormat?: string;
    colors?: string[];
  } = {}
): Array<{ date: string; [key: string]: number }> => {
  const { colors } = options;
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Format the result
  const result = sortedData.map(item => {
    const formattedItem: { date: string; [key: string]: any } = {
      date: item.date instanceof Date 
        ? formatDate(item.date, options.dateFormat) 
        : item.date,
    };
    
    valueFields.forEach((field, index) => {
      formattedItem[field] = item[field] || 0;
      
      // Add color if provided
      if (colors && colors.length > 0) {
        formattedItem[`${field}Color`] = colors[index % colors.length];
      }
    });
    
    return formattedItem;
  });
  
  return result;
};

/**
 * Generate heatmap data for calendar visualization
 */
export const prepareHeatmapData = (
  data: Array<{ date: Date | string; value: number }>,
  options: {
    startDate?: Date;
    endDate?: Date;
    colorRange?: string[];
  } = {}
): Array<{ date: string; value: number; color?: string }> => {
  const { startDate, endDate, colorRange } = options;
  
  // Convert all dates to Date objects
  const dateItems = data.map(item => ({
    date: item.date instanceof Date ? item.date : new Date(item.date),
    value: item.value,
  }));
  
  // Determine date range
  const start = startDate || new Date(Math.min(...dateItems.map(item => item.date.getTime())));
  const end = endDate || new Date(Math.max(...dateItems.map(item => item.date.getTime())));
  
  // Generate all dates in the range
  const result: Array<{ date: string; value: number; color?: string }> = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateString = formatDate(currentDate, 'yyyy-MM-dd');
    const matchingItem = dateItems.find(
      item => formatDate(item.date, 'yyyy-MM-dd') === dateString
    );
    
    result.push({
      date: dateString,
      value: matchingItem ? matchingItem.value : 0,
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculate color based on value range if colorRange provided
  if (colorRange && colorRange.length > 0) {
    const values = result.map(item => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    
    result.forEach(item => {
      if (valueRange > 0) {
        const normalizedValue = (item.value - minValue) / valueRange;
        const colorIndex = Math.min(
          Math.floor(normalizedValue * colorRange.length),
          colorRange.length - 1
        );
        item.color = colorRange[colorIndex];
      } else {
        item.color = colorRange[0];
      }
    });
  }
  
  return result;
};

/**
 * Prepare stacked bar chart data
 */
export const prepareStackedBarChartData = (
  data: Array<Record<string, any>>,
  categories: string[],
  valueField: string,
  options: {
    sortBy?: string;
    order?: 'asc' | 'desc';
    colors?: string[];
  } = {}
): Array<Record<string, any>> => {
  const { sortBy, order = 'desc', colors } = options;
  
  // Group data by category
  const groupedData: Record<string, Record<string, number>> = {};
  
  data.forEach(item => {
    const category = item[valueField];
    const value = item.value || 1; // Default to 1 if not specified
    
    categories.forEach(cat => {
      if (!groupedData[cat]) {
        groupedData[cat] = {};
      }
      
      if (category === cat) {
        groupedData[cat][item.name] = (groupedData[cat][item.name] || 0) + value;
      }
    });
  });
  
  // Convert to the format required for stacked bar chart
  let result = Object.keys(groupedData[categories[0]] || {}).map(name => {
    const item: Record<string, any> = { name };
    
    categories.forEach((category, index) => {
      item[category] = groupedData[category]?.[name] || 0;
      
      if (colors && colors.length > 0) {
        item[`${category}Color`] = colors[index % colors.length];
      }
    });
    
    return item;
  });
  
  // Sort if requested
  if (sortBy) {
    result.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }
  
  return result;
};

/**
 * Prepare data for radar/spider charts
 */
export const prepareRadarChartData = (
  data: Array<Record<string, any>>,
  axes: string[],
  nameField: string,
  options: {
    maxValue?: number;
    colors?: string[];
  } = {}
): Array<{ name: string; data: number[]; color?: string }> => {
  const { colors } = options;
  
  return data.map((item, index) => {
    const result: { name: string; data: number[]; color?: string } = {
      name: item[nameField],
      data: axes.map(axis => item[axis] || 0),
    };
    
    if (colors && colors.length > 0) {
      result.color = colors[index % colors.length];
    }
    
    return result;
  });
};

/* Utility Functions */

/**
 * Format a date according to the specified format
 */
const formatDate = (date: Date, format = 'yyyy-MM-dd'): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return format
    .replace('yyyy', year.toString())
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('dd', day.toString().padStart(2, '0'));
};

export default {
  preparePieChartData,
  prepareBarChartData,
  prepareLineChartData,
  prepareHeatmapData,
  prepareStackedBarChartData,
  prepareRadarChartData,
};
