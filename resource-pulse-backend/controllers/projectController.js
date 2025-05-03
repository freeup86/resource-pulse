const { poolPromise, sql } = require('../db/config');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log('Backend: Getting all projects');
    
    // Query projects with financial data
    const result = await pool.request()
      .query(`
        SELECT 
          p.ProjectID, 
          p.Name, 
          p.Client, 
          p.Description,
          p.StartDate, 
          p.EndDate, 
          p.Status,
          p.Budget,
          p.ActualCost,
          p.BudgetUtilization,
          p.Currency,
          p.FinancialNotes
        FROM Projects p
        ORDER BY p.Name
      `);
    
    // For each project, get required skills and roles
    const projects = await Promise.all(result.recordset.map(async project => {
      // Get skills
      const skillsResult = await pool.request()
        .input('projectId', sql.Int, project.ProjectID)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
          WHERE ps.ProjectID = @projectId
        `);
      
      // Get roles
      const rolesResult = await pool.request()
        .input('projectId', sql.Int, project.ProjectID)
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
      
      // Get financial summary from view
      const financialResult = await pool.request()
        .input('projectId', sql.Int, project.ProjectID)
        .query(`
          SELECT 
            PlannedBudget,
            ActualCost,
            Variance,
            BudgetUtilizationPercentage,
            AllocatedCost,
            BillableAmount,
            ProjectProfit,
            ProfitMarginPercentage
          FROM vw_ProjectFinancials
          WHERE ProjectID = @projectId
        `);
      
      const financials = financialResult.recordset.length > 0 ? financialResult.recordset[0] : null;
      
      // Format the response
      return {
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        description: project.Description,
        startDate: project.StartDate,
        endDate: project.EndDate,
        status: project.Status,
        requiredSkills: skillsResult.recordset.map(skill => skill.Name),
        requiredRoles: rolesResult.recordset.map(role => ({
          id: role.RoleID,
          name: role.RoleName,
          count: role.Count
        })),
        financials: {
          budget: project.Budget,
          actualCost: project.ActualCost,
          budgetUtilization: project.BudgetUtilization,
          currency: project.Currency,
          financialNotes: project.FinancialNotes,
          // Add calculated fields from the view if available
          variance: financials ? financials.Variance : null,
          budgetUtilizationPercentage: financials ? financials.BudgetUtilizationPercentage : null,
          allocatedCost: financials ? financials.AllocatedCost : null,
          billableAmount: financials ? financials.BillableAmount : null,
          profit: financials ? financials.ProjectProfit : null,
          profitMargin: financials ? financials.ProfitMarginPercentage : null
        }
      };
    }));
    
    console.log('Backend: Returning projects with roles and financials');
    res.json(projects);
  } catch (err) {
    console.error('Error getting projects:', err);
    res.status(500).json({
      message: 'Error retrieving projects',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    console.log('Backend: Getting project with ID:', id);
    
    // Get required roles
    const rolesResult = await pool.request()
    .input('projectId', sql.Int, id)
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
    
    console.log('Backend: Found roles for project:', rolesResult.recordset);

    // Query project with financial data
    const result = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT 
          p.ProjectID, 
          p.Name, 
          p.Client, 
          p.Description,
          p.StartDate, 
          p.EndDate, 
          p.Status,
          p.Budget,
          p.ActualCost,
          p.BudgetUtilization,
          p.Currency,
          p.FinancialNotes
        FROM Projects p
        WHERE p.ProjectID = @projectId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = result.recordset[0];
    
    // Get skills
    const skillsResult = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT s.SkillID, s.Name
        FROM Skills s
        INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
        WHERE ps.ProjectID = @projectId
      `);
    
    // Get allocated resources with financial data
    const resourcesResult = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT 
          r.ResourceID,
          r.Name,
          r.Role,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          a.HourlyRate,
          a.BillableRate,
          a.TotalHours,
          a.TotalCost,
          a.BillableAmount,
          a.IsBillable
        FROM Resources r
        INNER JOIN Allocations a ON r.ResourceID = a.ResourceID
        WHERE a.ProjectID = @projectId
        AND a.EndDate >= GETDATE()
        ORDER BY a.EndDate ASC
      `);
    
    // Get financial summary from view
    const financialResult = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT 
          PlannedBudget,
          ActualCost,
          Variance,
          BudgetUtilizationPercentage,
          AllocatedCost,
          BillableAmount,
          ProjectProfit,
          ProfitMarginPercentage
        FROM vw_ProjectFinancials
        WHERE ProjectID = @projectId
      `);
    
    const financials = financialResult.recordset.length > 0 ? financialResult.recordset[0] : null;
    
    // Get budget items for detailed breakdown
    const budgetItemsResult = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT 
          BudgetItemID,
          Category,
          Description,
          PlannedAmount,
          ActualAmount,
          Variance,
          Notes
        FROM BudgetItems
        WHERE ProjectID = @projectId
        ORDER BY Category, Description
      `);
    
    // Get financial snapshots for historical tracking
    const snapshotsResult = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT 
          SnapshotID,
          SnapshotDate,
          PlannedBudget,
          ActualCost,
          ForecastedCost,
          Variance,
          Notes
        FROM ProjectFinancialSnapshots
        WHERE ProjectID = @projectId
        ORDER BY SnapshotDate DESC
      `);
    
    // Format the response
    const formattedProject = {
      id: project.ProjectID,
      name: project.Name,
      client: project.Client,
      description: project.Description,
      startDate: project.StartDate,
      endDate: project.EndDate,
      status: project.Status,
      requiredSkills: skillsResult.recordset.map(skill => skill.Name),
      requiredRoles: rolesResult.recordset.map(role => ({
        id: role.RoleID,
        name: role.RoleName,
        count: role.Count
      })),
      allocatedResources: resourcesResult.recordset.map(resource => ({
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        startDate: resource.StartDate,
        endDate: resource.EndDate,
        utilization: resource.Utilization,
        hourlyRate: resource.HourlyRate,
        billableRate: resource.BillableRate,
        totalHours: resource.TotalHours,
        totalCost: resource.TotalCost,
        billableAmount: resource.BillableAmount,
        isBillable: resource.IsBillable,
        billingType: resource.BillingType
      })),
      financials: {
        budget: project.Budget,
        actualCost: project.ActualCost,
        budgetUtilization: project.BudgetUtilization,
        currency: project.Currency,
        financialNotes: project.FinancialNotes,
        // Add calculated fields from the view if available
        variance: financials ? financials.Variance : null,
        budgetUtilizationPercentage: financials ? financials.BudgetUtilizationPercentage : null,
        allocatedCost: financials ? financials.AllocatedCost : null,
        billableAmount: financials ? financials.BillableAmount : null,
        profit: financials ? financials.ProjectProfit : null,
        profitMargin: financials ? financials.ProfitMarginPercentage : null,
        // Add budget items and snapshots
        budgetItems: budgetItemsResult.recordset.map(item => ({
          id: item.BudgetItemID,
          category: item.Category,
          description: item.Description,
          plannedAmount: item.PlannedAmount,
          actualAmount: item.ActualAmount,
          variance: item.Variance,
          notes: item.Notes
        })),
        snapshots: snapshotsResult.recordset.map(snapshot => ({
          id: snapshot.SnapshotID,
          date: snapshot.SnapshotDate,
          plannedBudget: snapshot.PlannedBudget,
          actualCost: snapshot.ActualCost,
          forecastedCost: snapshot.ForecastedCost,
          variance: snapshot.Variance,
          notes: snapshot.Notes
        }))
      }
    };
    
    console.log('Backend: Returning project with roles and financials');
    res.json(formattedProject);
  } catch (err) {
    console.error('Error getting project:', err);
    res.status(500).json({
      message: 'Error retrieving project',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { 
      name, 
      client, 
      description, 
      startDate, 
      endDate, 
      status,
      requiredSkills,
      requiredRoles,
      // Financial parameters
      budget,
      currency,
      financialNotes,
      budgetItems
    } = req.body;
    
    // Validate required fields
    if (!name || !client) {
      return res.status(400).json({ message: 'Name and client are required' });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Insert project with financial data
      const projectResult = await transaction.request()
        .input('name', sql.NVarChar, name)
        .input('client', sql.NVarChar, client)
        .input('description', sql.NVarChar, description || null)
        .input('startDate', sql.Date, startDate ? new Date(startDate) : null)
        .input('endDate', sql.Date, endDate ? new Date(endDate) : null)
        .input('status', sql.NVarChar, status || 'Active')
        .input('budget', sql.Decimal(14, 2), budget || null)
        .input('currency', sql.NVarChar(3), currency || 'USD')
        .input('financialNotes', sql.NVarChar, financialNotes || null)
        .query(`
          INSERT INTO Projects (
            Name, 
            Client, 
            Description, 
            StartDate, 
            EndDate, 
            Status, 
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
            @budget, 
            @currency, 
            @financialNotes,
            0,  -- Initial actual cost is 0
            0   -- Initial budget utilization is 0
          )
        `);
      
      const projectId = projectResult.recordset[0].ProjectID;
      
      // Process budget items if provided
      if (budgetItems && budgetItems.length > 0) {
        for (const item of budgetItems) {
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
      }
      
      // Create initial financial snapshot
      await transaction.request()
        .input('projectId', sql.Int, projectId)
        .input('budget', sql.Decimal(14, 2), budget || null)
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
      
      // Process required skills if provided
      if (requiredSkills && requiredSkills.length > 0) {
        for (const skillName of requiredSkills) {
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
      }
      
      // Process required roles if provided
      if (requiredRoles && requiredRoles.length > 0) {
        for (const roleReq of requiredRoles) {
          // Validate role exists
          const roleResult = await transaction.request()
            .input('roleId', sql.Int, roleReq.roleId)
            .query(`
              SELECT RoleID FROM Roles WHERE RoleID = @roleId
            `);
          
          if (roleResult.recordset.length === 0) {
            // Role doesn't exist, skip it
            continue;
          }
          
          // Add role requirement to project
          await transaction.request()
            .input('projectId', sql.Int, projectId)
            .input('roleId', sql.Int, roleReq.roleId)
            .input('count', sql.Int, roleReq.count || 1)
            .query(`
              INSERT INTO ProjectRoles (ProjectID, RoleID, Count)
              VALUES (@projectId, @roleId, @count)
            `);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Get financial summary from view
      const financialResult = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT 
            PlannedBudget,
            ActualCost,
            Variance,
            BudgetUtilizationPercentage,
            AllocatedCost,
            BillableAmount,
            ProjectProfit,
            ProfitMarginPercentage
          FROM vw_ProjectFinancials
          WHERE ProjectID = @projectId
        `);
      
      const financials = financialResult.recordset.length > 0 ? financialResult.recordset[0] : null;
      
      // Get budget items for response
      const budgetItemsResult = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT 
            BudgetItemID,
            Category,
            Description,
            PlannedAmount,
            ActualAmount,
            Variance,
            Notes
          FROM BudgetItems
          WHERE ProjectID = @projectId
          ORDER BY Category, Description
        `);
      
      // Return the created project (include required roles and financial data)
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
            p.Budget,
            p.ActualCost,
            p.BudgetUtilization,
            p.Currency,
            p.FinancialNotes
          FROM Projects p
          WHERE p.ProjectID = @projectId
        `);
      
      // Get skills
      const skillsResult = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
          WHERE ps.ProjectID = @projectId
        `);
      
      // Get required roles
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
      
      // Format the response
      const project = result.recordset[0];
      const formattedProject = {
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        description: project.Description,
        startDate: project.StartDate,
        endDate: project.EndDate,
        status: project.Status,
        requiredSkills: skillsResult.recordset.map(skill => skill.Name),
        requiredRoles: rolesResult.recordset.map(role => ({
          id: role.RoleID,
          name: role.RoleName,
          count: role.Count
        })),
        allocatedResources: [],
        financials: {
          budget: project.Budget,
          actualCost: project.ActualCost,
          budgetUtilization: project.BudgetUtilization,
          currency: project.Currency,
          financialNotes: project.FinancialNotes,
          // Add calculated fields from the view if available
          variance: financials ? financials.Variance : null,
          budgetUtilizationPercentage: financials ? financials.BudgetUtilizationPercentage : null,
          allocatedCost: financials ? financials.AllocatedCost : null,
          billableAmount: financials ? financials.BillableAmount : null,
          profit: financials ? financials.ProjectProfit : null,
          profitMargin: financials ? financials.ProfitMarginPercentage : null,
          // Add budget items
          budgetItems: budgetItemsResult.recordset.map(item => ({
            id: item.BudgetItemID,
            category: item.Category,
            description: item.Description,
            plannedAmount: item.PlannedAmount,
            actualAmount: item.ActualAmount,
            variance: item.Variance,
            notes: item.Notes
          }))
        }
      };
      
      res.status(201).json(formattedProject);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({
      message: 'Error creating project',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
  const pool = await poolPromise;
  const { id } = req.params;
  const { 
      name, 
      client, 
      description, 
      startDate, 
      endDate, 
      status,
      requiredSkills,
      requiredRoles,
      // Financial parameters
      budget,
      currency,
      financialNotes,
      budgetItems
  } = req.body;
  
  console.log('Backend: Updating project with ID:', id);
  
  // Validate required fields
  if (!name || !client) {
      return res.status(400).json({ message: 'Name and client are required' });
  }
  
  // Start a transaction
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  
  try {
      // Check if project exists
      const checkProject = await transaction.request()
      .input('projectId', sql.Int, id)
      .query(`
          SELECT ProjectID FROM Projects WHERE ProjectID = @projectId
      `);
      
      if (checkProject.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Update project with financial data
      await transaction.request()
      .input('projectId', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('client', sql.NVarChar, client)
      .input('description', sql.NVarChar, description || null)
      .input('startDate', sql.Date, startDate ? new Date(startDate) : null)
      .input('endDate', sql.Date, endDate ? new Date(endDate) : null)
      .input('status', sql.NVarChar, status || 'Active')
      .input('budget', sql.Decimal(14, 2), budget)
      .input('currency', sql.NVarChar(3), currency || 'USD')
      .input('financialNotes', sql.NVarChar, financialNotes || null)
      .input('updatedAt', sql.DateTime2, new Date())
      .query(`
          UPDATE Projects
          SET Name = @name,
              Client = @client,
              Description = @description,
              StartDate = @startDate,
              EndDate = @endDate,
              Status = @status,
              UpdatedAt = @updatedAt,
              Budget = @budget,
              Currency = @currency,
              FinancialNotes = @financialNotes
          WHERE ProjectID = @projectId
      `);
      
      // Process budget items if provided
      if (budgetItems !== undefined) {
        // Remove all existing budget items
        await transaction.request()
          .input('projectId', sql.Int, id)
          .query(`
            DELETE FROM BudgetItems
            WHERE ProjectID = @projectId
          `);
        
        // Add new budget items
        if (budgetItems && budgetItems.length > 0) {
          for (const item of budgetItems) {
            await transaction.request()
              .input('projectId', sql.Int, id)
              .input('category', sql.NVarChar(100), item.category)
              .input('description', sql.NVarChar(500), item.description)
              .input('plannedAmount', sql.Decimal(14, 2), item.plannedAmount)
              .input('actualAmount', sql.Decimal(14, 2), item.actualAmount || 0)
              .input('variance', sql.Decimal(14, 2), (item.plannedAmount || 0) - (item.actualAmount || 0))
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
                  @actualAmount,
                  @variance,
                  @notes
                )
              `);
          }
        }
      }
      
      // Create a financial snapshot
      if (budget !== undefined) {
        await transaction.request()
          .input('projectId', sql.Int, id)
          .input('budget', sql.Decimal(14, 2), budget)
          .input('notes', sql.NVarChar, 'Snapshot created due to budget update')
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
            SELECT 
              @projectId, 
              GETDATE(), 
              @budget, 
              ActualCost,
              -- Simple forecasting based on current burn rate and remaining time
              CASE 
                WHEN DATEDIFF(day, GETDATE(), EndDate) > 0 AND DATEDIFF(day, StartDate, GETDATE()) > 0
                THEN ActualCost * (DATEDIFF(day, StartDate, EndDate) / CAST(DATEDIFF(day, StartDate, GETDATE()) AS FLOAT))
                ELSE ActualCost
              END,
              @budget - ActualCost,
              @notes
            FROM Projects
            WHERE ProjectID = @projectId
          `);
      }
      
      // Process required skills if provided
      if (requiredSkills !== undefined) {
        // Remove all existing skills
        await transaction.request()
          .input('projectId', sql.Int, id)
          .query(`
            DELETE FROM ProjectSkills
            WHERE ProjectID = @projectId
          `);
      
        // Add new skills
        if (requiredSkills && requiredSkills.length > 0) {
          for (const skillName of requiredSkills) {
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
              .input('projectId', sql.Int, id)
              .input('skillId', sql.Int, skillId)
              .query(`
                INSERT INTO ProjectSkills (ProjectID, SkillID)
                VALUES (@projectId, @skillId)
              `);
          }
        }
      }
      
      // Process required roles if provided
      if (requiredRoles !== undefined) {
        console.log('Backend: Processing required roles');
        
        // Remove all existing roles
        const deleteResult = await transaction.request()
          .input('projectId', sql.Int, id)
          .query(`
            DELETE FROM ProjectRoles
            WHERE ProjectID = @projectId
          `);
        
        console.log('Backend: Deleted existing roles, affected rows:', deleteResult.rowsAffected[0]);
        
        // Add new roles
        if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
          console.log('Backend: Adding new roles, count:', requiredRoles.length);
          
          for (const roleReq of requiredRoles) {
            console.log('Backend: Processing role:', roleReq);
            
            if (!roleReq.roleId) {
              console.log('Backend: Invalid role object, missing roleId:', roleReq);
              continue;
            }
            
            const roleId = parseInt(roleReq.roleId);
            const count = parseInt(roleReq.count) || 1;
            
            console.log(`Backend: Using roleId: ${roleId}, count: ${count}`);
            
            // Validate role exists
            const roleResult = await transaction.request()
              .input('roleId', sql.Int, roleId)
              .query(`
                SELECT RoleID FROM Roles WHERE RoleID = @roleId
              `);
            
            if (roleResult.recordset.length === 0) {
              console.log(`Backend: Role with ID ${roleId} not found, skipping`);
              continue;
            }
            
            console.log(`Backend: Role with ID ${roleId} found, adding to project`);
            
            // Add role requirement to project
            const insertResult = await transaction.request()
              .input('projectId', sql.Int, id)
              .input('roleId', sql.Int, roleId)
              .input('count', sql.Int, count)
              .query(`
                INSERT INTO ProjectRoles (ProjectID, RoleID, Count)
                VALUES (@projectId, @roleId, @count)
              `);
            
            console.log('Backend: Role inserted, affected rows:', insertResult.rowsAffected[0]);
          }
        } else {
          console.log('Backend: No roles to add or invalid roles array:', requiredRoles);
        }
      }
      
      // Run the stored procedure to recalculate project financials
      await transaction.request()
        .input('projectId', sql.Int, id)
        .execute('sp_RecalculateProjectFinancials');
      
      // Commit transaction
      await transaction.commit();
      
      // Get required roles for the response
      const rolesResult = await pool.request()
        .input('projectId', sql.Int, id)
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
      
      // Return the updated project with financial data
      const result = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
          SELECT 
            p.ProjectID, 
            p.Name, 
            p.Client, 
            p.Description,
            p.StartDate, 
            p.EndDate, 
            p.Status,
            p.Budget,
            p.ActualCost,
            p.BudgetUtilization,
            p.Currency,
            p.FinancialNotes
          FROM Projects p
          WHERE p.ProjectID = @projectId
        `);
      
      // Get skills
      const skillsResult = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
          WHERE ps.ProjectID = @projectId
        `);
      
      // Get allocated resources with financial data
      const resourcesResult = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
          SELECT 
            r.ResourceID,
            r.Name,
            r.Role,
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
      
      // Get financial summary from view
      const financialResult = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
          SELECT 
            PlannedBudget,
            ActualCost,
            Variance,
            BudgetUtilizationPercentage,
            AllocatedCost,
            BillableAmount,
            ProjectProfit,
            ProfitMarginPercentage
          FROM vw_ProjectFinancials
          WHERE ProjectID = @projectId
        `);
      
      const financials = financialResult.recordset.length > 0 ? financialResult.recordset[0] : null;
      
      // Get budget items for detailed breakdown
      const budgetItemsResult = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
          SELECT 
            BudgetItemID,
            Category,
            Description,
            PlannedAmount,
            ActualAmount,
            Variance,
            Notes
          FROM BudgetItems
          WHERE ProjectID = @projectId
          ORDER BY Category, Description
        `);
      
      // Get financial snapshots for historical tracking
      const snapshotsResult = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
          SELECT 
            SnapshotID,
            SnapshotDate,
            PlannedBudget,
            ActualCost,
            ForecastedCost,
            Variance,
            Notes
          FROM ProjectFinancialSnapshots
          WHERE ProjectID = @projectId
          ORDER BY SnapshotDate DESC
        `);
      
      // Format the response
      const project = result.recordset[0];
      const formattedProject = {
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        description: project.Description,
        startDate: project.StartDate,
        endDate: project.EndDate,
        status: project.Status,
        requiredSkills: skillsResult.recordset.map(skill => skill.Name),
        requiredRoles: rolesResult.recordset.map(role => ({
          id: role.RoleID,
          name: role.RoleName,
          count: role.Count
        })),
        allocatedResources: resourcesResult.recordset.map(resource => ({
          id: resource.ResourceID,
          name: resource.Name,
          role: resource.Role,
          startDate: resource.StartDate,
          endDate: resource.EndDate,
          utilization: resource.Utilization,
          hourlyRate: resource.HourlyRate,
          billableRate: resource.BillableRate,
          totalHours: resource.TotalHours,
          totalCost: resource.TotalCost,
          billableAmount: resource.BillableAmount,
          isBillable: resource.IsBillable !== 0
        })),
        financials: {
          budget: project.Budget,
          actualCost: project.ActualCost,
          budgetUtilization: project.BudgetUtilization,
          currency: project.Currency,
          financialNotes: project.FinancialNotes,
          // Add calculated fields from the view if available
          variance: financials ? financials.Variance : null,
          budgetUtilizationPercentage: financials ? financials.BudgetUtilizationPercentage : null,
          allocatedCost: financials ? financials.AllocatedCost : null,
          billableAmount: financials ? financials.BillableAmount : null,
          profit: financials ? financials.ProjectProfit : null,
          profitMargin: financials ? financials.ProfitMarginPercentage : null,
          // Add budget items and snapshots
          budgetItems: budgetItemsResult.recordset.map(item => ({
            id: item.BudgetItemID,
            category: item.Category,
            description: item.Description,
            plannedAmount: item.PlannedAmount,
            actualAmount: item.ActualAmount,
            variance: item.Variance,
            notes: item.Notes
          })),
          snapshots: snapshotsResult.recordset.map(snapshot => ({
            id: snapshot.SnapshotID,
            date: snapshot.SnapshotDate,
            plannedBudget: snapshot.PlannedBudget,
            actualCost: snapshot.ActualCost,
            forecastedCost: snapshot.ForecastedCost,
            variance: snapshot.Variance,
            notes: snapshot.Notes
          }))
        }
      };
      
      console.log('Backend: Responding with updated project and financials');
      res.json(formattedProject);
  } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Backend: Transaction error:', err);
      throw err;
  }
  } catch (err) {
    console.error('Backend: Error updating project:', err);
    res.status(500).json({
      message: 'Error updating project',
      error: process.env.NODE_ENV === 'production' ? {} : {
        message: err.message,
        stack: err.stack
      }
    });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Check if project exists
    const checkProject = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT ProjectID, Name FROM Projects WHERE ProjectID = @projectId
      `);
    
    if (checkProject.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const projectName = checkProject.recordset[0].Name;
    
    // Check if project has allocations
    const checkAllocations = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT COUNT(*) AS AllocationCount 
        FROM Allocations 
        WHERE ProjectID = @projectId
      `);
    
    if (checkAllocations.recordset[0].AllocationCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete project with active allocations. Remove allocations first.' 
      });
    }
    
    // Check if project has invoices
    const checkInvoices = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT COUNT(*) AS InvoiceCount 
        FROM Invoices 
        WHERE ProjectID = @projectId
      `);
    
    if (checkInvoices.recordset[0].InvoiceCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete project with invoices. Archive the project instead.' 
      });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Create a final financial snapshot before deletion (for record keeping)
      await transaction.request()
        .input('projectId', sql.Int, id)
        .execute('sp_RecalculateProjectFinancials');
      
      console.log('Backend: Created final financial snapshot before deletion');
      
      // Delete related financial records first
      await transaction.request()
        .input('projectId', sql.Int, id)
        .query(`
          -- Delete budget items
          DELETE FROM BudgetItems
          WHERE ProjectID = @projectId;
          
          -- Delete project snapshots
          DELETE FROM ProjectFinancialSnapshots
          WHERE ProjectID = @projectId;
          
          -- Delete time entries
          DELETE FROM TimeEntries
          WHERE ProjectID = @projectId;
        `);
      
      console.log('Backend: Deleted financial records');
      
      // Delete project (cascade will handle remaining related records)
      await transaction.request()
        .input('projectId', sql.Int, id)
        .query(`
          DELETE FROM Projects
          WHERE ProjectID = @projectId
        `);
      
      console.log('Backend: Deleted project');
      
      // Commit transaction
      await transaction.commit();
      
      res.json({ 
        message: `Project "${projectName}" deleted successfully, including all financial records.` 
      });
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Backend: Transaction error:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({
      message: 'Error deleting project',
      error: process.env.NODE_ENV === 'production' ? {} : {
        message: err.message,
        stack: err.stack
      }
    });
  }
};

// Recalculate project financial data
exports.recalculateFinancials = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { createSnapshot = true, snapshotNotes } = req.body;
    
    // Check if project exists
    const checkProject = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT ProjectID, Name, Budget FROM Projects WHERE ProjectID = @projectId
      `);
    
    if (checkProject.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const projectName = checkProject.recordset[0].Name;
    const budget = checkProject.recordset[0].Budget;
    
    // Run the recalculation stored procedure
    await pool.request()
      .input('projectId', sql.Int, id)
      .execute('sp_RecalculateProjectFinancials');
    
    console.log(`Backend: Recalculated financials for project "${projectName}"`);
    
    // Create a financial snapshot if requested
    if (createSnapshot) {
      const notes = snapshotNotes || 'Snapshot created via manual recalculation';
      
      await pool.request()
        .input('projectId', sql.Int, id)
        .input('notes', sql.NVarChar, notes)
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
          SELECT 
            @projectId, 
            GETDATE(), 
            Budget, 
            ActualCost,
            -- Simple forecasting based on current burn rate and remaining time
            CASE 
              WHEN DATEDIFF(day, GETDATE(), EndDate) > 0 AND DATEDIFF(day, StartDate, GETDATE()) > 0
              THEN ActualCost * (DATEDIFF(day, StartDate, EndDate) / CAST(DATEDIFF(day, StartDate, GETDATE()) AS FLOAT))
              ELSE ActualCost
            END,
            Budget - ActualCost,
            @notes
          FROM Projects
          WHERE ProjectID = @projectId
        `);
      
      console.log(`Backend: Created financial snapshot for project "${projectName}"`);
    }
    
    // Get updated financial data
    const financialResult = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT 
          PlannedBudget,
          ActualCost,
          Variance,
          BudgetUtilizationPercentage,
          AllocatedCost,
          BillableAmount,
          ProjectProfit,
          ProfitMarginPercentage
        FROM vw_ProjectFinancials
        WHERE ProjectID = @projectId
      `);
    
    const financials = financialResult.recordset.length > 0 ? financialResult.recordset[0] : null;
    
    // Return updated financial information
    res.json({
      message: `Financials recalculated successfully for project "${projectName}"`,
      financials: {
        budget: budget,
        actualCost: financials ? financials.ActualCost : null,
        variance: financials ? financials.Variance : null,
        budgetUtilizationPercentage: financials ? financials.BudgetUtilizationPercentage : null,
        allocatedCost: financials ? financials.AllocatedCost : null,
        billableAmount: financials ? financials.BillableAmount : null,
        profit: financials ? financials.ProjectProfit : null,
        profitMargin: financials ? financials.ProfitMarginPercentage : null
      },
      snapshotCreated: createSnapshot
    });
  } catch (err) {
    console.error('Error recalculating project financials:', err);
    res.status(500).json({
      message: 'Error recalculating project financials',
      error: process.env.NODE_ENV === 'production' ? {} : {
        message: err.message,
        stack: err.stack
      }
    });
  }
};