/**
 * Document Processing Service
 * Provides AI-powered document parsing and extraction functionality
 */
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { Anthropic } = require('@anthropic-ai/sdk');
const telemetry = require('./aiTelemetry');
const db = require('../db/config');

// Initialize Claude client if API key is available
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const claude = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    ensureDirectoryExists(uploadDir)
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, CSV and text files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit to 10MB
  }
});

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Process resume document and extract structured information
 * @param {Object} file - Uploaded file object
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Extracted information
 */
const processResume = async (file, options = {}) => {
  try {
    // Extract text from document
    const text = await extractTextFromDocument(file);
    
    if (!text || text.trim() === '') {
      throw new Error('No text could be extracted from the document');
    }
    
    // Use AI to parse resume text
    const resumeData = await parseResumeWithAI(text, options);
    
    // Store document metadata
    const documentId = await storeDocumentMetadata(file, 'resume', resumeData);
    
    return {
      documentId,
      resumeData,
      processingTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing resume:', error);
    throw new Error(`Resume processing failed: ${error.message}`);
  } finally {
    // Clean up file if it exists
    try {
      if (file && file.path) {
        await fs.unlink(file.path);
      }
    } catch (error) {
      console.warn('Error cleaning up file:', error);
    }
  }
};

/**
 * Process project document and extract structured information
 * @param {Object} file - Uploaded file object
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Extracted information
 */
const processProjectDocument = async (file, options = {}) => {
  try {
    // Extract text from document
    const text = await extractTextFromDocument(file);
    
    if (!text || text.trim() === '') {
      throw new Error('No text could be extracted from the document');
    }
    
    // Use AI to parse project document text
    const projectData = await parseProjectDocumentWithAI(text, options);
    
    // Store document metadata
    const documentId = await storeDocumentMetadata(file, 'project', projectData);
    
    return {
      documentId,
      projectData,
      processingTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing project document:', error);
    throw new Error(`Project document processing failed: ${error.message}`);
  } finally {
    // Clean up file if it exists
    try {
      if (file && file.path) {
        await fs.unlink(file.path);
      }
    } catch (error) {
      console.warn('Error cleaning up file:', error);
    }
  }
};

/**
 * Extract text content from document file
 * @param {Object} file - Uploaded file object
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromDocument = async (file) => {
  try {
    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Read file based on extension
    if (fileExt === '.pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (fileExt === '.docx' || fileExt === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (fileExt === '.txt') {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
    } else if (fileExt === '.csv') {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      // For simplicity, we'll return a message for Excel files
      // A real implementation would use a library like ExcelJS
      return 'Excel file detected. Content extraction not implemented in this demo.';
    } else {
      throw new Error(`Unsupported file extension: ${fileExt}`);
    }
  } catch (error) {
    console.error('Error extracting text from document:', error);
    throw error;
  }
};

/**
 * Parse resume text with AI
 * @param {string} text - Resume text content
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} - Structured resume data
 */
const parseResumeWithAI = async (text, options = {}) => {
  if (!claude) {
    throw new Error('Claude AI client not initialized');
  }
  
  try {
    // Record API call in telemetry
    telemetry.recordRequest('claude_resume_parsing');
    
    // Prepare prompt with resume text
    const prompt = `<instructions>
You are an expert resume parser. Extract structured information from the resume text provided. Break down the information into detailed sections and provide accurate, structured data.
</instructions>

<resume>
${text.slice(0, 20000)} ${text.length > 20000 ? '... [Resume truncated due to length]' : ''}
</resume>

Extract the following information in a structured JSON format:
1. Personal Information (name, email, phone, location)
2. Professional Summary
3. Work Experience (each role with company, title, dates, and detailed responsibilities)
4. Education (each degree with institution, major, dates)
5. Skills (technical and soft skills, with proficiency levels if available)
6. Certifications (with dates and issuing organizations)
7. Projects (with descriptions and technologies used)
8. Languages (with proficiency levels)

Format your response as a valid JSON object with these sections. Only include sections that are present in the resume. For Work Experience, include detailed bullet points from the resume.

Ensure the JSON is properly formatted and escaped.`;

    // Call Claude API
    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: "You are a resume parsing assistant that extracts structured information from resumes into well-organized JSON format."
    });
    
    // Record successful API response
    telemetry.recordSuccess(response);
    
    // Extract JSON from response
    const responseText = response.content[0].text;
    
    try {
      // Find JSON object in response
      const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      
      // Fallback to returning the raw text if JSON parsing fails
      return {
        rawText: text.slice(0, 10000), // Truncate to avoid returning too much
        error: 'Could not parse structured data from resume',
        aiResponse: responseText
      };
    }
  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    telemetry.recordError(error);
    
    // Return basic fallback data
    return {
      rawText: text.slice(0, 10000), // Truncate to avoid returning too much
      error: `AI parsing failed: ${error.message}`
    };
  }
};

