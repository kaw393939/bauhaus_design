#!/usr/bin/env node
/**
 * Comprehensive Lighthouse Audit Report Generator
 * Analyzes all Lighthouse JSON reports and generates actionable recommendations
 */

const fs = require('fs');
const path = require('path');

// Configuration
const AUDIT_DIR = '/tmp';
const OUTPUT_FILE = path.join(process.cwd(), 'docs', 'LIGHTHOUSE_AUDIT_REPORT.md');

// All pages audited
const PAGES = [
  { name: 'Home', file: 'lh-home.json', url: '/' },
  { name: 'About', file: 'audit-about.json', url: '/about/' },
  { name: 'Contact', file: 'audit-contact.json', url: '/contact/' },
  { name: 'Color Theory', file: 'audit-color-theory.json', url: '/color-theory/' },
  { name: 'Projects', file: 'audit-projects.json', url: '/projects/' },
  { name: 'Bauhaus Portfolio', file: 'audit-project-bauhaus.json', url: '/projects/bauhaus-portfolio/' },
  { name: 'Design System', file: 'audit-project-design.json', url: '/projects/design-system/' },
  { name: 'Ecommerce Redesign', file: 'audit-project-ecommerce.json', url: '/projects/ecommerce-redesign/' },
  { name: 'Blog', file: 'audit-blog.json', url: '/blog/' },
  { name: 'Welcome Post', file: 'audit-blog-welcome.json', url: '/blog/welcome/' },
  { name: 'CSS Architecture', file: 'audit-blog-css.json', url: '/blog/css-architecture/' },
  { name: 'Docker Frontend', file: 'audit-blog-docker.json', url: '/blog/docker-frontend/' },
  { name: 'Robots', file: 'audit-robots.json', url: '/robots/' }
];

/**
 * Load and parse Lighthouse JSON report
 */
