const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { poolPromise, sql } = require('./config');

async function runMigrations() {
    try {
        console.log('Connecting to database...');
        const pool = await poolPromise;

        // Create Migrations table if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Migrations' and xtype='U')
            CREATE TABLE Migrations (
                MigrationID INT IDENTITY(1,1) PRIMARY KEY,
                MigrationName NVARCHAR(255) NOT NULL UNIQUE,
                AppliedAt DATETIME DEFAULT GETDATE()
            );
        `);

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                const migrationName = file;

                // Check if migration already applied
                const result = await pool.request()
                    .input('name', sql.NVarChar, migrationName)
                    .query('SELECT COUNT(*) as count FROM Migrations WHERE MigrationName = @name');

                if (result.recordset[0].count === 0) {
                    console.log(`Applying migration: ${migrationName}`);
                    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

                    const transaction = new sql.Transaction(pool);
                    await transaction.begin();

                    try {
                        const request = new sql.Request(transaction);
                        await request.query(sqlContent);

                        const logRequest = new sql.Request(transaction);
                        await logRequest.input('name', sql.NVarChar, migrationName)
                            .query('INSERT INTO Migrations (MigrationName) VALUES (@name)');

                        await transaction.commit();
                        console.log(`Successfully applied: ${migrationName}`);
                    } catch (err) {
                        await transaction.rollback();
                        console.error(`Failed to apply ${migrationName}:`, err);
                        throw err;
                    }
                } else {
                    console.log(`Skipping already applied: ${migrationName}`);
                }
            }
        }

        console.log('All migrations processed.');
        await pool.close();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