/**
 * Parse project document text with AI
 * @param {string} text - Project document text content
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} - Structured project data
 */
const parseProjectDocumentWithAI = async (text, options = {}) => {
  if (!claude) {
    throw new Error('Claude AI client not initialized');
  }
  
  try {
    // Record API call in telemetry
    telemetry.recordRequest('claude_project_document_parsing');
    
    // Prepare prompt with project document text
    const prompt = `<instructions>
You are an expert project document analyzer. Extract structured information from the project document text provided. Focus on extracting project details, requirements, timelines, resources, and technologies.
</instructions>

<project_document>
${text.slice(0, 20000)} ${text.length > 20000 ? '... [Document truncated due to length]' : ''}
</project_document>

Extract the following information in a structured JSON format:
1. Project Overview (name, description, objectives)
2. Project Timeline (start date, end date, milestones)
3. Requirements (functional and non-functional)
4. Resource Requirements (roles, skills, and quantities needed)
5. Technologies (tools, frameworks, platforms)
6. Deliverables (expected outputs)
7. Risks and Constraints
8. Stakeholders

Format your response as a valid JSON object with these sections. Only include sections that are present in the document.

Ensure the JSON is properly formatted and escaped.`;

    // Call Claude API
    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: "You are a project document parsing assistant that extracts structured information from project documentation into well-organized JSON format."
    });
    
    // Record successful API response
    telemetry.recordSuccess(response);
    
    // Extract JSON from response
    const responseText = response.content[0].text;
    
    try {
      // Find JSON object in response
      const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      
      // Fallback to returning the raw text if JSON parsing fails
      return {
        rawText: text.slice(0, 10000), // Truncate to avoid returning too much
        error: 'Could not parse structured data from project document',
        aiResponse: responseText
      };
    }
  } catch (error) {
    console.error('Error parsing project document with AI:', error);
    telemetry.recordError(error);
    
    // Return basic fallback data
    return {
      rawText: text.slice(0, 10000), // Truncate to avoid returning too much
      error: `AI parsing failed: ${error.message}`
    };
  }
};

/**
 * Extract skills from resume data
 * @param {Object} resumeData - Parsed resume data
 * @param {string} resourceId - Resource ID to associate skills with
 * @returns {Promise<Array>} - Extracted skills with metadata
 */
