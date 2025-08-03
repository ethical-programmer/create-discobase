const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const projectRoot = process.cwd();
const tempDir = path.join(projectRoot, 'temp-discobase'); 

const filesToReplaceFully = [
    'discobase.json',
    'cli.js',
];

const eventHandlerFiles = [
    'src/events/handlers/interactionCreate.js',
    'src/events/handlers/prefixCreate.js',
    'src/events/handlers/ready.js',
];

const functionHandlerFiles = [
    'src/functions/handlers/antiCrash.js',
    'src/functions/handlers/functionHandler.js',
    'src/functions/handlers/handelEvents.js',
    'src/functions/handlers/handleCommands.js',
    'src/functions/handlers/prefixHandler.js',
    'src/functions/handlers/requiredIntents.js',
    'src/functions/handlers/similarity.js',
    'src/functions/handlers/watchFolders.js',
    'src/functions/handlers/activityTracker.js',
];

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

function copyFile(srcFullPath, destFullPath) {
    const destDir = path.dirname(destFullPath);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcFullPath, destFullPath);
    console.log(chalk.green(`Copied: ${path.relative(projectRoot, destFullPath)}`));
}

function copyFolder(srcFolder, destFolder) {
    if (!fs.existsSync(srcFolder)) {
        console.log(chalk.yellow(`⚠️  Skipping folder: ${srcFolder} not found.`));
        return;
    }

    deleteFolderRecursive(destFolder);

    function copyDir(srcDir, destDir) {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.readdirSync(srcDir).forEach((file) => {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            if (fs.lstatSync(srcFile).isDirectory()) {
                copyDir(srcFile, destFile);
            } else {
                fs.copyFileSync(srcFile, destFile);
            }
        });
    }

    copyDir(srcFolder, destFolder);
    console.log(chalk.green(`Replaced folder: ${path.relative(projectRoot, destFolder)}`));
}

function runNpxDiscobase() {
    console.log(chalk.cyan('Running npx create-discobase@latest to scaffold temp project...'));
    try {
        if (fs.existsSync(tempDir)) {
            deleteFolderRecursive(tempDir);
        }
        fs.mkdirSync(tempDir); // ✅ Make sure it exists!
        execSync(`npx create-discobase@latest`, { cwd: tempDir, stdio: 'inherit' });
        console.log(chalk.green('✅ Scaffolded latest discobase into local temp folder.'));
    } catch (err) {
        console.error(chalk.red('❌ Failed to scaffold discobase via npx:'), err.message);
        process.exit(1);
    }

    console.log(chalk.cyan('📦 Installing figlet and gradient-string...'));
    try {
        execSync(`npm install figlet gradient-string micromatch`, { cwd: projectRoot, stdio: 'inherit' });
        console.log(chalk.green('✅ figlet and gradient-string installed successfully.'));
    } catch (err) {
        console.error(chalk.red('❌ Failed to install figlet and gradient-string:'), err.message);
    }
}

function updateIndexJS() {
    const srcPath = path.join(tempDir, 'src', 'index.js');
    const destPath = path.join(projectRoot, 'src', 'index.js');

    if (!fs.existsSync(srcPath)) {
        console.log(chalk.red('Source index.js not found!'));
        return;
    }
    if (!fs.existsSync(destPath)) {
        copyFile(srcPath, destPath);
        return;
    }

    const srcContent = fs.readFileSync(srcPath, 'utf8');
    const destContent = fs.readFileSync(destPath, 'utf8');

    const splitComment = '//* You can start writing your custom bot logic from here';

    const srcParts = srcContent.split(splitComment);
    if (srcParts.length < 2) {
        console.log(chalk.red('Source index.js missing special comment, copying whole file.'));
        copyFile(srcPath, destPath);
        return;
    }
    const destParts = destContent.split(splitComment);

    const newContent = srcParts[0] + splitComment + (destParts[1] || '');

    fs.writeFileSync(destPath, newContent, 'utf8');
    console.log(chalk.green('✅ index.js updated, preserving user custom code.'));
}

function runUpdate() {
    runNpxDiscobase();

    copyFolder(path.join(tempDir, 'admin'), path.join(projectRoot, 'admin'));

    filesToReplaceFully.forEach(file => {
        copyFile(path.join(tempDir, file), path.join(projectRoot, file));
    });

    eventHandlerFiles.forEach(file => {
        copyFile(path.join(tempDir, file), path.join(projectRoot, file));
    });

    functionHandlerFiles.forEach(file => {
        copyFile(path.join(tempDir, file), path.join(projectRoot, file));
    });

    updateIndexJS();
}

runUpdate();
deleteFolderRecursive(tempDir);
console.log(chalk.cyan('✅ Temp folder cleaned. All done!'));