const { poolPromise, sql } = require('../db/config');

// Get RAID items for a project
exports.getRAID = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId } = req.params;
        const { type } = req.query;

        let query = `SELECT * FROM ProjectRAID WHERE ProjectID = @projectId`;
        if (type) {
            query += ` AND Type = @type`;
        }
        query += ` ORDER BY CreatedAt DESC`;

        const request = pool.request().input('projectId', sql.Int, projectId);
        if (type) request.input('type', sql.NVarChar, type);

        const result = await request.query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching RAID items:', err);
        res.status(500).json({ message: 'Server error fetching RAID items' });
    }
};

// Create RAID item
exports.createRAID = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId } = req.params;
        const { type, description, impact, probability, status, owner, dueDate } = req.body;

        const request = pool.request()
            .input('projectId', sql.Int, projectId)
            .input('type', sql.NVarChar, type)
            .input('description', sql.NVarChar, description)
            .input('impact', sql.NVarChar, impact)
            .input('probability', sql.NVarChar, probability)
            .input('status', sql.NVarChar, status || 'Open')
            .input('owner', sql.NVarChar, owner);

        // Only add dueDate if it's provided and not empty
        if (dueDate) {
            request.input('dueDate', sql.Date, dueDate);
            await request.query(`
                INSERT INTO ProjectRAID (ProjectID, Type, Description, Impact, Probability, Status, Owner, DueDate)
                VALUES (@projectId, @type, @description, @impact, @probability, @status, @owner, @dueDate)
            `);
        } else {
            await request.query(`
                INSERT INTO ProjectRAID (ProjectID, Type, Description, Impact, Probability, Status, Owner)
                VALUES (@projectId, @type, @description, @impact, @probability, @status, @owner)
            `);
        }

        res.status(201).json({ message: 'RAID item created successfully' });
    } catch (err) {
        console.error('Error creating RAID item:', err);
        res.status(500).json({ message: 'Server error creating RAID item' });
    }
};

// Update RAID item
exports.updateRAID = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;
        const { description, impact, probability, status, owner, dueDate } = req.body;

        const request = pool.request().input('id', sql.Int, id);

        let updates = [];
        if (description) { request.input('description', sql.NVarChar, description); updates.push('Description = @description'); }
        if (impact) { request.input('impact', sql.NVarChar, impact); updates.push('Impact = @impact'); }
        if (probability) { request.input('probability', sql.NVarChar, probability); updates.push('Probability = @probability'); }
        if (status) { request.input('status', sql.NVarChar, status); updates.push('Status = @status'); }
        if (owner) { request.input('owner', sql.NVarChar, owner); updates.push('Owner = @owner'); }
        if (dueDate) { request.input('dueDate', sql.Date, dueDate); updates.push('DueDate = @dueDate'); }

        if (updates.length === 0) return res.json({ message: 'No updates provided' });

        updates.push('UpdatedAt = GETDATE()');

        await request.query(`
      UPDATE ProjectRAID 
      SET ${updates.join(', ')}
      WHERE RAIDID = @id
    `);

        res.json({ message: 'RAID item updated successfully' });
    } catch (err) {
        console.error('Error updating RAID item:', err);
        res.status(500).json({ message: 'Server error updating RAID item' });
    }
};

// Delete RAID item
exports.deleteRAID = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ProjectRAID WHERE RAIDID = @id');

        res.json({ message: 'RAID item deleted successfully' });
    } catch (err) {
        console.error('Error deleting RAID item:', err);
        res.status(500).json({ message: 'Server error deleting RAID item' });
    }
};
