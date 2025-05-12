/**
 * Mock Data Service
 *
 * Provides in-memory data storage when the database is unavailable
 * Allows the application to function when the SQL Server connection fails
 */

// In-memory storage
const mockDb = {
  projects: [],
  resources: [],
  skills: [],
  roles: [
    { id: 1, name: 'Developer', description: 'Software developer role' },
    { id: 2, name: 'Designer', description: 'UX/UI designer role' },
    { id: 3, name: 'Project Manager', description: 'Project management role' },
    { id: 4, name: 'QA Engineer', description: 'Quality assurance engineer role' },
    { id: 5, name: 'DevOps Engineer', description: 'DevOps and infrastructure role' }
  ],
  allocations: [],
  projectSkills: [], // {projectId, skillId}
  projectRoles: [], // {projectId, roleId, count}
  resourceSkills: [], // {resourceId, skillId, proficiency}
  budgetItems: [], // Project budget items
  financialSnapshots: [], // Project financial snapshots
  notifications: [] // System notifications
};

// Sample data initialization (creates some base data for development)
const initializeSampleData = () => {
  // Only add sample data if DB is empty
  if (mockDb.projects.length === 0 && mockDb.resources.length === 0) {
    // Add sample skills if none exist
    const sampleSkills = [
      { id: 1, name: 'JavaScript' },
      { id: 2, name: 'React' },
      { id: 3, name: 'Node.js' },
      { id: 4, name: 'SQL' },
      { id: 5, name: 'UX Design' },
      { id: 6, name: 'Project Management' },
      { id: 7, name: 'DevOps' },
      { id: 8, name: 'Python' }
    ];

    mockDb.skills = sampleSkills;

    // Add sample resources
    const sampleResources = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Developer',
        department: 'Engineering',
        location: 'Remote',
        costRate: 50,
        status: 'Active'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Designer',
        department: 'Design',
        location: 'New York',
        costRate: 60,
        status: 'Active'
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'Project Manager',
        department: 'Project Management',
        location: 'San Francisco',
        costRate: 75,
        status: 'Active'
      }
    ];

    mockDb.resources = sampleResources;

    // Add resource skills
    mockDb.resourceSkills = [
      { id: 1, resourceId: 1, skillId: 1, proficiency: 5 },
      { id: 2, resourceId: 1, skillId: 2, proficiency: 4 },
      { id: 3, resourceId: 1, skillId: 3, proficiency: 4 },
      { id: 4, resourceId: 2, skillId: 5, proficiency: 5 },
      { id: 5, resourceId: 2, skillId: 2, proficiency: 3 },
      { id: 6, resourceId: 3, skillId: 6, proficiency: 5 },
      { id: 7, resourceId: 3, skillId: 4, proficiency: 3 }
    ];

    // Add sample projects
    const sampleProjects = [
      {
        id: 1,
        name: 'Website Redesign',
        client: 'Acme Corp',
        description: 'Redesign of the company website with modern UI',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-09-30'),
        status: 'Active',
        budget: 50000,
        actualCost: 20000,
        budgetUtilization: 40,
        currency: 'USD',
        financialNotes: 'On budget and on schedule',
        createdAt: new Date('2023-05-15'),
        updatedAt: new Date('2023-05-15')
      },
      {
        id: 2,
        name: 'Mobile App Development',
        client: 'TechStart Inc',
        description: 'Development of a mobile application for iOS and Android',
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-12-31'),
        status: 'Active',
        budget: 75000,
        actualCost: 25000,
        budgetUtilization: 33,
        currency: 'USD',
        financialNotes: 'Initial phase completed under budget',
        createdAt: new Date('2023-06-15'),
        updatedAt: new Date('2023-06-15')
      }
    ];

    mockDb.projects = sampleProjects;

    // Add project skills
    mockDb.projectSkills = [
      { id: 1, projectId: 1, skillId: 1 },
      { id: 2, projectId: 1, skillId: 2 },
      { id: 3, projectId: 1, skillId: 5 },
      { id: 4, projectId: 2, skillId: 1 },
      { id: 5, projectId: 2, skillId: 3 },
      { id: 6, projectId: 2, skillId: 8 }
    ];

    // Add project roles
    mockDb.projectRoles = [
      { id: 1, projectId: 1, roleId: 1, count: 2 },
      { id: 2, projectId: 1, roleId: 2, count: 1 },
      { id: 3, projectId: 1, roleId: 3, count: 1 },
      { id: 4, projectId: 2, roleId: 1, count: 3 },
      { id: 5, projectId: 2, roleId: 4, count: 1 }
    ];

    // Add allocations
    mockDb.allocations = [
      {
        id: 1,
        resourceId: 1,
        projectId: 1,
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-09-30'),
        utilization: 50,
        hourlyRate: 50,
        billableRate: 100,
        totalHours: 320,
        totalCost: 16000,
        billableAmount: 32000,
        isBillable: true,
        notes: 'Frontend development'
      },
      {
        id: 2,
        resourceId: 2,
        projectId: 1,
        startDate: new Date('2023-06-15'),
        endDate: new Date('2023-08-31'),
        utilization: 75,
        hourlyRate: 60,
        billableRate: 120,
        totalHours: 300,
        totalCost: 18000,
        billableAmount: 36000,
        isBillable: true,
        notes: 'UI/UX design'
      },
      {
        id: 3,
        resourceId: 3,
        projectId: 1,
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-09-30'),
        utilization: 25,
        hourlyRate: 75,
        billableRate: 150,
        totalHours: 160,
        totalCost: 12000,
        billableAmount: 24000,
        isBillable: true,
        notes: 'Project management'
      }
    ];

    // Add budget items
    mockDb.budgetItems = [
      {
        id: 1,
        projectId: 1,
        category: 'Development',
        description: 'Frontend development',
        plannedAmount: 20000,
        actualAmount: 16000,
        variance: 4000,
        notes: 'Within planned budget'
      },
      {
        id: 2,
        projectId: 1,
        category: 'Design',
        description: 'UI/UX design',
        plannedAmount: 15000,
        actualAmount: 18000,
        variance: -3000,
        notes: 'Additional design iterations required'
      },
      {
        id: 3,
        projectId: 1,
        category: 'Management',
        description: 'Project management',
        plannedAmount: 10000,
        actualAmount: 8000,
        variance: 2000,
        notes: 'Efficient management process'
      }
    ];

    // Add financial snapshots
    mockDb.financialSnapshots = [
      {
        id: 1,
        projectId: 1,
        snapshotDate: new Date('2023-07-01'),
        plannedBudget: 50000,
        actualCost: 10000,
        forecastedCost: 48000,
        variance: 40000,
        notes: 'Initial snapshot at project start'
      },
      {
        id: 2,
        projectId: 1,
        snapshotDate: new Date('2023-08-01'),
        plannedBudget: 50000,
        actualCost: 20000,
        forecastedCost: 45000,
        variance: 30000,
        notes: 'Midpoint snapshot'
      }
    ];

    console.log('Initialized sample mock data');
  }
};

