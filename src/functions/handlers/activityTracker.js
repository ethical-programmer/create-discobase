const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');

// Store activities in memory
let activities = [];
const MAX_ACTIVITIES = 100; // Maximum number of activities to store

/**
 * Add a new activity to the activities array
 * @param {string} type - Type of activity (add, change, delete)
 * @param {string} filePath - Path to the file
 * @param {string} details - Additional details about the activity
 */
const addActivity = (type, filePath, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    const relativePath = path.relative(process.cwd(), filePath);
    
    const activity = {
        id: Date.now().toString(),
        type,
        filePath: relativePath,
        details,
        timestamp,
        fileName: path.basename(filePath)
    };
    
    activities.unshift(activity); // Add to beginning of array
    
    // Keep only the last MAX_ACTIVITIES activities
    if (activities.length > MAX_ACTIVITIES) {
        activities = activities.slice(0, MAX_ACTIVITIES);
    }
    
    // Log to console with color
    const typeColors = {
        add: chalk.green,
        change: chalk.blue,
        delete: chalk.red,
        rename: chalk.yellow
    };
    
    const icon = type === 'add' ? '✚' : type === 'change' ? '✎' : type === 'delete' ? '✖' : type === 'rename' ? '↪' : '•';
    console.log(
        `${chalk.gray(`[${timestamp}]`)} ${typeColors[type] ? typeColors[type](`${icon} ${type.toUpperCase()}`) : type} ${chalk.white('│')} ${chalk.cyan(relativePath)} ${details ? chalk.gray(details) : ''}`
    );
};

/**
 * Get all activities
 * @returns {Array} Array of activities
 */
const getActivities = () => {
    return activities;
};

/**
 * Initialize the activity tracker
 * @param {string} rootDir - Root directory to watch
 * @param {Array} ignoredPaths - Paths to ignore
 */
const initActivityTracker = (rootDir = process.cwd(), ignoredPaths = []) => {
    // Default ignored paths
    const defaultIgnored = [
        '**/node_modules/**',
        '**/.git/**',
        '**/errors/**',
        '**/package-lock.json'
    ];
    
    const allIgnored = [...defaultIgnored, ...ignoredPaths];
    
    // Initialize watcher
    const watcher = chokidar.watch(rootDir, {
        ignored: allIgnored,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        }
    });
    
    // Add event listeners
    watcher
        .on('add', (filePath) => {
            addActivity('add', filePath, 'File created');
        })
        .on('change', (filePath) => {
            addActivity('change', filePath, 'File modified');
        })
        .on('unlink', (filePath) => {
            addActivity('delete', filePath, 'File deleted');
        })
        .on('addDir', (dirPath) => {
            addActivity('add', dirPath, 'Directory created');
        })
        .on('unlinkDir', (dirPath) => {
            addActivity('delete', dirPath, 'Directory deleted');
        })
        .on('error', (error) => {
            console.error(`Watcher error: ${error}`);
        });
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${chalk.gray(`[${timestamp}]`)} ${chalk.green.bold('✓ SUCCESS ')} ${chalk.white('│')} Activity tracker initialized`);
    
    return watcher;
};

module.exports = {
    initActivityTracker,
    getFileActivities: getActivities,
    addActivity
};
