import React, { useEffect } from 'react';

// This component provides diagnostic tools to help find what's causing the spacing
const DiagnosticSettings = () => {
  useEffect(() => {
    // Inject diagnostic styles that will highlight elements with padding, margin, or gap
    const diagnosticStyle = document.createElement('style');
    diagnosticStyle.textContent = `
      /* Make paddings visible with a blue background */
      .MuiBox-root, .MuiGrid-item, .MuiContainer-root, .MuiPaper-root {
        background-color: rgba(0, 0, 255, 0.1) !important;
        border: 1px solid rgba(0, 0, 255, 0.3) !important;
      }
      
      /* Make margins visible with a red outline */
      *[style*="margin"], *[class*="margin"], .MuiBox-root, .MuiGrid-item {
        outline: 1px dashed red !important;
      }
      
      /* Make grid gaps visible */
      .MuiGrid-container {
        background-color: rgba(255, 0, 0, 0.1) !important;
      }
    `;
    document.head.appendChild(diagnosticStyle);
    
    return () => {
      document.head.removeChild(diagnosticStyle);
    };
  }, []);

  // Simple fixed width layout with no possibility of spacing
  return (
    <div style={{ margin: '-24px' }}>
      <h1 style={{ 
        padding: '16px', 
        fontSize: '24px', 
        fontFamily: 'sans-serif', 
        fontWeight: 'normal' 
      }}>
        Settings
      </h1>
      
      <div style={{ 
        display: 'flex', 
        height: 'calc(100vh - 120px)', 
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        borderRadius: '4px'
      }}>
        {/* Sidebar - fixed width */}
        <div style={{ 
          width: '200px', 
          borderRight: '1px solid #ddd', 
          overflowY: 'auto',
          backgroundColor: 'white'
        }}>
          <div style={{ 
            padding: '8px 16px', 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#666',
            fontWeight: 'bold' 
          }}>
            Account
          </div>
          
          <div style={{ 
            cursor: 'pointer', 
            padding: '8px 16px', 
            backgroundColor: '#f0f0f0', 
            borderLeft: '3px solid #1976d2' 
          }}>
            Profile Settings
          </div>
          
          <div style={{ cursor: 'pointer', padding: '8px 16px' }}>
            Notification Preferences
          </div>
          
          <div style={{ cursor: 'pointer', padding: '8px 16px' }}>
            Security
          </div>
          
          <div style={{ height: '1px', backgroundColor: '#ddd', margin: '8px 0' }} />
          
          <div style={{ 
            padding: '8px 16px', 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#666',
            fontWeight: 'bold' 
          }}>
            System
          </div>
          
          <div style={{ cursor: 'pointer', padding: '8px 16px' }}>
            Organization Settings
          </div>
          
          <div style={{ cursor: 'pointer', padding: '8px 16px' }}>
            Email Templates
          </div>
        </div>
        
        {/* Content area */}
        <div style={{ 
          flex: '1', 
          padding: '20px',
          overflowY: 'auto',
          backgroundColor: 'white'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            marginBottom: '16px', 
            fontFamily: 'sans-serif', 
            fontWeight: 'normal'
          }}>
            Profile Settings
          </h2>
          
          <p style={{ 
            marginBottom: '20px',
            color: '#666',
            fontFamily: 'sans-serif'
          }}>
            Manage your profile information and preferences.
          </p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>First Name</label>
            <input style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px' 
            }} 
            type="text" 
            defaultValue="John" />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Last Name</label>
            <input style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px' 
            }} 
            type="text" 
            defaultValue="Doe" />
          </div>
          
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Save Changes
          </button>
          
          {/* Add this diagnostic info */}
          <div style={{ 
            marginTop: '40px', 
            padding: '16px', 
            backgroundColor: '#f8f8f8', 
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <h3 style={{ marginBottom: '8px' }}>Diagnostic Information</h3>
            <p>
              Elements with blue background have padding.<br />
              Elements with red dashed outline have margin.<br />
              Note: This highlights spacing issues and should make it clear where the extra space is coming from.
            </p>
            <p style={{ marginTop: '16px' }}>
              To fix the spacing issue, right-click on the space between sidebar and content,
              select "Inspect" or "Inspect Element", and look for any elements that have padding,
              margin, or gap properties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticSettings;