const fs = require('fs');

const orig = fs.readFileSync('scratch/matches_orig.tsx', 'utf8').split('\n');

const profileCardFunc = orig.slice(203, 731);

const finalFile = [
  'import Link from "next/link";',
  'import { Lock } from "lucide-react";',
  'import { type RegisteredUser } from "@/lib/auth-store";',
  '',
  '// PhoneIcon component for the profile card',
  'function PhoneIcon() {',
  '  return (',
  '    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">',
  '      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>',
  '    </svg>',
  '  );',
  '}',
  '',
  ...profileCardFunc,
  '',
  'export default ProfileCard;',
  ''
].join('\n');

fs.writeFileSync('src/components/ui/MatchesProfileCard.tsx', finalFile);
console.log("Successfully rebuilt MatchesProfileCard.tsx");
