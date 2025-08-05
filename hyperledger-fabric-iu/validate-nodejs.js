#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

async function checkNodeVersion() {
    logInfo('Checking Node.js version...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 16) {
        logSuccess(`Node.js version: ${nodeVersion}`);
        return true;
    } else {
        logError(`Node.js version ${nodeVersion} is not supported. Required: >= 16.0.0`);
        return false;
    }
}

function checkNpmVersion() {
    logInfo('Checking npm version...');
    
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        const majorVersion = parseInt(npmVersion.split('.')[0]);
        
        if (majorVersion >= 8) {
            logSuccess(`npm version: ${npmVersion}`);
            return true;
        } else {
            logError(`npm version ${npmVersion} is not supported. Required: >= 8.0.0`);
            return false;
        }
    } catch (error) {
        logError('npm is not installed or not accessible');
        return false;
    }
}

function checkDockerVersion() {
    logInfo('Checking Docker version...');
    
    try {
        const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
        logSuccess(dockerVersion);
        return true;
    } catch (error) {
        logError('Docker is not installed or not accessible');
        return false;
    }
}

function checkProjectStructure() {
    logInfo('Checking project structure...');
    
    const requiredFiles = [
        'package.json',
        'network/docker-compose.yaml',
        'network/network.sh',
        'network/configtx.yaml',
        'network/crypto-config.yaml',
        'chaincode/iu-basic/package.json',
        'chaincode/iu-basic/index.js',
        'application/package.json',
        'application/app.js'
    ];
    
    const requiredDirs = [
        'network',
        'chaincode/iu-basic',
        'application'
    ];
    
    let allGood = true;
    
    // Check directories
    for (const dir of requiredDirs) {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            logSuccess(`Directory exists: ${dir}`);
        } else {
            logError(`Missing directory: ${dir}`);
            allGood = false;
        }
    }
    
    // Check files
    for (const file of requiredFiles) {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            logSuccess(`File exists: ${file}`);
        } else {
            logError(`Missing file: ${file}`);
            allGood = false;
        }
    }
    
    return allGood;
}

function checkNodeDependencies() {
    logInfo('Checking Node.js dependencies...');
    
    const packagePaths = [
        'package.json',
        'chaincode/iu-basic/package.json',
        'application/package.json'
    ];
    
    let allGood = true;
    
    for (const packagePath of packagePaths) {
        if (fs.existsSync(packagePath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const nodeModulesPath = path.dirname(packagePath) + '/node_modules';
                
                if (fs.existsSync(nodeModulesPath)) {
                    logSuccess(`Dependencies installed: ${packagePath}`);
                } else {
                    logWarning(`Dependencies not installed: ${packagePath}. Run 'npm install' in ${path.dirname(packagePath)}`);
                }
            } catch (error) {
                logError(`Invalid package.json: ${packagePath}`);
                allGood = false;
            }
        }
    }
    
    return allGood;
}

function checkChaincodeStructure() {
    logInfo('Checking Node.js chaincode structure...');
    
    const chaincodeIndex = 'chaincode/iu-basic/index.js';
    
    if (fs.existsSync(chaincodeIndex)) {
        try {
            const content = fs.readFileSync(chaincodeIndex, 'utf8');
            
            // Check for required imports and exports
            if (content.includes('fabric-contract-api') && 
                content.includes('InformationUtilityContract') &&
                content.includes('module.exports')) {
                logSuccess('Chaincode structure is valid');
                return true;
            } else {
                logError('Chaincode structure is invalid - missing required components');
                return false;
            }
        } catch (error) {
            logError(`Error reading chaincode file: ${error.message}`);
            return false;
        }
    } else {
        logError('Chaincode index.js not found');
        return false;
    }
}

function checkApplicationStructure() {
    logInfo('Checking Node.js application structure...');
    
    const appFile = 'application/app.js';
    
    if (fs.existsSync(appFile)) {
        try {
            const content = fs.readFileSync(appFile, 'utf8');
            
            // Check for required imports and structure
            if (content.includes('express') && 
                content.includes('fabric-network') &&
                content.includes('app.listen')) {
                logSuccess('Application structure is valid');
                return true;
            } else {
                logError('Application structure is invalid - missing required components');
                return false;
            }
        } catch (error) {
            logError(`Error reading application file: ${error.message}`);
            return false;
        }
    } else {
        logError('Application app.js not found');
        return false;
    }
}

async function main() {
    log('\n🔍 Information Utility - Node.js Environment Validation\n', colors.blue);
    
    const checks = [
        { name: 'Node.js Version', fn: checkNodeVersion },
        { name: 'npm Version', fn: checkNpmVersion },
        { name: 'Docker Version', fn: checkDockerVersion },
        { name: 'Project Structure', fn: checkProjectStructure },
        { name: 'Node.js Dependencies', fn: checkNodeDependencies },
        { name: 'Chaincode Structure', fn: checkChaincodeStructure },
        { name: 'Application Structure', fn: checkApplicationStructure }
    ];
    
    let passedChecks = 0;
    
    for (const check of checks) {
        log(`\n--- ${check.name} ---`);
        const result = await check.fn();
        if (result) {
            passedChecks++;
        }
    }
    
    log(`\n📊 Summary: ${passedChecks}/${checks.length} checks passed\n`);
    
    if (passedChecks === checks.length) {
        logSuccess('🎉 All checks passed! Your Node.js environment is ready.');
        log('\n🚀 Next steps:');
        log('   1. Run: npm run setup');
        log('   2. Run: npm start');
        log('   3. Visit: http://localhost:3000/api/health');
    } else {
        logError('❌ Some checks failed. Please fix the issues above before proceeding.');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
