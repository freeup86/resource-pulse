const { poolPromise, sql } = require('../db/config');

// Get milestones for a project
exports.getMilestones = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId } = req.params;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
        SELECT * FROM ProjectMilestones 
        WHERE ProjectID = @projectId 
        ORDER BY DueDate ASC
      `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching milestones:', err);
        res.status(500).json({ message: 'Server error fetching milestones' });
    }
};

// Create a milestone
exports.createMilestone = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId } = req.params;
        const { name, dueDate, description } = req.body;

        await pool.request()
            .input('projectId', sql.Int, projectId)
            .input('name', sql.NVarChar, name)
            .input('dueDate', sql.Date, dueDate)
            .input('description', sql.NVarChar, description)
            .query(`
        INSERT INTO ProjectMilestones (ProjectID, Name, DueDate, Description)
        VALUES (@projectId, @name, @dueDate, @description)
      `);

        res.status(201).json({ message: 'Milestone created successfully' });
    } catch (err) {
        console.error('Error creating milestone:', err);
        res.status(500).json({ message: 'Server error creating milestone' });
    }
};

// Update milestone status
exports.updateMilestone = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;
        const { status, name, dueDate, description } = req.body;

        const request = pool.request()
            .input('id', sql.Int, id);

        let updates = [];
        if (status) {
            request.input('status', sql.NVarChar, status);
            updates.push('Status = @status');
        }
        if (name) {
            request.input('name', sql.NVarChar, name);
            updates.push('Name = @name');
        }
        if (dueDate) {
            request.input('dueDate', sql.Date, dueDate);
            updates.push('DueDate = @dueDate');
        }
        if (description) {
            request.input('description', sql.NVarChar, description);
            updates.push('Description = @description');
        }

        if (updates.length === 0) return res.json({ message: 'No updates provided' });

        updates.push('UpdatedAt = GETDATE()');

        await request.query(`
      UPDATE ProjectMilestones 
      SET ${updates.join(', ')}
      WHERE MilestoneID = @id
    `);

        res.json({ message: 'Milestone updated successfully' });
    } catch (err) {
        console.error('Error updating milestone:', err);
        res.status(500).json({ message: 'Server error updating milestone' });
    }
};

// Delete milestone
exports.deleteMilestone = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ProjectMilestones WHERE MilestoneID = @id');

        res.json({ message: 'Milestone deleted successfully' });
    } catch (err) {
        console.error('Error deleting milestone:', err);
        res.status(500).json({ message: 'Server error deleting milestone' });
    }
};
