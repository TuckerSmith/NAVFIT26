
import React, { useState, useEffect } from 'react';
import './styles/App.css'; 
import { describe, it, expect } from 'vitest';
import validators from './utils/formatters';
import PerformanceRow from './components/PerformanceRow';
import SumPromo from './components/SumPromo';
import PromoRec from './components/PromoRec';
import { FITREP_CONFIG, TRAIT_STANDARDS } from './constants/fitrepConfig';
import useFitrep from './hooks/useFitrep';

export default function App(){

  //const [currentView, setCurrentView] = useState('editor'); 
  //const [activeReport, setActiveReport] = useState(null);
  const [activeSqliteDb, setActiveSqliteDb] = useState('migrated_reports.db');
  const {
    formData, 
    handleChange, 
    handleSaveFitrep, // Changed from handleSave to match your hook function name
    handlePDFExport,
    calculateTraitAverage,
    showModal,
    setShowModal,
    modalContent,
    isSaved,
    hasUnsavedChanges, 
    handleACCDBExport,
    getError
  } = useFitrep(activeSqliteDb);

  // Helper to convert Browser Date (YYYY-MM-DD) to Navy Format (YYMMM DD)
  const formatDateToNavy = (dateVal) => {
    if (!dateVal) return "";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return dateVal; 
    const day = String(date.getDate()).padStart(2, '0');
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${year}${month} ${day}`;
  };
  
  return (
    <div className="navfit-paper">
      {/* HEADER SECTION */}
      <div className="navfit-header">
        <h1>FITNESS REPORT & COUNSELING RECORD (W2-O6)</h1>
      </div>

    <div className="navfit-row" style={{ borderTop: '1px solid black' }}>
      {/* BLOCKS 1-4: THE TOP ROW */}
      {/* BLOCK 1 */}
      <div className="navfit-row">
        <div 
          className={`navfit-cell ${getError('name').isError ? "input-error" : ""}`} 
          style={{ flex: 3 }}
        >
          <label>1. Name (Last, First MI Suffix)</label>
          <input 
            className="navfit-input"
            value={formData.name} 
            onChange={(e) => {
              // Keeps the auto-uppercase and regex blocking in the onChange
              const cleanValue = e.target.value.toUpperCase().replace(/[^A-Z,\s-]/g, '');
              handleChange('name', cleanValue);
            }} 
          />
      
          {getError('name').isError && (
            <div style={{ color: 'red', fontSize: '10px', marginTop: '1px', fontWeight: 'bold' }}>
              {getError('name').note}
            </div>
          )}
        </div>


      {/* BLOCK 2: GRADE/RATE */}
      <div 
        className={`navfit-cell ${getError('grade').isError ? "input-error" : ""}`} 
        style={{ flex: 1 }}
      >
        <label>2. Grade/Rate</label>
        <input 
          className="navfit-input"
          value={formData.grade} 
          // Auto-uppercase as they type for Navy standards
          onChange={(e) => handleChange('grade', e.target.value.toUpperCase())}
        />
        
        {/* Show the specific error message from your validators file */}
        {getError('grade').isError && (
          <div className="error-note">
            {getError('grade').note}
          </div>
        )}
      </div>

      {/* BLOCK 3: DESIG */}
      <div 
        className={`navfit-cell ${getError('desig').isError ? "input-error" : ""}`} 
        style={{ flex: 1 }}
      >
        <label>3. Desig</label>
        <input 
          className="navfit-input"
          value={formData.desig} 
          // This regex stays: it forces only numbers (digits) as they type
          onChange={(e) => handleChange('desig', e.target.value.replace(/\D/g, ''))} 
          maxLength={4} // Navy Designators are exactly 4 digits
        />
        
        {/* If the validator finds an issue (like only 3 digits), show the note */}
        {getError('desig').isError && (
          <div className="error-note">
            {getError('desig').note}
          </div>
        )}
      </div>
      
      {/* BLOCK 4: SSN */}
      <div 
        className={`navfit-cell ${getError('ssn').isError ? "input-error" : ""}`} 
        style={{ flex: 1.5 }}
      >
        <label>4. SSN</label>
        <input 
          className="navfit-input"
          value={formData.ssn} 
          placeholder="000-00-0000"
          onChange={(e) => {
            // 1. Strip all non-digits
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 9) val = val.slice(0, 9);
            
            // 2. Apply the Navy/Standard SSN mask (000-00-0000)
            const masked = val
              .replace(/^(\d{3})(\d)/, '$1-$2')
              .replace(/^(\d{3})-(\d{2})(\d)/, '$1-$2-$3');
            
            // 3. Update the state
            handleChange('ssn', masked);
          }}
        />
        
        {/* If the SSN is incomplete (less than 11 characters including dashes), show the note */}
        {getError('ssn').isError && (
          <div className="error-note">
            {getError('ssn').note}
          </div>
        )}
      </div>
      </div>
      </div>
      
      {/* BLOCKS 5-9: THE DUTY STATION ROW */}
      <div className="navfit-row">
        {/* BLOCK 5: DUTY STATUS */}
        <div className="navfit-cell" style={{ flex: 2 }}>
          <label>5. Duty Status</label>
          <div className="radio-group" style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            {['ACT', 'FTS', 'INACT', 'AT/ADSW/'].map((status) => (
              <label key={status} className="radio-label" style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="radio" 
                  name="dutyStatus"
                  value={status} 
                  checked={formData.dutyStatus === status} 
                  onChange={(e) => handleChange('dutyStatus', e.target.value)}
                /> 
                {status}
              </label>
            ))}
          </div>
        </div>

        {/*BLOCK 6*/}
        <div className="navfit-cell" style={{ flex: 1 }}>
          <label>6. UIC</label>
          <input 
            value={formData.uic} 
            onChange={(e) => handleChange('uic', e.target.value.replace(/\D/g, ''))} 
          />
          {formData.uic.length > FITREP_CONFIG.MAX_UIC_LENGTH && (
          <div className="error-text">
            Warning: Designator must be {FITREP_CONFIG.MAX_UIC_LENGTH} digits.
          </div>
        )}
        </div>

  
        {/* BLOCK 7: SHIP/STATION */}
        <div 
          className={`navfit-cell ${getError('station').isError ? "input-error" : ""}`} 
          style={{ flex: 1.5 }}
        >
          <label>7. Ship/Station</label>
          <input 
            className="navfit-input"
            value={formData.station} 
            // Auto-uppercase to match Navy administrative standards
            onChange={(e) => handleChange('station', e.target.value.toUpperCase())} 
            placeholder="USS SHIPNAME / COMMAND"
          />
          
          {/* If required and empty, or if it exceeds character limits */}
          {getError('station').isError && (
            <div className="error-note">
              {getError('station').note}
            </div>
          )}
        </div>

        {/*BLOCK 8*/}
        <div className="navfit-cell" style={{ flex: .5 }}>
          <label>8. Promotion Status</label>
          <select 
            value={formData.promo} 
            onChange={(e) => handleChange('promo', e.target.value)}
            className="dropdown-input"
          >
            <option value="">  </option>
            <option value="REGULAR">REGULAR</option>
            <option value="FROCKED">FROCKED</option>
            <option value="SELECTED">SELECTED</option>
            <option value="SPOT">SPOT</option>
          </select>
        </div>
        
        {/* BLOCK 9: DATE REPORTED */}
        <div 
          className={`navfit-cell ${getError('dateRep').isError ? "input-error" : ""}`} 
          style={{ flex: 0.5 }}
        >
          <label>9. Date Reported</label>
          <input 
            // If we have a value, show it as text (formatted), otherwise show date picker
            type={formData.dateRep ? "text" : "date"}
            className="navfit-input calendar-input"
            value={formData.dateRep}
            placeholder="YYMMM DD"
            
            // When they pick a date, we format it to Navy style immediately
            onChange={(e) => {
              if (e.target.value) {
                handleChange('dateRep', formatDateToNavy(e.target.value));
              }
            }} 
            
            // Switch back to date picker only if they click to edit
            onFocus={(e) => {
              e.target.type = "date";
            }}
            
            // Switch back to text when they click away
            onBlur={(e) => {
              if (formData.dateRep) e.target.type = "text";
            }}
          />

          {/* Validator for date logic (e.g., checking if the date is in the future) */}
          {getError('dateRep').isError && (
            <div className="error-note">
              {getError('dateRep').note}
            </div>
          )}
        </div>
      </div>

      {/* BLOCKS 10-15 */}
      <div className="navfit-row">
        
      {/* BLOCKS 10-13: OCCASION FOR REPORT */}
      <div className="navfit-cell" style={{ flex: 3 }}>
        <label style={{ fontWeight: 'normal' }}>Occasion for Report</label>
        <div className="radio-group" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'nowrap', // Forces them to stay in one row
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '4px', 
          marginTop: '4px' 
        }}>
          <label className="radio-label" style={{ fontSize: '8.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '1px' }}>
            <input type="radio" value="Periodic" checked={formData.occasion === 'Periodic'} onChange={(e) => handleChange('occasion', e.target.value)} /> 10. Periodic
          </label>
          
          <label className="radio-label" style={{ fontSize: '8.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '1px' }}>
            <input type="radio" value="Detachment of Individual" checked={formData.occasion === 'Detachment of Individual'} onChange={(e) => handleChange('occasion', e.target.value)} /> 11. Detachment of Indiv.
          </label>
          
          <label className="radio-label" style={{ fontSize: '8.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '1px' }}>
            <input type="radio" value="Detachment of Reporting Senior" checked={formData.occasion === 'Detachment of Reporting Senior'} onChange={(e) => handleChange('occasion', e.target.value)} /> 12. Detachment of Senior
          </label>
          
          <label className="radio-label" style={{ fontSize: '8.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '1px' }}>
            <input type="radio" value="Special" checked={formData.occasion === 'Special'} onChange={(e) => handleChange('occasion', e.target.value)} /> 13. Special
          </label>
        </div>
      </div>

      
      {/* BLOCKS 14 & 15: PERIOD OF REPORT */}
      <div className="navfit-cell" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <label>Period of Report</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          
          {/* BLOCK 14: FROM */}
          <div 
            className={`navfit-cell ${getError('fromPeriod').isError ? "input-error" : ""}`} 
            style={{ flex: 1, borderRight: 'none', padding: '0' }}
          >
            <label style={{ fontSize: '9px' }}>14. FROM:</label>
            <input 
              type={formData.fromPeriod ? "text" : "date"}
              value={formData.fromPeriod}
              className="navfit-input"
              placeholder="YYMMM DD"
              onChange={(e) => e.target.value && handleChange('fromPeriod', formatDateToNavy(e.target.value))} 
              onFocus={(e) => { e.target.type = "date"; }}
              onBlur={(e) => { if (formData.fromPeriod) e.target.type = "text"; }}
            />
          </div>

    {/* BLOCK 15: TO */}
    <div 
      className={`navfit-cell ${getError('toPeriod').isError ? "input-error" : ""}`} 
      style={{ flex: 1, borderRight: 'none', padding: '0' }}
    >
      <label style={{ fontSize: '9px' }}>15. TO:</label>
      <input 
        type={formData.toPeriod ? "text" : "date"}
        value={formData.toPeriod}
        className="navfit-input"
        placeholder="YYMMM DD"
        onChange={(e) => e.target.value && handleChange('toPeriod', formatDateToNavy(e.target.value))} 
        onFocus={(e) => { e.target.type = "date"; }}
        onBlur={(e) => { if (formData.toPeriod) e.target.type = "text"; }}
      />
    </div>

      {/* Shared Error Message for Date Logic */}
      {(getError('fromPeriod').isError || getError('toPeriod').isError) && (
        <div className="error-note" style={{ fontSize: '8px' }}>
          {getError('fromPeriod').note || getError('toPeriod').note}
        </div>
      )}
    </div>

      </div>
      </div>

      {/* BLOCKS 16-21 */}
      <div className="navfit-row">
        {/*BLOCK 16*/}
        <div className="navfit-cell" style={{ flex: .75, display: 'flex', flexDirection: 'column' }}>
          <label>16. Not Observed Report</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                value="Not Observed Report" 
                checked={formData.notObserved === 'Not Observed Report'} 
                onChange={(e) => handleChange('notObserved', e.target.value)} 
              />
            </label>
          </div>
        </div>

      {/* BLOCKS 17-19: TYPE OF REPORT */}
      <div className="navfit-cell" style={{ flex: 2.25, display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontWeight: 'normal' }}>Type of Report</label>
        <div className="radio-group" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'nowrap', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '4px',
          height: '100%' 
        }}>
          <label className="radio-label" style={{ fontSize: '9px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              type="radio" 
              name="reportType"
              value="Regular" 
              checked={formData.reportType === 'Regular'} 
              onChange={(e) => handleChange('reportType', e.target.value)} 
            /> 17. Regular
          </label>
          
          <label className="radio-label" style={{ fontSize: '9px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              type="radio" 
              name="reportType"
              value="Concurrent" 
              checked={formData.reportType === 'Concurrent'} 
              onChange={(e) => handleChange('reportType', e.target.value)} 
            /> 18. Concurrent
          </label>
          
          <label className="radio-label" style={{ fontSize: '9px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              type="radio" 
              name="reportType"
              value="Ops Cdr" 
              checked={formData.reportType === 'Ops Cdr'} 
              onChange={(e) => handleChange('reportType', e.target.value)} 
            /> 19. Ops Cdr
          </label>
        </div>
        </div>

      {/* BLOCK 20: PHYSICAL READINESS */}
      <div 
        className={`navfit-cell ${getError('physicalRead').isError ? "input-error" : ""}`} 
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <label>20. Physical Readiness</label>
        <input 
          className="navfit-input"
          type="text" 
          value={formData.physicalRead} 
          // Auto-uppercase and limit to 4 characters (standard for these codes)
          onChange={(e) => handleChange('physicalRead', e.target.value.toUpperCase().slice(0, 4))} 
          placeholder="e.g., PFPF"
        />

        {/* Validator note for Navy codes */}
        {getError('physicalRead').isError && (
          <div className="error-note">
            {getError('physicalRead').note}
          </div>
        )}
      </div>


        {/*BLOCK 21*/}
        <div className="navfit-cell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label>21. Billet Subcategory (if any)</label>
          <select 
            value={formData.billetSub} 
            onChange={(e) => handleChange('billetSub', e.target.value)}
            className="dropdown-input"
          >
            <option value="">   </option>
            <option value="NA">NA</option>
            <option value="BASIC">BASIC</option>
            <option value="APPROVED">APPROVED</option>
            <option value="INDIV AUG">INDIV AUG</option>
            <option value="CO AFLOAT">CO AFLOAT</option>
            <option value="CO ASHORE">CO ASHORE</option>
            <option value="OIC">OIC</option>
            <option value="SEA COMP">SEA COMP</option>
            <option value="APPROVED">APPROVED</option>
            <option value="CRF">CRF</option>
            <option value="CANVASSER">CANVASSER</option>
            <option value="RESIDENT">RESIDENT</option>
            <option value="INTERN">INTERN</option>
            <option value="INSTRUCTOR">INSTRUCTOR</option>
            <option value="STUDENT">STUDENT</option>
            <option value="RESAC1">RESAC1</option>
            <option value="RESAC6">RESAC6</option>
            <option value="SPECIAL01">SPECIAL01</option>
            <option value="SPECIAL02">SPECIAL02</option>
            <option value="SPECIAL03">SPECIAL03</option>
            <option value="SPECIAL04">SPECIAL04</option>
            <option value="SPECIAL05">SPECIAL05</option>
            <option value="SPECIAL06">SPECIAL06</option>
            <option value="SPECIAL07">SPECIAL07</option>
            <option value="SPECIAL08">SPECIAL08</option>
            <option value="SPECIAL09">SPECIAL09</option>
            <option value="SPECIAL10">SPECIAL10</option>
            <option value="SPECIAL11">SPECIAL11</option>
            <option value="SPECIAL12">SPECIAL12</option>
            <option value="SPECIAL13">SPECIAL13</option>
            <option value="SPECIAL14">SPECIAL14</option>
            <option value="SPECIAL15">SPECIAL15</option>
            <option value="SPECIAL16">SPECIAL16</option>
            <option value="SPECIAL17">SPECIAL17</option>
            <option value="SPECIAL18">SPECIAL18</option>
            <option value="SPECIAL19">SPECIAL19</option>
            <option value="SPECIAL20">SPECIAL20</option>
          </select>
        </div>
      
      </div>

    {/* BLOCKS 22-27 */}
    <div className="navfit-row" style={{ 
      display: 'flex', 
      width: '100%', 
      alignItems: 'stretch',
      flexWrap: 'nowrap' 
    }}>
            
    {/* BLOCK 22: REPORTING SENIOR */}
    <div 
      className={`navfit-cell ${getError('reportSenior').isError ? "input-error" : ""}`} 
      style={{ flex: 2, minWidth: 0 }}
    >
      <label style={{ fontSize: 'clamp(7px, 1vw, 10px)', letterSpacing: '-0.5px' }}>
        22. SENIOR (L, F MI)
      </label>
      <input 
        type="text" 
        className="navfit-input" 
        value={formData.reportSenior} 
        // Auto-uppercase and sanitize to allow only letters, commas, spaces, and hyphens
        onChange={(e) => {
          const cleanValue = e.target.value.toUpperCase().replace(/[^A-Z,\s-]/g, '');
          handleChange('reportSenior', cleanValue);
        }} 
        placeholder="SMITH, JOHN J"
      />

      {/* Display the validation note (e.g., "Required Format: LAST, FIRST MI") */}
      {getError('reportSenior').isError && (
        <div className="error-note">
          {getError('reportSenior').note}
        </div>
      )}
    </div>

      {/* BLOCK 23: SENIOR GRADE */}
      <div 
        className={`navfit-cell ${getError('reportGrade').isError ? "input-error" : ""}`} 
        style={{ flex: 0.5, minWidth: 0 }}
      >
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>23. GRADE</label>
        <input 
          type="text" 
          className="navfit-input" 
          value={formData.reportGrade} 
          // Auto-uppercase to match Navy standards
          onChange={(e) => handleChange('reportGrade', e.target.value.toUpperCase())} 
          placeholder="e.g., CAPT"
        />

        {/* Validator note for Senior Ranks */}
        {getError('reportGrade').isError && (
          <div className="error-note">
            {getError('reportGrade').note}
          </div>
        )}
      </div>

      {/* BLOCK 24: SENIOR DESIGNATOR */}
      <div 
        className={`navfit-cell ${getError('reportDesig').isError ? "input-error" : ""}`} 
        style={{ flex: 0.5, minWidth: 0 }}
      >
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>24. DES</label>
        <input 
          type="text" 
          className="navfit-input" 
          value={formData.reportDesig} 
          // Force numeric-only input
          onChange={(e) => handleChange('reportDesig', e.target.value.replace(/\D/g, ''))} 
          placeholder="0000"
          maxLength={4}
        />

        {/* Validator note for 4-digit designator */}
        {getError('reportDesig').isError && (
          <div className="error-note">
            {getError('reportDesig').note}
          </div>
        )}
      </div>

      {/* BLOCK 25: SENIOR TITLE */}
      <div 
        className={`navfit-cell ${getError('reportTitle').isError ? "input-error" : ""}`} 
        style={{ flex: 1.5, minWidth: 0 }}
      >
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>25. TITLE</label>
        <input 
          type="text" 
          className="navfit-input" 
          value={formData.reportTitle} 
          // Auto-uppercase and reasonable character limit for the PDF box
          onChange={(e) => handleChange('reportTitle', e.target.value.toUpperCase().slice(0, 20))} 
          placeholder="e.g., CO / OIC / XO"
        />

        {/* Validator note for character limits */}
        {getError('reportTitle').isError && (
          <div className="error-note">
            {getError('reportTitle').note}
          </div>
        )}
      </div>

      {/* BLOCK 26: SENIOR UIC */}
      <div 
        className={`navfit-cell ${getError('reportUIC').isError ? "input-error" : ""}`} 
        style={{ flex: 0.5, minWidth: 0 }}
      >
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>26. UIC</label>
        <input 
          type="text" 
          className="navfit-input"
          value={formData.reportUIC} 
          // Force numeric-only input and limit to 6 digits
          onChange={(e) => handleChange('reportUIC', e.target.value.replace(/\D/g, '').slice(0, 6))} 
          placeholder="00000"
        />

        {/* Validator note for numeric length */}
        {getError('reportUIC').isError && (
          <div className="error-note">
            {getError('reportUIC').note}
          </div>
        )}
      </div>

      {/* BLOCK 27: SENIOR SSN */}
      <div 
        className={`navfit-cell ${getError('reportSSN').isError ? "input-error" : ""}`} 
        style={{ flex: 1, borderRight: 'none', minWidth: 0 }}
      >
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>27. SSN</label>
        <input 
          type="text" 
          className="navfit-input" 
          value={formData.reportSSN} 
          placeholder="000-00-0000"
          onChange={(e) => {
            // 1. Strip all non-digits
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 9) val = val.slice(0, 9);
            
            // 2. Apply the SSN mask (000-00-0000)
            const masked = val
              .replace(/^(\d{3})(\d)/, '$1-$2')
              .replace(/^(\d{3})-(\d{2})(\d)/, '$1-$2-$3');
            
            // 3. Update the CORRECT field in state
            handleChange('reportSSN', masked);
          }}
        />

        {/* Validator note for the 9-digit count */}
        {getError('reportSSN').isError && (
          <div className="error-note">
            {getError('reportSSN').note}
          </div>
        )}
      </div>
    </div>

    {/* BLOCK 28: COMMAND EMPLOYMENT AND ACHIEVEMENTS */}
    <div className={`navfit-row ${getError('cmdEmployAch').isError ? "input-error" : ""}`} style={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%', 
        borderTop: '1px solid black', 
        padding: '5px'
      }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px', marginBottom: '4px' }}>
          28. COMMAND EMPLOYMENT AND COMMAND ACHIEVEMENTS
        </label>
        
        <textarea 
          value={formData.cmdEmployAch} 
          onChange={(e) => handleChange('cmdEmployAch', e.target.value)} 
          className="navfit-textarea" 
          style={{ 
            width: '100%', 
            border: 'none',
            outline: 'none',
            resize: 'none',
            backgroundColor: 'transparent', // Let the parent's input-error handle the color
            fontSize: '14px',
            lineHeight: '1.2'
          }}
          rows="4"
          placeholder="Enter command mission and achievements..."
        />
        
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px', 
          borderTop: '1px dashed #ccc',
          marginTop: '1px',
          paddingTop: '1px'
        }}>
          {/* Left side: Show the specific error note if over limit */}
          <span style={{ color: 'red', fontWeight: 'normal' }}>
            {getError('cmdEmployAch').isError ? getError('cmdEmployAch').note : ""}
          </span>

          {/* Right side: Character counter */}
          <span style={{ color: getError('cmdEmployAch').isError ? 'red' : '#666' }}>
            {formData.cmdEmployAch.length} / {FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH}
          </span>
        </div>
      </div>

      {/* BLOCK 29: PRIMARY/COLLATERAL DUTIES */}
      <div className={`navfit-row ${getError('duties').isError ? "input-error" : ""}`} style={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%', 
        borderTop: '1px solid black', 
        padding: '5px',
        position: 'relative'
      }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px', marginBottom: '4px', maxWidth: '85%' }}>
          29. Primary/Collateral/Watchstanding Duties (Enter Primary Duty Abbreviation in Box)
        </label>

        {/* Mini Abbreviation Box */}
        <div style={{
          position: 'absolute',
          left: '10px',
          top: '20px',
          border: `1px solid ${getError('primaryDuty').isError ? 'red' : 'black'}`,
          width: '200px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#fff',
          zIndex: 10
        }}>
          <input 
            type="text"
            maxLength="8"
            value={formData.primaryDuty} 
            onChange={(e) => handleChange('primaryDuty', e.target.value.toUpperCase())} 
            style={{ 
              width: '100%', 
              border: 'none', 
              textAlign: 'center', 
              fontSize: '14px', 
              fontWeight: 'normal',
              outline: 'none'
            }}
          />
        </div>

        <textarea 
          value={formData.duties} 
          onChange={(e) => handleChange('duties', e.target.value)} 
          className="navfit-textarea" 
          style={{ 
            width: '100%', 
            border: 'none',
            outline: 'none',
            resize: 'none',
            backgroundColor: 'transparent',
            fontSize: '14px',
            lineHeight: '1.2',
            marginTop: '10px'
          }}
          rows="5"
        />

        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px', 
          borderTop: '1px dashed #ccc',
          marginTop: '1px'
        }}>
          <span style={{ color: 'red', fontWeight: 'normal' }}>
            {getError('duties').isError ? getError('duties').note : (getError('primaryDuty').isError ? getError('primaryDuty').note : "")}
          </span>
          <span style={{ color: getError('duties').isError ? 'red' : '#666' }}>
            {formData.duties.length} / {FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH}
          </span>
        </div>
      </div>

      {/* ROW: BLOCKS 30-32 (COUNSELING) */}
      <div className="navfit-row" style={{ display: 'flex', width: '100%', borderTop: '1px solid black' }}>
        <div className="navfit-cell" style={{ flex: 1.5 }}>
          <label style={{ fontSize: '9px' }}>For Mid-term Counseling Use (When completing FITREP, enter 30 and 31 from counseling worksheet, sign 32.)</label>
        </div>

        <div className="navfit-cell" style={{ flex: 0.5 }}>
          <label style={{ fontSize: '9px' }}>30. Date Counseled</label>
          <select 
            className="navfit-input"
            value={formData.dateCounseled} 
            onChange={(e) => handleChange('dateCounseled', e.target.value)}
          >
            <option value=""></option>
            <option value="NOT REQ">NOT REQ</option>
            <option value="NOT PERF">NOT PERF</option>
          </select>
        </div>

        <div className={`navfit-cell ${getError('counselor').isError ? "input-error" : ""}`} style={{ flex: 1 }}>
          <label style={{ fontSize: '9px' }}>31. Counselor</label>
          <input 
            className="navfit-input"
            value={formData.counselor} 
            onChange={(e) => handleChange('counselor', e.target.value.toUpperCase())}
            placeholder="LAST, FIRST MI"
          />
        </div>

        <div className="navfit-cell" style={{ flex: 1, borderRight: 'none', backgroundColor: '#f9f9f9' }}>
          <label style={{ fontSize: '9px' }}>32. Signature of Individual Counseled</label>
          <div style={{ borderBottom: '1px solid black', marginTop: '12px', height: '15px' }}></div>
        </div>
      </div>

    {/* PERFORMANCE TRAITS SECTION */}
    <div className="navfit-row" style={{ display: 'flex', width: '100%', borderTop: '1px solid black' }}>
        <div className="navfit-cell" style={{ flex: 1.5 }}>
          <label style={{ fontSize: '9px' }}>PERFORMANCE TRAITS: 1.0 - Below standards/not progressing or UNSAT in any one standard; 2.0 - Does not yet meet all 3.0 standards; 3.0 - Meets all 3.0 standards; 4.0 - Exceeds most 3.0 standards; 5.0 - Meets overall criteria and most of the specific standards for 5.0.</label>
        </div>
    </div>

    {/* PERFORMANCE TRAITS HEADER ROW */}
    <div className="navfit-row" style={{ 
      display: 'flex', 
      width: '100%', 
      borderTop: '1px solid black', 
      borderBottom: '1px solid black',
      alignItems: 'stretch'
    }}>
      <div className="navfit-cell" style={{ flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px' }}>PERFORMANCE TRAITS</label>
      </div>
      
      <div className="navfit-cell" style={{ flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px' }}>1.0*</label>
        <label>Below Standards</label>
      </div>
      
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px' }}>2.0</label>
        <label>Progressing</label>
      </div>
      
      <div className="navfit-cell" style={{ flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px' }}>3.0</label>
        <label>Meets Standards</label>
      </div>
      
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px' }}>4.0</label>
        <label>Above Standards</label>
      </div>
      
      <div className="navfit-cell" style={{ flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <label style={{ fontWeight: 'normal', fontSize: '10px' }}>5.0</label>
        <label>Greatly Exceeds Standards</label>
      </div>
    </div>

    <div className="performance-section">
      
      {/* Block 33 */}
      <PerformanceRow 
        label="33. PROFESSIONAL EXPERTISE" 
        subLabel="Professional knowledge, proficiency, and qualifications."
        name="proExpert" 
        value={formData.proExpert} 
        setter={(val) => handleChange('proExpert', val)} 
        standards={TRAIT_STANDARDS.proExpert} 
      />

      {/* Block 34 */}
      <PerformanceRow 
        label="34. COMMAND OR ORGANIZATIONAL CLIMATE/EQUAL OPPORTUNITY:" 
        subLabel="Contributing to growth and development, human worth, community."
        name="cmeo" 
        value={formData.cmeo} 
        setter={(val) => handleChange('cmeo', val)} 
        standards={TRAIT_STANDARDS.cmeo} 
      />

      {/* Block 35 */}
      <PerformanceRow 
        label="35. MILITARY BEARING/CHARACTER:" 
        subLabel="Appearance, conduct, physical fitness, adherance to Navy Core Values."
        name="bearing" 
        value={formData.bearing} 
        setter={(val) => handleChange('bearing', val)} 
        standards={TRAIT_STANDARDS.bearing} 
      />

      {/* Block 36 */}
      <PerformanceRow 
        label="36. TEAMWORK:"
        subLabel="Contributions toward team building and team results." 
        name="teamwork" 
        value={formData.teamwork} 
        setter={(val) => handleChange('teamwork', val)} 
        standards={TRAIT_STANDARDS.teamwork} 
      />

      {/* Block 37 */}
      <PerformanceRow 
        label="37. MISSION ACCOMPLISHMENT AND INITIATIVE:"
        subLabel="Taking initiative, planning/prioritizing, achieving mission." 
        name="missAccomp" 
        value={formData.missAccomp} 
        setter={(val) => handleChange('missAccomp', val)} 
        standards={TRAIT_STANDARDS.missAccomp} 
      />

      {/* Block 38 */}
      <PerformanceRow 
        label="38. LEADERSHIP:"
        subLabel="Organizing, motivating and developing others to accomplish goals." 
        name="leadership" 
        value={formData.leadership} 
        setter={(val) => handleChange('leadership', val)} 
        standards={TRAIT_STANDARDS.leadership} 
      />

      {/* Block 39 */}
      <PerformanceRow 
        label="39. TACTICAL PERFORMANCE:"
        subLabel="(Warfare qualified officers only) Basic and tactical employment of weapons systems." 
        name="tactPerform" 
        value={formData.tactPerform} 
        setter={(val) => handleChange('tactPerform', val)} 
        standards={TRAIT_STANDARDS.tactPerform} 
      />
    </div>

      {/* BLOCK 40: MILESTONES */}
      <div className="navfit-row" style={{ display: 'flex', borderTop: '1px solid black' }}>
        <div className="navfit-cell" style={{ flex: 2, fontSize: '8px' }}>
          <label style={{ fontWeight: 'normal' }}>40. I recommend screening this individual for next career milestone(s) as follows: (maximum of two)</label>
          <label>Recommendations may be for competitive schools or duty assignments such as:</label>
          <label>SCP, Dept Head, XO, OIC, CO, Major Command, War College, PG School</label>
        </div>
        <div className={`navfit-cell ${getError('milestoneOne').isError ? "input-error" : ""}`} style={{ flex: 1 }}>
          <input className="navfit-input" value={formData.milestoneOne} onChange={(e) => handleChange('milestoneOne', e.target.value.toUpperCase())} placeholder="Milestone 1" />
        </div>
        <div className={`navfit-cell ${getError('milestoneTwo').isError ? "input-error" : ""}`} style={{ flex: 1, borderRight: 'none' }}>
          <input className="navfit-input" value={formData.milestoneTwo} onChange={(e) => handleChange('milestoneTwo', e.target.value.toUpperCase())} placeholder="Milestone 2" />
        </div>
      </div>

      {/* BLOCK 41: COMMENTS */}
      <div className={`navfit-row ${getError('comments').isError ? "input-error" : ""}`} style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid black', padding: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label style={{ fontWeight: 'normal', fontSize: '9px' }}>41. COMMENTS ON PERFORMANCE</label>
          <div style={{ fontSize: '9px' }}>
            Font: <select value={formData.commentFontSize || "16px"} onChange={(e) => handleChange('commentFontSize', e.target.value)}>
              <option value="13.3px">10 pt</option>
              <option value="16px">12 pt</option>
            </select>
          </div>
        </div>
        <textarea 
          value={formData.comments} 
          onChange={(e) => handleChange('comments', e.target.value)} 
          className="navfit-textarea" 
          style={{ width: '100%', minHeight: '180px', fontSize: formData.commentFontSize || "16px", fontFamily: 'Courier New' }} 
        />
        <div style={{ textAlign: 'right', fontSize: '9px', borderTop: '1px dashed #ccc' }}>
          {formData.comments.length} / {FITREP_CONFIG.MAX_COMMENT_LENGTH || 1800}
        </div>
      </div>

      {/* BLOCKS 42-44: PROMO GRID */}
      <div style={{ display: 'flex', width: '100%', borderTop: '1px solid black', borderBottom: '1px solid black' }}>
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: '1px solid black' }}>
          <PromoRec label="42." subLabel="INDIVIDUAL" name="promotion" value={formData.promotion} setter={(val) => handleChange('promotion', val)} />
          <SumPromo label="43." subLabel="SUMMARY" name="sumPromo" value={formData.sumPromo} setter={(val) => handleChange('sumPromo', val)} />
        </div>
        <div className="navfit-cell" style={{ flex: 1.2 }}>
          <label style={{ fontSize: '8px', fontWeight: 'normal' }}>44. SENIOR ADDRESS</label>
          <textarea className="navfit-textarea" value={formData.seniorAddress} onChange={(e) => handleChange('seniorAddress', e.target.value.toUpperCase())} style={{ flex: 1, border: 'none' }} />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="navfit-actions" style={{ padding: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button className="save-btn" onClick={handleSaveFitrep}>Save to Database</button>
        <button className="pdf-btn" onClick={handlePDFExport} disabled={!isSaved || hasUnsavedChanges}>Generate PDF</button>
        <button className="accdb-btn" onClick={handleACCDBExport} disabled={!isSaved || hasUnsavedChanges}>Export ACCDB</button>
      </div>

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: modalContent.isError ? 'red' : 'green' }}>{modalContent.title}</h3>
            <p>{modalContent.text}</p>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

    </div> // This closes navfit-paper
  );
}