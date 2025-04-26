import React from 'react';
import { resources, projects } from '../../utils/mockData';
import { isEndingSoon } from '../../utils/dateUtils';

const SummaryCards = () => {
  // Calculate summary data
  const totalResources = resources.length;
  const allocatedResources = resources.filter(r => r.allocation).length;
  const availableResources = resources.filter(r => !r.allocation).length;
  const endingSoonCount = resources.filter(r => r.allocation && isEndingSoon(r.allocation.endDate)).length;
  const totalProjects = projects.length;
  
  const summaries = [
    {
      title: 'Total Resources',
      value: totalResources,
      color: 'bg-blue-500'
    },
    {
      title: 'Allocated',
      value: allocatedResources,
      color: 'bg-green-500'
    },
    {
      title: 'Available',
      value: availableResources,
      color: 'bg-gray-500'
    },
    {
      title: 'Ending Soon',
      value: endingSoonCount,
      color: 'bg-yellow-500'
    },
    {
      title: 'Total Projects',
      value: totalProjects,
      color: 'bg-purple-500'
    }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {summaries.map((summary, index) => (
        <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
          <div className={`h-2 ${summary.color}`}></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700">{summary.title}</h3>
            <p className="text-3xl font-bold mt-2">{summary.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;