function loadAudit(filename) {
  const filepath = path.join(AUDIT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️  Warning: ${filename} not found`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.error(`❌ Error parsing ${filename}:`, e.message);
    return null;
  }
}

/**
 * Extract score from category
 */
function getScore(audit, category) {
  if (!audit || !audit.categories || !audit.categories[category]) return null;
  return Math.round(audit.categories[category].score * 100);
}

/**
 * Get all failed audits from a category
 */
function getFailedAudits(audit, categoryName) {
  if (!audit || !audit.categories || !audit.categories[categoryName]) return [];
  
  const category = audit.categories[categoryName];
  const failed = [];
  
  category.auditRefs.forEach(ref => {
    if (ref.weight === 0) return; // Skip non-scoring audits
    
    const auditResult = audit.audits[ref.id];
    if (!auditResult) return;
    
    if (auditResult.score !== null && auditResult.score < 1) {
      failed.push({
        id: ref.id,
        title: auditResult.title,
        description: auditResult.description,
        score: auditResult.score,
        displayValue: auditResult.displayValue,
        details: auditResult.details
      });
    }
  });
  
  return failed;
}

/**
 * Aggregate all unique issues across all pages
 */
function aggregateIssues(audits) {
  const issues = {
    performance: new Map(),
    accessibility: new Map(),
    'best-practices': new Map(),
    seo: new Map()
  };
  
  Object.entries(audits).forEach(([pageName, audit]) => {
    ['performance', 'accessibility', 'best-practices', 'seo'].forEach(category => {
      const failed = getFailedAudits(audit, category);
      failed.forEach(issue => {
        if (!issues[category].has(issue.id)) {
          issues[category].set(issue.id, {
            ...issue,
            affectedPages: []
          });
        }
        issues[category].get(issue.id).affectedPages.push(pageName);
      });
    });
  });
  
  return issues;
}

/**
 * Generate markdown report
 */
function generateReport(audits, issues) {
  const lines = [];
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Header
  lines.push('# Comprehensive Lighthouse Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(`**Total Pages Audited:** ${Object.keys(audits).length}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push('### Overall Scores by Page');
  lines.push('');
  lines.push('| Page | Performance | Accessibility | Best Practices | SEO |');
  lines.push('|------|-------------|---------------|----------------|-----|');
  
  Object.entries(audits).forEach(([pageName, audit]) => {
    const perf = getScore(audit, 'performance') || 'N/A';
    const a11y = getScore(audit, 'accessibility') || 'N/A';
    const bp = getScore(audit, 'best-practices') || 'N/A';
    const seo = getScore(audit, 'seo') || 'N/A';
    
    const perfEmoji = perf >= 90 ? '🟢' : perf >= 50 ? '🟡' : '🔴';
    const a11yEmoji = a11y >= 90 ? '🟢' : a11y >= 50 ? '🟡' : '🔴';
    const bpEmoji = bp >= 90 ? '🟢' : bp >= 50 ? '🟡' : '🔴';
    const seoEmoji = seo >= 90 ? '🟢' : seo >= 50 ? '🟡' : '🔴';
    
    lines.push(`| ${pageName} | ${perfEmoji} ${perf} | ${a11yEmoji} ${a11y} | ${bpEmoji} ${bp} | ${seoEmoji} ${seo} |`);
  });
  
  lines.push('');
  lines.push('**Score Legend:** 🟢 90-100 (Good) | 🟡 50-89 (Needs Improvement) | 🔴 0-49 (Poor)');
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Issues by Category
  ['performance', 'accessibility', 'best-practices', 'seo'].forEach(category => {
    const categoryIssues = Array.from(issues[category].values());
    if (categoryIssues.length === 0) return;
    
    const categoryTitle = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    lines.push(`## ${categoryTitle} Issues`);
    lines.push('');
    lines.push(`**Total Unique Issues:** ${categoryIssues.length}`);
    lines.push('');
    
    categoryIssues.forEach((issue, idx) => {
      lines.push(`### ${idx + 1}. ${issue.title}`);
      lines.push('');
      lines.push(`**Audit ID:** \`${issue.id}\``);
      lines.push(`**Affected Pages:** ${issue.affectedPages.length} page(s)`);
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>Affected Pages</summary>');
      lines.push('');
      issue.affectedPages.forEach(page => {
        lines.push(`- ${page}`);
      });
      lines.push('</details>');
      lines.push('');
      lines.push('**Description:**');
      lines.push(issue.description.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')); // Strip markdown links
      lines.push('');
      
      if (issue.displayValue) {
        lines.push(`**Current Value:** ${issue.displayValue}`);
        lines.push('');
      }
      
      lines.push('**Priority:** ' + (issue.affectedPages.length > 5 ? '🔴 HIGH' : issue.affectedPages.length > 2 ? '🟡 MEDIUM' : '🟢 LOW'));
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  });
  
  // Recommendations
  lines.push('## Recommended Actions');
  lines.push('');
  lines.push('### Priority 1: Critical Issues (Affects 6+ pages)');
  lines.push('');
  
  const criticalIssues = [];
  Object.values(issues).forEach(categoryMap => {
    Array.from(categoryMap.values()).forEach(issue => {
      if (issue.affectedPages.length >= 6) {
        criticalIssues.push(issue);
      }
    });
  });
  
  if (criticalIssues.length > 0) {
    criticalIssues.forEach((issue, idx) => {
      lines.push(`${idx + 1}. **${issue.title}** - Fix across ${issue.affectedPages.length} pages`);
    });
  } else {
    lines.push('✅ No critical issues found!');
  }
  
  lines.push('');
  lines.push('### Priority 2: High Impact Issues (Affects 3-5 pages)');
  lines.push('');
  
  const highImpactIssues = [];
  Object.values(issues).forEach(categoryMap => {
    Array.from(categoryMap.values()).forEach(issue => {
      if (issue.affectedPages.length >= 3 && issue.affectedPages.length < 6) {
        highImpactIssues.push(issue);
      }
    });
  });
  
  if (highImpactIssues.length > 0) {
    highImpactIssues.forEach((issue, idx) => {
      lines.push(`${idx + 1}. **${issue.title}** - Fix across ${issue.affectedPages.length} pages`);
    });
  } else {
    lines.push('✅ No high impact issues found!');
  }
  
  lines.push('');
  lines.push('### Priority 3: Page-Specific Issues (Affects 1-2 pages)');
  lines.push('');
  
  const pageSpecificCount = Array.from(new Set([
    ...Array.from(issues.performance.values()),
    ...Array.from(issues.accessibility.values()),
    ...Array.from(issues['best-practices'].values()),
    ...Array.from(issues.seo.values())
  ])).filter(issue => issue.affectedPages.length < 3).length;
  
  lines.push(`${pageSpecificCount} page-specific issues to address individually.`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Conclusion
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. **Address Critical Issues First** - Focus on problems affecting 6+ pages for maximum impact');
  lines.push('2. **Fix High Impact Issues** - Resolve issues affecting 3-5 pages to improve consistency');
  lines.push('3. **Optimize Page-Specific Issues** - Address unique problems on individual pages');
  lines.push('4. **Re-run Audits** - Validate fixes by running Lighthouse audits again');
  lines.push('5. **Target 95+ Scores** - Aim for scores above 95 in all categories across all pages');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🔦 Lighthouse Audit Report Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Load all audits
  const audits = {};
  PAGES.forEach(page => {
    console.log(`📊 Loading: ${page.name}`);
    const audit = loadAudit(page.file);
    if (audit) {
      audits[page.name] = audit;
    }
  });
  
  console.log('');
  console.log(`✓ Loaded ${Object.keys(audits).length} audit reports`);
  console.log('');
  
  if (Object.keys(audits).length === 0) {
    console.error('❌ No audit reports found. Please run Lighthouse audits first.');
    process.exit(1);
  }
  
  // Aggregate issues
  console.log('🔍 Analyzing issues...');
  const issues = aggregateIssues(audits);
  
  const totalIssues = Array.from(issues.performance.keys()).length +
                     Array.from(issues.accessibility.keys()).length +
                     Array.from(issues['best-practices'].keys()).length +
                     Array.from(issues.seo.keys()).length;
  
  console.log(`✓ Found ${totalIssues} unique issues`);
  console.log('');
  
  // Generate report
  console.log('📝 Generating report...');
  const report = generateReport(audits, issues);
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, report, 'utf8');
  console.log(`✓ Report saved to: ${OUTPUT_FILE}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Report generation complete!');
}

main();
