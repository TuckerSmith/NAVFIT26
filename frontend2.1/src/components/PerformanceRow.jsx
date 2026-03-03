import React from 'react';

/** replicates the boxes from 33-39 rows from NAVFIT98
 */
const PerformanceRow = ({ label, subLabel, name, value, setter, standards }) => (
    <div className="navfit-row" style={{ display: 'flex', borderBottom: '1px solid black' }}>
      
      {/* LEFT COLUMN: TRAIT & NOB */}
      <div className="navfit-cell" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px' }}>
        <div style={{ fontWeight: 'normal', fontSize: '9px' }}>{label}</div>
        <div style={{ fontSize: '7px', color: '#444', marginBottom: '4px' }}>{subLabel}</div>
        
        {/* NOB Button pushed to bottom-right of this cell */}
        <div style={{ 
          marginTop: 'auto', 
          alignSelf: 'flex-end', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '3px' 
        }}>
          <label style={{ fontSize: '7px', fontWeight: 'normal' }}>NOB</label>
          <input type="radio" name={name} value="NOB" checked={value === 'NOB'} onChange={(e) => setter(e.target.value)} />
        </div>
      </div>
  
      {/* SCORE COLUMNS (1.0 - 5.0) */}
      {[
        { val: "1.0", flex: 1, text: standards?.s1 },
        { val: "2.0", flex: 0.5, text: "" },
        { val: "3.0", flex: 1, text: standards?.s3 },
        { val: "4.0", flex: 0.5, text: "" },
        { val: "5.0", flex: 1, text: standards?.s5 }
      ].map((col, idx) => (
        <div key={idx} className="navfit-cell" style={{ 
          flex: col.flex, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '2px',
          backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
          minHeight: '80px' // Ensures consistent height across the row
        }}>
          {/* Standard Text stays at the top */}
          <div style={{ fontSize: '9px', lineHeight: '1.1', textAlign: 'left', width: '100%' }}>
            {Array.isArray(col.text) 
              ? col.text.map((line, i) => <div key={i}>{line}</div>) 
              : col.text}
          </div>
          
          {/* Radio Button pushed to bottom-right of this cell */}
          <div style={{ marginTop: 'auto', alignSelf: 'flex-end' }}>
            <input 
              type="radio" 
              name={name} 
              value={col.val} 
              checked={value === col.val} 
              onChange={(e) => setter(e.target.value)} 
            />
          </div>
        </div>
      ))}
    </div>
  );

export default PerformanceRow;