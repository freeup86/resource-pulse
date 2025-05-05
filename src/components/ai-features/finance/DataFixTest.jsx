import React from 'react';
import FinancialSummary from './FinancialSummary';

// Sample data matching our API response structure
const sampleData = {
  projects: [
    {
      id: 3,
      name: "Asima Implementation",
      client: "Microsoft",
      status: "Active",
      startDate: "2025-04-25T00:00:00.000Z",
      endDate: "2026-04-25T00:00:00.000Z",
      revenue: 250000,
      cost: 225000,
      profit: 25000,
      profitMargin: 0.1
    },
    {
      id: 2,
      name: "ResourcePulse",
      client: "LIT Consulting",
      status: "Active",
      startDate: "2025-04-25T00:00:00.000Z",
      endDate: "2025-08-01T00:00:00.000Z",
      revenue: 200000,
      cost: 160000,
      profit: 40000,
      profitMargin: 0.2
    },
    {
      id: 1,
      name: "SAP Implementation",
      client: "Lockheed Martin",
      status: "Active",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2030-01-01T00:00:00.000Z",
      revenue: 150000,
      cost: 120000,
      profit: 30000,
      profitMargin: 0.2
    },
    {
      id: 4,
      name: "Slate Rock SAP Implementation",
      client: "Slate Rock and Gravel Company",
      status: "Active",
      startDate: "2025-05-05T00:00:00.000Z",
      endDate: "2025-09-30T00:00:00.000Z",
      revenue: 300000,
      cost: 240000,
      profit: 60000,
      profitMargin: 0.2
    }
  ],
  summary: {
    totalRevenue: 900000,
    totalCost: 745000,
    totalProfit: 155000,
    profitMargin: 0.172,
    revenueTrend: 0.08,
    costTrend: 0.05,
    profitTrend: 0.12,
    marginTrend: 0.03
  },
  timeSeries: {
    monthly: [
      {
        period: "2025-02",
        revenue: 120000,
        cost: 98000,
        profit: 22000,
        margin: 0.183
      },
      {
        period: "2025-03",
        revenue: 135000,
        cost: 105000,
        profit: 30000,
        margin: 0.222
      },
      {
        period: "2025-04",
        revenue: 145000,
        cost: 118000,
        profit: 27000,
        margin: 0.186
      },
      {
        period: "2025-05",
        revenue: 160000,
        cost: 128000,
        profit: 32000,
        margin: 0.2
      },
      {
        period: "2025-06",
        revenue: 155000,
        cost: 125000,
        profit: 30000,
        margin: 0.194
      },
      {
        period: "2025-07",
        revenue: 165000,
        cost: 130000,
        profit: 35000,
        margin: 0.212
      },
      {
        period: "2025-08",
        revenue: 170000,
        cost: 136000,
        profit: 34000,
        margin: 0.2
      }
    ],
    quarterly: [],
    yearly: []
  },
  aiInsights: {
    summary: "Financial analysis shows a positive overall trend with improving profit margins. Several projects are performing above expectations, while a few require attention due to cost overruns.",
    opportunities: [
      "Increase investment in high-margin projects to maximize return on resource allocation",
      "Evaluate rate structures for projects with margins below 15%",
      "Consider implementing performance bonuses for teams on projects exceeding 25% margin"
    ],
    risks: [
      "Several projects show budget utilization above 100%, requiring immediate attention",
      "Seasonal variations may impact Q4 revenue projections",
      "Resource allocation imbalances may be affecting overall portfolio performance"
    ]
  },
  retrievedAt: "2025-05-04T23:51:21.999Z"
};

// Component to test the FinancialSummary with fixed data
const DataFixTest = () => {
  // Track selected projects (needed by FinancialSummary)
  const [selectedProjects, setSelectedProjects] = React.useState([]);
  
  // Function to handle project selection
  const handleProjectSelection = (projects) => {
    setSelectedProjects(projects);
    console.log('Selected projects:', projects);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Financial Summary Test</h1>
      
      <div className="bg-gray-100 p-4 mb-4 rounded">
        <p>This is a test component to verify that the Financial Summary is rendering correctly with the proper data structure.</p>
      </div>
      
      <FinancialSummary 
        data={sampleData}
        onProjectSelection={handleProjectSelection}
        selectedProjects={selectedProjects}
      />
    </div>
  );
};

export default DataFixTest;