// ID generators (simulate auto-increment)
const idGenerators = {
  projects: 3, // start after samples
  resources: 4, // start after samples
  skills: 9, // start after samples
  roles: 6, // start after defaults
  allocations: 4, // start after samples
  projectRoles: 6,
  projectSkills: 7,
  resourceSkills: 8,
  budgetItems: 4,
  financialSnapshots: 3,
  notifications: 1
};

// Utility function to generate new IDs
const nextId = (entityType) => {
  if (!idGenerators[entityType]) {
    idGenerators[entityType] = 1;
  }
  return idGenerators[entityType]++;
};

// Check if mock data should be used
const shouldUseMock = () => {
  // Check for explicit env flag
  if (process.env.USE_MOCK_DATA === 'true') {
    console.log('Using mock data because USE_MOCK_DATA is set to true');
    // Initialize sample data if needed
    initializeSampleData();
    return true;
  }

  // Check for database connection
  try {
    const { poolPromise } = require('./db/config');
    const pool = poolPromise;

    // If poolPromise is rejected or undefined, use mock data
    if (!pool) {
      console.log('Using mock data because database connection pool is not available');
      initializeSampleData();
      return true;
    }

    // Database connection is available, don't use mock data
    return false;
  } catch (err) {
    console.log('Using mock data because of database error:', err.message);
    initializeSampleData();
    return true;
  }
};

