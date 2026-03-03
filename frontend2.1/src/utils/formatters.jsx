/** formatting of each block */

const validators = {
// Block 1
name: (val) => {
  if (!val) return { isError: false, note: "" };
  const nameRegex = /^[A-Z]+,\s[A-Z]+(\s[A-Z])?$/;
  const isValid = nameRegex.test(val.trim());
  return { 
    isError: !isValid, 
    note: isValid ? "" : "Required Format: LAST, FIRST MI (Uppercase)" 
  };
},
  
  // Block 2
  grade: (val) => {
    if (!val) return { isError: false, note: "" };
    const validGrades = ['ENS', 'LTJG', 'LT', 'LCDR', 'CDR', 'CAPT', 'CHW02', 'CHW03', 'CHW04'];
    const isValid = validGrades.includes(val.trim().toUpperCase());
    return { 
      isError: !isValid, 
      note: "Use standard Navy rank (e.g., LT, CDR)" 
    };
  },
  
  // Block 3
  desig: (val) => {
    if (!val) return { isError: false, note: "" };
    // Check if it's exactly 4 digits
    const isValid = /^\d{4}$/.test(val);
    return { 
      isError: !isValid, 
      note: isValid ? "" : "Designator must be 4 digits" 
    };
  },
  
  // Block 4
  ssn: (val) => {
    if (!val) return { isError: false, note: "" };
    // Check if it matches the full 000-00-0000 pattern
    const isValid = /^\d{3}-\d{2}-\d{4}$/.test(val);
    return { 
      isError: !isValid, 
      note: isValid ? "" : "SSN must be 9 digits" 
    };
  },
  
  // Block 6
  uic: (val) => {
    if (!val) return { isError: false, note: "" };
    // Adjust the {5,6} based on whether your command uses 5 or 6 digit UICs
    const isValid = /^\d{5,6}$/.test(val); 
    return { 
      isError: !isValid, 
      note: isValid ? "" : `UIC must be ${FITREP_CONFIG.MAX_UIC_LENGTH} digits` 
    };
  },

  // Block 7
  station: (val) => {
    if (!val || val.trim().length === 0) {
      return { isError: false, note: "" }; // Optional: change isError to true if mandatory
    }
    // Navy forms often have character limits for command names
    const isTooLong = val.length > 30; 
    return {
      isError: isTooLong,
      note: isTooLong ? "Command name too long for box" : ""
    };
  },

  // Block 9
  dateRep: (val) => {
    if (!val) return { isError: false, note: "" };
    // Check if the formatted string matches YYMMM DD (e.g., 24JAN 15)
    const navyDateRegex = /^\d{2}[A-Z]{3}\s\d{2}$/;
    const isValid = navyDateRegex.test(val);
    
    return {
      isError: !isValid,
      note: isValid ? "" : "Format: YYMMM DD"
    };
  },

  // Blocks 10-15
  fromPeriod: (val) => {
    if (!val) return { isError: false, note: "" };
    const isValid = /^\d{2}[A-Z]{3}\s\d{2}$/.test(val);
    return { isError: !isValid, note: isValid ? "" : "Invalid Format" };
  },
  toPeriod: (val, allData) => {
    if (!val) return { isError: false, note: "" };
    const isValid = /^\d{2}[A-Z]{3}\s\d{2}$/.test(val);
    
    // Logic: You can compare strings here if you convert them back to dates
    // For now, we'll just check format
    return { isError: !isValid, note: isValid ? "" : "Invalid Format" };
  },

  // Block 20
  physicalRead: (val) => {
    if (!val) return { isError: false, note: "" };
    
    // Standard Navy codes often use combinations of P, F, M, W, N
    // Example: 'PPPP' or 'PFNP'
    const navyCodeRegex = /^[PFMWN]{1,4}$/;
    const isValid = navyCodeRegex.test(val);
    
    return {
      isError: !isValid,
      note: isValid ? "" : "Use Navy codes (P, F, M, W, N)"
    };
  },

  // Block 22
  reportSenior: (val) => {
    if (!val) return { isError: false, note: "" };
    // Requires: LAST(optional hyphen), SPACE FIRST(optional hyphen) SPACE MI
    const nameRegex = /^[A-Z-]+,\s[A-Z-]+(\s[A-Z])?$/;
    const isValid = nameRegex.test(val);
    return { 
      isError: !isValid, 
      note: isValid ? "" : "Format: LAST, FIRST MI" 
    };
  },

  // Block 23
  reportGrade: (val) => {
    if (!val) return { isError: false, note: "" };
    // Reporting Seniors are usually LT and above
    const seniorGrades = ['LT', 'LCDR', 'CDR', 'CAPT', 'RDML', 'RADM', 'VADM', 'ADM', 'GS13', 'GS14', 'GS15'];
    const isValid = seniorGrades.includes(val.trim().toUpperCase());
    
    return {
      isError: !isValid,
      note: isValid ? "" : "Use senior rank (e.g., CDR, CAPT)"
    };
  },

  // Block 24
  reportDesig: (val) => {
    if (!val) return { isError: false, note: "" };
    // Most Navy designators are 4 digits; 0000 is common for civilian seniors
    const isValid = /^\d{4}$/.test(val);
    return { 
      isError: !isValid, 
      note: isValid ? "" : "Must be 4 digits" 
    };
  },

  // Block 25
  reportTitle: (val) => {
    if (!val) return { isError: false, note: "" };
    // Most NAVFIT boxes for title only fit about 15-20 characters
    const isTooLong = val.length > 18;
    return { 
      isError: isTooLong, 
      note: isTooLong ? "Title too long; use abbreviations" : "" 
    };
  },

  // Block 26
  reportUIC: (val) => {
    if (!val) return { isError: false, note: "" };
    // UICs are generally 5 or 6 digits
    const isValid = /^\d{5,6}$/.test(val);
    return { 
      isError: !isValid, 
      note: isValid ? "" : "UIC must be 5-6 digits" 
    };
  },

  // Block 27
  reportSSN: (val) => {
    if (!val) return { isError: false, note: "" };
    // Check for the full 9-digit pattern with dashes
    const isValid = /^\d{3}-\d{2}-\d{4}$/.test(val);
    return { 
      isError: !isValid, 
      note: isValid ? "" : "Senior SSN must be 9 digits" 
    };
  },

  // Block 28
  cmdEmployAch: (val) => {
    const maxLength = 250; // Or whatever FITREP_CONFIG.MAX_ACHIEVEMENT_LENGTH is set to
    if (!val) return { isError: false, note: "" };
    
    const isOver = val.length > maxLength;
    return { 
      isError: isOver, 
      note: isOver ? "TEXT TOO LONG FOR BOX" : "" 
    };
  },

  // Block 29
  primaryDuty: (val) => {
    if (!val) return { isError: false, note: "" };
    // Abbreviation box is tiny—usually max 8 characters
    const isTooLong = val.length > 8;
    return { 
      isError: isTooLong, 
      note: isTooLong ? "Abbreviation too long" : "" 
    };
  },
  duties: (val) => {
    const maxLength = 300; // Adjust to your config
    if (!val) return { isError: false, note: "" };
    const isOver = val.length > maxLength;
    return { 
      isError: isOver, 
      note: isOver ? "DUTIES TEXT TOO LONG" : "" 
    };
  },
  
  // Block 31
  counselor: (val) => {
    if (!val) return { isError: false, note: "" };
    // Check for the standard: LAST, FIRST MI
    const nameRegex = /^[A-Z-]+,\s[A-Z-]+(\s[A-Z])?$/;
    const isValid = nameRegex.test(val);
    return { 
      isError: !isValid, 
      note: isValid ? "" : "Format: LAST, FIRST MI" 
    };
  },

  // Block 40
  milestoneOne: (val) => {
    if (!val) return { isError: false, note: "" };
    const isTooLong = val.length > 18;
    return { isError: isTooLong, note: isTooLong ? "Too long" : "" };
  },
  milestoneTwo: (val) => {
    if (!val) return { isError: false, note: "" };
    const isTooLong = val.length > 18;
    return { isError: isTooLong, note: isTooLong ? "Too long" : "" };
  },

  // Block 41
  comments: (val) => {
    if (!val) return { isError: false, note: "" };
    const maxLength = 1800; // Typical max for Block 41
    const isOver = val.length > maxLength;
    
    return { 
      isError: isOver, 
      note: isOver ? "COMMENTS TOO LONG FOR PDF" : "" 
    };
  },
  // // format dates
  // export const formatDateToNavy = (dateString) => {
  //   if (!dateString) return "";
    
  //   const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  //   const date = new Date(dateString);
    
  //   // Add a day because Date(dateString) can sometimes be off by one due to timezone
  //   date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  
  //   const day = String(date.getDate()).padStart(2, '0');
  //   const month = months[date.getMonth()];
  //   const year = String(date.getFullYear()).slice(-2); // Gets last two digits (e.g. 26)
  
  //   return `${year}${month}${day}`;
  // };
  
  // // format senior officer title
  // export const formatTitle = (value) => {
  
  //   // only allow letters
  //   return value.replace(/[^a-zA-z\s]/g, '');
  // };
  
  // // format achievements block
  // export const formatAch = (value) => {
  
  //   // limit to 276 digits
  //   const limited = value.substring(0, 276);
  
  //   return limited;
  
  // };
}

export default validators;