const fs = require('fs');

const page = fs.readFileSync('src/app/search/regular/page.tsx', 'utf8');

const filterSectionStartStr = '<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>';
const filterSectionEndStr = '{/* Apply / Clear buttons */}';

const startIndex = page.indexOf(filterSectionStartStr);
const endIndex = page.indexOf(filterSectionEndStr);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find filter section bounds");
  process.exit(1);
}

const newFilters = `
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Basic Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "1rem 0 0.5rem", color: "#444" }}>Basic Details</h4>
                  
                  {/* Age range */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Age</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.age_min} onChange={(e) => setStagedFilters({ ...stagedFilters, age_min: e.target.value })}>
                        {Array.from({ length: 35 }, (_, i) => 18 + i).map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <span style={{ color: "#888", fontSize: "0.8125rem", flexShrink: 0 }}>to</span>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.age_max} onChange={(e) => setStagedFilters({ ...stagedFilters, age_max: e.target.value })}>
                        {Array.from({ length: 35 }, (_, i) => 18 + i).map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {/* Height */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Height (cm)</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.height_min} onChange={(e) => setStagedFilters({ ...stagedFilters, height_min: e.target.value })}>
                        {Array.from({ length: 93 }, (_, i) => 121 + i).map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span style={{ color: "#888", fontSize: "0.8125rem", flexShrink: 0 }}>to</span>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.height_max} onChange={(e) => setStagedFilters({ ...stagedFilters, height_max: e.target.value })}>
                        {Array.from({ length: 93 }, (_, i) => 121 + i).map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Marital Status</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.marital_status} onChange={(e) => setStagedFilters({ ...stagedFilters, marital_status: e.target.value })}>
                      <option value="">Any</option>
                      {MARITAL_STATUS.map((m: any) => <option key={m.value || m} value={m.value || m}>{m.label || m}</option>)}
                    </select>
                  </div>

                  {/* Mother Tongue */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Mother Tongue</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.mother_tongue} onChange={(e) => setStagedFilters({ ...stagedFilters, mother_tongue: e.target.value })}>
                      <option value="">Any</option>
                      {MOTHER_TONGUES.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  
                  {/* Physical Status */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Physical Status</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.physical_status} onChange={(e) => setStagedFilters({ ...stagedFilters, physical_status: e.target.value })}>
                      <option value="">Any</option>
                      {PHYSICAL_STATUS.map((p: any) => <option key={p.value || p} value={p.value || p}>{p.label || p}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Religious Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Religious Details</h4>
                  
                  {/* Religion */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Religion</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.religion} onChange={(e) => { setStagedFilters({ ...stagedFilters, religion: e.target.value, caste: "", sub_caste: "" }); }}>
                      <option value="">Any Religion</option>
                      {RELIGIONS.map((r: string) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Caste */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Caste</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.caste} onChange={(e) => setStagedFilters({ ...stagedFilters, caste: e.target.value, sub_caste: "" })}>
                      <option value="">Any Caste</option>
                      {(stagedFilters.religion && RELIGION_TO_CASTES[stagedFilters.religion as keyof typeof RELIGION_TO_CASTES] ? RELIGION_TO_CASTES[stagedFilters.religion as keyof typeof RELIGION_TO_CASTES] : []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  {/* Subcaste */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Subcaste</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.sub_caste} onChange={(e) => setStagedFilters({ ...stagedFilters, sub_caste: e.target.value })}>
                      <option value="">Any Subcaste</option>
                      {(stagedFilters.caste && CASTE_TO_SUBCASTE[stagedFilters.caste] ? CASTE_TO_SUBCASTE[stagedFilters.caste] : []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Professional Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Professional Details</h4>
                  
                  {/* Education */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Education</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.education} onChange={(e) => setStagedFilters({ ...stagedFilters, education: e.target.value })}>
                      <option value="">Any</option>
                      {EDUCATION_LEVELS.map((e: string) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* Occupation */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Occupation</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.occupation} onChange={(e) => setStagedFilters({ ...stagedFilters, occupation: e.target.value })}>
                      <option value="">Any</option>
                      {OCCUPATIONS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                  
                  {/* Income */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Income</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.income} onChange={(e) => setStagedFilters({ ...stagedFilters, income: e.target.value })}>
                      <option value="">Any</option>
                      {INCOME_RANGES.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Location Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Location Details</h4>
                  
                  {/* Country */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Country</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.country} onChange={(e) => setStagedFilters({ ...stagedFilters, country: e.target.value })}>
                      <option value="">Any</option>
                      {COUNTRIES.map((e: string) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* State */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>State (India)</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.state} onChange={(e) => setStagedFilters({ ...stagedFilters, state: e.target.value })}>
                      <option value="">Any</option>
                      {INDIAN_STATES.map((e: string) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Lifestyle */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Lifestyle</h4>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Eating Habit</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.eating} onChange={(e) => setStagedFilters({ ...stagedFilters, eating: e.target.value })}>
                      <option value="">Any</option>
                      {EATING_HABITS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Horoscope */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Horoscope</h4>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Star</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.star} onChange={(e) => setStagedFilters({ ...stagedFilters, star: e.target.value })}>
                      <option value="">Any</option>
                      {STARS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Raasi / Moon Sign</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.raasi} onChange={(e) => setStagedFilters({ ...stagedFilters, raasi: e.target.value })}>
                      <option value="">Any</option>
                      {RAASI_LIST.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Dhosham</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.dhosham} onChange={(e) => setStagedFilters({ ...stagedFilters, dhosham: e.target.value })}>
                      <option value="">Any</option>
                      {DHOSHAM_OPTIONS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Verified only */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={stagedFilters.verified_only}
                      onChange={(e) => setStagedFilters({ ...stagedFilters, verified_only: e.target.checked })}
                      style={{ accentColor: "#6B1A2A", width: "14px", height: "14px" }}
                    />
                    <span style={{ fontSize: "0.8125rem", color: "#444" }}>Verified profiles only</span>
                  </label>
                </div>
              </div>
            </div>
`;

let newPage = page.slice(0, startIndex) + newFilters.trim() + '\n            ' + page.slice(endIndex);

newPage = newPage.replace(
  /import \{([^}]+)\} from "@\/data\/matrimony-data";/,
  "import { RELIGIONS, MOTHER_TONGUES, MARITAL_STATUS, PHYSICAL_STATUS, EDUCATION_LEVELS, OCCUPATIONS, INCOME_RANGES, COUNTRIES, INDIAN_STATES, EATING_HABITS, STARS, RAASI_LIST, DHOSHAM_OPTIONS, RELIGION_TO_CASTES, CASTE_TO_SUBCASTE } from '@/data/matrimony-data';"
);

fs.writeFileSync('src/app/search/regular/page.tsx', newPage);
console.log('Successfully updated filters with correct variables and types');
