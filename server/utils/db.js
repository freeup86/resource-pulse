// Database utility functions
const sql = require('mssql');
const dbConfig = require('../config/database');
const logger = require('./logger');

/**
 * Get a database connection from the pool
 * @returns {Promise<sql.ConnectionPool>} SQL connection
 */
const getConnection = async () => {
  try {
    return await sql.connect(dbConfig);
  } catch (err) {
    logger.error('Database connection error:', err);
    throw err;
  }
};

/**
 * Execute a SQL query with parameters
 * @param {string} query - SQL query string
 * @param {Object} params - Query parameters
 * @returns {Promise<any>} Query result
 */
const executeQuery = async (query, params = {}) => {
  let pool;
  try {
    pool = await getConnection();
    const request = pool.request();

    // Add parameters to the request
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    const result = await request.query(query);
    return result;
  } catch (err) {
    logger.error('Query execution error:', err);
    throw err;
  }
};

/**
 * Execute a stored procedure with parameters
 * @param {string} procedureName - Stored procedure name
 * @param {Object} params - Procedure parameters
 * @returns {Promise<any>} Procedure result
 */
const executeStoredProcedure = async (procedureName, params = {}) => {
  let pool;
  try {
    pool = await getConnection();
    const request = pool.request();

    // Add parameters to the request
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    const result = await request.execute(procedureName);
    return result;
  } catch (err) {
    logger.error(`Stored procedure execution error (${procedureName}):`, err);
    throw err;
  }
};

/**
 * Begin a transaction
 * @returns {Promise<sql.Transaction>} SQL transaction
 */
const beginTransaction = async () => {
  let pool;
  try {
    pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    return transaction;
  } catch (err) {
    logger.error('Begin transaction error:', err);
    throw err;
  }
};

/**
 * Execute a query within a transaction
 * @param {sql.Transaction} transaction - SQL transaction
 * @param {string} query - SQL query string
 * @param {Object} params - Query parameters
 * @returns {Promise<any>} Query result
 */
const executeTransactionQuery = async (transaction, query, params = {}) => {
  try {
    const request = new sql.Request(transaction);

    // Add parameters to the request
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    const result = await request.query(query);
    return result;
  } catch (err) {
    logger.error('Transaction query execution error:', err);
    throw err;
  }
};

/**
 * Commit a transaction
 * @param {sql.Transaction} transaction - SQL transaction
 * @returns {Promise<void>}
 */
const commitTransaction = async (transaction) => {
  try {
    await transaction.commit();
  } catch (err) {
    logger.error('Commit transaction error:', err);
    throw err;
  }
};

/**
 * Rollback a transaction
 * @param {sql.Transaction} transaction - SQL transaction
 * @returns {Promise<void>}
 */
const rollbackTransaction = async (transaction) => {
  try {
    await transaction.rollback();
  } catch (err) {
    logger.error('Rollback transaction error:', err);
    // Don't throw here, as we're likely handling another error
  }
};

module.exports = {
  getConnection,
  executeQuery,
  executeStoredProcedure,
  beginTransaction,
  executeTransactionQuery,
  commitTransaction,
  rollbackTransaction
};