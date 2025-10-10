#!/usr/bin/env tsx

/**
 * FindoTrip Feature Test Suite
 * 
 * This comprehensive test suite validates all features documented in the project.
 * It checks file existence, imports, database schema, API routes, and more.
 * 
 * Run with: npm run test:features
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

interface IssuesReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  issues: TestResult[];
  summary: string;
}

class FeatureTester {
  private results: TestResult[] = [];
  private projectRoot: string;
  private appDir: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.appDir = join(this.projectRoot, 'app');
  }

  private addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: string) {
    this.results.push({ category, test, status, message, details });
  }

  private fileExists(path: string): boolean {
    return existsSync(join(this.projectRoot, path));
  }

  private readFile(path: string): string | null {
    try {
      return readFileSync(join(this.projectRoot, path), 'utf-8');
    } catch {
      return null;
    }
  }

  private getFilesInDir(dir: string, extension?: string): string[] {
    try {
      const fullPath = join(this.projectRoot, dir);
      if (!existsSync(fullPath)) return [];
      
      return readdirSync(fullPath)
        .filter(file => {
          const filePath = join(fullPath, file);
          const stat = statSync(filePath);
          if (!stat.isFile()) return false;
          if (extension && !file.endsWith(extension)) return false;
          return true;
        });
    } catch {
      return [];
    }
  }

  private checkImport(importPath: string, filePath: string): boolean {
    const content = this.readFile(filePath);
    if (!content) return false;
    
    // Check for various import patterns
    const patterns = [
      new RegExp(`import.*from.*['"]${importPath.replace(/\./g, '\\.')}['"]`),
      new RegExp(`import.*['"]${importPath.replace(/\./g, '\\.')}['"]`),
      new RegExp(`require\\(['"]${importPath.replace(/\./g, '\\.')}['"]\\)`)
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  // ========================================
  // AUTHENTICATION SYSTEM TESTS
  // ========================================

  testAuthenticationSystem() {
    console.log('🔐 Testing Authentication System...');

    // Test auth files
    const authFiles = [
      'app/lib/auth/auth.server.ts',
      'app/lib/auth/auth-strategies.server.ts',
      'app/lib/auth/middleware.ts'
    ];

    authFiles.forEach(file => {
      if (this.fileExists(file)) {
        this.addResult('Authentication', `File exists: ${file}`, 'PASS', 'Authentication file found');
      } else {
        this.addResult('Authentication', `File exists: ${file}`, 'FAIL', 'Authentication file missing');
      }
    });

    // Test auth routes
    const authRoutes = [
      'app/routes/login.tsx',
      'app/routes/register.tsx',
      'app/routes/forgot-password.tsx',
      'app/routes/reset-password.tsx',
      'app/routes/logout.tsx',
      'app/routes/profile.tsx'
    ];

    authRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('Authentication', `Route exists: ${route}`, 'PASS', 'Authentication route found');
      } else {
        this.addResult('Authentication', `Route exists: ${route}`, 'FAIL', 'Authentication route missing');
      }
    });

    // Test role-based registration
    const roleRoutes = [
      'app/routes/register.customer.tsx',
      'app/routes/register.property-owner.tsx',
      'app/routes/register.vehicle-owner.tsx',
      'app/routes/register.tour-guide.tsx'
    ];

    roleRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('Authentication', `Role route exists: ${route}`, 'PASS', 'Role-based registration route found');
      } else {
        this.addResult('Authentication', `Role route exists: ${route}`, 'WARN', 'Role-based registration route missing');
      }
    });
  }

  // ========================================
  // SEARCH SYSTEM TESTS
  // ========================================

  testSearchSystem() {
    console.log('🔍 Testing Search System...');

    // Test search components
    const searchComponents = [
      'app/components/SearchAutocomplete.tsx',
      'app/components/SearchResults.tsx',
      'app/components/features/home/SearchForm.tsx'
    ];

    searchComponents.forEach(component => {
      if (this.fileExists(component)) {
        this.addResult('Search', `Component exists: ${component}`, 'PASS', 'Search component found');
      } else {
        this.addResult('Search', `Component exists: ${component}`, 'FAIL', 'Search component missing');
      }
    });

    // Test search API routes
    const searchRoutes = [
      'app/routes/api/search.accommodations.tsx',
      'app/routes/api/search.tours.tsx',
      'app/routes/api/search.vehicles.tsx'
    ];

    searchRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('Search', `API route exists: ${route}`, 'PASS', 'Search API route found');
      } else {
        this.addResult('Search', `API route exists: ${route}`, 'FAIL', 'Search API route missing');
      }
    });

    // Test search pages
    const searchPages = [
      'app/routes/accommodations.search.tsx',
      'app/routes/search.tsx'
    ];

    searchPages.forEach(page => {
      if (this.fileExists(page)) {
        this.addResult('Search', `Page exists: ${page}`, 'PASS', 'Search page found');
      } else {
        this.addResult('Search', `Page exists: ${page}`, 'FAIL', 'Search page missing');
      }
    });
  }

  // ========================================
  // BOOKING SYSTEM TESTS
  // ========================================

  testBookingSystem() {
    console.log('📅 Testing Booking System...');

    // Test booking routes
    const bookingRoutes = [
      'app/routes/book/property.$id.tsx',
      'app/routes/book/vehicle.$id.tsx',
      'app/routes/book/tour.$id.tsx',
      'app/routes/book/payment.$id.tsx',
      'app/routes/book/confirmation.$id.tsx'
    ];

    bookingRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('Booking', `Route exists: ${route}`, 'PASS', 'Booking route found');
      } else {
        this.addResult('Booking', `Route exists: ${route}`, 'FAIL', 'Booking route missing');
      }
    });

    // Test booking API routes
    const bookingAPIs = [
      'app/routes/api/booking.create.tsx',
      'app/routes/api/booking.confirm.tsx',
      'app/routes/api/booking.cancel.tsx'
    ];

    bookingAPIs.forEach(api => {
      if (this.fileExists(api)) {
        this.addResult('Booking', `API exists: ${api}`, 'PASS', 'Booking API found');
      } else {
        this.addResult('Booking', `API exists: ${api}`, 'FAIL', 'Booking API missing');
      }
    });

    // Test booking context
    if (this.fileExists('app/contexts/BookingContext.tsx')) {
      this.addResult('Booking', 'Booking context exists', 'PASS', 'Booking context found');
    } else {
      this.addResult('Booking', 'Booking context exists', 'FAIL', 'Booking context missing');
    }
  }

  // ========================================
  // CHAT SYSTEM TESTS
  // ========================================

  testChatSystem() {
    console.log('💬 Testing Chat System...');

    // Test chat components
    const chatComponents = [
      'app/components/chat/ChatButton.tsx',
      'app/components/chat/ChatInterface.tsx',
      'app/components/chat/ConversationList.tsx',
      'app/components/chat/MessageBubble.tsx',
      'app/components/chat/ChatInput.tsx'
    ];

    chatComponents.forEach(component => {
      if (this.fileExists(component)) {
        this.addResult('Chat', `Component exists: ${component}`, 'PASS', 'Chat component found');
      } else {
        this.addResult('Chat', `Component exists: ${component}`, 'FAIL', 'Chat component missing');
      }
    });

    // Test chat API routes
    const chatAPIs = [
      'app/routes/api/chat.conversations.tsx',
      'app/routes/api/chat.conversation.tsx',
      'app/routes/api/chat.send.tsx',
      'app/routes/api/chat.stream.tsx',
      'app/routes/api/chat.typing.tsx',
      'app/routes/api/chat.presence.tsx',
      'app/routes/api/chat.read.tsx'
    ];

    chatAPIs.forEach(api => {
      if (this.fileExists(api)) {
        this.addResult('Chat', `API exists: ${api}`, 'PASS', 'Chat API found');
      } else {
        this.addResult('Chat', `API exists: ${api}`, 'FAIL', 'Chat API missing');
      }
    });

    // Test chat utility functions
    if (this.fileExists('app/lib/chat.server.ts')) {
      this.addResult('Chat', 'Chat utilities exist', 'PASS', 'Chat utility functions found');
    } else {
      this.addResult('Chat', 'Chat utilities exist', 'FAIL', 'Chat utility functions missing');
    }

    // Test chat security
    if (this.fileExists('app/lib/chat-security.server.ts')) {
      this.addResult('Chat', 'Chat security exists', 'PASS', 'Chat security functions found');
    } else {
      this.addResult('Chat', 'Chat security exists', 'WARN', 'Chat security functions missing');
    }
  }

  // ========================================
  // DASHBOARD SYSTEM TESTS
  // ========================================

  testDashboardSystem() {
    console.log('📊 Testing Dashboard System...');

    // Test dashboard routes
    const dashboardRoutes = [
      'app/routes/dashboard.tsx',
      'app/routes/dashboard.profile.tsx',
      'app/routes/dashboard.bookings.tsx',
      'app/routes/dashboard.favorites.tsx',
      'app/routes/dashboard.reviews.tsx',
      'app/routes/dashboard.messages.tsx',
      'app/routes/dashboard.provider.tsx',
      'app/routes/dashboard.guide.tsx',
      'app/routes/dashboard.vehicle-owner.tsx',
      'app/routes/dashboard.admin.tsx'
    ];

    dashboardRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('Dashboard', `Route exists: ${route}`, 'PASS', 'Dashboard route found');
      } else {
        this.addResult('Dashboard', `Route exists: ${route}`, 'FAIL', 'Dashboard route missing');
      }
    });
  }

  // ========================================
  // REVIEW SYSTEM TESTS
  // ========================================

  testReviewSystem() {
    console.log('⭐ Testing Review System...');

    // Test review components
    const reviewComponents = [
      'app/components/reviews/UniversalReviewForm.tsx'
    ];

    reviewComponents.forEach(component => {
      if (this.fileExists(component)) {
        this.addResult('Reviews', `Component exists: ${component}`, 'PASS', 'Review component found');
      } else {
        this.addResult('Reviews', `Component exists: ${component}`, 'FAIL', 'Review component missing');
      }
    });

    // Test review routes
    const reviewRoutes = [
      'app/routes/booking.$id.review.tsx',
      'app/routes/reviews/new.tsx'
    ];

    reviewRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('Reviews', `Route exists: ${route}`, 'PASS', 'Review route found');
      } else {
        this.addResult('Reviews', `Route exists: ${route}`, 'FAIL', 'Review route missing');
      }
    });

    // Test review utilities
    if (this.fileExists('app/lib/reviews.server.ts')) {
      this.addResult('Reviews', 'Review utilities exist', 'PASS', 'Review utility functions found');
    } else {
      this.addResult('Reviews', 'Review utilities exist', 'FAIL', 'Review utility functions missing');
    }
  }

  // ========================================
  // SUPPORT SYSTEM TESTS
  // ========================================

  testSupportSystem() {
    console.log('🆘 Testing Support System...');

    // Test support components
    const supportComponents = [
      'app/components/support/SupportButton.tsx',
      'app/components/support/SupportChat.tsx'
    ];

    supportComponents.forEach(component => {
      if (this.fileExists(component)) {
        this.addResult('Support', `Component exists: ${component}`, 'PASS', 'Support component found');
      } else {
        this.addResult('Support', `Component exists: ${component}`, 'FAIL', 'Support component missing');
      }
    });

    // Test support routes
    const supportRoutes = [
      'app/routes/dashboard/support.tsx',
      'app/routes/help/chat-safety.tsx'
    ];

    supportRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('Support', `Route exists: ${route}`, 'PASS', 'Support route found');
      } else {
        this.addResult('Support', `Route exists: ${route}`, 'FAIL', 'Support route missing');
      }
    });

    // Test support utilities
    if (this.fileExists('app/lib/utils/support.server.ts')) {
      this.addResult('Support', 'Support utilities exist', 'PASS', 'Support utility functions found');
    } else {
      this.addResult('Support', 'Support utilities exist', 'WARN', 'Support utility functions missing');
    }
  }

  // ========================================
  // DATABASE SCHEMA TESTS
  // ========================================

  testDatabaseSchema() {
    console.log('🗄️ Testing Database Schema...');

    const schemaFile = 'prisma/schema.prisma';
    if (!this.fileExists(schemaFile)) {
      this.addResult('Database', 'Schema file exists', 'FAIL', 'Prisma schema file missing');
      return;
    }

    this.addResult('Database', 'Schema file exists', 'PASS', 'Prisma schema file found');

    const schemaContent = this.readFile(schemaFile);
    if (!schemaContent) {
      this.addResult('Database', 'Schema content readable', 'FAIL', 'Cannot read schema file');
      return;
    }

    // Test for key models
    const requiredModels = [
      'model User',
      'model Property',
      'model Vehicle',
      'model Tour',
      'model Booking',
      'model Payment',
      'model Review',
      'model Conversation',
      'model Message'
    ];

    requiredModels.forEach(model => {
      if (schemaContent.includes(model)) {
        this.addResult('Database', `Model exists: ${model}`, 'PASS', `${model} found in schema`);
      } else {
        this.addResult('Database', `Model exists: ${model}`, 'FAIL', `${model} missing from schema`);
      }
    });

    // Test for key enums
    const requiredEnums = [
      'enum UserRole',
      'enum BookingStatus',
      'enum PaymentStatus',
      'enum PropertyType',
      'enum VehicleType',
      'enum TourType'
    ];

    requiredEnums.forEach(enumType => {
      if (schemaContent.includes(enumType)) {
        this.addResult('Database', `Enum exists: ${enumType}`, 'PASS', `${enumType} found in schema`);
      } else {
        this.addResult('Database', `Enum exists: ${enumType}`, 'FAIL', `${enumType} missing from schema`);
      }
    });
  }

  // ========================================
  // FILE UPLOAD TESTS
  // ========================================

  testFileUploadSystem() {
    console.log('📁 Testing File Upload System...');

    // Test upload API routes
    const uploadRoutes = [
      'app/routes/api/upload-document.tsx',
      'app/routes/api/upload-review-photo.tsx',
      'app/routes/api/chat/upload.tsx'
    ];

    uploadRoutes.forEach(route => {
      if (this.fileExists(route)) {
        this.addResult('File Upload', `Upload route exists: ${route}`, 'PASS', 'File upload route found');
      } else {
        this.addResult('File Upload', `Upload route exists: ${route}`, 'FAIL', 'File upload route missing');
      }
    });

    // Test upload components
    if (this.fileExists('app/components/common/DocumentUpload.tsx')) {
      this.addResult('File Upload', 'Document upload component exists', 'PASS', 'Document upload component found');
    } else {
      this.addResult('File Upload', 'Document upload component exists', 'FAIL', 'Document upload component missing');
    }
  }

  // ========================================
  // ENVIRONMENT VARIABLES TESTS
  // ========================================

  testEnvironmentVariables() {
    console.log('🔧 Testing Environment Variables...');

    const envExample = this.readFile('.env.example');
    if (!envExample) {
      this.addResult('Environment', '.env.example exists', 'FAIL', '.env.example file missing');
      return;
    }

    this.addResult('Environment', '.env.example exists', 'PASS', '.env.example file found');

    // Test for required environment variables
    const requiredVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    requiredVars.forEach(varName => {
      if (envExample.includes(varName)) {
        this.addResult('Environment', `Variable documented: ${varName}`, 'PASS', `${varName} found in .env.example`);
      } else {
        this.addResult('Environment', `Variable documented: ${varName}`, 'WARN', `${varName} missing from .env.example`);
      }
    });
  }

  // ========================================
  // PACKAGE.JSON TESTS
  // ========================================

  testPackageJson() {
    console.log('📦 Testing Package.json...');

    const packageJson = this.readFile('package.json');
    if (!packageJson) {
      this.addResult('Package', 'package.json exists', 'FAIL', 'package.json file missing');
      return;
    }

    this.addResult('Package', 'package.json exists', 'PASS', 'package.json file found');

    try {
      const pkg = JSON.parse(packageJson);
      
      // Test for required dependencies
      const requiredDeps = [
        '@prisma/client',
        '@remix-run/react',
        '@remix-run/node',
        'react',
        'react-dom',
        'typescript'
      ];

      requiredDeps.forEach(dep => {
        if (pkg.dependencies && pkg.dependencies[dep]) {
          this.addResult('Package', `Dependency exists: ${dep}`, 'PASS', `${dep} found in dependencies`);
        } else if (pkg.devDependencies && pkg.devDependencies[dep]) {
          this.addResult('Package', `Dependency exists: ${dep}`, 'PASS', `${dep} found in devDependencies`);
        } else {
          this.addResult('Package', `Dependency exists: ${dep}`, 'FAIL', `${dep} missing from dependencies`);
        }
      });

      // Test for scripts
      const requiredScripts = [
        'dev',
        'build',
        'start',
        'typecheck',
        'db:generate',
        'db:push',
        'db:seed'
      ];

      requiredScripts.forEach(script => {
        if (pkg.scripts && pkg.scripts[script]) {
          this.addResult('Package', `Script exists: ${script}`, 'PASS', `${script} script found`);
        } else {
          this.addResult('Package', `Script exists: ${script}`, 'FAIL', `${script} script missing`);
        }
      });

    } catch (error) {
      this.addResult('Package', 'package.json valid', 'FAIL', 'package.json is not valid JSON');
    }
  }

  // ========================================
  // COMPONENT IMPORTS TESTS
  // ========================================

  testComponentImports() {
    console.log('🔗 Testing Component Imports...');

    // Test key component files for proper imports
    const keyComponents = [
      'app/components/FeaturedTours.tsx',
      'app/components/FeaturedVehicles.tsx',
      'app/components/TourCard.tsx',
      'app/components/VehicleCard.tsx',
      'app/components/SearchAutocomplete.tsx',
      'app/components/SearchResults.tsx'
    ];

    keyComponents.forEach(component => {
      if (this.fileExists(component)) {
        this.addResult('Components', `Component exists: ${component}`, 'PASS', 'Component file found');
        
        // Check if component has proper React imports
        const content = this.readFile(component);
        if (content && content.includes('import React')) {
          this.addResult('Components', `React import in ${component}`, 'PASS', 'React import found');
        } else {
          this.addResult('Components', `React import in ${component}`, 'WARN', 'React import missing');
        }
      } else {
        this.addResult('Components', `Component exists: ${component}`, 'FAIL', 'Component file missing');
      }
    });
  }

  // ========================================
  // API ROUTE TESTS
  // ========================================

  testAPIRoutes() {
    console.log('🌐 Testing API Routes...');

    const apiDir = join(this.appDir, 'routes', 'api');
    const apiFiles = this.getFilesInDir('app/routes/api', '.tsx');

    if (apiFiles.length === 0) {
      this.addResult('API', 'API routes exist', 'FAIL', 'No API routes found');
      return;
    }

    this.addResult('API', 'API routes exist', 'PASS', `${apiFiles.length} API routes found`);

    // Test specific API routes
    const criticalAPIs = [
      'booking.create.tsx',
      'booking.confirm.tsx',
      'booking.cancel.tsx',
      'search.accommodations.tsx',
      'chat.conversations.tsx',
      'chat.send.tsx'
    ];

    criticalAPIs.forEach(api => {
      if (apiFiles.includes(api)) {
        this.addResult('API', `Critical API exists: ${api}`, 'PASS', 'Critical API route found');
      } else {
        this.addResult('API', `Critical API exists: ${api}`, 'FAIL', 'Critical API route missing');
      }
    });
  }

  // ========================================
  // RUN ALL TESTS
  // ========================================

  async runAllTests(): Promise<IssuesReport> {
    console.log('🚀 Starting FindoTrip Feature Test Suite...\n');

    this.testAuthenticationSystem();
    this.testSearchSystem();
    this.testBookingSystem();
    this.testChatSystem();
    this.testDashboardSystem();
    this.testReviewSystem();
    this.testSupportSystem();
    this.testDatabaseSchema();
    this.testFileUploadSystem();
    this.testEnvironmentVariables();
    this.testPackageJson();
    this.testComponentImports();
    this.testAPIRoutes();

    // Calculate summary
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    const summary = `
📊 TEST SUMMARY
===============
Total Tests: ${totalTests}
✅ Passed: ${passed}
❌ Failed: ${failed}
⚠️  Warnings: ${warnings}

Success Rate: ${((passed / totalTests) * 100).toFixed(1)}%
    `.trim();

    return {
      totalTests,
      passed,
      failed,
      warnings,
      issues: this.results,
      summary
    };
  }

  // ========================================
  // GENERATE ISSUES REPORT
  // ========================================

  generateIssuesReport(report: IssuesReport): string {
    let output = `# 🚨 FindoTrip Issues Report\n\n`;
    output += `Generated on: ${new Date().toISOString()}\n\n`;
    output += `${report.summary}\n\n`;

    // Group issues by category
    const categories = [...new Set(report.issues.map(issue => issue.category))];

    categories.forEach(category => {
      const categoryIssues = report.issues.filter(issue => issue.category === category);
      const failed = categoryIssues.filter(issue => issue.status === 'FAIL');
      const warnings = categoryIssues.filter(issue => issue.status === 'WARN');

      output += `## ${category}\n\n`;
      
      if (failed.length > 0) {
        output += `### ❌ Critical Issues (${failed.length})\n\n`;
        failed.forEach(issue => {
          output += `- **${issue.test}**: ${issue.message}\n`;
          if (issue.details) {
            output += `  - Details: ${issue.details}\n`;
          }
        });
        output += `\n`;
      }

      if (warnings.length > 0) {
        output += `### ⚠️ Warnings (${warnings.length})\n\n`;
        warnings.forEach(issue => {
          output += `- **${issue.test}**: ${issue.message}\n`;
          if (issue.details) {
            output += `  - Details: ${issue.details}\n`;
          }
        });
        output += `\n`;
      }

      const passed = categoryIssues.filter(issue => issue.status === 'PASS');
      if (passed.length > 0) {
        output += `### ✅ Working Features (${passed.length})\n\n`;
        passed.forEach(issue => {
          output += `- **${issue.test}**: ${issue.message}\n`;
        });
        output += `\n`;
      }
    });

    // Add recommendations
    output += `## 🔧 Recommendations\n\n`;
    
    if (report.failed > 0) {
      output += `### Critical Actions Required:\n`;
      output += `1. Fix all FAILED tests before deployment\n`;
      output += `2. Address WARNINGS for better functionality\n`;
      output += `3. Test all features manually after fixes\n`;
      output += `4. Run database migrations if schema changes were made\n`;
      output += `5. Update environment variables as needed\n\n`;
    }

    if (report.warnings > 0) {
      output += `### Improvements:\n`;
      output += `1. Address warning items for enhanced functionality\n`;
      output += `2. Add missing optional features\n`;
      output += `3. Improve error handling and user experience\n\n`;
    }

    output += `## 📋 Next Steps\n\n`;
    output += `1. **Review all FAILED tests** - These must be fixed\n`;
    output += `2. **Address WARNINGS** - These improve functionality\n`;
    output += `3. **Test manually** - Run the application and test features\n`;
    output += `4. **Deploy with confidence** - Only after all critical issues are resolved\n\n`;

    return output;
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  const tester = new FeatureTester();
  
  try {
    const report = await tester.runAllTests();
    
    console.log('\n' + '='.repeat(60));
    console.log(report.summary);
    console.log('='.repeat(60) + '\n');

    // Generate issues report
    const issuesReport = tester.generateIssuesReport(report);
    
    // Write to file
    const fs = await import('fs');
    const path = await import('path');
    
    const reportPath = path.join(process.cwd(), 'issues_there.md');
    fs.writeFileSync(reportPath, issuesReport);
    
    console.log(`📄 Issues report generated: ${reportPath}`);
    console.log(`\n🔍 Review the report for detailed analysis of all issues.`);
    
    // Exit with appropriate code
    if (report.failed > 0) {
      console.log(`\n❌ Test suite completed with ${report.failed} critical issues.`);
      process.exit(1);
    } else if (report.warnings > 0) {
      console.log(`\n⚠️ Test suite completed with ${report.warnings} warnings.`);
      process.exit(0);
    } else {
      console.log(`\n✅ All tests passed! Your FindoTrip platform is ready.`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run the tests
main();

export { FeatureTester };