#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { exec } = require('child_process');

function installPackages(packages) {
    return new Promise((resolve, reject) => {
        const command = `npm install ${packages.join(' ')}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error installing packages: ${stderr}`);
                reject(error);
            } else {
                console.log(`Packages installed: ${stdout}`);
                resolve();
            }
        });
    });
}

const excludeFiles = ['setup.js', 'package.json', 'package-lock.json', '.gitignore'];
function copyProjectStructure(source, destination) {
    // Create the destination directory if it doesn't exist
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

        // Skip the excluded files
        if (excludeFiles.includes(item)) {
            return;
        }

        // Check if the item is a directory
        if (fs.lstatSync(srcPath).isDirectory()) {
            // Check for commands and messages directories to create Moderation and Other folders
            if (destination.endsWith('commands') || destination.endsWith('messages')) {
                const moderationPath = path.join(destination, 'Moderation');
                const otherPath = path.join(destination, 'Other');
                const devPath = path.join(destination, 'dev');

                // Create Moderation folder
                if (!fs.existsSync(moderationPath)) {
                    fs.mkdirSync(moderationPath);
                }

                // Create Other folder
                if (!fs.existsSync(otherPath)) {
                    fs.mkdirSync(otherPath);
                }

                // Create dev folder
                if (!fs.existsSync(devPath)) {
                    fs.mkdirSync(devPath);
                }
            }

            if (destination.endsWith('events')) {
                const buttonEventPath = path.join(destination, 'buttons');
                const modelsEventPath = path.join(destination, 'models');
                const otherEventPath = path.join(destination, 'other');
                const menusEventPath = path.join(destination, 'menus');

                if (!fs.existsSync(buttonEventPath)) {
                    fs.mkdirSync(buttonEventPath);
                }

                if (!fs.existsSync(modelsEventPath)) {
                    fs.mkdirSync(modelsEventPath);
                }

                if (!fs.existsSync(otherEventPath)) {
                    fs.mkdirSync(otherEventPath);
                }

                if (!fs.existsSync(menusEventPath)) {
                    fs.mkdirSync(menusEventPath);
                }

            }

            if (destination.endsWith('functions')) {
                const otherFunctionsPath = path.join(destination, 'other');

                if (!fs.existsSync(otherFunctionsPath)) {
                    fs.mkdirSync(otherFunctionsPath);
                }
          

            }


            copyProjectStructure(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Function to create package.json file
function createPackageJson(destination) {
    const packageJson = {
        name: path.basename(destination),
        main: "src/index.js",
    };

    fs.writeFileSync(path.join(destination, 'package.json'), JSON.stringify(packageJson, null, 2));
}



async function setupProjectStructure() {
    const args = process.argv.slice(2);
    let projectName = args[0] || '';
    let installDiscord, installMongo, installDependencies;

    if (!projectName) {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'Enter your bot name (leave blank to create in the current directory):',
            },
            {
                type: 'confirm',
                name: 'installDependencies',
                message: 'Do you want to install required dependencies for Discobase? [Recommended]',
                default: true
            },
            {
                type: 'confirm',
                name: 'installDiscord',
                message: 'Do you want to install discord.js [Recommended]?',
                default: true
            },
            {
                type: 'confirm',
                name: 'installMongo',
                message: 'Do you want to install MongoDB and Mongoose?',
                default: true
            }
        ]);
        projectName = answers.projectName;
        installDiscord = answers.installDiscord;
        installMongo = answers.installMongo;
        installDependencies = answers.installDependencies;
    } else {
        const confirmAnswers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'installDependencies',
                message: 'Do you want to install required dependencies for Discobase? [Recommended]',
                default: true
            },
            {
                type: 'confirm',
                name: 'installDiscord',
                message: 'Do you want to install discord.js [Recommended]?',
                default: true
            },
            {
                type: 'confirm',
                name: 'installMongo',
                message: 'Do you want to install MongoDB and Mongoose?',
                default: true
            }
        ]);

        installDiscord = confirmAnswers.installDiscord;
        installMongo = confirmAnswers.installMongo;
        installDependencies = confirmAnswers.installDependencies;
    }

    const sourcePath = __dirname;
    const destinationPath = projectName ? path.join(process.cwd(), projectName) : process.cwd();

    if (projectName && !fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath);
    }

    copyProjectStructure(sourcePath, destinationPath);
    createPackageJson(destinationPath); 


    console.log('Discobase is installed Successfully.');

    const packagesToInstall = [];
    if (installDiscord) packagesToInstall.push('discord.js');
    if (installMongo) packagesToInstall.push('mongoose');
    if (installDependencies) packagesToInstall.push('chalk@4', 'chokidar', 'axios');

    if (packagesToInstall.length > 0) {
        console.log(`Installing packages...`);
        try {
            await installPackages(packagesToInstall);
            console.log('Packages installed successfully.');
        } catch (err) {
            console.error(err);
        }
    }
}

setupProjectStructure();