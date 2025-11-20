const { poolPromise, sql } = require('../db/config');

// Get audit logs with filtering
exports.getAuditLogs = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { entityName, entityId, action, startDate, endDate, limit = 100 } = req.query;

        let query = `SELECT TOP (@limit) * FROM AuditLogs WHERE 1=1`;

        if (entityName) query += ` AND EntityName = @entityName`;
        if (entityId) query += ` AND EntityID = @entityId`;
        if (action) query += ` AND Action = @action`;
        if (startDate) query += ` AND ChangeDate >= @startDate`;
        if (endDate) query += ` AND ChangeDate <= @endDate`;

        query += ` ORDER BY ChangeDate DESC`;

        const request = pool.request().input('limit', sql.Int, parseInt(limit));

        if (entityName) request.input('entityName', sql.NVarChar, entityName);
        if (entityId) request.input('entityId', sql.NVarChar, entityId);
        if (action) request.input('action', sql.NVarChar, action);
        if (startDate) request.input('startDate', sql.DateTime2, startDate);
        if (endDate) request.input('endDate', sql.DateTime2, endDate);

        const result = await request.query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ message: 'Server error fetching audit logs' });
    }
};
