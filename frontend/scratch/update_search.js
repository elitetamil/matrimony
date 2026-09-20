const fs = require('fs');
let content = fs.readFileSync('src/app/search/regular/page.tsx', 'utf8');

// 1. Add import
content = content.replace(
  `import Image from "next/image";`,
  `import Image from "next/image";\nimport ProfileCard from "@/components/ui/MatchesProfileCard";`
);

// 2. Update mapped logic
content = content.replace(
  `        const mapped = data.map((row: any) => ({
          id: row.id,
          name: row.name || "Unknown",
          age: row.dob ? Math.floor((Date.now() - new Date(row.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : 0,
          location: [row.city, row.state].filter(Boolean).join(", ") || "India",
          occupation: row.occupation || "",
          education: row.education || "",
          religion: row.religion || "",
          community: row.caste || "",
          height: row.height || "",
          maritalStatus: row.marital_status || "",
          isVerified: row.is_verified || false,
          isOnline: row.is_online || false,
          isPremium: row.is_premium || false,
          photoUrl: row.photos && row.photos.length > 0 ? row.photos[0].url : row.photo_url,
          gender: row.gender,
        }));`,
  `        const mapped = data.map((row: any) => ({
          ...row,
          id: row.id,
          name: row.name || "Unknown",
          age: row.dob ? Math.floor((Date.now() - new Date(row.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : 0,
          dob: row.dob,
          city: row.city,
          state: row.state,
          country: row.country,
          location: [row.city, row.state].filter(Boolean).join(", ") || "India",
          occupation: row.occupation || "",
          education: row.education || "",
          religion: row.religion || "",
          community: row.caste || "",
          caste: row.caste,
          subcaste: row.subcaste,
          maritalStatus: row.marital_status || "",
          height: row.height || "",
          diet: row.diet,
          dhosham: row.dhosham,
          income: row.income,
          isVerified: row.is_verified || false,
          isOnline: row.is_online || false,
          isPremium: row.is_premium || false,
          photoUrl: row.photos && row.photos.length > 0 ? row.photos[0].url : row.photo_url,
          photos: row.photos,
          gender: row.gender,
        }));`
);

// 3. Update filtered logic
content = content.replace(
  `  const filtered = dbProfiles.filter((p) => {
    if (query) {
      const q = query.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.occupation.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.community.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filters.religion && p.religion !== filters.religion) return false;
    if (p.age < Number(filters.age_min) || p.age > Number(filters.age_max)) return false;
    if (filters.verified_only && !p.isVerified) return false;
    return true;
  });`,
  `  const filtered = dbProfiles.filter((p) => {
    if (query) {
      const q = query.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.occupation.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.community.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filters.religion && p.religion !== filters.religion) return false;
    if (p.age < Number(filters.age_min) || p.age > Number(filters.age_max)) return false;
    if (filters.verified_only && !p.isVerified) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "age_asc") return a.age - b.age;
    if (sort === "age_desc") return b.age - a.age;
    return 0;
  });`
);

// 4. Remove viewMode toggle
content = content.replace(
  `              {/* View mode */}
              <div style={{ display: "flex", border: "1.5px solid #e0e0e0", borderRadius: "6px", overflow: "hidden" }}>
                <button
                  onClick={() => setViewMode("list")}
                  style={{ padding: "0.3125rem 0.5rem", background: viewMode === "list" ? "#6B1A2A" : "#fff", color: viewMode === "list" ? "#fff" : "#888", border: "none", cursor: "pointer" }}
                ><List size={14} /></button>
                <button
                  onClick={() => setViewMode("grid")}
                  style={{ padding: "0.3125rem 0.5rem", background: viewMode === "grid" ? "#6B1A2A" : "#fff", color: viewMode === "grid" ? "#fff" : "#888", border: "none", cursor: "pointer" }}
                ><Grid3X3 size={14} /></button>
              </div>`,
  ``
);

// 5. Replace List and Grid render blocks with ProfileCard
const startStr = `              ) : viewMode === "list" ? (`;
const endStr = `                  ))}
                </div>
              )}`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {filtered.map((p, idx) => (
                    <ProfileCard
                      key={p.id}
                      profile={p as any}
                      index={idx}
                      onShortlist={() => handleShortlist(p.id, p.name)}
                      onHide={() => {}} 
                      onSendInterest={() => handleSendInterest(p.id, p.name)}
                      shortlisted={shortlistedIds.has(p.id)}
                      interestSent={sentInterestIds.has(p.id)}
                      canMessage={user?.isPremium || false}
                      canViewContact={user?.isPremium || false}
                    />
                  ))}
                </div>
              )}`;
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
} else {
  console.log("Could not find render block bounds");
}

fs.writeFileSync('src/app/search/regular/page.tsx', content);
console.log("Updated search page");
