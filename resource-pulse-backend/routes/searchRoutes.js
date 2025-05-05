/**
 * Search Routes
 * Defines API routes for natural language search functionality
 */
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Perform a natural language search
router.get('/', searchController.search);

// Get search suggestions
router.get('/suggestions', searchController.getSuggestions);

// Interpret a search query
router.get('/interpret', searchController.interpretQuery);

// Get recent searches
router.get('/recent', searchController.getRecentSearches);

module.exports = router;