const extractSkillsFromResume = async (resumeData, resourceId) => {
  try {
    if (!resumeData || !resumeData.skills) {
      return [];
    }
    
    let skills = [];
    
    // Handle different skill formats
    if (Array.isArray(resumeData.skills)) {
      // Handle array of skill strings
      skills = resumeData.skills.map(skill => {
        if (typeof skill === 'string') {
          return {
            name: skill,
            proficiency: null,
            category: 'Unknown',
            source: 'resume'
          };
        } else if (typeof skill === 'object') {
          return {
            name: skill.name || skill.skill,
            proficiency: skill.proficiency || skill.level,
            category: skill.category || 'Unknown',
            source: 'resume'
          };
        }
        return null;
      }).filter(Boolean);
    } else if (typeof resumeData.skills === 'object') {
      // Handle categorized skills
      Object.entries(resumeData.skills).forEach(([category, categorySkills]) => {
        if (Array.isArray(categorySkills)) {
          categorySkills.forEach(skill => {
            if (typeof skill === 'string') {
              skills.push({
                name: skill,
                proficiency: null,
                category,
                source: 'resume'
              });
            } else if (typeof skill === 'object') {
              skills.push({
                name: skill.name || skill.skill,
                proficiency: skill.proficiency || skill.level,
                category,
                source: 'resume'
              });
            }
          });
        }
      });
    }
    
    // Match skills against known skills in database
    if (skills.length > 0) {
      const skillNames = skills.map(skill => skill.name);
      
      // Get matching skills from database
      const query = `
        SELECT id, name, category 
        FROM skills 
        WHERE name IN (?)
      `;
      
      const [results] = await db.promise().query(query, [skillNames]);
      
      // Create a map of skill names to database IDs
      const skillMap = {};
      results.forEach(result => {
        skillMap[result.name.toLowerCase()] = {
          id: result.id,
          category: result.category
        };
      });
      
      // Enhance skills with database IDs and update categories
      skills = skills.map(skill => {
        const skillLower = skill.name.toLowerCase();
        if (skillMap[skillLower]) {
          return {
            ...skill,
            id: skillMap[skillLower].id,
            category: skillMap[skillLower].category,
            matched: true
          };
        }
        return {
          ...skill,
          matched: false
        };
      });
      
      // If resource ID is provided, add skills to resource
      if (resourceId) {
        await addSkillsToResource(skills, resourceId);
      }
    }
    
    return skills;
  } catch (error) {
    console.error('Error extracting skills from resume:', error);
    return [];
  }
};

/**
 * Extract requirements from project document
 * @param {Object} projectData - Parsed project document data
 * @param {string} projectId - Project ID to associate requirements with
 * @returns {Promise<Array>} - Extracted requirements with metadata
 */
const extractRequirementsFromProject = async (projectData, projectId) => {
  try {
    if (!projectData) {
      return [];
    }
    
    // Extract resource requirements
    const resourceRequirements = projectData.resourceRequirements || [];
    
    // Extract skills from resource requirements
    let skills = [];
    
    if (Array.isArray(resourceRequirements)) {
      resourceRequirements.forEach(req => {
        if (req.skills && Array.isArray(req.skills)) {
          req.skills.forEach(skill => {
            if (typeof skill === 'string') {
              skills.push({
                name: skill,
                importance: 3,  // Default medium importance
                category: 'Unknown',
                roleRequired: req.role || null,
                source: 'project'
              });
            } else if (typeof skill === 'object') {
              skills.push({
                name: skill.name || skill.skill,
                importance: skill.importance || skill.level || 3,
                category: skill.category || 'Unknown',
                roleRequired: req.role || null,
                source: 'project'
              });
            }
          });
        }
      });
    }
    
    // Also get skills from technologies section
    if (projectData.technologies) {
      let techSkills = [];
      
      if (Array.isArray(projectData.technologies)) {
        techSkills = projectData.technologies.map(tech => {
          if (typeof tech === 'string') {
            return {
              name: tech,
              importance: 4,  // Higher importance for listed technologies
              category: 'Technical',
              source: 'project_tech'
            };
          } else if (typeof tech === 'object') {
            return {
              name: tech.name || tech.technology,
              importance: tech.importance || 4,
              category: tech.category || 'Technical',
              source: 'project_tech'
            };
          }
          return null;
        }).filter(Boolean);
      } else if (typeof projectData.technologies === 'object') {
        Object.entries(projectData.technologies).forEach(([category, techs]) => {
          if (Array.isArray(techs)) {
            techs.forEach(tech => {
              if (typeof tech === 'string') {
                techSkills.push({
                  name: tech,
                  importance: 4,
                  category,
                  source: 'project_tech'
                });
              } else if (typeof tech === 'object') {
                techSkills.push({
                  name: tech.name || tech.technology,
                  importance: tech.importance || 4,
                  category,
                  source: 'project_tech'
                });
              }
            });
          }
        });
      }
      
      // Combine technology skills with other skills
      skills = [...skills, ...techSkills];
    }
    
    // Match skills against known skills in database
    if (skills.length > 0) {
      const skillNames = skills.map(skill => skill.name);
      
      // Get matching skills from database
      const query = `
        SELECT id, name, category 
        FROM skills 
        WHERE name IN (?)
      `;
      
      const [results] = await db.promise().query(query, [skillNames]);
      
      // Create a map of skill names to database IDs
      const skillMap = {};
      results.forEach(result => {
        skillMap[result.name.toLowerCase()] = {
          id: result.id,
          category: result.category
        };
      });
      
      // Enhance skills with database IDs and update categories
      skills = skills.map(skill => {
        const skillLower = skill.name.toLowerCase();
        if (skillMap[skillLower]) {
          return {
            ...skill,
            id: skillMap[skillLower].id,
            category: skillMap[skillLower].category,
            matched: true
          };
        }
        return {
          ...skill,
          matched: false
        };
      });
      
      // If project ID is provided, add skills to project
      if (projectId) {
        await addSkillsToProject(skills, projectId);
      }
    }
    
    return skills;
  } catch (error) {
    console.error('Error extracting requirements from project document:', error);
    return [];
  }
};

