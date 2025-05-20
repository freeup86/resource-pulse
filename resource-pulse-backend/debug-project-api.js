// debug-project-api.js
// This script helps debug how project information is returned by the API

const { poolPromise, sql } = require('./db/config');

async function getProject(projectId) {
  try {
    const pool = await poolPromise;
    console.log(`Debug: Getting project with ID ${projectId}`);
    
    // Query project with financial data
    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT
          p.ProjectID,
          p.Name,
          p.Client,
          p.Description,
          p.StartDate,
          p.EndDate,
          p.Status,
          p.ProjectNumber,
          p.ProjectOwner,
          p.Budget,
          p.ActualCost,
          p.BudgetUtilization,
          p.Currency,
          p.FinancialNotes
        FROM Projects p
        WHERE p.ProjectID = @projectId
      `);
    
    if (result.recordset.length === 0) {
      console.log(`Debug: Project with ID ${projectId} not found`);
      return null;
    }
    
    const project = result.recordset[0];
    console.log('Debug: Project found:', project);
    
    // Get skills
    const skillsResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT s.SkillID, s.Name
        FROM Skills s
        INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
        WHERE ps.ProjectID = @projectId
      `);
    
    console.log(`Debug: Found ${skillsResult.recordset.length} skills for project`);
    console.log('Debug: Skills:', skillsResult.recordset.map(s => s.Name));
    
    // Get roles
    const rolesResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          pr.ProjectRoleID,
          pr.RoleID,
          r.Name as RoleName,
          pr.Count
        FROM ProjectRoles pr
        INNER JOIN Roles r ON pr.RoleID = r.RoleID
        WHERE pr.ProjectID = @projectId
      `);
    
    console.log(`Debug: Found ${rolesResult.recordset.length} roles for project`);
    console.log('Debug: Roles:', rolesResult.recordset);
    
    // Get allocated resources with financial data
    const resourcesResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          r.ResourceID,
          r.Name AS ResourceName,
          r.Role,
          r.RoleID,
          a.AllocationID,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          a.HourlyRate,
          a.BillableRate,
          a.TotalHours,
          a.TotalCost,
          a.BillableAmount,
          a.IsBillable,
          a.BillingType
        FROM Resources r
        INNER JOIN Allocations a ON r.ResourceID = a.ResourceID
        WHERE a.ProjectID = @projectId
        AND a.EndDate >= GETDATE()
        ORDER BY a.EndDate ASC
      `);
    
    console.log(`Debug: Found ${resourcesResult.recordset.length} allocated resources for project`);
    console.log('Debug: Allocated resources:', resourcesResult.recordset.map(r => ({
      resourceId: r.ResourceID,
      resourceName: r.ResourceName,
      allocation: {
        id: r.AllocationID,
        startDate: r.StartDate,
        endDate: r.EndDate,
        utilization: r.Utilization
      }
    })));
    
    // Format the response like the API would
    const formattedProject = {
      id: project.ProjectID,
      name: project.Name,
      client: project.Client,
      description: project.Description,
      startDate: project.StartDate,
      endDate: project.EndDate,
      status: project.Status,
      projectNumber: project.ProjectNumber,
      projectOwner: project.ProjectOwner,
      requiredSkills: skillsResult.recordset.map(skill => skill.Name),
      requiredRoles: rolesResult.recordset.map(role => ({
        id: role.RoleID,
        name: role.RoleName,
        count: role.Count
      })),
      allocatedResources: resourcesResult.recordset.map(resource => ({
        id: resource.ResourceID,
        name: resource.ResourceName,
        role: resource.Role,
        roleId: resource.RoleID,
        allocation: {
          id: resource.AllocationID,
          projectId: projectId,
          startDate: resource.StartDate,
          endDate: resource.EndDate,
          utilization: resource.Utilization,
          hourlyRate: resource.HourlyRate,
          billableRate: resource.BillableRate,
          totalHours: resource.TotalHours,
          totalCost: resource.TotalCost,
          billableAmount: resource.BillableAmount,
          isBillable: resource.IsBillable
        }
      })),
      financials: {
        budget: project.Budget,
        actualCost: project.ActualCost,
        budgetUtilization: project.BudgetUtilization,
        currency: project.Currency,
        financialNotes: project.FinancialNotes
      }
    };
    
    console.log('Debug: API-like formatted project with allocations:');
    console.log('Debug: Project ID:', formattedProject.id);
    console.log('Debug: Project Name:', formattedProject.name);
    console.log('Debug: Required Skills:', formattedProject.requiredSkills);
    console.log('Debug: Required Roles:', formattedProject.requiredRoles);
    console.log('Debug: Allocated Resources:', formattedProject.allocatedResources.length);
    formattedProject.allocatedResources.forEach(resource => {
      console.log('Debug: - Resource:', resource.name, 'Utilization:', resource.allocation.utilization + '%');
    });
    
    return formattedProject;
  } catch (err) {
    console.error('Debug: Error getting project:', err);
    return null;
  }
}

