const fs = require('fs');
const path = require('path');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/fixed');
let intervalId;

const functionsDir = path.join(__dirname, '../');

const getAllFunctionFiles = (dir) => {
    let results = [];

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFunctionFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });

    return results;
};

const loadFunctions = () => {
    const functionFiles = getAllFunctionFiles(functionsDir);
    return functionFiles.map(file => require(file));  
};

const handleFunction = async (func) => {
    if (typeof func === 'function') {
        const config = func.config || {};  
        await handleSingleFunction(func.name, func, config);
    }
};

const handleSingleFunction = async (name, func, config) => {

    const { once, interval, retryAttempts, maxExecution, initializer } = config;

    if (interval && isNaN(interval)) {
        console.error(`Invalid interval for function ${name}. Interval must be a number.`);
        return;
    }

    if (initializer) {
        console.log(`Waiting ${initializer} seconds before starting function.`);
        await new Promise(resolve => setTimeout(resolve, initializer * 1000));
    }

    let executions = 0;
    let retries = 0;

    const runFunction = async () => {
        if (executions >= maxExecution) {
            console.log(`Max executions reached for ${name}.`);
            return clearIntervalAsync(intervalId); 
        }

        try {
            console.log(`Executing function: ${name}...`);
            await func();  
            executions++;
        } catch (error) {
            console.error(`Error executing function ${name}, Retrying...`);
            retries++;
            if (retries >= retryAttempts) {
                console.log(`Failed after ${retryAttempts} retries for ${name}.`);
                return clearIntervalAsync(intervalId);
            }
        }
    };

    if (once) {
        await runFunction();
    } else if (interval) {
        intervalId = setIntervalAsync(runFunction, interval);
    }
};

const runHandlers = async () => {
    const functions = loadFunctions();
    console.log(`Loaded ${functions.length} functions.`);

    for (const func of functions) {
        await handleFunction(func);
    }
};

runHandlers().catch(console.error);
