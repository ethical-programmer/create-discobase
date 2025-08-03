#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { outro, confirm, text, isCancel, spinner } from '@clack/prompts';
import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';
import cliProgress from 'cli-progress';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const titleGradient = gradient(['#FF416C', '#FF4B2B']);
const successGradient = gradient(['#00b09b', '#96c93d']);

function installPackages(packages, destination) {
    return new Promise((resolve, reject) => {
        const command = `npm install ${packages.join(' ')}`;
        exec(command, { cwd: destination }, (error, stdout, stderr) => {
            if (error) {
                console.error(chalk.red(`❌ Error installing packages: ${stderr}`));
                reject(error);
            } else {
                console.log(chalk.green(`✅ Packages installed:\n${stdout}`));
                resolve();
            }
        });
    });
}

async function displayBanner() {
    return new Promise((resolve) => {
        figlet.text('DISCOBASE', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        }, async function (err, data) {
            if (err) {
                console.log(chalk.red('❌ Banner could not be generated'));
                resolve();
                return;
            }

            const lines = data.split('\n');
            const delay = ms => new Promise(res => setTimeout(res, ms));

            console.log('\n');
            for (let i = 0; i < lines.length; i++) {
                console.log(titleGradient(lines[i]));
                await delay(50);
            }
            console.log('\n');
            resolve();
        });
    });
}

async function animation1() {
    return new Promise((resolve) => {
        const progressBar = new cliProgress.SingleBar({
            format: chalk.cyan('🚀 Setting up project |{bar}|') + ' {percentage}% | {duration_formatted}',
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true,
            barsize: 30,
            stopOnComplete: true,
            clearOnComplete: false,
            forceRedraw: true
        }, cliProgress.Presets.shades_classic);

        progressBar.start(100, 0);
        let value = 0;

        const timer = setInterval(() => {
            value += Math.random() * 3 + 1;
            if (value > 100) value = 100;

            progressBar.update(Math.floor(value));

            if (value >= 100) {
                clearInterval(timer);
                setTimeout(() => {
                    progressBar.stop();
                    resolve();
                }, 200);
            }
        }, 30);
    });
}

function animation2(projectName) {
    const projectDir = projectName && projectName !== 'current directory' ? projectName : '.';
    const message = `
${successGradient('🎉 Project setup completed successfully!')}

${chalk.bold.cyan('👉 Next Steps:')}
${chalk.gray('│')}
${chalk.gray('├─')} ${projectName && projectName !== 'current directory' ? chalk.white(`cd ${projectDir}`) : chalk.gray('(Already in project directory)')}
${chalk.gray('├─')} ${chalk.white('npm start')} ${chalk.gray('- Start your bot')}
${chalk.gray('└─')} ${chalk.white('npm run generate')} ${chalk.gray('- Generate components/commands')}

${chalk.bold.magenta('⚙️  Configuration:')}
${chalk.gray('│')}
${chalk.gray('├─')} Edit ${chalk.yellow('config.json')} with your bot token & id
${chalk.gray('├─')} Setup your database connection
${chalk.gray('└─')} Check the https://www.discobase.site/guide for detailed instructions

${chalk.dim('✨ Happy coding! 🚀')}
    `;

    console.log(boxen(message, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: '#001122'
    }));
}

const excludeFiles = ['setup.js', 'setup.mjs', 'package.json', 'package-lock.json', '.gitignore', 'README.md', 'node_modules', '.git'];

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

        if (excludeFiles.includes(item)) return;
        if (!includeDashboard && item === 'admin') return;

        try {
            if (fs.lstatSync(srcPath).isDirectory()) {
                if (destination.endsWith('commands') || destination.endsWith('messages')) {
                    const moderationPath = path.join(destination, 'Moderation');
                    const otherPath = path.join(destination, 'Other');

                    if (!fs.existsSync(moderationPath)) fs.mkdirSync(moderationPath);
                    if (!fs.existsSync(otherPath)) fs.mkdirSync(otherPath);
                }

                if (destination.endsWith('events')) {
                    const buttonEventPath = path.join(destination, 'Other');
                    if (!fs.existsSync(buttonEventPath)) fs.mkdirSync(buttonEventPath);
                }

                if (destination.endsWith('functions')) {
                    const otherFunctionsPath = path.join(destination, 'Other');
                    if (!fs.existsSync(otherFunctionsPath)) fs.mkdirSync(otherFunctionsPath);
                }

                copyProjectStructure(srcPath, destPath, includeDashboard);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        } catch (error) {
            console.error(chalk.yellow(`⚠️ Warning: Could not copy ${srcPath}: ${error.message}`));
        }
    });
}