/**
 * Add skills to resource in database
 * @param {Array} skills - Skills to add
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
const addSkillsToResource = async (skills, resourceId) => {
  try {
    // Only add skills with database IDs
    const matchedSkills = skills.filter(skill => skill.matched && skill.id);
    
    if (matchedSkills.length === 0) {
      return;
    }
    
    // Prepare values for bulk insert
    const values = matchedSkills.map(skill => [
      resourceId,
      skill.id,
      skill.proficiency || 3,  // Default to medium proficiency if not specified
      null,  // years_experience (not available from resume parsing)
      new Date().toISOString().split('T')[0],  // last_used_date (current date)
      0,  // is_certified (default to false)
      'resume'  // source
    ]);
    
    // Check if skills already exist for this resource
    const checkQuery = `
      SELECT skill_id 
      FROM resource_skills 
      WHERE resource_id = ?
    `;
    
    const [existingSkills] = await db.promise().query(checkQuery, [resourceId]);
    const existingSkillIds = existingSkills.map(row => row.skill_id);
    
    // Filter out skills that already exist
    const newValues = values.filter(value => !existingSkillIds.includes(value[1]));
    
    if (newValues.length === 0) {
      return;
    }
    
    // Insert new skills
    const insertQuery = `
      INSERT INTO resource_skills (
        resource_id, 
        skill_id, 
        proficiency_level, 
        experience_years, 
        last_used_date, 
        is_certified, 
        source
      ) VALUES ?
    `;
    
    await db.promise().query(insertQuery, [newValues]);
  } catch (error) {
    console.error('Error adding skills to resource:', error);
    throw error;
  }
};

/**
 * Add skills to project in database
 * @param {Array} skills - Skills to add
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
const addSkillsToProject = async (skills, projectId) => {
  try {
    // Only add skills with database IDs
    const matchedSkills = skills.filter(skill => skill.matched && skill.id);
    
    if (matchedSkills.length === 0) {
      return;
    }
    
    // Prepare values for bulk insert
    const values = matchedSkills.map(skill => [
      projectId,
      skill.id,
      skill.importance || 3,  // Default to medium importance if not specified
      skill.roleRequired,
      'project_document'  // source
    ]);
    
    // Check if skills already exist for this project
    const checkQuery = `
      SELECT skill_id 
      FROM project_skills 
      WHERE project_id = ?
    `;
    
    const [existingSkills] = await db.promise().query(checkQuery, [projectId]);
    const existingSkillIds = existingSkills.map(row => row.skill_id);
    
    // Filter out skills that already exist
    const newValues = values.filter(value => !existingSkillIds.includes(value[1]));
    
    if (newValues.length === 0) {
      return;
    }
    
    // Insert new skills
    const insertQuery = `
      INSERT INTO project_skills (
        project_id, 
        skill_id, 
        importance_level, 
        role_required, 
        source
      ) VALUES ?
    `;
    
    await db.promise().query(insertQuery, [newValues]);
  } catch (error) {
    console.error('Error adding skills to project:', error);
    throw error;
  }
};

/**
 * Store document metadata in database
 * @param {Object} file - Uploaded file object
 * @param {string} docType - Document type
 * @param {Object} extractedData - Extracted data
 * @returns {Promise<string>} - Document ID
 */
