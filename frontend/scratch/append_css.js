const fs = require('fs');

const cssToAdd = `
/* ============================================================
   PROFILE CARD LAYOUT
   ============================================================ */
/* Smallest screens: horizontal split mini card */
@media (max-width: 479px) {
  .match-card-grid { 
    display: grid !important; 
    grid-template-columns: 140px 1fr !important;
    grid-template-areas: "photo info" "actions actions" !important;
  }
  .match-card-photo-wrap {
    width: 140px !important;
    aspect-ratio: unset !important;
    max-height: 220px !important;
    min-height: 180px !important;
    overflow: hidden !important;
  }
  .match-card-photo {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: top center !important;
    min-height: 180px !important;
    max-height: 220px !important;
  }
}
/* Medium phones: side-by-side */
@media (min-width: 480px) {
  .match-card-grid { 
    display: grid !important; 
    grid-template-columns: 165px 1fr !important;
    grid-template-areas: "photo info" "photo actions" !important;
  }
  .match-card-photo-wrap {
    width: 165px !important;
    aspect-ratio: unset !important;
    min-height: 210px !important;
  }
  .match-card-photo {
    height: 100% !important;
    min-height: 210px !important;
    max-height: 300px !important;
  }
}
@media (min-width: 768px) {
  .match-card-grid {
    grid-template-columns: 190px 1fr !important;
  }
  .match-card-photo-wrap { width: 190px !important; min-height: 230px !important; }
  .match-card-photo { min-height: 230px !important; max-height: 340px !important; }
}
.match-card-actions::-webkit-scrollbar { display: none; }
`;

fs.appendFileSync('src/app/globals.css', cssToAdd);
console.log("Added profile card CSS to globals.css");
