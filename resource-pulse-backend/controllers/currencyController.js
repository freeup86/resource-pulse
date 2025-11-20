const { sql, poolPromise } = require('../db/config');

// Get all exchange rates
exports.getExchangeRates = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT * FROM ExchangeRates 
      ORDER BY EffectiveDate DESC
    `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        res.status(500).json({ message: 'Server error fetching exchange rates' });
    }
};

// Create or update exchange rate
exports.upsertExchangeRate = async (req, res) => {
    try {
        const { sourceCurrency, targetCurrency, rate, effectiveDate } = req.body;
        const pool = await poolPromise;

        // Check if rate exists for this date
        const check = await pool.request()
            .input('source', sql.NVarChar, sourceCurrency)
            .input('target', sql.NVarChar, targetCurrency || 'USD')
            .input('date', sql.Date, effectiveDate)
            .query(`
        SELECT RateID FROM ExchangeRates 
        WHERE SourceCurrency = @source AND TargetCurrency = @target AND EffectiveDate = @date
      `);

        if (check.recordset.length > 0) {
            // Update
            await pool.request()
                .input('id', sql.Int, check.recordset[0].RateID)
                .input('rate', sql.Decimal(18, 6), rate)
                .query(`
          UPDATE ExchangeRates 
          SET Rate = @rate, UpdatedAt = GETDATE()
          WHERE RateID = @id
        `);
        } else {
            // Insert
            await pool.request()
                .input('source', sql.NVarChar, sourceCurrency)
                .input('target', sql.NVarChar, targetCurrency || 'USD')
                .input('rate', sql.Decimal(18, 6), rate)
                .input('date', sql.Date, effectiveDate)
                .query(`
          INSERT INTO ExchangeRates (SourceCurrency, TargetCurrency, Rate, EffectiveDate)
          VALUES (@source, @target, @rate, @date)
        `);
        }

        res.json({ message: 'Exchange rate saved successfully' });
    } catch (error) {
        console.error('Error saving exchange rate:', error);
        res.status(500).json({ message: 'Server error saving exchange rate' });
    }
};
