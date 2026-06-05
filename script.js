const fs = require('fs');

function replaceThemeClasses(content) {
  return content
    // Backgrounds
    .replace(/bg-\[\#03020a\]/g, 'dark:bg-[#03020a] bg-slate-50')
    // Text colors
    .replace(/text-white(\s|")/g, 'dark:text-white text-slate-900$1')
    .replace(/text-white\/20/g, 'dark:text-white/20 text-slate-400')
    .replace(/text-white\/25/g, 'dark:text-white/25 text-slate-400')
    .replace(/text-white\/40/g, 'dark:text-white/40 text-slate-500')
    .replace(/text-white\/50/g, 'dark:text-white/50 text-slate-500')
    .replace(/text-white\/60/g, 'dark:text-white/60 text-slate-600')
    .replace(/placeholder:text-white\/20/g, 'dark:placeholder:text-white/20 placeholder:text-slate-400')
    // Borders
    .replace(/border-white\/\[0\.08\]/g, 'dark:border-white/[0.08] border-black/10')
    .replace(/border-white\/\[0\.07\]/g, 'dark:border-white/[0.07] border-black/10')
    .replace(/border-white\/\[0\.06\]/g, 'dark:border-white/[0.06] border-black/10')
    .replace(/border-white\/10/g, 'dark:border-white/10 border-black/10')
    .replace(/border-white\/20/g, 'dark:border-white/20 border-black/20')
    // Container Backgrounds
    .replace(/bg-white\/\[0\.04\]/g, 'dark:bg-white/[0.04] bg-white')
    .replace(/bg-white\/\[0\.03\]/g, 'dark:bg-white/[0.03] bg-white/50')
    .replace(/bg-white\/5/g, 'dark:bg-white/5 bg-slate-100')
    .replace(/bg-white\/10/g, 'dark:bg-white/10 bg-slate-200')
    .replace(/bg-white\/20/g, 'dark:bg-white/20 bg-slate-300')
    // specific fixes for glass input
    .replace(/bg-transparent dark:text-white text-slate-900/g, 'bg-transparent text-foreground') // fix overlapping replacements if any
    .replace(/border transition-all duration-300/g, 'border transition-all duration-300 backdrop-blur-xl')
    // select fix
    .replace(/bg-\[\#0e0b1f\]/g, 'dark:bg-[#0e0b1f] bg-white')
    // gradient text
    .replace(/text-transparent bg-clip-text/g, 'text-transparent bg-clip-text dark:bg-gradient-to-r')
    .replace(/text-transparent dark:text-white text-slate-900 bg-clip-text/g, 'text-transparent bg-clip-text')
}

['client/pages/Login.tsx', 'client/pages/Signup.tsx'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, replaceThemeClasses(content));
});

console.log("Done");
