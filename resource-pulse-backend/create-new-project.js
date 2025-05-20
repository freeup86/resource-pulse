// create-new-project.js
// This script creates a new project with all required and optional data

const { poolPromise, sql } = require('./db/config');

async function createProject() {
  try {
    const pool = await poolPromise;
    console.log('Connected to database');

    // Project data with all required and optional fields
    const projectData = {
      name: 'Marketing Dashboard Upgrade',
      client: 'Acme Corporation',
      description: 'Upgrade the marketing dashboard with new analytics features and improved UI/UX',
      projectNumber: 'PRJ-2023-045',
      projectOwner: 'Jane Smith',
      startDate: '2023-06-01',
      endDate: '2023-09-30',
      status: 'Active',
      // Budget information
      budget: 75000.00,
      currency: 'USD',
      financialNotes: 'Budget includes contingency of 10%. Client has approved additional funding if needed.',
      // Required skills
      requiredSkills: ['React', 'Data Visualization', 'API Integration', 'UI/UX Design'],
      // Required roles with counts
      requiredRoles: [
        { roleId: 1, count: 2 }, // Assuming roleId 1 is Developer
        { roleId: 2, count: 1 }, // Assuming roleId 2 is Designer
        { roleId: 3, count: 1 }  // Assuming roleId 3 is Project Manager
      ],
      // Budget items breakdown
      budgetItems: [
        {
          category: 'Development',
          description: 'Frontend Development',
          plannedAmount: 35000.00,
          notes: 'Includes all React components and integrations'
        },
        {
          category: 'Design',
          description: 'UI/UX Design',
          plannedAmount: 15000.00,
          notes: 'Includes wireframes, mockups, and design system updates'
        },
        {
          category: 'Project Management',
          description: 'Project Management',
          plannedAmount: 20000.00,
          notes: 'Includes all project coordination and client communication'
        },
        {
          category: 'Contingency',
          description: 'Contingency',
          plannedAmount: 5000.00,
          notes: '10% contingency for unexpected issues'
        }
      ]
    };

    // Insert project with financial data
    console.log('Creating new project...');
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Insert project with financial data
      const projectResult = await transaction.request()
        .input('name', sql.NVarChar, projectData.name)
        .input('client', sql.NVarChar, projectData.client)
        .input('description', sql.NVarChar, projectData.description || null)
        .input('startDate', sql.Date, projectData.startDate ? new Date(projectData.startDate) : null)
        .input('endDate', sql.Date, projectData.endDate ? new Date(projectData.endDate) : null)
        .input('status', sql.NVarChar, projectData.status || 'Active')
        .input('projectNumber', sql.NVarChar, projectData.projectNumber || null)
        .input('projectOwner', sql.NVarChar, projectData.projectOwner || null)
        .input('budget', sql.Decimal(14, 2), projectData.budget || null)
        .input('currency', sql.NVarChar(3), projectData.currency || 'USD')
        .input('financialNotes', sql.NVarChar, projectData.financialNotes || null)
        .query(`
          INSERT INTO Projects (
            Name,
            Client,
            Description,
            StartDate,
            EndDate,
            Status,
            ProjectNumber,
            ProjectOwner,
            Budget,
            Currency,
            FinancialNotes,
            ActualCost,
            BudgetUtilization
          )
          OUTPUT INSERTED.ProjectID
          VALUES (
            @name,
            @client,
            @description,
            @startDate,
            @endDate,
            @status,
            @projectNumber,
            @projectOwner,
            @budget,
            @currency,
            @financialNotes,
            0,  -- Initial actual cost is 0
            0   -- Initial budget utilization is 0
          )
        `);
      
      const projectId = projectResult.recordset[0].ProjectID;
      console.log(`Project created with ID: ${projectId}`);
      
      // Process budget items
      console.log('Adding budget items...');
      if (projectData.budgetItems && projectData.budgetItems.length > 0) {
        for (const item of projectData.budgetItems) {
          await transaction.request()
            .input('projectId', sql.Int, projectId)
            .input('category', sql.NVarChar(100), item.category)
            .input('description', sql.NVarChar(500), item.description)
            .input('plannedAmount', sql.Decimal(14, 2), item.plannedAmount)
            .input('notes', sql.NVarChar, item.notes || null)
            .query(`
              INSERT INTO BudgetItems (
                ProjectID, 
                Category, 
                Description, 
                PlannedAmount,
                ActualAmount,
                Variance,
                Notes
              )
              VALUES (
                @projectId, 
                @category, 
                @description, 
                @plannedAmount,
                0,  -- Initial actual amount is 0
                @plannedAmount, -- Initial variance is the planned amount
                @notes
              )
            `);
        }
        console.log(`Added ${projectData.budgetItems.length} budget items`);
      }
      
      // Create initial financial snapshot
      console.log('Creating initial financial snapshot...');
      await transaction.request()
        .input('projectId', sql.Int, projectId)
        .input('budget', sql.Decimal(14, 2), projectData.budget || null)
        .input('notes', sql.NVarChar, 'Initial project snapshot')
        .query(`
          INSERT INTO ProjectFinancialSnapshots (
            ProjectID, 
            SnapshotDate, 
            PlannedBudget, 
            ActualCost, 
            ForecastedCost, 
            Variance,
            Notes
          )
          VALUES (
            @projectId, 
            GETDATE(), 
            @budget, 
            0, -- Initial cost is 0
            @budget, -- Initial forecast is the budget
            @budget, -- Initial variance is the budget
            @notes
          )
        `);
      
      // Process required skills
      console.log('Adding required skills...');
      if (projectData.requiredSkills && projectData.requiredSkills.length > 0) {
        for (const skillName of projectData.requiredSkills) {
          // Check if skill exists
          const skillResult = await transaction.request()
            .input('skillName', sql.NVarChar, skillName)
            .query(`
              SELECT SkillID FROM Skills WHERE Name = @skillName
            `);
          
          let skillId;
          
          if (skillResult.recordset.length === 0) {
            // Create new skill
            const newSkillResult = await transaction.request()
              .input('skillName', sql.NVarChar, skillName)
              .query(`
                INSERT INTO Skills (Name)
                OUTPUT INSERTED.SkillID
                VALUES (@skillName)
              `);
            
            skillId = newSkillResult.recordset[0].SkillID;
          } else {
            skillId = skillResult.recordset[0].SkillID;
          }
          
          // Link skill to project
          await transaction.request()
            .input('projectId', sql.Int, projectId)
            .input('skillId', sql.Int, skillId)
            .query(`
              INSERT INTO ProjectSkills (ProjectID, SkillID)
              VALUES (@projectId, @skillId)
            `);
        }
        console.log(`Added ${projectData.requiredSkills.length} required skills`);
      }
      
      // Process required roles
      console.log('Adding required roles...');
      if (projectData.requiredRoles && projectData.requiredRoles.length > 0) {
        for (const roleReq of projectData.requiredRoles) {
          const roleId = parseInt(roleReq.roleId);
          const count = parseInt(roleReq.count) || 1;
          
          // Validate role exists
          const roleResult = await transaction.request()
            .input('roleId', sql.Int, roleId)
            .query(`
              SELECT RoleID FROM Roles WHERE RoleID = @roleId
            `);
          
          if (roleResult.recordset.length === 0) {
            console.log(`Role with ID ${roleId} not found, skipping`);
            continue;
          }
          
          // Add role requirement to project
          await transaction.request()
            .input('projectId', sql.Int, projectId)
            .input('roleId', sql.Int, roleId)
            .input('count', sql.Int, count)
            .query(`
              INSERT INTO ProjectRoles (ProjectID, RoleID, Count)
              VALUES (@projectId, @roleId, @count)
            `);
        }
        console.log(`Added ${projectData.requiredRoles.length} required roles`);
      }
      
      // Commit transaction
      await transaction.commit();
      console.log('Project creation transaction committed successfully');
      
      // Return the project ID for resource allocation
      console.log(`Use this project ID for resource allocation: ${projectId}`);
      return projectId;
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Error in transaction:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error creating project:', err);
    throw err;
  }
}