// Mock project service
const projectService = {
  // Create a new project
  createProject: async (projectData) => {
    try {
      console.log('Using mock data service to create project');

      const {
        name,
        client,
        description,
        startDate,
        endDate,
        status,
        requiredSkills = [],
        requiredRoles = [],
        budget,
        currency = 'USD',
        financialNotes,
        budgetItems = []
      } = projectData;

      // Validate
      if (!name || !client) {
        throw new Error('Name and client are required');
      }

      // Create project
      const projectId = nextId('projects');
      const newProject = {
        id: projectId,
        name,
        client,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'Active',
        budget: budget || 0,
        actualCost: 0,
        budgetUtilization: 0,
        currency: currency || 'USD',
        financialNotes: financialNotes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.projects.push(newProject);

      // Process skills
      const projectSkills = [];
      if (requiredSkills && requiredSkills.length > 0) {
        for (const skillName of requiredSkills) {
          // Find or create skill
          let skill = mockDb.skills.find(s => s.name === skillName);
          if (!skill) {
            skill = {
              id: nextId('skills'),
              name: skillName
            };
            mockDb.skills.push(skill);
          }

          // Link skill to project
          const projectSkill = {
            id: nextId('projectSkills'),
            projectId,
            skillId: skill.id
          };
          mockDb.projectSkills.push(projectSkill);
          projectSkills.push(skillName);
        }
      }

      // Process roles
      const projectRolesData = [];
      if (requiredRoles && requiredRoles.length > 0) {
        for (const roleReq of requiredRoles) {
          // Skip invalid roles
          if (!roleReq || typeof roleReq !== 'object') continue;

          const roleId = parseInt(roleReq.roleId);
          if (isNaN(roleId) || roleId <= 0) continue;

          const count = parseInt(roleReq.count) || 1;

          // Find role
          const role = mockDb.roles.find(r => r.id === roleId);
          if (!role) continue;

          // Link role to project
          const projectRole = {
            id: nextId('projectRoles'),
            projectId,
            roleId,
            count
          };
          mockDb.projectRoles.push(projectRole);
          projectRolesData.push({
            id: role.id,
            name: role.name,
            count
          });
        }
      }

      // Process budget items
      const budgetItemsData = [];
      if (budgetItems && budgetItems.length > 0) {
        for (const item of budgetItems) {
          const budgetItem = {
            id: nextId('budgetItems'),
            projectId,
            category: item.category,
            description: item.description,
            plannedAmount: parseFloat(item.plannedAmount) || 0,
            actualAmount: 0, // Initial actual amount is 0
            variance: parseFloat(item.plannedAmount) || 0, // Initial variance is the planned amount
            notes: item.notes || null
          };

          mockDb.budgetItems.push(budgetItem);
          budgetItemsData.push({
            id: budgetItem.id,
            category: budgetItem.category,
            description: budgetItem.description,
            plannedAmount: budgetItem.plannedAmount,
            actualAmount: budgetItem.actualAmount,
            variance: budgetItem.variance,
            notes: budgetItem.notes
          });
        }
      }

      // Create initial financial snapshot
      const snapshot = {
        id: nextId('financialSnapshots'),
        projectId,
        snapshotDate: new Date(),
        plannedBudget: budget || 0,
        actualCost: 0,
        forecastedCost: budget || 0,
        variance: budget || 0,
        notes: 'Initial project snapshot'
      };
      mockDb.financialSnapshots.push(snapshot);

      // Return formatted project
      return {
        id: newProject.id,
        name: newProject.name,
        client: newProject.client,
        description: newProject.description,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        status: newProject.status,
        requiredSkills: projectSkills,
        requiredRoles: projectRolesData,
        allocatedResources: [],
        financials: {
          budget: newProject.budget,
          actualCost: 0,
          budgetUtilization: 0,
          currency: newProject.currency,
          financialNotes: newProject.financialNotes,
          variance: newProject.budget,
          budgetUtilizationPercentage: 0,
          allocatedCost: 0,
          billableAmount: 0,
          profit: 0,
          profitMargin: 0,
          budgetItems: budgetItemsData,
          snapshots: [{
            id: snapshot.id,
            date: snapshot.snapshotDate,
            plannedBudget: snapshot.plannedBudget,
            actualCost: snapshot.actualCost,
            forecastedCost: snapshot.forecastedCost,
            variance: snapshot.variance,
            notes: snapshot.notes
          }]
        }
      };
    } catch (error) {
      console.error('Error in mock project creation:', error);
      throw error;
    }
  },

  // Get project by ID
  getProjectById: async (id) => {
    const projectId = parseInt(id);
    const project = mockDb.projects.find(p => p.id === projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Get skills
    const skills = mockDb.projectSkills
      .filter(ps => ps.projectId === projectId)
      .map(ps => {
        const skill = mockDb.skills.find(s => s.id === ps.skillId);
        return skill ? skill.name : null;
      })
      .filter(Boolean);

    // Get roles
    const roles = mockDb.projectRoles
      .filter(pr => pr.projectId === projectId)
      .map(pr => {
        const role = mockDb.roles.find(r => r.id === pr.roleId);
        return role ? {
          id: role.id,
          name: role.name,
          count: pr.count
        } : null;
      })
      .filter(Boolean);

    // Get allocated resources
    const allocatedResources = mockDb.allocations
      .filter(a => a.projectId === projectId && new Date(a.endDate) >= new Date())
      .map(a => {
        const resource = mockDb.resources.find(r => r.id === a.resourceId);
        return resource ? {
          id: resource.id,
          name: resource.name,
          role: resource.role,
          startDate: a.startDate,
          endDate: a.endDate,
          utilization: a.utilization,
          hourlyRate: a.hourlyRate,
          billableRate: a.billableRate,
          totalHours: a.totalHours,
          totalCost: a.totalCost,
          billableAmount: a.billableAmount,
          isBillable: a.isBillable
        } : null;
      })
      .filter(Boolean);

    // Get budget items
    const budgetItems = mockDb.budgetItems
      .filter(b => b.projectId === projectId)
      .map(b => ({
        id: b.id,
        category: b.category,
        description: b.description,
        plannedAmount: b.plannedAmount,
        actualAmount: b.actualAmount,
        variance: b.variance,
        notes: b.notes
      }));

    // Get financial snapshots
    const snapshots = mockDb.financialSnapshots
      .filter(s => s.projectId === projectId)
      .sort((a, b) => new Date(b.snapshotDate) - new Date(a.snapshotDate))
      .map(s => ({
        id: s.id,
        date: s.snapshotDate,
        plannedBudget: s.plannedBudget,
        actualCost: s.actualCost,
        forecastedCost: s.forecastedCost,
        variance: s.variance,
        notes: s.notes
      }));

    // Calculate financial summary
    let totalAllocatedCost = allocatedResources.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    let totalBillableAmount = allocatedResources.reduce((sum, r) => sum + (r.billableAmount || 0), 0);
    let profit = totalBillableAmount - totalAllocatedCost;
    let profitMargin = totalBillableAmount > 0 ? (profit / totalBillableAmount) * 100 : 0;

    return {
      id: project.id,
      name: project.name,
      client: project.client,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      requiredSkills: skills,
      requiredRoles: roles,
      allocatedResources,
      financials: {
        budget: project.budget,
        actualCost: project.actualCost,
        budgetUtilization: project.budgetUtilization,
        currency: project.currency,
        financialNotes: project.financialNotes,
        variance: project.budget - project.actualCost,
        budgetUtilizationPercentage: project.budget > 0 ? (project.actualCost / project.budget) * 100 : 0,
        allocatedCost: totalAllocatedCost,
        billableAmount: totalBillableAmount,
        profit,
        profitMargin,
        budgetItems,
        snapshots
      }
    };
  },

  // Get all projects
  getAllProjects: async () => {
    return mockDb.projects.map(project => {
      // Get skills
      const skills = mockDb.projectSkills
        .filter(ps => ps.projectId === project.id)
        .map(ps => {
          const skill = mockDb.skills.find(s => s.id === ps.skillId);
          return skill ? skill.name : null;
        })
        .filter(Boolean);

      // Get roles
      const roles = mockDb.projectRoles
        .filter(pr => pr.projectId === project.id)
        .map(pr => {
          const role = mockDb.roles.find(r => r.id === pr.roleId);
          return role ? {
            id: role.id,
            name: role.name,
            count: pr.count
          } : null;
        })
        .filter(Boolean);

      return {
        id: project.id,
        name: project.name,
        client: project.client,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        requiredSkills: skills,
        requiredRoles: roles,
        financials: {
          budget: project.budget,
          actualCost: project.actualCost,
          budgetUtilization: project.budgetUtilization,
          currency: project.currency,
          financialNotes: project.financialNotes,
          variance: project.budget - project.actualCost,
          budgetUtilizationPercentage: project.budget > 0 ? (project.actualCost / project.budget) * 100 : 0,
          allocatedCost: 0,
          billableAmount: 0,
          profit: 0,
          profitMargin: 0
        }
      };
    });
  },

  // Update a project
  updateProject: async (id, projectData) => {
    const projectId = parseInt(id);
    const projectIndex = mockDb.projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    const project = mockDb.projects[projectIndex];
    const {
      name,
      client,
      description,
      startDate,
      endDate,
      status,
      requiredSkills,
      requiredRoles,
      budget,
      currency,
      financialNotes,
      budgetItems
    } = projectData;

    // Update project data
    mockDb.projects[projectIndex] = {
      ...project,
      name: name || project.name,
      client: client || project.client,
      description: description !== undefined ? description : project.description,
      startDate: startDate ? new Date(startDate) : project.startDate,
      endDate: endDate ? new Date(endDate) : project.endDate,
      status: status || project.status,
      budget: budget !== undefined ? budget : project.budget,
      currency: currency || project.currency,
      financialNotes: financialNotes !== undefined ? financialNotes : project.financialNotes,
      updatedAt: new Date()
    };

    // Update skills if provided
    if (requiredSkills !== undefined) {
      // Remove existing skills
      mockDb.projectSkills = mockDb.projectSkills.filter(ps => ps.projectId !== projectId);

      // Add new skills
      if (requiredSkills && requiredSkills.length > 0) {
        for (const skillName of requiredSkills) {
          // Find or create skill
          let skill = mockDb.skills.find(s => s.name === skillName);
          if (!skill) {
            skill = {
              id: nextId('skills'),
              name: skillName
            };
            mockDb.skills.push(skill);
          }

          // Link skill to project
          mockDb.projectSkills.push({
            id: nextId('projectSkills'),
            projectId,
            skillId: skill.id
          });
        }
      }
    }

    // Update roles if provided
    if (requiredRoles !== undefined) {
      // Remove existing roles
      mockDb.projectRoles = mockDb.projectRoles.filter(pr => pr.projectId !== projectId);

      // Add new roles
      if (requiredRoles && requiredRoles.length > 0) {
        for (const roleReq of requiredRoles) {
          if (!roleReq || typeof roleReq !== 'object') continue;

          const roleId = parseInt(roleReq.roleId);
          if (isNaN(roleId) || roleId <= 0) continue;

          const count = parseInt(roleReq.count) || 1;

          // Find role
          const role = mockDb.roles.find(r => r.id === roleId);
          if (!role) continue;

          // Link role to project
          mockDb.projectRoles.push({
            id: nextId('projectRoles'),
            projectId,
            roleId,
            count
          });
        }
      }
    }

    // Update budget items if provided
    if (budgetItems !== undefined) {
      // Remove existing budget items
      mockDb.budgetItems = mockDb.budgetItems.filter(b => b.projectId !== projectId);

      // Add new budget items
      if (budgetItems && budgetItems.length > 0) {
        for (const item of budgetItems) {
          mockDb.budgetItems.push({
            id: nextId('budgetItems'),
            projectId,
            category: item.category,
            description: item.description,
            plannedAmount: parseFloat(item.plannedAmount) || 0,
            actualAmount: parseFloat(item.actualAmount) || 0,
            variance: (parseFloat(item.plannedAmount) || 0) - (parseFloat(item.actualAmount) || 0),
            notes: item.notes || null
          });
        }
      }
    }

    // Create a financial snapshot if budget changed
    if (budget !== undefined && budget !== project.budget) {
      mockDb.financialSnapshots.push({
        id: nextId('financialSnapshots'),
        projectId,
        snapshotDate: new Date(),
        plannedBudget: budget,
        actualCost: project.actualCost,
        forecastedCost: budget,
        variance: budget - project.actualCost,
        notes: 'Snapshot created due to budget update'
      });
    }

    // Return updated project details
    return projectService.getProjectById(id);
  },

  // Delete a project
  deleteProject: async (id) => {
    const projectId = parseInt(id);
    const projectIndex = mockDb.projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    // Check if project has allocations
    const hasAllocations = mockDb.allocations.some(a => a.projectId === projectId);
    if (hasAllocations) {
      throw new Error('Cannot delete project with active allocations. Remove allocations first.');
    }

    // Get project name for return message
    const projectName = mockDb.projects[projectIndex].name;

    // Remove related records
    mockDb.projectSkills = mockDb.projectSkills.filter(ps => ps.projectId !== projectId);
    mockDb.projectRoles = mockDb.projectRoles.filter(pr => pr.projectId !== projectId);
    mockDb.budgetItems = mockDb.budgetItems.filter(b => b.projectId !== projectId);
    mockDb.financialSnapshots = mockDb.financialSnapshots.filter(s => s.projectId !== projectId);

    // Remove project
    mockDb.projects.splice(projectIndex, 1);

    return { message: `Project "${projectName}" deleted successfully, including all financial records.` };
  },

  // Recalculate project financials
  recalculateFinancials: async (id, options = {}) => {
    const projectId = parseInt(id);
    const project = mockDb.projects.find(p => p.id === projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate actual costs from allocations
    const allocations = mockDb.allocations.filter(a => a.projectId === projectId);
    const totalCost = allocations.reduce((sum, a) => sum + (a.totalCost || 0), 0);
    const totalBillable = allocations.reduce((sum, a) => sum + (a.billableAmount || 0), 0);

    // Update project with calculated financials
    project.actualCost = totalCost;
    project.budgetUtilization = project.budget > 0 ? (totalCost / project.budget) * 100 : 0;

    // Create financial snapshot if requested
    if (options.createSnapshot) {
      const notes = options.snapshotNotes || 'Snapshot created via manual recalculation';

      const snapshot = {
        id: nextId('financialSnapshots'),
        projectId,
        snapshotDate: new Date(),
        plannedBudget: project.budget,
        actualCost: totalCost,
        forecastedCost: project.budget,
        variance: project.budget - totalCost,
        notes
      };

      mockDb.financialSnapshots.push(snapshot);
    }

    // Return financial data
    return {
      message: `Financials recalculated successfully for project "${project.name}"`,
      financials: {
        budget: project.budget,
        actualCost: totalCost,
        variance: project.budget - totalCost,
        budgetUtilizationPercentage: project.budget > 0 ? (totalCost / project.budget) * 100 : 0,
        allocatedCost: totalCost,
        billableAmount: totalBillable,
        profit: totalBillable - totalCost,
        profitMargin: totalBillable > 0 ? ((totalBillable - totalCost) / totalBillable) * 100 : 0
      },
      snapshotCreated: options.createSnapshot || false
    };
  },

  // Get roles
  getRoles: async () => {
    return mockDb.roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description
    }));
  }
};