async function getResources() {
  try {
    const pool = await poolPromise;
    console.log('Debug: Getting all resources with allocations');
    
    // Query resources with financial info
    const result = await pool.request()
      .query(`
        SELECT
          r.ResourceID,
          r.Name,
          r.Role,
          r.RoleID,
          r.Email,
          r.Phone,
          r.HourlyRate,
          r.BillableRate,
          r.Currency,
          r.CostCenter
        FROM Resources r
        ORDER BY r.Name
      `);
    
    console.log(`Debug: Found ${result.recordset.length} resources`);
    
    // For debugging, get all allocations for resources
    const allResources = await Promise.all(result.recordset.map(async resource => {
      // Get all active allocations for this resource
      const allocationsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT 
            a.AllocationID,
            a.ProjectID,
            p.Name AS ProjectName,
            a.StartDate,
            a.EndDate,
            a.Utilization,
            a.HourlyRate,
            a.BillableRate,
            a.TotalHours,
            a.TotalCost,
            a.BillableAmount,
            a.IsBillable,
            a.BillingType
          FROM Allocations a
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.ResourceID = @resourceId
          AND a.EndDate >= GETDATE()
          ORDER BY a.EndDate ASC
        `);
      
      return {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        roleId: resource.RoleID,
        hourlyRate: resource.HourlyRate,
        billableRate: resource.BillableRate,
        allocations: allocationsResult.recordset.map(alloc => ({
          id: alloc.AllocationID,
          projectId: alloc.ProjectID,
          projectName: alloc.ProjectName,
          startDate: alloc.StartDate,
          endDate: alloc.EndDate,
          utilization: alloc.Utilization,
          hourlyRate: alloc.HourlyRate,
          billableRate: alloc.BillableRate,
          totalHours: alloc.TotalHours,
          totalCost: alloc.TotalCost,
          billableAmount: alloc.BillableAmount,
          isBillable: alloc.IsBillable
        }))
      };
    }));
    
    // Debug: show resources with allocations for project 23
    const projectId = 23; // Our target project
    const resourcesWithAllocationsForProject = allResources.filter(resource => 
      resource.allocations.some(allocation => allocation.projectId === projectId)
    );
    
    console.log(`Debug: Found ${resourcesWithAllocationsForProject.length} resources with allocations for project ${projectId}`);
    resourcesWithAllocationsForProject.forEach(resource => {
      const projectAllocs = resource.allocations.filter(a => a.projectId === projectId);
      console.log(`Debug: - Resource: ${resource.name} has ${projectAllocs.length} allocations to project ${projectId}`);
      projectAllocs.forEach(a => {
        console.log(`Debug:   - Allocation ID: ${a.id}, Utilization: ${a.utilization}%, Dates: ${a.startDate.toISOString().split('T')[0]} - ${a.endDate.toISOString().split('T')[0]}`);
      });
    });
    
    return allResources;
  } catch (err) {
    console.error('Debug: Error getting resources:', err);
    return [];
  }
}

async function run() {
  try {
    // Find project by number
    const projectNumber = 'PRJ-2023-045';
    const pool = await poolPromise;
    const projectResult = await pool.request()
      .input('projectNumber', sql.NVarChar, projectNumber)
      .query(`
        SELECT ProjectID
        FROM Projects 
        WHERE ProjectNumber = @projectNumber
      `);
    
    if (projectResult.recordset.length === 0) {
      console.log(`Debug: Project with number ${projectNumber} not found`);
      process.exit(1);
    }
    
    const projectId = projectResult.recordset[0].ProjectID;
    console.log(`Debug: Found project ID ${projectId} for project number ${projectNumber}`);
    
    // Get project details and allocations
    await getProject(projectId);
    
    // Get all resources with allocations
    await getResources();
    
    console.log('Debug: Script completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Debug: Script failed:', err);
    process.exit(1);
  }
}

run();