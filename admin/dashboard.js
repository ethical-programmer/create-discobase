const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const client = require('../src/index')
const multer = require('multer');
const upload = multer();
const { getActivities } = require('../src/functions/handlers/handleCommands');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(upload.fields([{ name: 'new-bot-avatar' }, { name: 'new-bot-banner' }]));



function loadConfig() {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return {};
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/bot', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'botprofile.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'config.html'));
});

app.get('/commands', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'commands.html'));
});

app.get('/errors', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'errors.html'));
});

app.get('/guilds', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'guilds.html'));
});

app.get('/api/bot-info', async (req, res) => {
    try {

        const fetchedUser = await client.users.fetch(client.user.id, { force: true });
        const botStatus = client.presence.status;
        const botName = client.user.username;
        const botAvatar = `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`;

        const botId = client.user.id;
        const botBanner = `https://cdn.discordapp.com/banners/${client.user.id}/${fetchedUser.banner}.png`;

        const isVerified = client.user.verified;
        res.json({
            botStatus,
            botName,
            botId,
            botBanner,
            botAvatar,
            isVerified
        })
    } catch (err) {
        console.error('Error fetching bot info:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.post('/api/update-bot', async (req, res) => {
    const { newBotName } = req.body;

    if (newBotName) {
        try {
            await client.user.setUsername(newBotName);
        } catch (error) {
            console.error('Error updating bot name:', error);
            return res.json({ success: false, message: 'Failed to update bot name' });
        }
    }

    // Update bot avatar if provided
    const avatarFile = req.files['new-bot-avatar']?.[0];
    if (avatarFile) {
        try {
            await client.user.setAvatar(avatarFile.buffer); // Use buffer for the image
        } catch (error) {
            console.error('Error updating bot avatar:', error);
            return res.json({ success: false, message: 'Failed to update bot avatar' });
        }
    }

    const bannerFile = req.files['new-bot-banner']?.[0];
    if (bannerFile) {
        try {
            await client.user.setBanner(bannerFile.buffer);
        } catch (error) {
            console.error('Error updating bot banner:', error);
            return res.json({ success: false, message: 'Failed to update bot banner' });
        }
    }

    return res.json({ success: true });
});

app.get('/api/guilds', async (req, res) => {
    const guildsData = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
    }));

    res.json(guildsData);
});

app.get('/api/bot-stats', async (req, res) => {
    try {
        const totalServers = client.guilds.cache.size;
        const totalCommands = (client.commands ? client.commands.size : 0) + (client.prefix ? client.prefix.size : 0);
        const botName = client.user.username;
        const botIcon = `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`;
        let totalUsers = 0;
        client.guilds.cache.forEach(guild => {
            totalUsers += guild.memberCount;
        });

        res.json({
            totalServers,
            totalUsers,
            totalCommands,
            botName,
            botIcon
        });
    } catch (err) {
        console.error('Error fetching bot stats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/update-config', (req, res) => {
    // Load the existing config
    const currentConfig = loadConfig();

    // Update only the fields that are provided
    const newConfig = {
        bot: {
            ...currentConfig.bot, // Keep existing values
            ...(req.body.token && { token: req.body.token }), // Update token if provided
            ...(req.body.id && { id: req.body.id }), // Update id if provided
            ...(req.body.admins && { admins: req.body.admins.split(',') }), // Update admins if provided
            ...(req.body.ownerId && { ownerId: req.body.ownerId }), // Update ownerId if provided
            ...(req.body.developerCommandsServerIds && {
                developerCommandsServerIds: req.body.developerCommandsServerIds.split(','),
            }), // Update developerCommandsServerIds if provided
        },
        database: {
            ...(currentConfig.database || {}), 
            ...(req.body.mongodbUrl && { mongodbUrl: req.body.mongodbUrl }),
        },
        logging: {
            ...(currentConfig.logging || {}), 
            ...(req.body.guildJoinLogsId && { guildJoinLogsId: req.body.guildJoinLogsId }), 
            ...(req.body.guildLeaveLogsId && { guildLeaveLogsId: req.body.guildLeaveLogsId }), 
            ...(req.body.commandLogsChannelId && { commandLogsChannelId: req.body.commandLogsChannelId }), 
            ...(req.body.errorLogs && { errorLogs: req.body.errorLogs }), 
        },
        prefix: {
            ...(currentConfig.prefix || {}), 
            ...(req.body.prefix && { value: req.body.prefix }),
        },
    };

    fs.writeFileSync(path.join(__dirname, '../config.json'), JSON.stringify(newConfig, null, 2));
    res.redirect('/config?success=true');
});

app.get('/api/commands', (req, res) => {
    const slashCommandsDir = path.join(__dirname, '../src/commands');
    const prefixCommandsDir = path.join(__dirname, '../src/messages');
    const commands = {
        slash: [],
        prefix: []
    };

    // A function to read commands from a directory
    function readCommands(dir, commandArray, type) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    return reject(`Error reading ${type} commands`);
                }

                const promises = files.map(file => {
                    const filePath = path.join(dir, file);
                    return new Promise((resolveFile, rejectFile) => {
                        fs.stat(filePath, (err, stats) => {
                            if (err) {
                                return rejectFile('Error reading file stats');
                            }

                            if (stats.isDirectory()) {
                                readCommands(filePath, commandArray, type).then(resolveFile).catch(rejectFile);
                            } else if (path.extname(file) === '.js') {
                                const command = require(filePath);
                                if (type === 'slash') {
                                    commandArray.push({
                                        name: command.data.name,
                                        description: command.data.description
                                    });
                                } else {
                                    commandArray.push({
                                        name: command.name,
                                        description: command.description
                                    });
                                }
                                resolveFile();
                            } else {
                                resolveFile(); // Handle non-JS files gracefully
                            }
                        });
                    });
                });

                // Wait for all promises to resolve
                Promise.all(promises).then(resolve).catch(reject);
            });
        });
    }

    // Read slash commands and then prefix commands
    readCommands(slashCommandsDir, commands.slash, 'slash')
        .then(() => readCommands(prefixCommandsDir, commands.prefix, 'prefix'))
        .then(() => {
            res.json(commands); // Send response after both commands are read
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err });
        });
});

app.get('/api/activities', (req, res) => {
    const activities = getActivities();
    res.json(activities);
});

app.get('/api/errors', (req, res) => {
    const errorsDir = path.join(__dirname, '../errors'); // Path to the errors folder

    // Ensure that the folder exists
    if (!fs.existsSync(errorsDir)) {
        return res.json({ errors: [], message: 'No errors found' });
    }

    // Read the files from the errors folder
    fs.readdir(errorsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read error logs' });
        }

        // Sort files by date (latest first)
        files.sort((a, b) => fs.statSync(path.join(errorsDir, b)).mtime - fs.statSync(path.join(errorsDir, a)).mtime);

        // Prepare an array to store errors
        const errorLogs = [];

        // Read the content of each error file
        files.forEach(file => {
            const filePath = path.join(errorsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            errorLogs.push({ fileName: file, content });
        });

        // Send the error logs to the front-end
        res.json({ errors: errorLogs });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Admin dashboard running at http://localhost:${port}`);
});