// Mock resource service
const resourceService = {
  // Get all resources
  getAllResources: async () => {
    return mockDb.resources.map(resource => {
      // Get resource skills
      const skills = mockDb.resourceSkills
        .filter(rs => rs.resourceId === resource.id)
        .map(rs => {
          const skill = mockDb.skills.find(s => s.id === rs.skillId);
          return skill ? skill.name : null;
        })
        .filter(Boolean);

      // Get current allocations
      const allocations = mockDb.allocations
        .filter(a => a.resourceId === resource.id && new Date(a.endDate) >= new Date())
        .map(a => {
          const project = mockDb.projects.find(p => p.id === a.projectId);
          return project ? {
            id: a.id,
            projectId: project.id,
            projectName: project.name,
            startDate: a.startDate,
            endDate: a.endDate,
            utilization: a.utilization,
            hourlyRate: a.hourlyRate,
            billableRate: a.billableRate,
            totalHours: a.totalHours,
            totalCost: a.totalCost,
            billableAmount: a.billableAmount,
            isBillable: a.isBillable,
            notes: a.notes
          } : null;
        })
        .filter(Boolean);

      return {
        id: resource.id,
        name: resource.name,
        email: resource.email,
        role: resource.role,
        department: resource.department,
        location: resource.location,
        costRate: resource.costRate,
        status: resource.status,
        skills,
        allocations
      };
    });
  },

  // Get resource by ID
  getResourceById: async (id) => {
    const resourceId = parseInt(id);
    const resource = mockDb.resources.find(r => r.id === resourceId);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // Get resource skills
    const skills = mockDb.resourceSkills
      .filter(rs => rs.resourceId === resourceId)
      .map(rs => {
        const skill = mockDb.skills.find(s => s.id === rs.skillId);
        return skill ? skill.name : null;
      })
      .filter(Boolean);

    // Get current allocations
    const allocations = mockDb.allocations
      .filter(a => a.resourceId === resourceId)
      .map(a => {
        const project = mockDb.projects.find(p => p.id === a.projectId);
        return project ? {
          id: a.id,
          projectId: project.id,
          projectName: project.name,
          startDate: a.startDate,
          endDate: a.endDate,
          utilization: a.utilization,
          hourlyRate: a.hourlyRate,
          billableRate: a.billableRate,
          totalHours: a.totalHours,
          totalCost: a.totalCost,
          billableAmount: a.billableAmount,
          isBillable: a.isBillable,
          notes: a.notes
        } : null;
      })
      .filter(Boolean);

    return {
      id: resource.id,
      name: resource.name,
      email: resource.email,
      role: resource.role,
      department: resource.department,
      location: resource.location,
      costRate: resource.costRate,
      status: resource.status,
      skills,
      allocations
    };
  },

  // Create a new resource
  createResource: async (resourceData) => {
    const {
      name,
      email,
      role,
      department,
      location,
      costRate,
      status,
      skills = []
    } = resourceData;

    // Validate
    if (!name) {
      throw new Error('Resource name is required');
    }

    // Create resource
    const resourceId = nextId('resources');
    const newResource = {
      id: resourceId,
      name,
      email: email || null,
      role: role || null,
      department: department || null,
      location: location || null,
      costRate: costRate || 0,
      status: status || 'Active'
    };

    mockDb.resources.push(newResource);

    // Process skills
    if (skills && skills.length > 0) {
      for (const skillData of skills) {
        // Find or create skill
        let skillId;
        if (typeof skillData === 'string') {
          // Handle simple skill name
          let skill = mockDb.skills.find(s => s.name === skillData);
          if (!skill) {
            skill = {
              id: nextId('skills'),
              name: skillData
            };
            mockDb.skills.push(skill);
          }
          skillId = skill.id;
        } else if (skillData.id) {
          // Handle skill object with ID
          skillId = parseInt(skillData.id);
        } else if (skillData.name) {
          // Handle skill object with name
          let skill = mockDb.skills.find(s => s.name === skillData.name);
          if (!skill) {
            skill = {
              id: nextId('skills'),
              name: skillData.name
            };
            mockDb.skills.push(skill);
          }
          skillId = skill.id;
        } else {
          continue;
        }

        // Skip if skill doesn't exist and couldn't be created
        if (!skillId) continue;

        // Get proficiency if provided
        const proficiency = skillData.proficiency || 3; // Default proficiency

        // Link skill to resource
        mockDb.resourceSkills.push({
          id: nextId('resourceSkills'),
          resourceId,
          skillId,
          proficiency
        });
      }
    }

    // Return the created resource
    return resourceService.getResourceById(resourceId);
  },

  // Update a resource
  updateResource: async (id, resourceData) => {
    const resourceId = parseInt(id);
    const resourceIndex = mockDb.resources.findIndex(r => r.id === resourceId);

    if (resourceIndex === -1) {
      throw new Error('Resource not found');
    }

    const resource = mockDb.resources[resourceIndex];
    const {
      name,
      email,
      role,
      department,
      location,
      costRate,
      status,
      skills
    } = resourceData;

    // Update resource data
    mockDb.resources[resourceIndex] = {
      ...resource,
      name: name || resource.name,
      email: email !== undefined ? email : resource.email,
      role: role !== undefined ? role : resource.role,
      department: department !== undefined ? department : resource.department,
      location: location !== undefined ? location : resource.location,
      costRate: costRate !== undefined ? costRate : resource.costRate,
      status: status || resource.status
    };

    // Update skills if provided
    if (skills !== undefined) {
      // Remove existing skills
      mockDb.resourceSkills = mockDb.resourceSkills.filter(rs => rs.resourceId !== resourceId);

      // Add new skills
      if (skills && skills.length > 0) {
        for (const skillData of skills) {
          // Find or create skill
          let skillId;
          if (typeof skillData === 'string') {
            // Handle simple skill name
            let skill = mockDb.skills.find(s => s.name === skillData);
            if (!skill) {
              skill = {
                id: nextId('skills'),
                name: skillData
              };
              mockDb.skills.push(skill);
            }
            skillId = skill.id;
          } else if (skillData.id) {
            // Handle skill object with ID
            skillId = parseInt(skillData.id);
          } else if (skillData.name) {
            // Handle skill object with name
            let skill = mockDb.skills.find(s => s.name === skillData.name);
            if (!skill) {
              skill = {
                id: nextId('skills'),
                name: skillData.name
              };
              mockDb.skills.push(skill);
            }
            skillId = skill.id;
          } else {
            continue;
          }

          // Skip if skill doesn't exist and couldn't be created
          if (!skillId) continue;

          // Get proficiency if provided
          const proficiency = skillData.proficiency || 3; // Default proficiency

          // Link skill to resource
          mockDb.resourceSkills.push({
            id: nextId('resourceSkills'),
            resourceId,
            skillId,
            proficiency
          });
        }
      }
    }

    // Return updated resource
    return resourceService.getResourceById(resourceId);
  },

  // Delete a resource
  deleteResource: async (id) => {
    const resourceId = parseInt(id);
    const resourceIndex = mockDb.resources.findIndex(r => r.id === resourceId);

    if (resourceIndex === -1) {
      throw new Error('Resource not found');
    }

    // Check if resource has allocations
    const hasAllocations = mockDb.allocations.some(a => a.resourceId === resourceId);
    if (hasAllocations) {
      throw new Error('Cannot delete resource with active allocations. Remove allocations first.');
    }

    // Get resource name for return message
    const resourceName = mockDb.resources[resourceIndex].name;

    // Remove related records
    mockDb.resourceSkills = mockDb.resourceSkills.filter(rs => rs.resourceId !== resourceId);

    // Remove resource
    mockDb.resources.splice(resourceIndex, 1);

    return { message: `Resource "${resourceName}" deleted successfully.` };
  }
};

