#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { intro, outro, confirm, text, isCancel, spinner } = require('@clack/prompts');
const chalk = require('chalk');

function installPackages(packages, destination) {
    return new Promise((resolve, reject) => {
        const command = `npm install ${packages.join(' ')}`;
        exec(command, { cwd: destination }, (error, stdout, stderr) => {
            if (error) {
                console.error(chalk.red(`Error installing packages: ${stderr}`));
                reject(error);
            } else {
                console.log(chalk.green(`Packages installed: ${stdout}`));
                resolve();
            }
        });
    });
}

const excludeFiles = ['setup.js', 'package.json', 'package-lock.json', '.gitignore', 'README.md'];
function copyProjectStructure(source, destination, includeDashboard) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const items = fs.readdirSync(source);

    if (destination.endsWith('src')) {
        const schemasPath = path.join(destination, 'schemas');
        if (!fs.existsSync(schemasPath)) {
            fs.mkdirSync(schemasPath);
        }
    }

    items.forEach(item => {
        const srcPath = path.join(source, item);
        const destPath = path.join(destination, item);

        if (excludeFiles.includes(item)) {
            return;
        }

        if (!includeDashboard && item === 'admin') {
            return;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            if (destination.endsWith('commands') || destination.endsWith('messages')) {
                const moderationPath = path.join(destination, 'Moderation');
                const otherPath = path.join(destination, 'Other');

                if (!fs.existsSync(moderationPath)) fs.mkdirSync(moderationPath);
                if (!fs.existsSync(otherPath)) fs.mkdirSync(otherPath);
            }

            if (destination.endsWith('events')) {
                const buttonEventPath = path.join(destination, 'buttons');

                if (!fs.existsSync(buttonEventPath)) fs.mkdirSync(buttonEventPath);
            }

            if (destination.endsWith('functions')) {
                const otherFunctionsPath = path.join(destination, 'other');
                if (!fs.existsSync(otherFunctionsPath)) fs.mkdirSync(otherFunctionsPath);
            }

            copyProjectStructure(srcPath, destPath, includeDashboard);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

function createPackageJson(destination) {
    const packageJson = {
        name: path.basename(destination),
        main: "src/index.js",
        scripts: {
            "start": "node .",
            "generate": "node cli.js"
        },

    };

    fs.writeFileSync(path.join(destination, 'package.json'), JSON.stringify(packageJson, null, 2));
}

async function setupProjectStructure() {
    intro(chalk.yellowBright('Welcome to Discobase Setup!'));

    let projectName = await text({
        message: 'Enter your bot name (leave blank to create in the current directory):',
        validate(value) {
            return value.length > 100 ? 'Name too long' : undefined;
        }
    });

    if (isCancel(projectName)) {
        outro(chalk.red('Setup cancelled.'));
        return;
    }

    const installDependencies = await confirm({
        message: 'Do you want to install required dependencies for Discobase? [Recommended]',
        initialValue: true
    });

    if (isCancel(installDependencies)) {
        outro(chalk.red('Setup cancelled.'));
        return;
    }

    const installDiscord = await confirm({
        message: 'Do you want to install discord.js [Recommended]?',
        initialValue: true
    });

    if (isCancel(installDiscord)) {
        outro(chalk.red('Setup cancelled.'));
        return;
    }

    const installMongo = await confirm({
        message: 'Do you want to install MongoDB and Mongoose?',
        initialValue: true
    });

    if (isCancel(installMongo)) {
        outro(chalk.red('Setup cancelled.'));
        return;
    }

    const includeDashboard = await confirm({
        message: 'Do you want the Discobase Dashboard?',
        initialValue: true
    });

    if (isCancel(includeDashboard)) {
        outro(chalk.red('Setup cancelled.'));
        return;
    }

    const sourcePath = __dirname;
    const destinationPath = projectName ? path.join(process.cwd(), projectName) : process.cwd();

    if (projectName && !fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath);
    }

    process.chdir(destinationPath); // Change working directory to destinationPath

    const s = spinner();
    s.start(chalk.yellowBright('Copying project structure...'));
    copyProjectStructure(sourcePath, destinationPath, includeDashboard);
    createPackageJson(destinationPath);
    s.stop(chalk.green('Project structure copied successfully.'));

    const packagesToInstall = [];
    if (installDiscord) packagesToInstall.push('discord.js');
    if (installMongo) packagesToInstall.push('mongoose');
    if (installDependencies) packagesToInstall.push('chalk@4', 'chokidar', 'axios', '@clack/prompts', 'multer', 'express');

    if (packagesToInstall.length > 0) {
        console.log(chalk.yellow('Installing packages...'));
        try {
            await installPackages(packagesToInstall, destinationPath); // Pass destinationPath to installPackages
            console.log(chalk.green('Packages installed successfully.'));
        } catch (err) {
            console.error(chalk.red(err));
        }
    }

    outro(chalk.green('Discobase is installed successfully! Enjoy coding.'));
}

setupProjectStructure();
