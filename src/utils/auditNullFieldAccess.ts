/**
 * COMPREHENSIVE NULL FIELD ACCESS AUDIT
 * 
 * This utility audits the entire codebase for potential null field access patterns
 * and generates a report of remaining vulnerabilities.
 */

import fs from 'fs';
import path from 'path';

interface NullAccessVulnerability {
  file: string;
  line: number;
  pattern: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

/**
 * Dangerous patterns that can cause null reference errors
 */
export const DANGEROUS_PATTERNS = [
  // Direct property access without null checks
  {
    pattern: /(\w+)\.email(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct email access without null check'
  },
  {
    pattern: /(\w+)\.phone(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct phone access without null check'
  },
  {
    pattern: /(\w+)\.display_name(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct display_name access without null check'
  },
  {
    pattern: /(\w+)\.organization(?![A-Za-z_])/g,
    severity: 'MEDIUM' as const,
    description: 'Direct organization access without null check'
  },
  
  // Nested property access without null checks
  {
    pattern: /(\w+)\.user\.email(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct nested user.email access without null check'
  },
  {
    pattern: /(\w+)\.user\.phone(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct nested user.phone access without null check'
  },
  {
    pattern: /(\w+)\.user\.display_name(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct nested user.display_name access without null check'
  },
  {
    pattern: /(\w+)\.profile\.email(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct nested profile.email access without null check'
  },
  {
    pattern: /(\w+)\.profile\.phone(?![A-Za-z_])/g,
    severity: 'HIGH' as const,
    description: 'Direct nested profile.phone access without null check'
  },
  
  // JSX unsafe patterns
  {
    pattern: /\{(\w+)\.email\}/g,
    severity: 'HIGH' as const,
    description: 'JSX email display without null check'
  },
  {
    pattern: /\{(\w+)\.phone\}/g,
    severity: 'HIGH' as const,
    description: 'JSX phone display without null check'
  },
  {
    pattern: /\{(\w+)\.display_name\}/g,
    severity: 'MEDIUM' as const,
    description: 'JSX display_name without null check'
  },
  
  // Array methods on potentially null objects
  {
    pattern: /(\w+)\.map\([^)]*(?:email|phone|display_name)[^)]*\)/g,
    severity: 'HIGH' as const,
    description: 'Array.map with potential null field access'
  },
  
  // String methods on potentially null fields
  {
    pattern: /(\w+\.(?:email|phone|display_name))\.toLowerCase\(\)/g,
    severity: 'HIGH' as const,
    description: 'String method on potentially null field'
  },
  {
    pattern: /(\w+\.(?:email|phone|display_name))\.includes\(/g,
    severity: 'HIGH' as const,
    description: 'String includes method on potentially null field'
  },
  
  // Template literals with potential null fields
  {
    pattern: /\$\{(\w+\.(?:email|phone|display_name))\}/g,
    severity: 'MEDIUM' as const,
    description: 'Template literal with potentially null field'
  }
];

/**
 * Scan a file for null access vulnerabilities
 */
export function scanFileForVulnerabilities(filePath: string, content: string): NullAccessVulnerability[] {
  const vulnerabilities: NullAccessVulnerability[] = [];
  const lines = content.split('\n');
  
  DANGEROUS_PATTERNS.forEach(({ pattern, severity, description }) => {
    lines.forEach((line, index) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        // Skip if it's in a comment
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          continue;
        }
        
        // Skip if it's already using safe access patterns
        if (line.includes('getSafe') || line.includes('hasValid') || line.includes('?.')) {
          continue;
        }
        
        vulnerabilities.push({
          file: filePath,
          line: index + 1,
          pattern: match[0],
          severity,
          description
        });
      }
    });
  });
  
  return vulnerabilities;
}

/**
 * Recursively scan directory for TypeScript/JavaScript files
 */
export function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  
  function scan(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dirPath);
  return files;
}

/**
 * Generate comprehensive audit report
 */
export function generateAuditReport(srcPath: string): {
  vulnerabilities: NullAccessVulnerability[];
  summary: {
    totalFiles: number;
    vulnerableFiles: number;
    totalVulnerabilities: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
} {
  const files = scanDirectory(srcPath);
  const allVulnerabilities: NullAccessVulnerability[] = [];
  const vulnerableFiles = new Set<string>();
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const vulnerabilities = scanFileForVulnerabilities(filePath, content);
      
      if (vulnerabilities.length > 0) {
        vulnerableFiles.add(filePath);
        allVulnerabilities.push(...vulnerabilities);
      }
    } catch (error) {
      console.warn(`Could not scan file ${filePath}:`, error);
    }
  });
  
  const summary = {
    totalFiles: files.length,
    vulnerableFiles: vulnerableFiles.size,
    totalVulnerabilities: allVulnerabilities.length,
    highSeverity: allVulnerabilities.filter(v => v.severity === 'HIGH').length,
    mediumSeverity: allVulnerabilities.filter(v => v.severity === 'MEDIUM').length,
    lowSeverity: allVulnerabilities.filter(v => v.severity === 'LOW').length
  };
  
  return { vulnerabilities: allVulnerabilities, summary };
}

/**
 * Format audit report for console output
 */
export function formatAuditReport(report: ReturnType<typeof generateAuditReport>): string {
  const { vulnerabilities, summary } = report;
  
  let output = '\n=== NULL FIELD ACCESS AUDIT REPORT ===\n\n';
  
  // Summary
  output += `📊 SUMMARY:\n`;
  output += `  Total Files Scanned: ${summary.totalFiles}\n`;
  output += `  Files with Vulnerabilities: ${summary.vulnerableFiles}\n`;
  output += `  Total Vulnerabilities: ${summary.totalVulnerabilities}\n`;
  output += `  🔴 High Severity: ${summary.highSeverity}\n`;
  output += `  🟡 Medium Severity: ${summary.mediumSeverity}\n`;
  output += `  🟢 Low Severity: ${summary.lowSeverity}\n\n`;
  
  if (vulnerabilities.length === 0) {
    output += '✅ No null field access vulnerabilities found!\n';
    return output;
  }
  
  // Group by file
  const byFile = vulnerabilities.reduce((acc, vuln) => {
    if (!acc[vuln.file]) acc[vuln.file] = [];
    acc[vuln.file].push(vuln);
    return acc;
  }, {} as Record<string, NullAccessVulnerability[]>);
  
  output += '🚨 VULNERABILITIES BY FILE:\n\n';
  
  Object.entries(byFile).forEach(([file, vulns]) => {
    output += `📄 ${file.replace(process.cwd(), '')}\n`;
    
    vulns.forEach(vuln => {
      const severity = vuln.severity === 'HIGH' ? '🔴' : (vuln.severity === 'MEDIUM' ? '🟡' : '🟢');
      output += `  ${severity} Line ${vuln.line}: ${vuln.pattern}\n`;
      output += `     ${vuln.description}\n`;
    });
    
    output += '\n';
  });
  
  // Recommendations
  output += '💡 RECOMMENDATIONS:\n\n';
  output += '1. Replace direct field access with safe access utilities:\n';
  output += '   - Use getSafeUserEmail(user) instead of user.email\n';
  output += '   - Use getSafeUserPhone(user) instead of user.phone\n';
  output += '   - Use getSafeUserDisplayName(user) instead of user.display_name\n\n';
  
  output += '2. Add null checks before accessing nested properties:\n';
  output += '   - Use hasValidEmail(user) && getSafeUserEmail(user)\n';
  output += '   - Use user?.email instead of user.email\n\n';
  
  output += '3. Import safe access utilities:\n';
  output += "   import { getSafeUserEmail, getSafeUserPhone, ... } from '@/utils/fixNullProfileAccessPatterns';\n\n";
  
  return output;
}

/**
 * CLI function to run audit
 */
export function runAudit(srcPath: string = './src') {
  console.log('🔍 Starting null field access audit...\n');
  
  const report = generateAuditReport(srcPath);
  const formattedReport = formatAuditReport(report);
  
  console.log(formattedReport);
  
  // Write report to file
  const reportFile = path.join(process.cwd(), 'null-access-audit-report.txt');
  fs.writeFileSync(reportFile, formattedReport);
  console.log(`📝 Report saved to: ${reportFile}\n`);
  
  return report;
}

// Export everything
export default {
  scanFileForVulnerabilities,
  scanDirectory,
  generateAuditReport,
  formatAuditReport,
  runAudit,
  DANGEROUS_PATTERNS
};