// Mock allocation service
const allocationService = {
  // Get all allocations
  getAllAllocations: async () => {
    return mockDb.allocations.map(allocation => {
      const project = mockDb.projects.find(p => p.id === allocation.projectId);
      const resource = mockDb.resources.find(r => r.id === allocation.resourceId);

      return {
        id: allocation.id,
        project: project ? {
          id: project.id,
          name: project.name
        } : null,
        resource: resource ? {
          id: resource.id,
          name: resource.name,
          role: resource.role
        } : null,
        startDate: allocation.startDate,
        endDate: allocation.endDate,
        utilization: allocation.utilization,
        hourlyRate: allocation.hourlyRate,
        billableRate: allocation.billableRate,
        totalHours: allocation.totalHours,
        totalCost: allocation.totalCost,
        billableAmount: allocation.billableAmount,
        isBillable: allocation.isBillable,
        notes: allocation.notes
      };
    });
  },

  // Create a new allocation
  createAllocation: async (allocationData) => {
    const {
      resourceId,
      projectId,
      startDate,
      endDate,
      utilization,
      hourlyRate,
      billableRate,
      isBillable,
      notes
    } = allocationData;

    // Validate required fields
    if (!resourceId || !projectId || !startDate || !endDate) {
      throw new Error('Resource ID, Project ID, Start Date, and End Date are required');
    }

    // Verify resource and project exist
    const resource = mockDb.resources.find(r => r.id === parseInt(resourceId));
    const project = mockDb.projects.find(p => p.id === parseInt(projectId));

    if (!resource) {
      throw new Error('Resource not found');
    }

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate working days between start and end date
    const start = new Date(startDate);
    const end = new Date(endDate);
    const workingDays = calculateWorkingDays(start, end);

    // Calculate hours and costs
    const hoursPerDay = 8; // Standard 8-hour workday
    const utilizationPercent = utilization ? parseFloat(utilization) / 100 : 1;
    const totalHours = workingDays * hoursPerDay * utilizationPercent;
    const hourlyRateValue = hourlyRate || resource.costRate || 0;
    const billableRateValue = billableRate || (hourlyRateValue * 2) || 0;
    const totalCost = totalHours * hourlyRateValue;
    const billableAmount = isBillable ? totalHours * billableRateValue : 0;

    // Create allocation
    const allocationId = nextId('allocations');
    const newAllocation = {
      id: allocationId,
      resourceId: parseInt(resourceId),
      projectId: parseInt(projectId),
      startDate: start,
      endDate: end,
      utilization: parseFloat(utilization) || 100,
      hourlyRate: hourlyRateValue,
      billableRate: billableRateValue,
      totalHours,
      totalCost,
      billableAmount,
      isBillable: !!isBillable,
      notes: notes || null
    };

    mockDb.allocations.push(newAllocation);

    // Update project financials
    project.actualCost = (project.actualCost || 0) + totalCost;
    project.budgetUtilization = project.budget > 0 ? (project.actualCost / project.budget) * 100 : 0;

    // Return the created allocation
    return {
      id: newAllocation.id,
      project: {
        id: project.id,
        name: project.name
      },
      resource: {
        id: resource.id,
        name: resource.name,
        role: resource.role
      },
      startDate: newAllocation.startDate,
      endDate: newAllocation.endDate,
      utilization: newAllocation.utilization,
      hourlyRate: newAllocation.hourlyRate,
      billableRate: newAllocation.billableRate,
      totalHours: newAllocation.totalHours,
      totalCost: newAllocation.totalCost,
      billableAmount: newAllocation.billableAmount,
      isBillable: newAllocation.isBillable,
      notes: newAllocation.notes
    };
  },

  // Get allocation by ID
  getAllocationById: async (id) => {
    const allocationId = parseInt(id);
    const allocation = mockDb.allocations.find(a => a.id === allocationId);

    if (!allocation) {
      throw new Error('Allocation not found');
    }

    const project = mockDb.projects.find(p => p.id === allocation.projectId);
    const resource = mockDb.resources.find(r => r.id === allocation.resourceId);

    return {
      id: allocation.id,
      project: project ? {
        id: project.id,
        name: project.name
      } : null,
      resource: resource ? {
        id: resource.id,
        name: resource.name,
        role: resource.role
      } : null,
      startDate: allocation.startDate,
      endDate: allocation.endDate,
      utilization: allocation.utilization,
      hourlyRate: allocation.hourlyRate,
      billableRate: allocation.billableRate,
      totalHours: allocation.totalHours,
      totalCost: allocation.totalCost,
      billableAmount: allocation.billableAmount,
      isBillable: allocation.isBillable,
      notes: allocation.notes
    };
  },

  // Update an allocation
  updateAllocation: async (id, allocationData) => {
    const allocationId = parseInt(id);
    const allocationIndex = mockDb.allocations.findIndex(a => a.id === allocationId);

    if (allocationIndex === -1) {
      throw new Error('Allocation not found');
    }

    const allocation = mockDb.allocations[allocationIndex];
    const {
      resourceId,
      projectId,
      startDate,
      endDate,
      utilization,
      hourlyRate,
      billableRate,
      isBillable,
      notes
    } = allocationData;

    // Verify resource and project if changed
    let resource = mockDb.resources.find(r => r.id === allocation.resourceId);
    let project = mockDb.projects.find(p => p.id === allocation.projectId);

    if (resourceId && resourceId !== allocation.resourceId) {
      resource = mockDb.resources.find(r => r.id === parseInt(resourceId));
      if (!resource) {
        throw new Error('Resource not found');
      }
    }

    if (projectId && projectId !== allocation.projectId) {
      project = mockDb.projects.find(p => p.id === parseInt(projectId));
      if (!project) {
        throw new Error('Project not found');
      }
    }

    // Subtract current allocation cost from project financials
    if (project.id === allocation.projectId) {
      project.actualCost = (project.actualCost || 0) - (allocation.totalCost || 0);
    } else {
      const oldProject = mockDb.projects.find(p => p.id === allocation.projectId);
      if (oldProject) {
        oldProject.actualCost = (oldProject.actualCost || 0) - (allocation.totalCost || 0);
        oldProject.budgetUtilization = oldProject.budget > 0 ? (oldProject.actualCost / oldProject.budget) * 100 : 0;
      }
    }

    // Calculate updated allocation
    const start = startDate ? new Date(startDate) : allocation.startDate;
    const end = endDate ? new Date(endDate) : allocation.endDate;
    const workingDays = calculateWorkingDays(start, end);

    const hoursPerDay = 8;
    const utilizationPercent = utilization !== undefined ? parseFloat(utilization) / 100 : allocation.utilization / 100;
    const totalHours = workingDays * hoursPerDay * utilizationPercent;

    const hourlyRateValue = hourlyRate !== undefined ? hourlyRate : allocation.hourlyRate;
    const billableRateValue = billableRate !== undefined ? billableRate : allocation.billableRate;
    const isBillableValue = isBillable !== undefined ? !!isBillable : allocation.isBillable;

    const totalCost = totalHours * hourlyRateValue;
    const billableAmount = isBillableValue ? totalHours * billableRateValue : 0;

    // Update allocation
    const updatedAllocation = {
      ...allocation,
      resourceId: resourceId ? parseInt(resourceId) : allocation.resourceId,
      projectId: projectId ? parseInt(projectId) : allocation.projectId,
      startDate: start,
      endDate: end,
      utilization: utilization !== undefined ? parseFloat(utilization) : allocation.utilization,
      hourlyRate: hourlyRateValue,
      billableRate: billableRateValue,
      totalHours,
      totalCost,
      billableAmount,
      isBillable: isBillableValue,
      notes: notes !== undefined ? notes : allocation.notes
    };

    mockDb.allocations[allocationIndex] = updatedAllocation;

    // Add updated allocation cost to project financials
    project.actualCost = (project.actualCost || 0) + totalCost;
    project.budgetUtilization = project.budget > 0 ? (project.actualCost / project.budget) * 100 : 0;

    // Return updated allocation
    return allocationService.getAllocationById(allocationId);
  },

  // Delete an allocation
  deleteAllocation: async (id) => {
    const allocationId = parseInt(id);
    const allocationIndex = mockDb.allocations.findIndex(a => a.id === allocationId);

    if (allocationIndex === -1) {
      throw new Error('Allocation not found');
    }

    const allocation = mockDb.allocations[allocationIndex];

    // Update project financials
    const project = mockDb.projects.find(p => p.id === allocation.projectId);
    if (project) {
      project.actualCost = Math.max(0, (project.actualCost || 0) - (allocation.totalCost || 0));
      project.budgetUtilization = project.budget > 0 ? (project.actualCost / project.budget) * 100 : 0;
    }

    // Remove allocation
    mockDb.allocations.splice(allocationIndex, 1);

    return { message: 'Allocation deleted successfully' };
  },

  // Get unallocated resources
  getUnallocatedResources: async () => {
    const now = new Date();

    // Find resources with no current allocations
    return mockDb.resources.filter(resource => {
      // Check if resource has any active allocations
      const hasActiveAllocation = mockDb.allocations.some(allocation =>
        allocation.resourceId === resource.id &&
        new Date(allocation.endDate) >= now
      );

      return !hasActiveAllocation && resource.status === 'Active';
    }).map(resource => ({
      id: resource.id,
      name: resource.name,
      role: resource.role,
      department: resource.department,
      location: resource.location,
      skills: mockDb.resourceSkills
        .filter(rs => rs.resourceId === resource.id)
        .map(rs => {
          const skill = mockDb.skills.find(s => s.id === rs.skillId);
          return skill ? skill.name : null;
        })
        .filter(Boolean)
    }));
  },

  // Get allocations ending soon
  getAllocationsEndingSoon: async (days = 14) => {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() + parseInt(days));

    return mockDb.allocations.filter(allocation => {
      const endDate = new Date(allocation.endDate);
      return endDate >= now && endDate <= cutoffDate;
    }).map(allocation => {
      const project = mockDb.projects.find(p => p.id === allocation.projectId);
      const resource = mockDb.resources.find(r => r.id === allocation.resourceId);

      return {
        id: allocation.id,
        project: project ? {
          id: project.id,
          name: project.name
        } : null,
        resource: resource ? {
          id: resource.id,
          name: resource.name,
          role: resource.role
        } : null,
        startDate: allocation.startDate,
        endDate: allocation.endDate,
        utilization: allocation.utilization,
        daysRemaining: Math.ceil((new Date(allocation.endDate) - now) / (1000 * 60 * 60 * 24))
      };
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  }
};

// Mock skills service
const skillsService = {
  // Get all skills
  getAllSkills: async () => {
    return mockDb.skills.map(skill => ({
      id: skill.id,
      name: skill.name
    }));
  },

  // Create a new skill
  createSkill: async (skillData) => {
    const { name } = skillData;

    if (!name) {
      throw new Error('Skill name is required');
    }

    // Check if skill already exists
    const existingSkill = mockDb.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingSkill) {
      throw new Error('Skill with this name already exists');
    }

    // Create skill
    const skillId = nextId('skills');
    const newSkill = {
      id: skillId,
      name
    };

    mockDb.skills.push(newSkill);

    return {
      id: newSkill.id,
      name: newSkill.name
    };
  },

  // Delete a skill
  deleteSkill: async (id) => {
    const skillId = parseInt(id);
    const skillIndex = mockDb.skills.findIndex(s => s.id === skillId);

    if (skillIndex === -1) {
      throw new Error('Skill not found');
    }

    // Check if skill is in use
    const isUsedInProject = mockDb.projectSkills.some(ps => ps.skillId === skillId);
    const isUsedByResource = mockDb.resourceSkills.some(rs => rs.skillId === skillId);

    if (isUsedInProject || isUsedByResource) {
      throw new Error('Cannot delete skill that is in use by projects or resources');
    }

    // Remove skill
    const skillName = mockDb.skills[skillIndex].name;
    mockDb.skills.splice(skillIndex, 1);

    return { message: `Skill "${skillName}" deleted successfully` };
  }
};