// Function to add resource allocations to a project
async function addResourceAllocations(projectId) {
  try {
    const pool = await poolPromise;
    console.log(`Adding resource allocations to project ${projectId}...`);

    // Query available resources to allocate
    const resourcesResult = await pool.request().query(`
      SELECT TOP 3 ResourceID, Name, Role, HourlyRate, BillableRate
      FROM Resources
      ORDER BY ResourceID
    `);

    if (resourcesResult.recordset.length === 0) {
      console.log('No resources found to allocate');
      return;
    }

    // Sample allocations data
    const allocations = [
      {
        resourceId: resourcesResult.recordset[0].ResourceID,
        startDate: '2023-06-01',
        endDate: '2023-07-31',
        utilization: 75,
        hourlyRate: resourcesResult.recordset[0].HourlyRate || 50,
        billableRate: resourcesResult.recordset[0].BillableRate || 100,
        isBillable: true,
        billingType: 'Hourly'
      },
      {
        resourceId: resourcesResult.recordset[1].ResourceID,
        startDate: '2023-06-15',
        endDate: '2023-09-30',
        utilization: 50,
        hourlyRate: resourcesResult.recordset[1].HourlyRate || 60,
        billableRate: resourcesResult.recordset[1].BillableRate || 120,
        isBillable: true,
        billingType: 'Hourly'
      },
      {
        resourceId: resourcesResult.recordset[2].ResourceID,
        startDate: '2023-06-01',
        endDate: '2023-09-30',
        utilization: 25,
        hourlyRate: resourcesResult.recordset[2].HourlyRate || 75,
        billableRate: resourcesResult.recordset[2].BillableRate || 150,
        isBillable: true,
        billingType: 'Hourly'
      }
    ];

    // Create allocations
    for (const allocation of allocations) {
      // Calculate financial metrics
      const startDateObj = new Date(allocation.startDate);
      const endDateObj = new Date(allocation.endDate);
      
      // Calculate workdays between dates (excluding weekends)
      const daysDiff = await pool.request()
        .input('startDate', sql.Date, startDateObj)
        .input('endDate', sql.Date, endDateObj)
        .query(`
          SELECT 
            DATEDIFF(day, @startDate, @endDate) + 1 AS TotalDays,
            DATEDIFF(day, @startDate, @endDate) + 1 - 
            (2 * DATEDIFF(week, @startDate, @endDate)) AS WorkDays
        `);
      
      const workDays = daysDiff.recordset[0].WorkDays;
      
      // Calculate total allocation hours (8 hours per workday * utilization percentage)
      const totalHours = workDays * 8 * (allocation.utilization / 100);
      
      // Calculate financial amounts
      const totalCost = allocation.hourlyRate * totalHours;
      const billableAmount = allocation.isBillable ? allocation.billableRate * totalHours : 0;

      // Create allocation
      await pool.request()
        .input('resourceId', sql.Int, allocation.resourceId)
        .input('projectId', sql.Int, projectId)
        .input('startDate', sql.Date, startDateObj)
        .input('endDate', sql.Date, endDateObj)
        .input('utilization', sql.Int, allocation.utilization)
        .input('hourlyRate', sql.Decimal(10, 2), allocation.hourlyRate)
        .input('billableRate', sql.Decimal(10, 2), allocation.billableRate)
        .input('totalHours', sql.Int, totalHours)
        .input('totalCost', sql.Decimal(14, 2), totalCost)
        .input('billableAmount', sql.Decimal(14, 2), billableAmount)
        .input('isBillable', sql.Bit, allocation.isBillable)
        .input('billingType', sql.NVarChar(50), allocation.billingType)
        .query(`
          INSERT INTO Allocations (
            ResourceID, 
            ProjectID, 
            StartDate, 
            EndDate, 
            Utilization,
            HourlyRate,
            BillableRate,
            TotalHours,
            TotalCost,
            BillableAmount,
            IsBillable,
            BillingType
          )
          VALUES (
            @resourceId, 
            @projectId, 
            @startDate, 
            @endDate, 
            @utilization,
            @hourlyRate,
            @billableRate,
            @totalHours,
            @totalCost,
            @billableAmount,
            @isBillable,
            @billingType
          )
        `);

      console.log(`Allocated resource ${allocation.resourceId} to project ${projectId} at ${allocation.utilization}% utilization`);
    }

    // Recalculate project financials
    console.log('Recalculating project financials...');
    await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        UPDATE Projects
        SET ActualCost = (
          SELECT COALESCE(SUM(TotalCost), 0)
          FROM Allocations
          WHERE ProjectID = @projectId
        ),
        BudgetUtilization = (
          SELECT CASE
            WHEN Budget > 0 THEN (COALESCE(SUM(TotalCost), 0) / Budget) * 100
            ELSE 0
          END
          FROM Allocations
          WHERE ProjectID = @projectId
        )
        WHERE ProjectID = @projectId
      `);

    console.log(`Added ${allocations.length} resource allocations to project ${projectId}`);
    console.log('Project setup complete!');
  } catch (err) {
    console.error('Error allocating resources:', err);
    throw err;
  }
}

// Run the script
async function run() {
  try {
    // Create the project first
    const projectId = await createProject();
    
    // Then add resource allocations
    await addResourceAllocations(projectId);
    
    console.log('Script completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

run();