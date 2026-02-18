
import React, { useState, useEffect } from 'react';
import './styles/App.css'; 
import { describe, it, expect } from 'vitest';

export const FITREP_CONFIG = {
  MAX_DESIG_LENGTH: 4,
  MAX_UIC_LENGTH: 5,
  MAX_TITLE_LENGTH: 14,
  MAX_ACHIEVEMENT_LENGTH: 276,
  MAX_SSN_DIGITS: 9
};

/** * SUB-COMPONENT: PerformanceRow
 * This replicates the boxed 33-39 rows from NAVFIT98
 */
const PerformanceRow = ({ label, subLabel, name, value, setter }) => (
  <div className="navfit-row" style={{ display: 'flex', borderBottom: '1px solid black' }}>
    
    {/* TRAIT DESCRIPTION + NOB BOX */}
    <div className="navfit-cell" style={{ 
      flex: 1, // Matches the 'PERFORMANCE TRAITS' header flex
      display: 'flex', 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '4px'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{label}</div>
        <div style={{ fontSize: '8px', color: '#444', lineHeight: '1' }}>{subLabel}</div>
      </div>
      
      {/* THE NOB MINI-BOX */}
      <div style={{ 
        borderLeft: '1px solid black', 
        paddingLeft: '5px', 
        marginLeft: '5px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <label style={{ fontSize: '7px', fontWeight: 'bold' }}>NOB</label>
        <input 
          type="radio" 
          name={name} 
          value="NOB" 
          checked={value === 'NOB'} 
          onChange={(e) => setter(e.target.value)} 
        />
      </div>
    </div>

    {/* SCORE COLUMNS (Flex ratios matching your header) */}
    <div className="navfit-cell" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <input type="radio" name={name} value="1.0" checked={value === "1.0"} onChange={(e) => setter(e.target.value)} />
    </div>
    <div className="navfit-cell" style={{ flex: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <input type="radio" name={name} value="2.0" checked={value === "2.0"} onChange={(e) => setter(e.target.value)} />
    </div>
    <div className="navfit-cell" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <input type="radio" name={name} value="3.0" checked={value === "3.0"} onChange={(e) => setter(e.target.value)} />
    </div>
    <div className="navfit-cell" style={{ flex: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <input type="radio" name={name} value="4.0" checked={value === "4.0"} onChange={(e) => setter(e.target.value)} />
    </div>
    <div className="navfit-cell" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <input type="radio" name={name} value="5.0" checked={value === "5.0"} onChange={(e) => setter(e.target.value)} />
    </div>
  </div>
);

// 1. Standardized PromoRec
const PromoRec = ({ label, subLabel, name, value, setter }) => (
  <div className="navfit-row" style={{ display: 'flex', borderBottom: '1px solid black' }}>
    <div className="navfit-cell" style={{ flex: 0.2, padding: '4px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{label}</div>
      <div style={{ fontSize: '8px', color: '#444' }}>{subLabel}</div>
    </div>
    
    {/* All scores set to 0.2 to match header */}
    {["NOB", "Significant Problems", "Progressing", "Promotable", "Must Promote", "Early Promote"].map((val) => (
      <div key={val} className="navfit-cell" style={{ flex: 0.2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <input type="radio" name={name} value={val} checked={value === val} onChange={(e) => setter(e.target.value)} />
      </div>
    ))}
  </div>
);


const SumPromo = ({ label, subLabel, value, setter }) => {
  const handleInputChange = (field, val) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    setter({ ...value, [field]: numericValue });
  };

  return (
    <div className="navfit-row" style={{ display: 'flex', borderBottom: 'none' }}>
      <div className="navfit-cell" style={{ flex: 0.2, padding: '4px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{label}</div>
        <div style={{ fontSize: '8px', color: '#444' }}>{subLabel}</div>
      </div>

      {['nob', 'sigProb', 'prog', 'promotable', 'mustPromote', 'earlyPromote'].map((field) => {
        // Check if this is the NOB box
        const isNob = field === 'nob';

        return (
          <div key={field} className="navfit-cell" style={{ 
            flex: 0.2, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            /* If it's NOB, make it black, otherwise white */
            backgroundColor: isNob ? '#000' : '#fff' 
          }}>
            {!isNob && (
              <input 
                type="text" 
                maxLength="3"
                value={value[field] || ''} 
                onChange={(e) => handleInputChange(field, e.target.value)} 
                className="navfit-input"
                style={{ textAlign: 'center', fontWeight: 'bold', width: '100%' }}
                placeholder="0"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Block 1
export const formatName = (nameValue) => {
  if (!nameValue) return false; // Don't show error if empty
  const nameRegex = /^[A-Z-]+,\s[A-Z-]+(\s[A-Z])?$/;
  return !nameRegex.test(nameValue.trim());
};

// Block 2
export const formatGrade = (gradeValue) => {
  if (!gradeValue) return false; // Don't show error if empty
  const validGrades = ['ENS', 'LTJG', 'LT', 'LCDR', 'CDR', 'CAPT', 'RADML', 'RADM', 'VADM', 'ADM'];
  return !validGrades.includes(gradeValue.trim().toUpperCase());
};

// Block 3
// format designator
export const formatDesig = (desigValue) => {
  if (!desigValue) return false;
  // remove all non-digit
  return desigValue.replace(/\D/g, '');
};


// Block 4
// force SSN to be 9 digits with in XXX-XX-XXXX format
export const formatSSN = (ssnValue) => {

  if (!ssnValue) return "";

  // Remove all non-digit characters
  const val = ssnValue.replace(/\D/g, '');
  
  // Limit to 9 digits
  const limited = val.substring(0, 9);
  
  // Inject dashes: XXX-XX-XXXX
  if (limited.length > 5) {
      return `${limited.substring(0, 3)}-${limited.substring(3, 5)}-${limited.substring(5, 9)}`;
  } else if (limited.length > 3) {
      return `${limited.substring(0, 3)}-${limited.substring(3, 5)}`;
  }
  return limited;
};

// format UIC
export const formatUIC = (value) => {

  // remove all non-digit
  return value.replace(/\D/g, '');
};

// format dates
export const formatDateToNavy = (dateString) => {
  if (!dateString) return "";
  
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const date = new Date(dateString);
  
  // Add a day because Date(dateString) can sometimes be off by one due to timezone
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2); // Gets last two digits (e.g. 26)

  return `${year}${month}${day}`;
};

// format senior officer title
export const formatTitle = (value) => {

  // only allow letters
  return value.replace(/[^a-zA-z\s]/g, '');
};

// format achievements block
export const formatAch = (value) => {

  // limit to 276 digits
  const limited = value.substring(0, 276);

  return limited;

};

export default function App() {
  const [reports, setReports] = useState([]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [desig, setDesig] = useState('');
  const [ssn, setSSN] = useState('');
  const [dutyStatus, setDutyStatus] = useState('');
  const [uic, setUIC] = useState('');
  const [station, setStation] = useState('');
  const [promo, setPromo] = useState('');
  const [dateRep, setDateRep] = useState('');
  const [occasion, setOccasion] = useState('');
  const [fromPeriod, setFromPeriod] = useState('');
  const [toPeriod, setToPeriod] = useState('');
  const [notObserved, setNotObserved] = useState('');
  const [reportType, setReportType] = useState('');
  const [physicalRead, setPhysicalRead] = useState('');
  const [billetSub, setBilletSub] = useState('');
  const [reportSenior, setReportSenior] = useState('');
  const [reportGrade, setReportGrade] = useState('');
  const [reportDesig, setReportDesig] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportUIC, setReportUIC] = useState('');
  const [reportSSN, setReportSSN] = useState('');
  const [cmdEmployAch, setCmdEmployAch] = useState('');
  const [duties, setDuties] = useState('');
  const [dateCounseled, setDateCounseled] = useState('');
  const [counselor, setCounselor] = useState('');
  const [proExpert, setProExpert] = useState('');
  const [cmeo, setCmeo] = useState('');
  const [bearing, setBearing] = useState('');
  const [teamwork, setTeamwork] = useState('');
  const [missAccomp, setMissAccomp] = useState('');
  const [leadership, setLeadership] = useState('');
  const [tactPerform, setTactPerform] = useState('');
  const traitDescriptions = {
    '1.0': 'Significant Problems',
    '2.0': 'Progressing',
    '3.0': 'Fully Meets Standards',
    '4.0': 'Exceeds Standards',
    '5.0': 'Greatly Exceeds Standards',
    'NOB': 'Not Observed'
  };
  const [milestoneOne, setMilestoneOne] = useState('');
  const [milestoneTwo, setMilestoneTwo] = useState('');
  const [comments, setComments] = useState('');
  const [promotion, setPromotion] = useState('');
  const [sumPromo, setSumPromo] = useState('');
  const [seniorAddress, setSeniorAddress] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', text: '', isError: false });
  const [selectedReport, setSelectedReport] = useState(null);

  // --- PLACEHOLDERS FOR SAVING & EXPORTING LOGIC ---

  useEffect(() => {
    /* PLACE DATABASE FETCH LOGIC HERE (e.g., fetch reports from SQLite) */
    setMessage("Ready for input...");
  }, []);

// const handleSaveFitrep = () => {
//   /* TEAM MEMBER: PLACE DATABASE SAVE LOGIC HERE */
//   console.log("Saving data:", { name, ssn, cmdEmployAch });
//   setMessage("Simulated Save: Data logged to console.");
// };

  const handlePDFExport = () => {
    /* TATE: PLACE PDF CONVERSION/EXPORT LOGIC HERE */
    setMessage("Simulated PDF: Export triggered.");
  };

  const handleExportDatabase = () => {
    /* TUCKER: PLACE DATABASE EXPORT LOGIC HERE */
    setMessage("Simulated SQLite & ACCDB Export: SQLite & ACCDB files generated.");
  };

  const handleSQLite = () => {
    /* TATE: PLACE SQLITE EXPORT LOGIC HERE */
    setMessage("Simulated SQLite & ACCDB Export: SQLite & ACCDB files generated.");
  };

  const handleACCDB = () => {
    /* TATE: PLACE ACCDB EXPORT LOGIC HERE */
    setMessage("Simulated SQLite & ACCDB Export: SQLite & ACCDB files generated.");
  };

  const fileUpload = () => {
    /* THOMAS: FILE UPLOAD */
    setMessage("Simulated File Upload.");
  }

  const handleSaveFitrep = async () => {
    if (!uic) return triggerNotification("Missing Information", "Block 6: UIC is required", true);
    
    if (!station) return triggerNotification("Missing Information", "Block 7: Ship/Station is required", true);
    
    if (!promo) return triggerNotification("Missing Information", "Block 8: Promotion Status is required", true);
    
    if (!dateRep) return triggerNotification("Missing Information", "Block 9: Date Reported is required", true);

    if (!occasion) return triggerNotification("Missing Information", "Blocks 10-13: Select an Occasion for Report", true);

    if (!fromPeriod) return triggerNotification("Missing Information", "Block 14: Start of Period is required", true);

    if (!toPeriod) return triggerNotification("Missing Information", "Block 15: End of Period is required", true);
    
    if (!reportType) return triggerNotification("Missing Information", "Blocks 17-19: Select a Type of Report", true);

    const physicalReadRegex = /^[P|F|M|W|B|N]/
    if (!physicalRead) return triggerNotification("Missing Information", "Block 20: Physical Readiness is required", true);
    if (!physicalReadRegex.test(physicalRead.trim())) return triggerNotification("Block 20 Formatting Error", "Physical Readiness Code must be B, F, M, N, P, W", true);
    if (physicalRead.equals("B")) return triggerNotification("Block 20 Warning", "B was selected. Explain in block 41", true);

    if (!billetSub) return triggerNotification("Missing Information", "Block 21: Billet Subcategory is required", true);
    
    if (!reportSenior) return triggerNotification("Missing Information", "Block 22: Reporting Senior is required", true);
    const seniorRegex = /^[A-Z-]+,\s[A-Z](\s[A-Z])?$/; 
    if (!seniorRegex.test(reportSenior.trim())) return triggerNotification("Block 22 Formatting Error", "Reporting Senior name must be formatted as LAST, FI MI.", true);
    
    if (!reportGrade) return triggerNotification("Missing Information", "Block 23: Grade is required", true);
    if (!grade_rate.includes(reportGrade.trim())) return triggerNotification("Block 23 Formatting Error", "Invalid Officer Rank", true);

    if (!reportDesig) return triggerNotification("Missing Information", "Block 24: Desig is required", true);
    if (!reportTitle) return triggerNotification("Missing Information", "Block 25: Title is required", true);
    if (!reportUIC) return triggerNotification("Missing Information", "Block 26: UIC is required", true);
    if (!reportSSN) return triggerNotification("Missing Information", "Block 27: SSN is required", true);
    if (!cmdEmployAch) return triggerNotification("Missing Information", "Block 28: Command Employment and Command Achievements is required", true);
  
    const newFitrep = {
      name, 
      grade,
      desig,
      ssn,
      dutyStatus,
      uic,
      station,
      promo,
      dateRep,
      occasion,
      fromPeriod,
      toPeriod,
      notObserved,
      reportType,
      physicalRead,
      billetSub,
      reportSenior,
      reportGrade,
      reportDesig,
      reportTitle,
      reportUIC,
      reportSSN,
      cmdEmployAch,
      duties,
      dateCounseled,
      counselor,
      proExpert,
      cmeo,
      bearing,
      teamwork,
      missAcomp,
      leadership,
      tactPerform,
      milestoneOne,
      milestoneTwo,
      comments,
      promotion,
      sumPromo,
      seniorAddress,
      date: new Date().toLocaleDateString(),
    };

    try {
      const result = await window.api.saveFitrep(newFitrep);
      triggerNotification("Success", "Report saved to database successfully!", false);
      setName('');
      setGrade('');
      setDesig('');
      setSSN('');
      setDutyStatus('');
      setUIC('');
      setStation('');
      setPromo('');
      setDateRep('');
      setOccasion('');
      setFromPeriod('');
      setToPeriod('');
      setNotObserved('');
      setReportType('');
      setPhysicalRead('');
      setBilletSub('');
      setReportSenior('');
      setReportGrade('');
      setReportDesig('');
      setReportTitle('');
      setReportUIC('');
      setReportSSN('');
      setCmdEmployAch('');
      setDuties('');
      setDateCounseled('');
      setCounselor('');
      setProExpert('');
      setCmeo('');
      setBearing('');
      setTeamwork('');
      setMissAcomp('');
      setLeadership('');
      setTactPerform('');
      setMilestoneOne('');
      setMilestoneTwo('');
      setComments('');
      setPromotion('');
      setSumPromo('');
      setSeniorAddress('');
      await fetchReports(); 
    } catch (error) {
      triggerNotification("Database Error", "Could not save to SQLite file.", true);
    }
  };

  const handlePrintFromList = async (report) => {
    setMessage(`Preparing PDF for ${report.name}...`);
    
    // 1. Tell the hidden template to use this report's data
    setSelectedReport(report);
    
    // 2. Wait 100ms for the UI to update the hidden div, then trigger PDF
    setTimeout(async () => {
        await window.api.exportPDF();
        setSelectedReport(null); // Reset back to "Editor Mode"
        setMessage("PDF Generated.");
    }, 100);
  };

  return (
    <div className="navfit-paper">
      {/* HEADER SECTION */}
      <div className="navfit-header">
        <h1>FITNESS REPORT & COUNSELING RECORD (W2-O6)</h1>
      </div>

    <div className="navfit-row" style={{ borderTop: '2px solid black' }}>
      {/* BLOCKS 1-4: THE TOP ROW */}
      {/* BLOCK 1 */}
      <div className="navfit-row">
        <div className="navfit-cell" style={{ flex: 3 }}>
          <label>1. Name (Last, First MI Suffix)</label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value.toUpperCase())} 
          />
            {formatName(name) && <div className="error-text">Format: LAST, FIRST MI</div>}
        </div>

      {/* BLOCK 2 */}
        <div className="navfit-cell" style={{ flex: 1 }}>
          <label>2. Grade/Rate</label>
          <input 
            value={grade} 
            onChange={(e) => setGrade(e.target.value.toUpperCase())}
          />
          {formatGrade(grade) && (
            <div className="error-text shake">
              Invalid Officer Rank (Use: ENS, LT, CDR, etc.)
            </div>
          )}
        </div>

      {/* BLOCK 3 */}
        <div className="navfit-cell" style={{ flex: 1 }}>
          <label>3. Desig</label>
          <input 
            value={desig} 
            maxLength="4" 
            onChange={(e) => setDesig(e.target.value.replace(/\D/g, ''))} 
          />
          {desig.length > FITREP_CONFIG.MAX_DESIG_LENGTH && (
          <div className="error-text">
            Warning: Designator must be {FITREP_CONFIG.MAX_DESIG_LENGTH} digits.
           </div>
        )}
        </div>
      
      {/* BLOCK 4 */}
        <div className="navfit-cell" style={{ flex: 1.5 }}>
          <label>4. SSN</label>
          <input 
            value={ssn} 
            onChange={(e) => setSSN(formatSSN(e.target.value))} 
            placeholder="___-__-____" 
          />
          {ssn.length < 11 && ssn.length > 0 && (
            <div className="error-text">
              Warning: SSN must be 9 digits.
            </div>
          )}
        </div>
      </div>
      </div>
      
      {/* BLOCKS 5-9: THE DUTY STATION ROW */}
      <div className="navfit-row">
        {/*BLOCK 5*/}
        <div className="navfit-cell" style={{ flex: 2 }}>
          <label>5. Duty Status</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                value="ACT" 
                checked={dutyStatus === 'ACT'} 
                onChange={(e) => setDutyStatus(e.target.value)} 
              /> ACT
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                value="FTS" 
                checked={dutyStatus === 'FTS'} 
                onChange={(e) => setDutyStatus(e.target.value)} 
              /> FTS
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                value="INACT" 
                checked={dutyStatus === 'INACT'} 
                onChange={(e) => setDutyStatus(e.target.value)} 
              /> INACT
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                value="AT/ADSW/" 
                checked={dutyStatus === 'AT/ADSW/'} 
                onChange={(e) => setDutyStatus(e.target.value)} 
              /> AT/ADSW/
            </label>
          </div>
        </div>

        {/*BLOCK 6*/}
        <div className="navfit-cell" style={{ flex: 1 }}>
          <label>6. UIC</label>
          <input 
            value={uic} 
            maxLength="5" 
            onChange={(e) => setUIC(e.target.value.replace(/\D/g, ''))} 
          />
        </div>

        {/*BLOCK 7*/}
        <div className="navfit-cell" style={{ flex: 1.5 }}>
          <label>7. Ship/Station</label>
          <input 
            value={station} 
            onChange={(e) => setStation(e.target.value.toUpperCase())} 
          />
        </div>

        {/*BLOCK 8*/}
        <div className="navfit-cell" style={{ flex: .5 }}>
          <label>8. Promotion Status</label>
          <select 
            value={promo} 
            onChange={(e) => setPromo(e.target.value)}
            className="dropdown-input"
          >
            <option value="">  </option>
            <option value="REGULAR">REGULAR</option>
            <option value="FROCKED">FROCKED</option>
            <option value="SELECTED">SELECTED</option>
            <option value="SPOT">SPOT</option>
          </select>
        </div>

        {/*BLOCK 9*/}
        <div className="navfit-cell" style={{ flex: .5 }}>
          <label>9. Date Reported</label>
          <input 
            type={dateRep ? "text" : "date"}
            value ={dateRep}
            onChange={(e) => setDateRep(formatDateToNavy(e.target.value))} 
            onFocus={(e) => {
              e.target.type = "date";
              setDateRep("");
            }}
            placeholder="Select Date"
            className="calendar-input"
          />
        </div>
      </div>

      {/* BLOCKS 10-15 */}
      <div className="navfit-row">
        
        {/* BLOCKS 10-13 */}
        <div className="navfit-cell" style={{ flex: 3 }}>
          <label>Occasion for Report</label>
          <div className="radio-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            <label className="radio-label" style={{ fontSize: '9px' }}>
              <input type="radio" value="Periodic" checked={occasion === 'Periodic'} onChange={(e) => setOccasion(e.target.value)} /> 10. Periodic
            </label>
            <label className="radio-label" style={{ fontSize: '9px' }}>
              <input type="radio" value="Detachment of Individual" checked={occasion === 'Detachment of Individual'} onChange={(e) => setOccasion(e.target.value)} /> 11. Detachment of Individual
            </label>
            <label className="radio-label" style={{ fontSize: '9px' }}>
              <input type="radio" value="Detachment of Reporting Senior" checked={occasion === 'Detachment of Reporting Senior'} onChange={(e) => setOccasion(e.target.value)} /> 12. Detachment of Reporting Senior
            </label>
            <label className="radio-label" style={{ fontSize: '9px' }}>
              <input type="radio" value="Special" checked={occasion === 'Special'} onChange={(e) => setOccasion(e.target.value)} /> 13. Special
            </label>
          </div>
        </div>

        {/* BLOCKS 14 & 15 */}
        <div className="navfit-cell" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <label>Period of Report</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '9px' }}>14. FROM:</label>
              <input 
                type={toPeriod ? "text" : "date"}
                value={toPeriod}
                onChange={(e) => setToPeriod(formatDateToNavy(e.target.value))} 
                onFocus={(e) => { e.target.type = "date"; setToPeriod(""); }}
                className="navfit-input"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '9px' }}>15. TO:</label>
              <input 
                type={fromPeriod ? "text" : "date"}
                value={fromPeriod}
                onChange={(e) => setFromPeriod(formatDateToNavy(e.target.value))} 
                onFocus={(e) => { e.target.type = "date"; setFromPeriod(""); }}
                className="navfit-input"
              />
            </div>
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
                checked={notObserved === 'Not Observed Report'} 
                onChange={(e) => setNotObserved(e.target.value)} 
              /> Not Observed Report
            </label>
          </div>
        </div>

        {/*BLOCKS 17-19*/}
        <div className="navfit-cell" style={{ flex: 2.25, display: 'flex', flexDirection: 'column' }}>
          <label>Type of Report</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                value="Regular" 
                checked={reportType === 'Regular'} 
                onChange={(e) => setReportType(e.target.value)} 
              /> 17. Regular
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                value="Concurrent" 
                checked={reportType === 'Concurrent'} 
                onChange={(e) => setReportType(e.target.value)} 
              /> 18. Concurrent
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                value="Ops Cdr" 
                checked={reportType === 'Ops Cdr'} 
                onChange={(e) => setReportType(e.target.value)} 
              /> 19. Ops Cdr
            </label>
          </div>
        </div>

        {/*BLOCK 20*/}
        <div className="navfit-cell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label>20. Physical Readiness</label>
          <input 
            type="text" 
            value={physicalRead} 
            onChange={(e) => setPhysicalRead(e.target.value.toUpperCase())} 
            placeholder=""
          />
        </div>


        {/*BLOCK 21*/}
        <div className="navfit-cell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label>21. Billet Subcategory (if any)</label>
          <select 
            value={billetSub} 
            onChange={(e) => setBilletSub(e.target.value)}
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
            
      {/* BLOCK 22 */}
      <div className="navfit-cell" style={{ flex: 2, minWidth: 0 }}>
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)', letterSpacing: '-0.5px' }}>22. SENIOR (L, F MI)</label>
        <input 
          type="text" 
          value={reportSenior} onChange={(e) => setReportSenior(e.target.value.toUpperCase())} 
          className="navfit-input" 
        />
      </div>

      {/* BLOCK 23 */}
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0 }}>
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>23. GRADE</label>
        <input 
          type="text" 
          value={reportGrade} 
          onChange={(e) => setReportGrade(e.target.value.toUpperCase())} 
          className="navfit-input" 
        />
      </div>

      {/* BLOCK 24 */}
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0 }}>
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>24. DES</label>
        <input 
          type="text" 
          value={reportDesig} 
          onChange={(e) => setReportDesig(formatDesig(e.target.value))} 
          className="navfit-input" 
        />
      </div>

      {/* BLOCK 25 */}
      <div className="navfit-cell" style={{ flex: 1.5, minWidth: 0 }}>
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>25. TITLE</label>
        <input 
          type="text" 
          value={reportTitle} 
          onChange={(e) => setReportTitle(formatTitle(e.target.value.toUpperCase()))} 
          className="navfit-input" 
        />
      </div>

      {/* BLOCK 26 */}
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0 }}>
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>26. UIC</label>
        <input type="text" value={reportUIC} onChange={(e) => setReportUIC(formatUIC(e.target.value))} className="navfit-input" />
      </div>

      {/* BLOCK 27 */}
      <div className="navfit-cell" style={{ flex: 1, borderRight: 'none', minWidth: 0 }}>
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>27. SSN</label>
        <input type="text" value={reportSSN} onChange={(e) => setReportSSN(formatSSN(e.target.value))} placeholder="000-00-0000" className="navfit-input" />
      </div>
    </div>

    {/* BLOCK 28 */}
    <div className="navfit-row" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%', 
      borderTop: '2px solid black', 
      padding: '5px'
    }}>
      <label style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
        28. COMMAND EMPLOYMENT AND COMMAND ACHIEVEMENTS
      </label>
      
      <textarea 
        value={cmdEmployAch} 
        onChange={(e) => setCmdEmployAch(e.target.value)} 
        className="navfit-textarea" 
        style={{ 
          width: '100%', 
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: cmdEmployAch.length > FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH ? '#fff0f0' : 'transparent',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '14px',
          lineHeight: '1.2'
        }}
        rows="4"
      />
      
      <div style={{ 
        textAlign: 'right', 
        fontSize: '9px', 
        color: cmdEmployAch.length > FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH ? 'red' : '#666',
        borderTop: '1px dashed #ccc',
        marginTop: '2px'
      }}>
        {cmdEmployAch.length} / {FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH}
      </div>
    </div>

      {/* BLOCK 29 */}
      <div className="navfit-row" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%', 
        borderTop: '2px solid black', 
        padding: '5px',
        position: 'relative'
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}></div>
        <label style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', maxWidth: '80%'}}>
          29. Primary/Collateral/Watchstanding Duties (Enter Primary Duty Abbreviation in Box)
        </label>

      {/* Mini Box */}
      <div style={{
        border: '2px solid black',
        width: '80px',
        height: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginTop: '-2px' // Aligns better with the top line
      }}>
        <span style={{ fontSize: '7px', fontWeight: 'bold' }}></span>
        <input 
          type="text"
          maxLength="8"
          style={{ 
            width: '100%', 
            border: 'none', 
            textAlign: 'center', 
            fontSize: '12px', 
            fontFamily: '"Courier New", monospace',
            outline: 'none',
            textTransform: 'uppercase'
          }}
        />
      </div>

        <textarea 
          value={duties} 
          onChange={(e) => setDuties(e.target.value)} 
          className="navfit-textarea" 
          style={{ 
            width: '100%', 
            border: 'none',
            outline: 'none',
            resize: 'none',
            backgroundColor: duties.length > FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH ? '#fff0f0' : 'transparent',
            fontFamily: 'Courier New", Courier, monospace',
            fontSize: '14px',
            lineHeight: '1.2',
          }}
          rows="4"
        />
        <div style={{ 
          textAlign: 'right', 
          fontSize: '9px', 
          color: duties.length > FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH ? 'red' : '#666',
          borderTop: '1px dashed #ccc',
          marginTop: '2px'
        }}>
          {duties.length} / {FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH}
        </div>
      </div>

    {/* BLOCKS 30-32 */}
    <div className="navfit-row" style={{ 
      display: 'flex', 
      width: '100%', 
      alignItems: 'stretch',
      flexWrap: 'nowrap' 
      }}>

      <div className="navfit-cell" style={{ flex: 1, minWidth: 0 }}>
        <label>For Mid-term Counseling Use (When completing FITREP,</label> 
        <label>enter 30 and 31 from counseling worksheet, sign 32.)</label> 
      </div>

      {/* BLOCK 30 */}
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0 }}>
        <label style={{ fontSize: 'clamp(7px, 1vw, 10px)', letterSpacing: '-0.5px' }}>30. Date Counseled</label>
        <select 
          value={dateCounseled} 
          onChange={(e) => setDateCounseled(e.target.value)}
          className="dropdown-input"
        >
          <option value="">  </option>
          <option value="NOT REQ">NOT REQ</option>
          <option value="NOT PERF">NOT PERF</option>
        </select>
      </div>
    
      {/* BLOCK 31 */}
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0 }}>
          <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>31. Counselor</label>
          <input 
            type="text" 
            value={counselor} 
            onChange={(e) => setCounselor(e.target.value.toUpperCase())} 
            style={{ borderColor: formatName(name) ? '#bf616a' : '#ccc', borderWidth: '2px' }}
          />
        </div>

      {/* BLOCK 32 */}
      <div className="navfit-cell" style={{ flex: 0.5, minWidth: 0 }}>
          <label style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>32. Signature of Individual Counseled</label>
          <input 
            style={{ borderColor: formatName(name) ? '#bf616a' : '#ccc', borderWidth: '2px' }}
          />
        </div>
      </div>

     {/* PERFORMANCE SECTION HEADER (TITLE) */}
    <div className="navfit-cell">
      <label style={{ fontSize: '9px', display: 'block' }}>
        PERFORMANCE TRAITS: 1.0 - Below standards progressing or UNSAT in any one standard; 2.0 - Does not yet meet all 3.0 standards; 3.0 - Meets all 3.0 standards; 4.0 - Exceeds most 3.0 standards; 5.0 - Meets overall criteria and most of the specific standards for 5.0. Standards are not all inclusive.
      </label> 
    </div>

    {/* PERFORMANCE SECTION HEADER ROW */}
    <div className="navfit-row" style={{ 
      display: 'flex', 
      width: '100%', 
      alignItems: 'stretch',
      flexWrap: 'nowrap',
      borderBottom: '1px solid black',
      borderTop: '2px solid black'
    }}>
        
      {/* Center all cells */}
      {[
        { flex: 1, labels: ['PERFORMANCE', 'TRAITS'] },
        { flex: 1, labels: ['1.0*', 'Below Standards'] },
        { flex: 0.5, labels: ['2.0', 'Pro-', 'gressing'] },
        { flex: 1, labels: ['3.0', 'Meets Standards'] },
        { flex: 0.5, labels: ['4.0', 'Above', 'Standards'] },
        { flex: 1, labels: ['5.0', 'Greatly Exceeds Standards'] }
      ].map((box, idx) => (
        <div key={idx} className="navfit-cell" style={{ 
          flex: box.flex, 
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // Vertical centering
          alignItems: 'center',     // Horizontal centering
          textAlign: 'center',      // Text alignment centering
          padding: '4px 2px'
        }}>
          {box.labels.map((txt, i) => (
            <label key={i} style={{ fontSize: '8px', fontWeight: 'bold', lineHeight: '1.1' }}>
              {txt}
            </label>
          ))}
        </div>
      ))}
    </div>

      <PerformanceRow 
        label="33. PROFESSIONAL EXPERTISE:" 
        subLabel="Professional knowledge, proficiency, and qualifications."
        name="proExpert" value={proExpert} setter={setProExpert} 
      />
      <PerformanceRow 
        label="34. COMMAND OR ORGANIZATIONAL CLIMATE / EQUAL OPPORTUNITY:" 
        subLabel="Contributing to growth and development, human worth, community."
        name="cmeo" value={cmeo} setter={setCmeo} 
      />
      <PerformanceRow 
        label="35. MILITARY BEARING/CHARACTER:" 
        subLabel="Appearance, conduct, physical fitness, adherance to Navy Core Values."
        name="bearing" value={bearing} setter={setBearing} 
      />
      <PerformanceRow 
        label="36. TEAMWORK:" 
        subLabel="Contributions toward team building and team results."
        name="teamwork" value={teamwork} setter={setTeamwork} 
      />
      <PerformanceRow 
        label="37. MISSION ACCOMPLISHMENT AND INITIATIVE:" 
        subLabel="Taking initiative, planning/prioritizing, achieving mission."
        name="missAccomp" value={missAccomp} setter={setMissAccomp} 
      />
      <PerformanceRow 
        label="38. LEADERSHIP:" 
        subLabel="Organizing, motivating and developing others to accomplish goals."
        name="leadership" value={leadership} setter={setLeadership} 
      />
      <PerformanceRow 
        label="39. TACTICAL PERFORMANCE:" 
        subLabel="(Warfare qualified officers only) Basic and tactical employment of weapons systems."
        name="tactPerform" value={tactPerform} setter={setTactPerform} 
      />

    {/* BLOCK 40: CAREER MILESTONES */}
    <div className="navfit-row" style={{ display: 'flex', borderTop: '2px solid black' }}>
      
      <div className="navfit-cell" style={{ flex: 2.5, fontSize: '8px', lineHeight: '1.1', borderRight: 'none' }}>
        <label style={{ fontWeight: 'bold' }}>40. I recommend screening this individual for next career milestone(s) as follows: (maximum of two)</label>
        <label>Recommendations may be for competitive schools or duty assignments such as: </label>
        <label>SCP, Dept Head, XO, OIC, CO, Major Command, War College, PG School.</label>
      </div> 

      {/* MILESTONE 1 */}
      <div className="navfit-cell" style={{ flex: 1, minWidth: 0}}>
        <input 
          type="text" 
          value={milestoneOne} onChange={(e) => setMilestoneOne(e.target.value.toUpperCase())} 
          className="navfit-input" 
        />
      </div>

      {/* MILESTONE 2 */}
      <div className="navfit-cell" style={{ flex: 1, minWidth: 0 }}>
        <input 
          type="text" 
          value={milestoneTwo} onChange={(e) => setMilestoneTwo(e.target.value.toUpperCase())} 
          className="navfit-input" 
        />
      </div>
    </div>

    {/* BLOCK 41: COMMENTS */}
    <div className="navfit-row" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%', 
      borderTop: '2px solid black', 
      padding: '5px'
      }}>
        {/* Applied font-family and smaller font-size to match NAVFIT headers */}
        <label style={{ 
          fontWeight: 'bold', 
          fontSize: '8px', 
          fontFamily: 'sans-serif', 
          textTransform: 'uppercase' 
        }}>
          41. COMMENTS ON PERFORMANCE: * All 1.0 marks, three 2.0 marks, and 2.0 marks in Block 34 must be specifically substantiated in comments.
        </label>
        <label style={{ 
          fontSize: '7px', 
          fontFamily: 'sans-serif', 
          marginBottom: '5px' 
        }}>
          Font must be 10 or 12 Pitch (10 or 12 Point) only. Use upper and lower case.
        </label>

      <textarea 
        value={comments} 
        onChange={(e) => setComments(e.target.value)} 
        className="navfit-textarea" 
        style={{ 
          width: '100%', 
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'transparent',
          /* Using a fallback for the typewriter font */
          fontFamily: '"Courier New", Courier, monospace',
          /* 12pt is roughly 16px, but 14px usually looks better on screen */
          fontSize: '14px', 
          lineHeight: '1.2'
        }}
        rows="10" 
      />
      
      <div style={{ 
        textAlign: 'right', 
        fontSize: '9px', 
        color: comments.length > FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH ? 'red' : '#666',
        borderTop: '1px dashed #ccc',
        marginTop: '2px'
      }}>
        {comments.length} / {FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH}
      </div>
    </div>

    {/* BLOCKS 42-44 */}
    {/* PROMOTION RECOMMENDATION SECTION HEADER ROW */}
    <div style={{ display: 'flex', width: '100%', borderTop: '2px solid black', borderBottom: '2px solid black' }}>
      
      {/* Header, Blocks 42 and 43 */}
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: '1px solid black' }}>
        
        {/* ROW 1: HEADERS */}
        <div className="navfit-row" style={{ display: 'flex', borderBottom: '1px solid black' }}>
          {[
            { flex: 0.2, labels: ['PROMOTION', 'RECOMMENDATION'] },
            { flex: 0.2, labels: ['NOB'] },
            { flex: 0.2, labels: ['SIGNIFICANT', 'PROBLEMS'] },
            { flex: 0.2, labels: ['PROGRESSING'] },
            { flex: 0.2, labels: ['PROMOTABLE'] },
            { flex: 0.2, labels: ['MUST', 'PROMOTE'] },
            { flex: 0.2, labels: ['EARLY', 'PROMOTE'] }
          ].map((box, idx) => (
            <div key={idx} className="navfit-cell" style={{ 
              flex: box.flex, 
              textAlign: 'center', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRight: idx === 6 ? 'none' : '1px solid black' 
            }}>
              {box.labels.map((txt, i) => (
                <label key={i} style={{ fontSize: '7px', fontWeight: 'bold' }}>{txt}</label>
              ))}
            </div>
          ))}
        </div>

        {/* ROW 2: BLOCK 42 */}
        <PromoRec 
          label="42." 
          subLabel="INDIVIDUAL"
          name="promotion" value={promotion} setter={setPromotion} 
        />

        {/* ROW 3: BLOCK 43 */}
        <SumPromo
          label="43."
          subLabel="SUMMARY"
          name="sumPromo" value={sumPromo} setter={setSumPromo}
        />
      </div>

      {/* BLOCK 44 (Fills the entire vertical height) */}
      <div className="navfit-cell" style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: '8px', fontWeight: 'bold' }}>44. REPORTING SENIOR ADDRESS</label>
        <textarea 
          value={seniorAddress} 
          onChange={(e) => setSeniorAddress(e.target.value.toUpperCase())}
          className="navfit-textarea"
          style={{ 
            flex: 1,
            width: '100%',
            fontSize: '11px', 
            resize: 'none',
            marginTop: '5px',
            border: 'none',           
            outline: 'none',          
            background: 'transparent'
          }}
        />
      </div>
    </div>

    {/* BLOCKS 45-46, TRAIT AVERAGE & GROUP AVERAGE */}
{/* SIGNATURE SECTION (Blocks 45, 46, 47) */}
<div className="navfit-row" style={{ display: 'flex', width: '100%', borderTop: '1px solid black' }}>
  
  {/* BLOCK 45: SIGNATURE OF RATED MEMBER */}
  <div className="navfit-cell" style={{ flex: 1, height: '60px' }}>
    <label>45. SIGNATURE OF MEMBER RATED</label>
    <div style={{ flex: 1 }}></div> {/* Spacer for the signature area */}
    <span className="date-label">Date:</span>
  </div>

  {/* BLOCK 46: SIGNATURE OF REPORTING SENIOR */}
  <div className="navfit-cell" style={{ flex: 1, borderLeft: '1px solid black' }}>
    <label>46. SIGNATURE OF REPORTING SENIOR</label>
    <div style={{ flex: 1 }}></div>
    <span className="date-label">Date:</span>
  </div>

  {/* BLOCK 47: SIGNATURE OF REVIEWER (Optional) */}
  <div className="navfit-cell" style={{ flex: 1, borderLeft: '1px solid black' }}>
    <label>47. SIGNATURE OF REVIEWER</label>
    <div style={{ flex: 1 }}></div>
    <span className="date-label">Date:</span>
  </div>
</div>

      {/* ACTION BUTTONS */}
      <div className="navfit-actions">
        <button className="save-btn" onClick={handleSaveFitrep}>Save to Database</button>
        <button className="pdf-btn">Generate PDF</button>
        <button className="accdb-btn">Generate ACCDB</button>
        <button className="sqlite-btn">Generate SQLite</button>
        <button className="fileupload-btn">Upload File</button>
      </div>

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: modalContent.isError ? '#bf616a' : '#a3be8c' }}>{modalContent.title}</h3>
            <p>{modalContent.text}</p>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}