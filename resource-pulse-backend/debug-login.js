const { poolPromise, sql } = require('./db/config');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function debugLogin() {
    try {
        console.log('Connecting to database...');
        const pool = await poolPromise;
        console.log('Connected.');

        const username = 'admin';
        const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';

        console.log(`Checking user: ${username}`);
        console.log(`Using password from env: ${password}`);

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT UserID, Username, PasswordHash, Role FROM Users WHERE Username = @username');

        if (result.recordset.length === 0) {
            console.log('User NOT found!');
        } else {
            const user = result.recordset[0];
            console.log('User found:', {
                id: user.UserID,
                username: user.Username,
                role: user.Role,
                hashLength: user.PasswordHash.length
            });

            console.log('Comparing password...');
            const match = await bcrypt.compare(password, user.PasswordHash);
            console.log(`Password match: ${match}`);

            if (!match) {
                console.log('Resetting password to ensure it works...');
                const newHash = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('hash', sql.NVarChar, newHash)
                    .input('username', sql.NVarChar, username)
                    .query('UPDATE Users SET PasswordHash = @hash WHERE Username = @username');
                console.log('Password reset complete.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

debugLogin();
