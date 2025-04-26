// Mock resources data
export const resources = [
    { 
      id: 1, 
      name: "Jane Smith", 
      role: "Senior Consultant", 
      skills: ["Data Analysis", "Project Management", "Change Management"], 
      allocation: { projectId: 1, endDate: "2025-05-10", utilization: 100 } 
    },
    { 
      id: 2, 
      name: "John Doe", 
      role: "Technical Consultant", 
      skills: ["Software Development", "System Architecture", "Cloud Infrastructure"], 
      allocation: { projectId: 3, endDate: "2025-05-05", utilization: 75 } 
    },
    { 
      id: 3, 
      name: "Maria Garcia", 
      role: "Business Analyst", 
      skills: ["Requirements Gathering", "Business Process Modeling", "Data Visualization"], 
      allocation: { projectId: 2, endDate: "2025-06-20", utilization: 50 } 
    },
    { 
      id: 4, 
      name: "David Kim", 
      role: "Senior Developer", 
      skills: ["Full Stack Development", "Mobile Development", "API Design"], 
      allocation: { projectId: 1, endDate: "2025-07-15", utilization: 100 } 
    },
    { 
      id: 5, 
      name: "Priya Patel", 
      role: "UX Designer", 
      skills: ["User Research", "Prototyping", "UI Design"], 
      allocation: null 
    },
    { 
      id: 6, 
      name: "Robert Johnson", 
      role: "Data Scientist", 
      skills: ["Machine Learning", "Statistical Analysis", "Python"], 
      allocation: { projectId: 4, endDate: "2025-04-30", utilization: 100 } 
    },
  ];
  
  // Mock projects data
  export const projects = [
    { 
      id: 1, 
      name: "Financial System Upgrade", 
      client: "Global Bank", 
      requiredSkills: ["Project Management", "Software Development", "Change Management"] 
    },
    { 
      id: 2, 
      name: "Digital Transformation", 
      client: "Retail Co.", 
      requiredSkills: ["Business Process Modeling", "Change Management", "UI Design"] 
    },
    { 
      id: 3, 
      name: "Cloud Migration", 
      client: "Tech Solutions", 
      requiredSkills: ["Cloud Infrastructure", "System Architecture", "API Design"] 
    },
    { 
      id: 4, 
      name: "Data Analytics Platform", 
      client: "Healthcare Inc.", 
      requiredSkills: ["Data Analysis", "Machine Learning", "Statistical Analysis"] 
    },
    { 
      id: 5, 
      name: "Mobile App Development", 
      client: "StartApp", 
      requiredSkills: ["Mobile Development", "UI Design", "API Design"], 
      startDate: "2025-05-15" 
    },
  ];