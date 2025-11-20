const { poolPromise, sql } = require('../db/config');

// Get financial phasing for a project
exports.getPhasing = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId } = req.params;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
        SELECT * FROM ProjectFinancialPhasing 
        WHERE ProjectID = @projectId 
        ORDER BY Period ASC
      `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching financial phasing:', error);
        res.status(500).json({ message: 'Server error fetching financial phasing' });
    }
};

// Get project expenses
exports.getExpenses = async (req, res) => {
    try {
        const { projectId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
        SELECT * FROM ProjectBudgetItems 
        WHERE ProjectID = @projectId
        ORDER BY DateCreated DESC
      `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Server error fetching expenses' });
    }
};

// Create project expense
exports.createExpense = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { category, description, plannedAmount, actualAmount } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .input('category', sql.NVarChar, category)
            .input('description', sql.NVarChar, description)
            .input('plannedAmount', sql.Decimal(14, 2), plannedAmount)
            .input('actualAmount', sql.Decimal(14, 2), actualAmount || 0)
            .query(`
        INSERT INTO ProjectBudgetItems (ProjectID, Category, Description, PlannedAmount, ActualAmount)
        OUTPUT INSERTED.*
        VALUES (@projectId, @category, @description, @plannedAmount, @actualAmount)
      `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: 'Server error creating expense' });
    }
};

// Delete project expense
exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ProjectBudgetItems WHERE BudgetItemID = @id');

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Server error deleting expense' });
    }
};

// Get financial snapshots
exports.getSnapshots = async (req, res) => {
    try {
        const { projectId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
        SELECT * FROM ProjectFinancialSnapshots 
        WHERE ProjectID = @projectId
        ORDER BY SnapshotDate DESC
      `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching snapshots:', error);
        res.status(500).json({ message: 'Server error fetching snapshots' });
    }
};

// Create financial snapshot
exports.createSnapshot = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, notes } = req.body;
        const pool = await poolPromise;

        // Calculate current financials to snapshot
        const financials = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
        SELECT 
          p.Budget,
          p.ActualCost,
          (SELECT SUM(PlannedAmount) FROM ProjectBudgetItems WHERE ProjectID = @projectId) as ExpenseBudget,
          (SELECT SUM(ActualAmount) FROM ProjectBudgetItems WHERE ProjectID = @projectId) as ExpenseActual
        FROM Projects p
        WHERE p.ProjectID = @projectId
      `);

        const data = financials.recordset[0];
        const totalBudget = (data.Budget || 0) + (data.ExpenseBudget || 0);
        const totalActual = (data.ActualCost || 0) + (data.ExpenseActual || 0);

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .input('name', sql.NVarChar, name)
            .input('plannedBudget', sql.Decimal(14, 2), totalBudget)
            .input('actualCost', sql.Decimal(14, 2), totalActual)
            .input('notes', sql.NVarChar, notes)
            .query(`
        INSERT INTO ProjectFinancialSnapshots (ProjectID, SnapshotName, PlannedBudget, ActualCost, Notes)
        OUTPUT INSERTED.*
        VALUES (@projectId, @name, @plannedBudget, @actualCost, @notes)
      `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating snapshot:', error);
        res.status(500).json({ message: 'Server error creating snapshot' });
    }
};

// Upsert financial phasing items
exports.upsertPhasing = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { projectId } = req.params;
        const { items } = req.body; // Array of { period, amount, type, category }

        console.log('Received phasing request:', { projectId, items });

        if (!items || !Array.isArray(items)) {
            console.error('Invalid items format:', items);
            return res.status(400).json({ message: 'Invalid items format - expected array', received: typeof items });
        }

        if (items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const item of items) {
                if (!item.period) {
                    console.error('Missing period in item:', item);
                    throw new Error('Each item must have a period');
                }

                const request = new sql.Request(transaction);
                await request
                    .input('projectId', sql.Int, projectId)
                    .input('period', sql.Date, item.period)
                    .input('amount', sql.Decimal(18, 2), item.amount)
                    .input('type', sql.NVarChar, item.type || 'Budget')
                    .input('category', sql.NVarChar, item.category || 'Labor')
                    .query(`
            MERGE ProjectFinancialPhasing AS target
            USING (SELECT @projectId as ProjectID, @period as Period, @type as Type, @category as Category) AS source
            ON (target.ProjectID = source.ProjectID AND target.Period = source.Period AND target.Type = source.Type AND target.Category = source.Category)
            WHEN MATCHED THEN
              UPDATE SET Amount = @amount, UpdatedAt = GETDATE()
            WHEN NOT MATCHED THEN
              INSERT (ProjectID, Period, Amount, Type, Category)
              VALUES (@projectId, @period, @amount, @type, @category);
          `);
            }

            await transaction.commit();
            res.json({ message: 'Financial phasing updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error updating financial phasing:', err);
        res.status(500).json({ message: 'Server error updating financial phasing', error: err.message });
    }
};
