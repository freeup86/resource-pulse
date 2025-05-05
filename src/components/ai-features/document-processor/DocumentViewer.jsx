import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DocumentViewer = ({ document }) => {
  const [activeTab, setActiveTab] = useState('extract');
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render content based on document type
  const renderExtractedContent = () => {
    switch (document.documentType) {
      case 'resume':
        return renderResumeContent();
      case 'project_document':
        return renderProjectDocumentContent();
      case 'skill_certification':
        return renderCertificationContent();
      case 'contract':
        return renderContractContent();
      case 'timesheet':
        return renderTimesheetContent();
      case 'invoice':
        return renderInvoiceContent();
      default:
        return renderGenericContent();
    }
  };

  // Render resume content
  const renderResumeContent = () => {
    const { aiExtracted } = document;
    
    if (!aiExtracted) {
      return <p className="text-gray-500">No extracted content available.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Candidate Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">{aiExtracted.candidate?.name || 'Unnamed Candidate'}</h3>
          
          <div className="mt-2 grid grid-cols-2 gap-4">
            {aiExtracted.candidate?.email && (
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="text-sm">{aiExtracted.candidate.email}</p>
              </div>
            )}
            
            {aiExtracted.candidate?.phone && (
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p className="text-sm">{aiExtracted.candidate.phone}</p>
              </div>
            )}
            
            {aiExtracted.candidate?.location && (
              <div>
                <span className="text-sm text-gray-500">Location:</span>
                <p className="text-sm">{aiExtracted.candidate.location}</p>
              </div>
            )}
            
            {aiExtracted.candidate?.linkedIn && (
              <div>
                <span className="text-sm text-gray-500">LinkedIn:</span>
                <p className="text-sm">
                  <a 
                    href={aiExtracted.candidate.linkedIn} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Profile Link
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Skills */}
        {aiExtracted.skills && aiExtracted.skills.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {aiExtracted.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {skill.name}
                  {skill.yearsOfExperience && ` (${skill.yearsOfExperience} yr${skill.yearsOfExperience !== 1 ? 's' : ''})`}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Experience */}
        {aiExtracted.experience && aiExtracted.experience.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Work Experience</h4>
            <div className="space-y-4">
              {aiExtracted.experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <h5 className="font-medium">{exp.title}</h5>
                  <p className="text-sm">{exp.company}</p>
                  <p className="text-xs text-gray-500">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Education */}
        {aiExtracted.education && aiExtracted.education.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Education</h4>
            <div className="space-y-3">
              {aiExtracted.education.map((edu, index) => (
                <div key={index}>
                  <h5 className="font-medium">{edu.degree}</h5>
                  <p className="text-sm">{edu.institution}</p>
                  <p className="text-xs text-gray-500">
                    {edu.startDate && `${edu.startDate} - `}{edu.endDate || 'Present'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* AI Matching Suggestions */}
        {aiExtracted.matchingSuggestions && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">AI Matching Suggestions</h4>
            
            {aiExtracted.matchingSuggestions.roles && aiExtracted.matchingSuggestions.roles.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700">Recommended Roles</h5>
                <ul className="mt-1 space-y-1">
                  {aiExtracted.matchingSuggestions.roles.map((role, index) => (
                    <li key={index} className="text-sm">
                      {role.title}{role.fitPercentage && ` (${role.fitPercentage}% match)`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {aiExtracted.matchingSuggestions.projects && aiExtracted.matchingSuggestions.projects.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700">Recommended Projects</h5>
                <ul className="mt-1 space-y-1">
                  {aiExtracted.matchingSuggestions.projects.map((project, index) => (
                    <li key={index} className="text-sm">
                      {project.name}{project.fitPercentage && ` (${project.fitPercentage}% match)`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render project document content
  const renderProjectDocumentContent = () => {
    const { aiExtracted } = document;
    
    if (!aiExtracted) {
      return <p className="text-gray-500">No extracted content available.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Project Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">{aiExtracted.project?.name || 'Unnamed Project'}</h3>
          
          {aiExtracted.project?.description && (
            <p className="text-sm text-gray-700 mt-2">{aiExtracted.project.description}</p>
          )}
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            {aiExtracted.project?.client && (
              <div>
                <span className="text-sm text-gray-500">Client:</span>
                <p className="text-sm">{aiExtracted.project.client}</p>
              </div>
            )}
            
            {aiExtracted.project?.timeline && (
              <div>
                <span className="text-sm text-gray-500">Timeline:</span>
                <p className="text-sm">{aiExtracted.project.timeline}</p>
              </div>
            )}
            
            {aiExtracted.project?.budget && (
              <div>
                <span className="text-sm text-gray-500">Budget:</span>
                <p className="text-sm">{aiExtracted.project.budget}</p>
              </div>
            )}
            
            {aiExtracted.project?.status && (
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="text-sm">{aiExtracted.project.status}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Key Requirements */}
        {aiExtracted.requirements && aiExtracted.requirements.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Key Requirements</h4>
            <ul className="list-disc list-inside space-y-1">
              {aiExtracted.requirements.map((req, index) => (
                <li key={index} className="text-sm text-gray-700">{req}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Skills Needed */}
        {aiExtracted.skillsNeeded && aiExtracted.skillsNeeded.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Skills Needed</h4>
            <div className="flex flex-wrap gap-2">
              {aiExtracted.skillsNeeded.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Milestones */}
        {aiExtracted.milestones && aiExtracted.milestones.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Milestones</h4>
            <div className="space-y-3">
              {aiExtracted.milestones.map((milestone, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <h5 className="font-medium">{milestone.name}</h5>
                  {milestone.date && <p className="text-xs text-gray-500">{milestone.date}</p>}
                  {milestone.description && (
                    <p className="text-sm text-gray-700 mt-1">{milestone.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* AI Resource Recommendations */}
        {aiExtracted.resourceRecommendations && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">AI Resource Recommendations</h4>
            
            {aiExtracted.resourceRecommendations.resources && aiExtracted.resourceRecommendations.resources.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700">Recommended Resources</h5>
                <ul className="mt-1 space-y-1">
                  {aiExtracted.resourceRecommendations.resources.map((resource, index) => (
                    <li key={index} className="text-sm">
                      {resource.name}{resource.matchPercentage && ` (${resource.matchPercentage}% match)`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {aiExtracted.resourceRecommendations.roles && aiExtracted.resourceRecommendations.roles.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-gray-700">Required Roles</h5>
                <ul className="mt-1 space-y-1">
                  {aiExtracted.resourceRecommendations.roles.map((role, index) => (
                    <li key={index} className="text-sm">
                      {role.title} - {role.count} {role.count === 1 ? 'resource' : 'resources'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render certification content
  const renderCertificationContent = () => {
    const { aiExtracted } = document;
    
    if (!aiExtracted) {
      return <p className="text-gray-500">No extracted content available.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Certification Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">{aiExtracted.certification?.name || 'Unnamed Certification'}</h3>
          
          <div className="mt-2 grid grid-cols-2 gap-4">
            {aiExtracted.resource?.name && (
              <div>
                <span className="text-sm text-gray-500">Resource Name:</span>
                <p className="text-sm">{aiExtracted.resource.name}</p>
              </div>
            )}
            
            {aiExtracted.certification?.issuer && (
              <div>
                <span className="text-sm text-gray-500">Issuing Organization:</span>
                <p className="text-sm">{aiExtracted.certification.issuer}</p>
              </div>
            )}
            
            {aiExtracted.certification?.issueDate && (
              <div>
                <span className="text-sm text-gray-500">Issue Date:</span>
                <p className="text-sm">{aiExtracted.certification.issueDate}</p>
              </div>
            )}
            
            {aiExtracted.certification?.expiryDate && (
              <div>
                <span className="text-sm text-gray-500">Expiry Date:</span>
                <p className="text-sm">{aiExtracted.certification.expiryDate}</p>
              </div>
            )}
            
            {aiExtracted.certification?.credentialId && (
              <div>
                <span className="text-sm text-gray-500">Credential ID:</span>
                <p className="text-sm">{aiExtracted.certification.credentialId}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Skills Certified */}
        {aiExtracted.skills && aiExtracted.skills.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Skills Certified</h4>
            <div className="flex flex-wrap gap-2">
              {aiExtracted.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Verification */}
        {aiExtracted.verification && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Verification</h4>
            <div className="text-sm">
              {aiExtracted.verification.method && (
                <div className="mb-1">
                  <span className="text-gray-500">Method: </span>
                  <span>{aiExtracted.verification.method}</span>
                </div>
              )}
              {aiExtracted.verification.url && (
                <div>
                  <span className="text-gray-500">URL: </span>
                  <a 
                    href={aiExtracted.verification.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Verify Certificate
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Insights */}
        {aiExtracted.insights && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">AI Insights</h4>
            <p className="text-sm text-gray-700">{aiExtracted.insights.summary}</p>
            
            {aiExtracted.insights.recommendations && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-gray-700">Recommendations</h5>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {aiExtracted.insights.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render generic content for other document types
  const renderGenericContent = () => {
    const { aiExtracted } = document;
    
    if (!aiExtracted) {
      return <p className="text-gray-500">No extracted content available.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Generic Document Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">{aiExtracted.title || 'Untitled Document'}</h3>
          
          {aiExtracted.summary && (
            <p className="text-sm text-gray-700 mt-2">{aiExtracted.summary}</p>
          )}
        </div>
        
        {/* Key Points */}
        {aiExtracted.keyPoints && aiExtracted.keyPoints.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Key Points</h4>
            <ul className="list-disc list-inside space-y-1">
              {aiExtracted.keyPoints.map((point, index) => (
                <li key={index} className="text-sm text-gray-700">{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Extracted Entities */}
        {aiExtracted.entities && Object.keys(aiExtracted.entities).length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Extracted Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(aiExtracted.entities).map(([key, value]) => (
                <div key={key}>
                  <span className="text-sm text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                  <p className="text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* AI Analysis */}
        {aiExtracted.aiAnalysis && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-700">{aiExtracted.aiAnalysis}</p>
          </div>
        )}
      </div>
    );
  };

  // Render contract content
  const renderContractContent = () => {
    const { aiExtracted } = document;
    
    if (!aiExtracted) {
      return <p className="text-gray-500">No extracted content available.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Contract Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">{aiExtracted.contract?.title || 'Untitled Contract'}</h3>
          
          <div className="mt-2 grid grid-cols-2 gap-4">
            {aiExtracted.contract?.parties && aiExtracted.contract.parties.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">Parties:</span>
                <ul className="text-sm list-inside">
                  {aiExtracted.contract.parties.map((party, index) => (
                    <li key={index}>{party}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {aiExtracted.contract?.effectiveDate && (
              <div>
                <span className="text-sm text-gray-500">Effective Date:</span>
                <p className="text-sm">{aiExtracted.contract.effectiveDate}</p>
              </div>
            )}
            
            {aiExtracted.contract?.terminationDate && (
              <div>
                <span className="text-sm text-gray-500">Termination Date:</span>
                <p className="text-sm">{aiExtracted.contract.terminationDate}</p>
              </div>
            )}
            
            {aiExtracted.contract?.value && (
              <div>
                <span className="text-sm text-gray-500">Contract Value:</span>
                <p className="text-sm">{aiExtracted.contract.value}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Key Provisions */}
        {aiExtracted.keyProvisions && aiExtracted.keyProvisions.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Key Provisions</h4>
            <ul className="list-disc list-inside space-y-2">
              {aiExtracted.keyProvisions.map((provision, index) => (
                <li key={index} className="text-sm text-gray-700">
                  <span className="font-medium">{provision.title}:</span> {provision.description}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Payment Terms */}
        {aiExtracted.paymentTerms && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Payment Terms</h4>
            <p className="text-sm text-gray-700">{aiExtracted.paymentTerms}</p>
          </div>
        )}
        
        {/* AI Risk Analysis */}
        {aiExtracted.riskAnalysis && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">AI Risk Analysis</h4>
            
            {aiExtracted.riskAnalysis.summary && (
              <p className="text-sm text-gray-700 mb-3">{aiExtracted.riskAnalysis.summary}</p>
            )}
            
            {aiExtracted.riskAnalysis.risks && aiExtracted.riskAnalysis.risks.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700">Identified Risks</h5>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {aiExtracted.riskAnalysis.risks.map((risk, index) => (
                    <li key={index} className="text-sm">{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render timesheet content
  const renderTimesheetContent = () => {
    const { aiExtracted } = document;
    
    if (!aiExtracted) {
      return <p className="text-gray-500">No extracted content available.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Timesheet Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {aiExtracted.resource?.name ? `${aiExtracted.resource.name}'s Timesheet` : 'Timesheet'}
          </h3>
          
          <div className="mt-2 grid grid-cols-2 gap-4">
            {aiExtracted.period?.startDate && aiExtracted.period?.endDate && (
              <div>
                <span className="text-sm text-gray-500">Period:</span>
                <p className="text-sm">{aiExtracted.period.startDate} to {aiExtracted.period.endDate}</p>
              </div>
            )}
            
            {aiExtracted.resource?.id && (
              <div>
                <span className="text-sm text-gray-500">Resource ID:</span>
                <p className="text-sm">{aiExtracted.resource.id}</p>
              </div>
            )}
            
            {aiExtracted.totalHours && (
              <div>
                <span className="text-sm text-gray-500">Total Hours:</span>
                <p className="text-sm">{aiExtracted.totalHours}</p>
              </div>
            )}
            
            {aiExtracted.status && (
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="text-sm">{aiExtracted.status}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Time Entries */}
        {aiExtracted.entries && aiExtracted.entries.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Time Entries</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {aiExtracted.entries.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.date}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.project}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {entry.task}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                        {entry.hours}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                      {aiExtracted.totalHours}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        {/* AI Analysis */}
        {aiExtracted.aiAnalysis && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">AI Analysis</h4>
            
            {aiExtracted.aiAnalysis.summary && (
              <p className="text-sm text-gray-700 mb-3">{aiExtracted.aiAnalysis.summary}</p>
            )}
            
            {aiExtracted.aiAnalysis.observations && aiExtracted.aiAnalysis.observations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700">Observations</h5>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {aiExtracted.aiAnalysis.observations.map((observation, index) => (
                    <li key={index} className="text-sm">{observation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render invoice content
  const renderInvoiceContent = () => {
    const { aiExtracted } = document;
    
    if (!aiExtracted) {
      return <p className="text-gray-500">No extracted content available.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Invoice Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {aiExtracted.invoice?.number ? `Invoice #${aiExtracted.invoice.number}` : 'Invoice'}
          </h3>
          
          <div className="mt-2 grid grid-cols-2 gap-4">
            {aiExtracted.invoice?.date && (
              <div>
                <span className="text-sm text-gray-500">Invoice Date:</span>
                <p className="text-sm">{aiExtracted.invoice.date}</p>
              </div>
            )}
            
            {aiExtracted.invoice?.dueDate && (
              <div>
                <span className="text-sm text-gray-500">Due Date:</span>
                <p className="text-sm">{aiExtracted.invoice.dueDate}</p>
              </div>
            )}
            
            {aiExtracted.client?.name && (
              <div>
                <span className="text-sm text-gray-500">Client:</span>
                <p className="text-sm">{aiExtracted.client.name}</p>
              </div>
            )}
            
            {aiExtracted.project?.name && (
              <div>
                <span className="text-sm text-gray-500">Project:</span>
                <p className="text-sm">{aiExtracted.project.name}</p>
              </div>
            )}
            
            {aiExtracted.invoice?.total && (
              <div>
                <span className="text-sm text-gray-500">Total Amount:</span>
                <p className="text-sm font-medium">{aiExtracted.invoice.total}</p>
              </div>
            )}
            
            {aiExtracted.invoice?.status && (
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="text-sm">{aiExtracted.invoice.status}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Line Items */}
        {aiExtracted.lineItems && aiExtracted.lineItems.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Invoice Line Items</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {aiExtracted.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.rate}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                      {aiExtracted.invoice?.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        {/* Payment Terms */}
        {aiExtracted.paymentTerms && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Payment Terms</h4>
            <p className="text-sm text-gray-700">{aiExtracted.paymentTerms}</p>
          </div>
        )}
        
        {/* AI Analysis */}
        {aiExtracted.aiAnalysis && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-700">{aiExtracted.aiAnalysis}</p>
          </div>
        )}
      </div>
    );
  };

  // Render document metadata
  const renderMetadata = () => {
    return (
      <div className="space-y-6">
        {/* Document Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Document Information</h3>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <span className="text-sm text-gray-500">Filename:</span>
              <p className="text-sm">{document.filename}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Document Type:</span>
              <p className="text-sm capitalize">{document.documentType.replace('_', ' ')}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">File Type:</span>
              <p className="text-sm">{document.fileType}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">File Size:</span>
              <p className="text-sm">{document.fileSize} KB</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Uploaded:</span>
              <p className="text-sm">{formatDate(document.uploadDate)}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Processed:</span>
              <p className="text-sm">{formatDate(document.processedDate)}</p>
            </div>
          </div>
        </div>
        
        {/* User-Provided Metadata */}
        {document.metadata && Object.keys(document.metadata).length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">User-Provided Metadata</h3>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {Object.entries(document.metadata).map(([key, value]) => {
                if (!value || key === 'documentType') return null;
                
                const formattedKey = key
                  .replace(/([A-Z])/g, ' $1')
                  .toLowerCase()
                  .replace(/^./, str => str.toUpperCase());
                
                return (
                  <div key={key}>
                    <span className="text-sm text-gray-500">{formattedKey}:</span>
                    <p className="text-sm">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* AI Tags */}
        {document.aiTags && document.aiTags.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">AI-Generated Tags</h3>
            <div className="flex flex-wrap gap-2">
              {document.aiTags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render document raw text
  const renderRawText = () => {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Raw Extracted Text</h3>
        
        {document.extractedText ? (
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-[600px] whitespace-pre-wrap">
            {document.extractedText}
          </div>
        ) : (
          <p className="text-gray-500">No raw text available for this document.</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">{document.filename}</h2>
        <p className="text-sm text-gray-500">
          Processed: {formatDate(document.processedDate)}
        </p>
      </div>
      
      {/* Document Preview */}
      <div className="p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button 
                className={`inline-block p-3 rounded-t-lg ${activeTab === 'extract' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'hover:text-gray-600 hover:border-gray-300'}`}
                onClick={() => setActiveTab('extract')}
              >
                AI Extracted Data
              </button>
            </li>
            <li className="mr-2">
              <button 
                className={`inline-block p-3 rounded-t-lg ${activeTab === 'metadata' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'hover:text-gray-600 hover:border-gray-300'}`}
                onClick={() => setActiveTab('metadata')}
              >
                Document Metadata
              </button>
            </li>
            <li className="mr-2">
              <button 
                className={`inline-block p-3 rounded-t-lg ${activeTab === 'raw' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'hover:text-gray-600 hover:border-gray-300'}`}
                onClick={() => setActiveTab('raw')}
              >
                Raw Text
              </button>
            </li>
          </ul>
        </div>
        
        {/* Tab content */}
        {activeTab === 'extract' && renderExtractedContent()}
        {activeTab === 'metadata' && renderMetadata()}
        {activeTab === 'raw' && renderRawText()}
      </div>
    </div>
  );
};

export default DocumentViewer;