const { poolPromise, sql } = require('../db/config');

/**
 * Middleware to log audit events for state-changing operations
 */
const auditLog = async (req, res, next) => {
    // Only log state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const originalSend = res.send;

        // Intercept response to ensure we only log successful operations
        res.send = function (body) {
            res.send = originalSend;

            // Restore original send and call it
            const result = res.send.apply(res, arguments);

            // Log asynchronously after response is sent
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAuditEvent(req, body).catch(err =>
                    console.error('Audit logging failed:', err)
                );
            }

            return result;
        };
    }
    next();
};

async function logAuditEvent(req, responseBody) {
    try {
        const pool = await poolPromise;

        // Determine entity from URL path
        // e.g., /api/projects/123 -> Entity: Project, ID: 123
        const pathParts = req.path.split('/').filter(p => p);
        let entityName = 'Unknown';
        let entityId = 'N/A';

        if (pathParts.length > 0) {
            // Simple heuristic: assume resource name is first part (e.g. 'projects')
            // and ID is second part if present
            entityName = pathParts[pathParts.length - 1] === 'projects' ? 'Project' :
                pathParts[pathParts.length - 1] === 'resources' ? 'Resource' :
                    pathParts[0]; // Fallback

            // If the last part is a number, it's likely the ID
            if (!isNaN(pathParts[pathParts.length - 1])) {
                entityId = pathParts[pathParts.length - 1];
                entityName = pathParts[pathParts.length - 2]; // Parent is likely the entity name
            } else if (req.params.id) {
                entityId = req.params.id;
            } else if (responseBody && responseBody.id) {
                // Try to get ID from response for POST requests
                entityId = responseBody.id;
            }
        }

        // Normalize entity name (singularize)
        if (entityName.endsWith('s')) entityName = entityName.slice(0, -1);
        entityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

        const user = req.user ? (req.user.userId || req.user.username || 'Anonymous') : 'Anonymous';

        await pool.request()
            .input('entityName', sql.NVarChar, entityName)
            .input('entityId', sql.NVarChar, String(entityId))
            .input('action', sql.NVarChar, req.method)
            .input('changedBy', sql.NVarChar, String(user))
            .input('oldValues', sql.NVarChar, null) // TODO: Implement fetching old values for updates
            .input('newValues', sql.NVarChar, JSON.stringify(req.body))
            .input('requestPath', sql.NVarChar, req.originalUrl)
            .input('ipAddress', sql.NVarChar, req.ip)
            .query(`
        INSERT INTO AuditLogs (EntityName, EntityID, Action, ChangedBy, NewValues, RequestPath, IPAddress)
        VALUES (@entityName, @entityId, @action, @changedBy, @newValues, @requestPath, @ipAddress)
      `);

    } catch (err) {
        console.error('Error writing audit log:', err);
    }
}

module.exports = auditLog;
