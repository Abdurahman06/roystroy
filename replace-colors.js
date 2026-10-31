const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  // Colors
  [/#E2B857/g, '#8E9BA8'],
  [/#F6DF9C/g, '#C8D0D8'],
  [/#C99C32/g, '#6B7A87'],
  [/#D4AF37/g, '#8E9BA8'],
  [/#B89230/g, '#6B7A87'],
  [/#8C6B1B/g, '#444444'],
  [/#090D15/g, '#0a0a0a'],
  [/#0a0f1a/g, '#0d0d0d'],
  [/#0b101c/g, '#0d0d0d'],
  [/#0d1422/g, '#111111'],
  [/#0e1627/g, '#111111'],
  [/#0f1624/g, '#141414'],
  [/#0c1220/g, '#111111'],
  [/#080d16/g, '#0a0a0a'],
  [/#070b13/g, '#090909'],
  [/#06090e/g, '#0a0a0a'],
  [/#0a0f1c/g, '#0d0d0d'],

  // Text gradient classes
  [/text-gold-gradient/g, 'text-silver-gradient'],

  // Background classes that use gold
  [/bg-\[#E2B857\]/g, 'bg-[#8E9BA8]'],
  [/bg-\[#F6DF9C\]/g, 'bg-[#C8D0D8]'],

  // Tailwind color variants for gold
  [/from-\[#F6DF9C\]/g, 'from-[#E8ECEF]'],
  [/via-\[#E2B857\]/g, 'via-[#8E9BA8]'],
  [/to-\[#C99C32\]/g, 'to-[#6B7A87]'],
  [/to-\[#B89230\]/g, 'to-[#6B7A87]'],
  [/from-\[#E2B857\]/g, 'from-[#8E9BA8]'],

  // Border
  [/border-\[#E2B857\]/g, 'border-[#8E9BA8]'],
  [/border-\[#D4AF37\]/g, 'border-[#8E9BA8]'],

  // Text color
  [/text-\[#E2B857\]/g, 'text-[#C8D0D8]'],
  [/text-\[#D4AF37\]/g, 'text-[#C8D0D8]'],

  // Shadow
  [/shadow-\[#E2B857\]/g, 'shadow-[#8E9BA8]'],

  // Opacity variants
  [/#E2B857\/15/g, '#8E9BA8/15'],
  [/#E2B857\/10/g, '#8E9BA8/10'],
  [/#E2B857\/20/g, '#8E9BA8/20'],
  [/#E2B857\/25/g, '#8E9BA8/20'],
  [/#E2B857\/30/g, '#8E9BA8/25'],
  [/#E2B857\/40/g, '#8E9BA8/30'],
  [/#E2B857\/45/g, '#8E9BA8/35'],
  [/#E2B857\/50/g, '#8E9BA8/40'],
  [/#D4AF37\/15/g, '#8E9BA8/15'],
  [/#D4AF37\/25/g, '#8E9BA8/20'],
  [/#D4AF37\/30/g, '#8E9BA8/25'],

  // amber- and yellow- classes  
  [/bg-amber-400/g, 'bg-white'],
  [/text-amber-400/g, 'text-[#C8D0D8]'],
  [/from-amber-500/g, 'from-[#8E9BA8]'],
  [/to-amber-500/g, 'to-[#C8D0D8]'],
  [/bg-gradient-to-r from-\[#F6DF9C\] via-\[#E2B857\] to-\[#C99C32\]/g, 'bg-white'],
  [/bg-gradient-to-r from-\[#F6DF9C\] to-\[#E2B857\]/g, 'bg-white'],

  // purple / indigo / violet (keep only grey alternatives)
  [/from-purple-600/g, 'from-[#444444]'],
  [/via-pink-600/g, 'via-[#555555]'],
  [/to-amber-500/g, 'to-[#777777]'],
  [/text-pink-400/g, 'text-[#C8D0D8]'],
  [/bg-pink-500\/10/g, 'bg-white/8'],
  [/border-pink-500\/30/g, 'border-white/15'],
  [/bg-indigo-600/g, 'bg-[#333333]'],
  [/bg-sky-600/g, 'bg-[#444444]'],
  [/text-sky-300/g, 'text-[#C8D0D8]'],

  // Button text color corrections
  [/text-\[#090D15\]/g, 'text-[#0a0a0a]'],
  [/text-black font-bold shadow-md shadow-\[#E2B857\]\/20/g, 'text-[#0a0a0a] font-bold'],
  [/text-black font-bold shadow-md/g, 'text-[#0a0a0a] font-bold'],
  [/text-black font-bold/g, 'text-[#0a0a0a] font-bold'],
  [/text-black bg-\[#E2B857\]/g, 'text-[#0a0a0a] bg-white'],
  [/text-black bg-gradient/g, 'text-[#0a0a0a] bg-white'],
  [/text-black hover:bg-\[#F6DF9C\]/g, 'text-[#0a0a0a] hover:bg-[#E8ECEF]'],
];

let totalChanges = 0;

for (const file of files) {
  const fPath = path.join(dir, file);
  let content = fs.readFileSync(fPath, 'utf8');
  const orig = content;
  
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  
  if (content !== orig) {
    fs.writeFileSync(fPath, content, 'utf8');
    console.log(`  Updated: ${file}`);
    totalChanges++;
  } else {
    console.log(`  No changes: ${file}`);
  }
}

console.log(`\nDone. Updated ${totalChanges} files.`);
