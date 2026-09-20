const fs = require('fs');

let page = fs.readFileSync('src/app/search/regular/page.tsx', 'utf8');

// Normalize line endings
page = page.replace(/\r\n/g, '\n');

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

if (!page.includes(targetMappingStr)) {
  console.error("Mapping string not found!");
  process.exit(1);
}
page = page.replace(targetMappingStr, replacementMappingStr);

const targetFilterStr = `    if (filters.mother_tongues && filters.mother_tongues.length > 0) {
      if (!p.motherTongue || !filters.mother_tongues.includes(p.motherTongue)) return false;
    }`;

const replacementFilterStr = `    if (filters.mother_tongue && filters.mother_tongue !== "") {
      if (!p.motherTongue || p.motherTongue !== filters.mother_tongue) return false;
    } else if (filters.mother_tongues && filters.mother_tongues.length > 0) {
      if (!p.motherTongue || !filters.mother_tongues.includes(p.motherTongue)) return false;
    }
    
    // Additional exact matches
    if (filters.income && p.income && p.income !== filters.income) return false;
    if (filters.star && p.star && p.star !== filters.star) return false;
    if (filters.raasi && p.raasi && p.raasi !== filters.raasi) return false;`;

if (!page.includes(targetFilterStr)) {
  console.error("Filter string not found!");
  process.exit(1);
}
page = page.replace(targetFilterStr, replacementFilterStr);

fs.writeFileSync('src/app/search/regular/page.tsx', page);
console.log('Successfully applied mapping and filtering fixes');
