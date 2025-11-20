const { poolPromise, sql } = require('../db/config');

// Get all requests (RM sees all, PM sees own project's)
exports.getRequests = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId, status } = req.query;

        let query = `
      SELECT r.*, p.Name as ProjectName, p.Client 
      FROM ResourceRequests r
      JOIN Projects p ON r.ProjectID = p.ProjectID
    `;

        const conditions = [];

        if (projectId) {
            conditions.push(`r.ProjectID = @projectId`);
        }

        if (status) {
            conditions.push(`r.Status = @status`);
        }

        // If user is PM, restrict to their projects (TODO: Implement ownership check)
        // For now, we rely on frontend to filter or pass projectId

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY r.CreatedAt DESC';

        const request = pool.request();
        if (projectId) request.input('projectId', sql.Int, projectId);
        if (status) request.input('status', sql.NVarChar, status);

        const result = await request.query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching requests:', err);
        res.status(500).json({ message: 'Server error fetching requests' });
    }
};

// Create a new request
exports.createRequest = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId, roleId, count, startDate, endDate, notes } = req.body;
        const createdBy = req.user ? req.user.userId : 'System';

        await pool.request()
            .input('projectId', sql.Int, projectId)
            .input('roleId', sql.Int, roleId)
            .input('count', sql.Int, count || 1)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('notes', sql.NVarChar, notes)
            .input('createdBy', sql.NVarChar, String(createdBy))
            .query(`
        INSERT INTO ResourceRequests (ProjectID, RoleID, Count, StartDate, EndDate, Notes, CreatedBy)
        VALUES (@projectId, @roleId, @count, @startDate, @endDate, @notes, @createdBy)
      `);

        res.status(201).json({ message: 'Resource request created successfully' });
    } catch (err) {
        console.error('Error creating request:', err);
        res.status(500).json({ message: 'Server error creating request' });
    }
};

// Update request status (Approve/Reject)
exports.updateStatus = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;
        const { status } = req.body; // Approved, Rejected

        if (!['Pending', 'Approved', 'Rejected', 'Fulfilled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query(`
        UPDATE ResourceRequests 
        SET Status = @status, UpdatedAt = GETDATE()
        WHERE RequestID = @id
      `);

        res.json({ message: `Request status updated to ${status}` });
    } catch (err) {
        console.error('Error updating request status:', err);
        res.status(500).json({ message: 'Server error updating request' });
    }
};