const storeDocumentMetadata = async (file, docType, extractedData) => {
  try {
    // Create document metadata table if it doesn't exist
    await createDocumentMetadataTable();
    
    // Store metadata
    const query = `
      INSERT INTO document_metadata (
        filename, 
        original_filename, 
        file_size, 
        mime_type, 
        document_type, 
        extracted_data, 
        upload_date
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const params = [
      path.basename(file.path),
      file.originalname,
      file.size,
      file.mimetype,
      docType,
      JSON.stringify(extractedData)
    ];
    
    const [result] = await db.promise().query(query, params);
    return result.insertId.toString();
  } catch (error) {
    console.error('Error storing document metadata:', error);
    return null;
  }
};

/**
 * Create document metadata table if it doesn't exist
 * @returns {Promise<void>}
 */
const createDocumentMetadataTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS document_metadata (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        extracted_data JSON,
        upload_date DATETIME NOT NULL,
        processed_by VARCHAR(100),
        processing_time INT,
        INDEX (document_type),
        INDEX (upload_date)
      )
    `;
    
    await db.promise().query(query);
  } catch (error) {
    console.error('Error creating document metadata table:', error);
    throw error;
  }
};

/**
 * Get document processing history
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Document processing history
 */
const getDocumentHistory = async (options = {}) => {
  try {
    const {
      limit = 50,
      documentType,
      startDate,
      endDate
    } = options;
    
    let query = `
      SELECT 
        id, 
        original_filename, 
        document_type, 
        file_size, 
        mime_type, 
        upload_date, 
        processed_by, 
        processing_time
      FROM document_metadata
    `;
    
    const params = [];
    const conditions = [];
    
    if (documentType) {
      conditions.push('document_type = ?');
      params.push(documentType);
    }
    
    if (startDate) {
      conditions.push('upload_date >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('upload_date <= ?');
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY upload_date DESC LIMIT ?';
    params.push(limit);
    
    const [results] = await db.promise().query(query, params);
    return results;
  } catch (error) {
    console.error('Error getting document history:', error);
    throw error;
  }
};

/**
 * Get document details by ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} - Document details
 */
const getDocumentById = async (documentId) => {
  try {
    const query = `
      SELECT * 
      FROM document_metadata 
      WHERE id = ?
    `;
    
    const [results] = await db.promise().query(query, [documentId]);
    
    if (results.length === 0) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    const document = results[0];
    
    // Parse extracted data
    if (document.extracted_data) {
      try {
        document.extracted_data = JSON.parse(document.extracted_data);
      } catch (error) {
        console.warn('Error parsing extracted data JSON:', error);
      }
    }
    
    return document;
  } catch (error) {
    console.error('Error getting document by ID:', error);
    throw error;
  }
};

module.exports = {
  upload,
  processResume,
  processProjectDocument,
  extractSkillsFromResume,
  extractRequirementsFromProject,
  getDocumentHistory,
  getDocumentById
};