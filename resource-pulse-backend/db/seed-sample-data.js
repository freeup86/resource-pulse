/**
 * Sample Data Seed Script
 * 
 * This script populates the ResourcePulse database with sample data for testing and demonstration.
 * Run this script after setting up the database structure if you want sample data to work with.
 */

const { poolPromise, sql } = require('./config');

const seedSampleData = async () => {
  try {
    console.log('======================================================');
    console.log('SEEDING SAMPLE DATA');
    console.log('======================================================');
    console.log('This will populate your database with sample data.');
    console.log('------------------------------------------------------');
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Check if data already exists
      const resourceCount = await transaction.request().query(`
        SELECT COUNT(*) as count FROM Resources
      `);
      
      if (resourceCount.recordset[0].count > 0) {
        console.log('Your database already contains resources. Do you want to:');
        console.log('1. Delete all existing data and seed fresh sample data');
        console.log('2. Add sample data alongside your existing data');
        console.log('3. Cancel and make no changes');
        
        // In a real interactive script, we'd ask for input here
        // For this example, we'll just proceed assuming option 2
        console.log('\nProceeding with option 2: Adding sample data alongside existing data');
      }
      
      // Add skills
      console.log('\nAdding sample skills...');
      const skills = [
        { name: 'JavaScript', category: 'Frontend' },
        { name: 'React', category: 'Frontend' },
        { name: 'Angular', category: 'Frontend' },
        { name: 'Vue', category: 'Frontend' },
        { name: 'HTML/CSS', category: 'Frontend' },
        { name: 'Node.js', category: 'Backend' },
        { name: 'Python', category: 'Backend' },
        { name: 'Java', category: 'Backend' },
        { name: 'C#', category: 'Backend' },
        { name: 'SQL', category: 'Database' },
        { name: 'MongoDB', category: 'Database' },
        { name: 'AWS', category: 'DevOps' },
        { name: 'Azure', category: 'DevOps' },
        { name: 'Docker', category: 'DevOps' },
        { name: 'Kubernetes', category: 'DevOps' },
        { name: 'Project Management', category: 'Management' },
        { name: 'Scrum', category: 'Management' },
        { name: 'UI Design', category: 'Design' },
        { name: 'UX Research', category: 'Design' }
      ];
      
      for (const skill of skills) {
        try {
          await transaction.request()
            .input('name', sql.NVarChar, skill.name)
            .input('category', sql.NVarChar, skill.category)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM Skills WHERE Name = @name)
              BEGIN
                INSERT INTO Skills (Name, Category)
                VALUES (@name, @category)
              END
            `);
        } catch (err) {
          console.warn(`  Warning: Could not add skill ${skill.name}: ${err.message}`);
        }
      }
      
      // Add projects
      console.log('Adding sample projects...');
      const projects = [
        { name: 'E-commerce Platform', client: 'RetailCorp', description: 'Building a new e-commerce platform with modern technologies.', startDate: '2023-01-01', endDate: '2023-12-31', status: 'Active' },
        { name: 'Mobile Banking App', client: 'FinanceBank', description: 'Developing a mobile banking application with secure authentication.', startDate: '2023-03-15', endDate: '2023-11-30', status: 'Active' },
        { name: 'Health Tracker', client: 'HealthTech', description: 'Creating a health tracking application for patients and doctors.', startDate: '2023-02-01', endDate: '2023-08-31', status: 'Active' },
        { name: 'CRM System', client: 'SalesForce', description: 'Implementing a custom CRM system for sales teams.', startDate: '2023-04-01', endDate: '2024-01-31', status: 'Active' },
        { name: 'Marketing Website', client: 'MarketingPro', description: 'Redesigning the marketing website for better conversion.', startDate: '2023-05-15', endDate: '2023-08-15', status: 'Active' },
        { name: 'Analytics Dashboard', client: 'DataCorp', description: 'Building a real-time analytics dashboard for business metrics.', startDate: '2023-06-01', endDate: '2023-12-15', status: 'Active' },
        { name: 'Support Portal', client: 'HelpDesk', description: 'Creating a customer support portal with ticketing system.', startDate: '2023-07-01', endDate: '2024-02-28', status: 'Active' },
        { name: 'Legacy System Migration', client: 'OldTech', description: 'Migrating a legacy system to modern cloud infrastructure.', startDate: '2023-01-15', endDate: '2023-10-31', status: 'Active' },
        { name: 'Content Management System', client: 'PublishCorp', description: 'Implementing a custom CMS for content creators.', startDate: '2023-08-01', endDate: '2024-04-30', status: 'Planned' },
        { name: 'Inventory Management', client: 'WarehouseCo', description: 'Building an inventory management system with barcode scanning.', startDate: '2023-09-15', endDate: '2024-03-31', status: 'Planned' }
      ];
      
      for (const project of projects) {
        try {
          await transaction.request()
            .input('name', sql.NVarChar, project.name)
            .input('client', sql.NVarChar, project.client)
            .input('description', sql.NVarChar, project.description)
            .input('startDate', sql.Date, new Date(project.startDate))
            .input('endDate', sql.Date, new Date(project.endDate))
            .input('status', sql.NVarChar, project.status)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM Projects WHERE Name = @name AND Client = @client)
              BEGIN
                INSERT INTO Projects (Name, Client, Description, StartDate, EndDate, Status)
                VALUES (@name, @client, @description, @startDate, @endDate, @status)
              END
            `);
        } catch (err) {
          console.warn(`  Warning: Could not add project ${project.name}: ${err.message}`);
        }
      }
      
      // Add resources
      console.log('Adding sample resources...');
      const resources = [
        { name: 'John Smith', role: 'Frontend Developer', email: 'john.smith@example.com', hourlyRate: 75 },
        { name: 'Jane Doe', role: 'Backend Developer', email: 'jane.doe@example.com', hourlyRate: 85 },
        { name: 'Michael Johnson', role: 'Full Stack Developer', email: 'michael.johnson@example.com', hourlyRate: 95 },
        { name: 'Emily Williams', role: 'UI/UX Designer', email: 'emily.williams@example.com', hourlyRate: 80 },
        { name: 'Robert Brown', role: 'Project Manager', email: 'robert.brown@example.com', hourlyRate: 100 },
        { name: 'Sophia Davis', role: 'QA Engineer', email: 'sophia.davis@example.com', hourlyRate: 70 },
        { name: 'William Miller', role: 'DevOps Engineer', email: 'william.miller@example.com', hourlyRate: 90 },
        { name: 'Olivia Wilson', role: 'Data Scientist', email: 'olivia.wilson@example.com', hourlyRate: 95 },
        { name: 'James Moore', role: 'Frontend Developer', email: 'james.moore@example.com', hourlyRate: 75 },
        { name: 'Emma Taylor', role: 'Backend Developer', email: 'emma.taylor@example.com', hourlyRate: 85 },
        { name: 'Alexander Anderson', role: 'Full Stack Developer', email: 'alexander.anderson@example.com', hourlyRate: 95 },
        { name: 'Ava Thomas', role: 'UI/UX Designer', email: 'ava.thomas@example.com', hourlyRate: 80 },
        { name: 'Benjamin Jackson', role: 'Mobile Developer', email: 'benjamin.jackson@example.com', hourlyRate: 85 },
        { name: 'Mia White', role: 'Security Engineer', email: 'mia.white@example.com', hourlyRate: 90 },
        { name: 'Ethan Harris', role: 'Database Administrator', email: 'ethan.harris@example.com', hourlyRate: 85 }
      ];
      
      for (const resource of resources) {
        try {
          await transaction.request()
            .input('name', sql.NVarChar, resource.name)
            .input('role', sql.NVarChar, resource.role)
            .input('email', sql.NVarChar, resource.email)
            .input('hourlyRate', sql.Decimal(10, 2), resource.hourlyRate)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM Resources WHERE Name = @name OR Email = @email)
              BEGIN
                INSERT INTO Resources (Name, Role, Email, HourlyRate)
                VALUES (@name, @role, @email, @hourlyRate)
              END
            `);
        } catch (err) {
          console.warn(`  Warning: Could not add resource ${resource.name}: ${err.message}`);
        }
      }
      
      // Add allocations - more complex as it requires relationships
      console.log('Adding sample allocations...');
      
      // Get resource IDs
      const resourcesResult = await transaction.request().query(`
        SELECT ResourceID, Name FROM Resources
      `);
      
      // Get project IDs
      const projectsResult = await transaction.request().query(`
        SELECT ProjectID, Name, StartDate, EndDate FROM Projects
      `);
      
      if (resourcesResult.recordset.length > 0 && projectsResult.recordset.length > 0) {
        const resources = resourcesResult.recordset;
        const projects = projectsResult.recordset;
        
        // Create some allocations
        const allocations = [];
        
        // Allocate each resource to 1-3 projects with different utilization
        for (const resource of resources) {
          // Randomly select 1-3 projects for this resource
          const numProjects = Math.floor(Math.random() * 3) + 1;
          const shuffledProjects = [...projects].sort(() => 0.5 - Math.random());
          const selectedProjects = shuffledProjects.slice(0, numProjects);
          
          for (const project of selectedProjects) {
            // Randomize start and end dates within project timeline
            const projectStart = new Date(project.StartDate);
            const projectEnd = new Date(project.EndDate);
            
            // Start date is between project start and 1 month before project end
            const earliestStart = projectStart;
            const latestStart = new Date(projectEnd);
            latestStart.setMonth(latestStart.getMonth() - 1);
            
            const startBuffer = latestStart.getTime() - earliestStart.getTime();
            const randomStartOffset = Math.floor(Math.random() * startBuffer);
            const allocationStart = new Date(earliestStart.getTime() + randomStartOffset);
            
            // End date is between 1 month after allocation start and project end
            const earliestEnd = new Date(allocationStart);
            earliestEnd.setMonth(earliestEnd.getMonth() + 1);
            const latestEnd = projectEnd;
            
            const endBuffer = latestEnd.getTime() - earliestEnd.getTime();
            const randomEndOffset = Math.floor(Math.random() * endBuffer);
            const allocationEnd = new Date(earliestEnd.getTime() + randomEndOffset);
            
            // Random utilization between 20% and 100%
            const utilization = Math.floor(Math.random() * 81) + 20;
            
            allocations.push({
              resourceId: resource.ResourceID,
              projectId: project.ProjectID,
              startDate: allocationStart,
              endDate: allocationEnd,
              utilization: utilization,
              notes: `${resource.Name} allocated to ${project.Name}`
            });
          }
        }
        
        // Insert allocations
        for (const allocation of allocations) {
          try {
            await transaction.request()
              .input('resourceId', sql.Int, allocation.resourceId)
              .input('projectId', sql.Int, allocation.projectId)
              .input('startDate', sql.Date, allocation.startDate)
              .input('endDate', sql.Date, allocation.endDate)
              .input('utilization', sql.Int, allocation.utilization)
              .input('notes', sql.NVarChar, allocation.notes)
              .query(`
                IF NOT EXISTS (
                  SELECT 1 FROM Allocations 
                  WHERE ResourceID = @resourceId 
                  AND ProjectID = @projectId 
                  AND StartDate = @startDate
                  AND EndDate = @endDate
                )
                BEGIN
                  INSERT INTO Allocations (ResourceID, ProjectID, StartDate, EndDate, Utilization, Notes)
                  VALUES (@resourceId, @projectId, @startDate, @endDate, @utilization, @notes)
                END
              `);
          } catch (err) {
            console.warn(`  Warning: Could not add allocation: ${err.message}`);
          }
        }
      }
      
      // Create capacity scenarios
      console.log('Adding sample capacity scenarios...');
      
      try {
        await transaction.request()
          .input('name', sql.NVarChar, 'Growth Scenario')
          .input('description', sql.NVarChar, 'Scenario for planning team growth in Q3-Q4')
          .query(`
            IF NOT EXISTS (SELECT 1 FROM CapacityScenarios WHERE Name = @name)
            BEGIN
              INSERT INTO CapacityScenarios (Name, Description)
              VALUES (@name, @description)
            END
          `);
      } catch (err) {
        console.warn(`  Warning: Could not add capacity scenario: ${err.message}`);
      }
      
      // Commit the transaction
      await transaction.commit();
      
      console.log('\n======================================================');
      console.log('SAMPLE DATA SEEDING COMPLETE');
      console.log('======================================================');
      console.log('Your database has been populated with sample data.');
      console.log('You can now start using the application with test data.');
      
    } catch (err) {
      // If there's an error, roll back the transaction
      await transaction.rollback();
      throw err;
    }
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding sample data:', err);
    process.exit(1);
  }
};

// Run the seed script
seedSampleData();