function createPackageJson(destination) {
    const packageJson = {
        name: path.basename(destination),
        version: "1.0.0",
        description: "Discord bot created with Discobase",
        main: "src/index.js",
        scripts: {
            "start": "node .",
            "generate": "node cli.js",
            "dev": "nodemon src/index.js"
        },
        author: "",
        license: "ISC"
    };

    fs.writeFileSync(path.join(destination, 'package.json'), JSON.stringify(packageJson, null, 2));
}

function isInsideSourceDirectory(sourcePath, destinationPath) {
    const resolvedSource = path.resolve(sourcePath).toLowerCase().replace(/\\/g, '/');
    const resolvedDest = path.resolve(destinationPath).toLowerCase().replace(/\\/g, '/');

    return resolvedDest.startsWith(resolvedSource + '/') ||
        (resolvedDest.startsWith(resolvedSource) && resolvedDest !== resolvedSource && resolvedDest.length > resolvedSource.length);
}

async function setupProjectStructure() {
    console.clear();
    await displayBanner();

    let projectName = await text({
        message: chalk.cyanBright('📦 Enter your bot name (leave blank to use current directory):'),
        validate(value) {
            return value && value.length > 100 ? 'Name too long' : undefined;
        }
    });

    if (isCancel(projectName)) {
        outro(chalk.red('❌ Setup cancelled.'));
        return;
    }

    projectName = projectName?.trim() || 'current directory';

    const installDependencies = await confirm({
        message: chalk.cyan('📌 Install required Discobase dependencies? [Recommended]'),
        initialValue: true
    });

    if (isCancel(installDependencies)) return outro(chalk.red('❌ Setup cancelled.'));

    const installDiscord = await confirm({
        message: chalk.cyan('💬 Install discord.js? [Recommended]'),
        initialValue: true
    });

    if (isCancel(installDiscord)) return outro(chalk.red('❌ Setup cancelled.'));

    const installMongo = await confirm({
        message: chalk.cyan('📂 Install MongoDB & Mongoose?'),
        initialValue: true
    });

    if (isCancel(installMongo)) return outro(chalk.red('❌ Setup cancelled.'));

    const includeDashboard = await confirm({
        message: chalk.cyan('🧩 Include Discobase Dashboard?'),
        initialValue: true
    });

    if (isCancel(includeDashboard)) return outro(chalk.red('❌ Setup cancelled.'));

    const sourcePath = __dirname;
    let destinationPath;

    if (projectName !== 'current directory') {
        destinationPath = path.join(process.cwd(), projectName);

        if (isInsideSourceDirectory(sourcePath, destinationPath)) {
            console.error(chalk.red('❌ Error: Cannot create project inside the source directory'));
            return outro(chalk.red('❌ Setup cancelled.'));
        }

        if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true });
        }
    } else {
        destinationPath = process.cwd();
    }

    if (projectName !== 'current directory') {
        process.chdir(destinationPath);
    }

    await animation1();
    console.log("\n");

    const s = spinner();
    s.start(chalk.yellowBright('📂 Copying project structure...'));
    copyProjectStructure(sourcePath, destinationPath, includeDashboard);
    createPackageJson(destinationPath);
    s.stop(chalk.green('✅ Project structure copied successfully.'));

    const packagesToInstall = [];
    if (installDiscord) packagesToInstall.push('discord.js');
    if (installMongo) packagesToInstall.push('mongoose');
    if (installDependencies) packagesToInstall.push('chalk@4', 'chokidar', 'axios', '@clack/prompts', 'multer', 'express', 'set-interval-async', 'commander', 'figlet', 'gradient-string', 'micromatch');

    if (packagesToInstall.length > 0) {
        console.log(chalk.yellow('📦 Installing packages...'));
        try {
            await installPackages(packagesToInstall, destinationPath);
            console.log(chalk.green('✅ Packages installed successfully.'));
        } catch (err) {
            console.error(chalk.red(err));
        }
    }

    animation2(projectName);
    outro(chalk.green('✨ Discobase installed successfully! Happy coding 🚀'));
}

setupProjectStructure();