// Helper function to calculate working days between two dates
function calculateWorkingDays(startDate, endDate) {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set time to beginning of day for consistent calculations
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let workingDays = 0;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    // Check if it's a weekday (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

// Mock role service
const roleService = {
  // Get all roles
  getAllRoles: async () => {
    return mockDb.roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description
    }));
  },

  // Create a new role
  createRole: async (roleData) => {
    const { name, description } = roleData;

    if (!name) {
      throw new Error('Role name is required');
    }

    // Check if role already exists
    const existingRole = mockDb.roles.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    // Create role
    const roleId = nextId('roles');
    const newRole = {
      id: roleId,
      name,
      description: description || null
    };

    mockDb.roles.push(newRole);

    return {
      id: newRole.id,
      name: newRole.name,
      description: newRole.description
    };
  },

  // Get role by ID
  getRoleById: async (id) => {
    const roleId = parseInt(id);
    const role = mockDb.roles.find(r => r.id === roleId);

    if (!role) {
      throw new Error('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description
    };
  },

  // Update role
  updateRole: async (id, roleData) => {
    const roleId = parseInt(id);
    const roleIndex = mockDb.roles.findIndex(r => r.id === roleId);

    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    const { name, description } = roleData;

    if (!name) {
      throw new Error('Role name is required');
    }

    // Update role
    mockDb.roles[roleIndex] = {
      ...mockDb.roles[roleIndex],
      name,
      description: description || null
    };

    return {
      id: mockDb.roles[roleIndex].id,
      name: mockDb.roles[roleIndex].name,
      description: mockDb.roles[roleIndex].description
    };
  },

  // Delete role
  deleteRole: async (id) => {
    const roleId = parseInt(id);
    const roleIndex = mockDb.roles.findIndex(r => r.id === roleId);

    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    // Check if role is used by resources
    const isUsedByResource = mockDb.resources.some(r => r.role === mockDb.roles[roleIndex].name);

    if (isUsedByResource) {
      throw new Error('Cannot delete role that is assigned to resources. Update resources first.');
    }

    // Check if role is used in projects
    const isUsedInProject = mockDb.projectRoles.some(pr => pr.roleId === roleId);

    if (isUsedInProject) {
      throw new Error('Cannot delete role that is required by projects. Update projects first.');
    }

    // Delete role
    const roleName = mockDb.roles[roleIndex].name;
    mockDb.roles.splice(roleIndex, 1);

    return { message: `Role "${roleName}" deleted successfully` };
  }
};

// Export services and utility functions
module.exports = {
  shouldUseMock,
  projectService,
  resourceService,
  allocationService,
  skillsService,
  roleService
};