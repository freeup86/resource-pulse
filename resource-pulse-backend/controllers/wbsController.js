const { sql, poolPromise } = require('../db/config');

// --- PHASES ---

// Get all phases for a project
exports.getPhases = async (req, res) => {
    try {
        const { projectId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
        SELECT * FROM ProjectPhases 
        WHERE ProjectID = @projectId
        ORDER BY [Order], StartDate
      `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching phases:', error);
        res.status(500).json({ message: 'Server error fetching phases' });
    }
};

// Create a phase
exports.createPhase = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, startDate, endDate, description, order } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .input('name', sql.NVarChar, name)
            .input('startDate', sql.Date, startDate || null)
            .input('endDate', sql.Date, endDate || null)
            .input('description', sql.NVarChar, description || null)
            .input('order', sql.Int, order || 0)
            .query(`
        INSERT INTO ProjectPhases (ProjectID, Name, StartDate, EndDate, Description, [Order])
        OUTPUT INSERTED.*
        VALUES (@projectId, @name, @startDate, @endDate, @description, @order)
      `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating phase:', error);
        res.status(500).json({ message: 'Server error creating phase' });
    }
};

// Update a phase
exports.updatePhase = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate, description, order } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('startDate', sql.Date, startDate || null)
            .input('endDate', sql.Date, endDate || null)
            .input('description', sql.NVarChar, description || null)
            .input('order', sql.Int, order)
            .query(`
        UPDATE ProjectPhases
        SET Name = @name,
            StartDate = @startDate,
            EndDate = @endDate,
            Description = @description,
            [Order] = @order,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE PhaseID = @id
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Phase not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error updating phase:', error);
        res.status(500).json({ message: 'Server error updating phase' });
    }
};

// Delete a phase
exports.deletePhase = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ProjectPhases WHERE PhaseID = @id');

        res.json({ message: 'Phase deleted successfully' });
    } catch (error) {
        console.error('Error deleting phase:', error);
        res.status(500).json({ message: 'Server error deleting phase' });
    }
};

// --- TASKS ---

// Get all tasks for a project (grouped by phase in frontend)
exports.getTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
        SELECT t.*, r.Name as AssignedToName
        FROM ProjectTasks t
        JOIN ProjectPhases p ON t.PhaseID = p.PhaseID
        LEFT JOIN Resources r ON t.AssignedTo = r.ResourceID
        WHERE p.ProjectID = @projectId
        ORDER BY t.[Order], t.StartDate
      `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error fetching tasks' });
    }
};

// Create a task
exports.createTask = async (req, res) => {
    try {
        const { phaseId, name, assignedTo, startDate, endDate, status, percentComplete, description, order } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('phaseId', sql.Int, phaseId)
            .input('name', sql.NVarChar, name)
            .input('assignedTo', sql.Int, assignedTo || null)
            .input('startDate', sql.Date, startDate || null)
            .input('endDate', sql.Date, endDate || null)
            .input('status', sql.NVarChar, status || 'Not Started')
            .input('percentComplete', sql.Int, percentComplete || 0)
            .input('description', sql.NVarChar, description || null)
            .input('order', sql.Int, order || 0)
            .query(`
        INSERT INTO ProjectTasks (PhaseID, Name, AssignedTo, StartDate, EndDate, Status, PercentComplete, Description, [Order])
        OUTPUT INSERTED.*
        VALUES (@phaseId, @name, @assignedTo, @startDate, @endDate, @status, @percentComplete, @description, @order)
      `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error creating task' });
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, assignedTo, startDate, endDate, status, percentComplete, description, order } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('assignedTo', sql.Int, assignedTo || null)
            .input('startDate', sql.Date, startDate || null)
            .input('endDate', sql.Date, endDate || null)
            .input('status', sql.NVarChar, status)
            .input('percentComplete', sql.Int, percentComplete)
            .input('description', sql.NVarChar, description || null)
            .input('order', sql.Int, order)
            .query(`
        UPDATE ProjectTasks
        SET Name = @name,
            AssignedTo = @assignedTo,
            StartDate = @startDate,
            EndDate = @endDate,
            Status = @status,
            PercentComplete = @percentComplete,
            Description = @description,
            [Order] = @order,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE TaskID = @id
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error updating task' });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ProjectTasks WHERE TaskID = @id');

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error deleting task' });
    }
};
