// resourceCapacityController.js
const { poolPromise, sql } = require('../db/config');

// Update resource capacity
const updateResourceCapacity = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { year, month, availableCapacity, plannedTimeOff, notes } = req.body;
    
    // Validate required fields
    if (!year || !month || availableCapacity === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const pool = await poolPromise;
    
    // Check if resource exists
    const resourceCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (resourceCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Check if capacity entry exists for this month
    const capacityCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('year', sql.Int, year)
      .input('month', sql.Int, month)
      .query(`
        SELECT CapacityID 
        FROM ResourceCapacity 
        WHERE ResourceID = @resourceId
        AND Year = @year
        AND Month = @month
      `);
    
    if (capacityCheck.recordset.length > 0) {
      // Update existing capacity
      await pool.request()
        .input('capacityId', sql.Int, capacityCheck.recordset[0].CapacityID)
        .input('availableCapacity', sql.Int, availableCapacity)
        .input('plannedTimeOff', sql.Int, plannedTimeOff || 0)
        .input('notes', sql.NVarChar, notes || null)
        .query(`
          UPDATE ResourceCapacity
          SET AvailableCapacity = @availableCapacity,
              PlannedTimeOff = @plannedTimeOff,
              Notes = @notes,
              UpdatedAt = GETDATE()
          WHERE CapacityID = @capacityId
        `);
    } else {
      // Create new capacity entry
      await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .input('year', sql.Int, year)
        .input('month', sql.Int, month)
        .input('availableCapacity', sql.Int, availableCapacity)
        .input('plannedTimeOff', sql.Int, plannedTimeOff || 0)
        .input('notes', sql.NVarChar, notes || null)
        .query(`
          INSERT INTO ResourceCapacity (
            ResourceID, Year, Month, AvailableCapacity, PlannedTimeOff, Notes
          )
          VALUES (
            @resourceId, @year, @month, @availableCapacity, @plannedTimeOff, @notes
          )
        `);
    }
    
    // Return updated capacity data
    const updatedCapacity = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('year', sql.Int, year)
      .input('month', sql.Int, month)
      .query(`
        SELECT
          rc.CapacityID as id,
          rc.ResourceID as resourceId,
          r.Name as resourceName,
          rc.Year as year,
          rc.Month as month,
          rc.AvailableCapacity as availableCapacity,
          rc.PlannedTimeOff as plannedTimeOff,
          rc.Notes as notes
        FROM ResourceCapacity rc
        INNER JOIN Resources r ON rc.ResourceID = r.ResourceID
        WHERE rc.ResourceID = @resourceId
        AND rc.Year = @year
        AND rc.Month = @month
      `);
    
    res.json(updatedCapacity.recordset[0]);
  } catch (err) {
    console.error('Error updating resource capacity:', err);
    res.status(500).json({
      message: 'Error updating resource capacity',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get resource capacity
const getResourceCapacity = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { startDate, endDate } = req.query;
    
    const pool = await poolPromise;
    
    // Calculate default date range if not provided
    const today = new Date();
    const start = startDate ? new Date(startDate) : today;
    
    let end;
    if (endDate) {
      end = new Date(endDate);
    } else {
      end = new Date(start);
      end.setMonth(end.getMonth() + 12); // Default to 12 months ahead
    }
    
    const startYear = start.getFullYear();
    const startMonth = start.getMonth() + 1;
    const endYear = end.getFullYear();
    const endMonth = end.getMonth() + 1;
    
    // Check if resource exists
    const resourceCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT ResourceID, Name FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (resourceCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Get capacity data for the date range
    const capacityData = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('startYear', sql.Int, startYear)
      .input('startMonth', sql.Int, startMonth)
      .input('endYear', sql.Int, endYear)
      .input('endMonth', sql.Int, endMonth)
      .query(`
        SELECT
          rc.Year as year,
          rc.Month as month,
          rc.AvailableCapacity as availableCapacity,
          rc.PlannedTimeOff as plannedTimeOff,
          rc.Notes as notes
        FROM ResourceCapacity rc
        WHERE rc.ResourceID = @resourceId
        AND (
          (rc.Year > @startYear) OR
          (rc.Year = @startYear AND rc.Month >= @startMonth)
        )
        AND (
          (rc.Year < @endYear) OR
          (rc.Year = @endYear AND rc.Month <= @endMonth)
        )
        ORDER BY rc.Year, rc.Month
      `);
    
    // Generate all months in the date range
    const capacityMonths = [];
    let currentDate = new Date(start);
    currentDate.setDate(1); // Set to first of month
    
    while (currentDate <= end) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Find existing capacity data for this month
      const capacityEntry = capacityData.recordset.find(c => 
        c.year === year && c.month === month
      );
      
      // If no entry exists, use default values
      capacityMonths.push({
        year,
        month,
        label: currentDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        availableCapacity: capacityEntry ? capacityEntry.availableCapacity : 100,
        plannedTimeOff: capacityEntry ? capacityEntry.plannedTimeOff : 0,
        notes: capacityEntry ? capacityEntry.notes : null
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    res.json({
      resourceId: parseInt(resourceId),
      resourceName: resourceCheck.recordset[0].Name,
      startDate: start,
      endDate: end,
      capacityData: capacityMonths
    });
  } catch (err) {
    console.error('Error fetching resource capacity:', err);
    res.status(500).json({
      message: 'Error fetching resource capacity',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Bulk update resource capacity
const bulkUpdateResourceCapacity = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { capacityData } = req.body;
    
    if (!Array.isArray(capacityData) || capacityData.length === 0) {
      return res.status(400).json({ message: 'Capacity data must be an array of monthly capacity values' });
    }
    
    const pool = await poolPromise;
    
    // Check if resource exists
    const resourceCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (resourceCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Process each month's capacity data
      for (const monthData of capacityData) {
        const { year, month, availableCapacity, plannedTimeOff, notes } = monthData;
        
        // Validate required fields
        if (!year || !month || availableCapacity === undefined) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: `Missing required fields for year ${year}, month ${month}` 
          });
        }
        
        // Check if capacity entry exists for this month
        const capacityCheck = await transaction.request()
          .input('resourceId', sql.Int, resourceId)
          .input('year', sql.Int, year)
          .input('month', sql.Int, month)
          .query(`
            SELECT CapacityID 
            FROM ResourceCapacity 
            WHERE ResourceID = @resourceId
            AND Year = @year
            AND Month = @month
          `);
        
        if (capacityCheck.recordset.length > 0) {
          // Update existing capacity
          await transaction.request()
            .input('capacityId', sql.Int, capacityCheck.recordset[0].CapacityID)
            .input('availableCapacity', sql.Int, availableCapacity)
            .input('plannedTimeOff', sql.Int, plannedTimeOff || 0)
            .input('notes', sql.NVarChar, notes || null)
            .query(`
              UPDATE ResourceCapacity
              SET AvailableCapacity = @availableCapacity,
                  PlannedTimeOff = @plannedTimeOff,
                  Notes = @notes,
                  UpdatedAt = GETDATE()
              WHERE CapacityID = @capacityId
            `);
        } else {
          // Create new capacity entry
          await transaction.request()
            .input('resourceId', sql.Int, resourceId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('availableCapacity', sql.Int, availableCapacity)
            .input('plannedTimeOff', sql.Int, plannedTimeOff || 0)
            .input('notes', sql.NVarChar, notes || null)
            .query(`
              INSERT INTO ResourceCapacity (
                ResourceID, Year, Month, AvailableCapacity, PlannedTimeOff, Notes
              )
              VALUES (
                @resourceId, @year, @month, @availableCapacity, @plannedTimeOff, @notes
              )
            `);
        }
      }
      
      await transaction.commit();
      
      // Return updated capacity data for the resource
      const updatedCapacity = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT
            rc.CapacityID as id,
            rc.ResourceID as resourceId,
            rc.Year as year,
            rc.Month as month,
            rc.AvailableCapacity as availableCapacity,
            rc.PlannedTimeOff as plannedTimeOff,
            rc.Notes as notes
          FROM ResourceCapacity rc
          WHERE rc.ResourceID = @resourceId
          ORDER BY rc.Year, rc.Month
        `);
      
      res.json({
        resourceId: parseInt(resourceId),
        capacityData: updatedCapacity.recordset,
        message: 'Resource capacity updated successfully'
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating resource capacity:', err);
    res.status(500).json({
      message: 'Error updating resource capacity',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

module.exports = {
  updateResourceCapacity,
  getResourceCapacity,
  bulkUpdateResourceCapacity
};