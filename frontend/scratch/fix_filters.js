const fs = require('fs');

const page = fs.readFileSync('src/app/search/regular/page.tsx', 'utf8');

const targetMappingStr = `          caste: row.caste,
          subcaste: row.subcaste,
          maritalStatus: row.marital_status || "",
          height: row.height || "",
          diet: row.diet,
          dhosham: row.dhosham,
          income: row.income,`;

const replacementMappingStr = `          caste: row.caste || "",
          subcaste: row.subcaste || "",
          maritalStatus: row.marital_status || "",
          motherTongue: row.mother_tongue || "",
          physicalStatus: row.physical_status || "",
          height: row.height || "",
          diet: row.diet || "",
          dhosham: row.dhosham || "",
          star: row.star || "",
          raasi: row.raasi || "",
          income: row.income || "",`;

let newPage = page.replace(targetMappingStr, replacementMappingStr);

const targetFilterStr = `    if (filters.mother_tongues && filters.mother_tongues.length > 0) {
      if (!p.motherTongue || !filters.mother_tongues.includes(p.motherTongue)) return false;
    }`;

// Notice: In our UI we bound Mother Tongue to a single select: `mother_tongue` string instead of `mother_tongues` array.
// Let's support both `mother_tongues` array (from initial state) and `mother_tongue` string (from the new UI select).
const replacementFilterStr = `    if (filters.mother_tongue && filters.mother_tongue !== "") {
      if (!p.motherTongue || p.motherTongue !== filters.mother_tongue) return false;
    } else if (filters.mother_tongues && filters.mother_tongues.length > 0) {
      if (!p.motherTongue || !filters.mother_tongues.includes(p.motherTongue)) return false;
    }
    
    // Additional exact matches
    if (filters.income && p.income && p.income !== filters.income) return false;
    if (filters.star && p.star && p.star !== filters.star) return false;
    if (filters.raasi && p.raasi && p.raasi !== filters.raasi) return false;`;

newPage = newPage.replace(targetFilterStr, replacementFilterStr);

fs.writeFileSync('src/app/search/regular/page.tsx', newPage);
console.log('Successfully applied mapping and filtering fixes');
