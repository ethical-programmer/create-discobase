![Logo](https://i.ibb.co/YBJHtQLL/disco.jpg)

<div align="center">

[![Discord](https://img.shields.io/discord/1188398653530984539?logo=discord&logoColor=%23fff&logoSize=auto&label=Discord&labelColor=%23505050&color=%235E6AE9)](https://discord.gg/ethical-programmer-s-1188398653530984539)
[![NPM Version](https://img.shields.io/npm/v/create-discobase?logo=npm&label=npm&labelColor=%235C5C5C&color=%23F58142)](https://www.npmjs.com/package/create-discobase)
[![NPM License](https://img.shields.io/npm/l/create-discobase)](https://github.com/ethical-programmer/create-discobase/blob/main/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dt/create-discobase?logo=npm&logoColor=white&label=downloads&labelColor=%235C5C5C&color=%2300C853)](https://www.npmjs.com/package/create-discobase)

</div>

# DiscoBase

**The modern, production-ready framework for building powerful Discord bots with ease.**

DiscoBase provides everything you need to create scalable, feature-rich Discord bots using Discord.js v14. Whether you're building a simple utility bot or a complex multi-server system, DiscoBase gives you the tools and flexibility to succeed.

> ✨ Built on Discord.js v14<br>
> 🚀 Production-ready architecture<br>
> 🌐 **Documentation:** [discobase.site](https://www.discobase.site)

## 🚀 Quick Start

Create your Discord bot in seconds:

```bash
npx create-discobase@latest
```

The interactive setup will guide you through:
- ✅ **Edition Selection**: Core (package-based) or Source (full customization)
- ✅ **MongoDB Integration**: Optional database setup
- ✅ **Admin Dashboard**: Built-in web dashboard
- ✅ **Auto Installation**: All dependencies installed automatically

## ⚡ Core Features

### 📦 Command System
- **Slash Commands** - Modern Discord interactions
- **Prefix Commands** - Traditional text-based commands
- **Hot Reload** - Changes apply instantly without restart
- **Command Generator** - Scaffold new commands with `npm run generate`
- **Command Manager** - Enable/disable commands with `npm run manage`
- **Middleware** - Pre-execution logic for commands

### 🔐 Advanced Controls
- **Bot Permissions** - Automatic bot permission validation
- **User Permissions** - Role-based access control
- **Cooldowns** - Built-in rate limiting per user
- **Cooldown Messages** - Custom cooldown feedback
- **Role Requirements** - Restrict commands to specific roles
- **Owner/Admin Only** - Special access controls
- **Dev Mode** - Test commands in specific servers
- **Sharding** - Built-in scaling support (Optional)

### 📊 Dashboard & Monitoring
- **Real-time Stats** - Monitor bot performance live
- **Guild Management** - View and manage all servers
- **Command Analytics** - Track slash & prefix command usage separately
- **Error Logging** - Automatic error tracking
- **Activity Tracker** - Monitor file changes in real-time

### ⚙️ Developer Experience
- **Auto-detect Intents** - Never miss required intents
- **Structured & Scalable** - Clean, organized codebase
- **MongoDB Integration** - Built-in database support with Mongoose
- **Configurable Functions** - Advanced function options
- **Error Recovery** - Graceful error handling
- **TypeScript Support** - Enhanced IntelliSense & type checking


## 📦 Installation

### Interactive Setup 
```bash
npx create-discobase@latest
```


## 🧩 Command Options

Powerful options available for every command:

| Option | Type | Description |
|--------|------|-------------|
| `ownerOnly` | boolean | Only bot owner can use this command |
| `adminOnly` | boolean | Only users in `bot.admins` can use it |
| `devOnly` | boolean | Only works in developer servers |
| `botPermissions` | array | Required bot permissions (e.g., `['SendMessages', 'ManageChannels']`) |
| `userPermissions` | array | Required user permissions (e.g., `['Administrator', 'KickMembers']`) |
| `cooldown` | number | Cooldown in seconds before reuse (default: 3) |
| `disabled` | boolean | Disable command without deleting it |
| `requiredRoles` | array | Array of role IDs required to run command |

**Example Command:**

```javascript
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!'),
  cooldown: 5,
  botPermissions: ['SendMessages'],
  userPermissions: ['SendMessages'],
  async execute(interaction, client) {
    // Your command logic here
  }
};
```

## 🛡️ Middleware System

DiscoBase includes a powerful middleware system that runs **before** any slash command is executed. Use it for global checks like blacklists, maintenance mode, or custom analytics.

**Location:** `src/middleware/index.js`

```javascript
module.exports = {
    // Return true to continue, false to block the command
    checkBlacklist: async (interaction) => {
        const isBlacklisted = await db.blacklist.findOne({ userId: interaction.user.id });
        if (isBlacklisted) {
            await interaction.reply({ content: 'You are blacklisted.', ephemeral: true });
            return false; // Blocks command
        }
        return true; // Continues execution
    }
};
```

## 📡 Sharding (Optional)

For large bots (2,500+ servers), DiscoBase supports automatic sharding. You can enable this during setup.

**Usage:**
```bash
node sharding.js
# or add "shard": "node sharding.js" to your package.json scripts
```

This will spawn multiple processes of your bot to handle high load, automatically managed by Discord.js `ShardingManager`.

## 📅 Event Options

Configure your event handlers with these options:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | **Required.** The Discord.js event name (e.g., `'messageCreate'`, `'guildMemberAdd'`) |
| `customId` | string | For button/select menu interactions - matches the component's customId |
| `cooldown` | number | Cooldown in seconds before reuse |
| `cooldownMessage` | string | Cooldown message to send when user uses command while on cooldown. Use `{time}` for showing remaining time in message |
| `botPermissions` | array | Required bot permissions (e.g., `['SendMessages', 'ManageChannels']`) |
| `userPermissions` | array | Required user permissions (e.g., `['Administrator', 'KickMembers']`) |
| `rateLimit` | object | Rate limit configuration |

**Example Event:**

```javascript
module.exports = {
  name: 'interactionCreate',
  customId: 'verify-button', //or multiple customIds in array ['verify-button', 'verify-button2']
  cooldown: 5,
  cooldownMessage: 'You are on cooldown! Please try again in {time}.',
  botPermissions: ['SendMessages'],
  userPermissions: ['SendMessages'],
  rateLimit: {
    type: 'user', // 'user', 'guild', 'channel',
    max: 5, // max uses
    window: 60000 // 60 seconds
  },
  
  async execute(interaction, client) {
    // Your event logic here
  }
};
```


## ⚙️ Configuration

Your `config.json` structure:

| Parameter | Type | Description |
|-----------|------|-------------|
| `bot.token` | string | **Required.** Your Discord bot token |
| `bot.id` | string | **Required.** Your Discord bot ID |
| `bot.admins` | array | Optional. List of admin user IDs |
| `bot.ownerId` | string | Optional. The owner's user ID |
| `bot.developerCommandsServerIds` | array | Optional. Server IDs for dev-only commands |
| `database.mongodbUrl` | string | Optional. MongoDB connection URL |
| `logging.guildJoinLogsId` | string | Optional. Channel ID for guild join logs |
| `logging.guildLeaveLogsId` | string | Optional. Channel ID for guild leave logs |
| `logging.commandLogsChannelId` | string | Optional. Channel ID for command logs |
| `logging.errorLogs` | string | Optional. Webhook URL for error logging |
| `prefix.value` | string | Optional. Prefix for text commands |

## 🔧 Function Options

Advanced function configuration:

| Property | Type | Description |
|----------|------|-------------|
| `once` | boolean | Run once then stop |
| `interval` | number | Time (ms) between repeated executions |
| `retryAttempts` | number | Number of retries if function fails |
| `maxExecution` | number | Maximum number of executions allowed |
| `initializer` | number | Initial value/state for setup |

**Example:**

```javascript
const exampleFunction = async () => {
  console.log("Function executed!");
};

exampleFunction.config = {
  once: false,
  interval: 10000, // Run every 10 seconds
  retryAttempts: 3,
  maxExecution: 100,
  initializer: 0
};

module.exports = exampleFunction;
```

## 🔍 Activity Tracker

Monitor all file changes in real-time through `discobase.json`:

```json
{
  "activityTracker": {
    "enabled": true,
    "ignoredPaths": [
      "**/logs/**",
      "**/node_modules/**",
      "**/private/**"
    ]
  }
}
```

## ✨ Generate Commands & Events

Create new commands and events instantly:

```bash
npm run generate
```

### Supported Builders:
- **EmbedBuilder** - Rich embedded messages
- **ButtonBuilder & ActionRowBuilder** - Interactive buttons
- **StringSelectMenuBuilder** - Dropdown menus
- **ModalBuilder & TextInputBuilder** - Input forms

The CLI automatically generates imports and example code!

## 📊 Manage Commands & Events

Edit, pause, or delete commands and events:

```bash
npm run manage
```

Features:
- Enable/disable commands without deleting
- Edit command properties
- View all commands and events
- Bulk operations

## 📚 Documentation

For complete guides, tutorials, and API reference:

🌐 **[discobase.site](https://www.discobase.site)**

## 💬 Community & Support

Join our Discord community:

[![Discord Server](https://img.shields.io/discord/1188398653530984539?logo=discord&logoColor=%23fff&logoSize=auto&label=Join%20Discord&labelColor=%23505050&color=%235E6AE9)](https://discord.gg/ethical-programmer-s-1188398653530984539)

## 🔗 Links

- **NPM Package:** [create-discobase](https://www.npmjs.com/package/create-discobase)
- **Core Library:** [discobase-core](https://www.npmjs.com/package/discobase-core)
- **GitHub:** [ethical-programmer/create-discobase](https://github.com/ethical-programmer/create-discobase)
- **Documentation:** [discobase.site](https://www.discobase.site)
- **Discord:** [Join our community](https://discord.gg/ethical-programmer-s-1188398653530984539)

## 📜 License

Apache-2.0 © DiscoBase Team

<div align="center">
  <sub>Built with ❤️ by the DiscoBase Team</sub>
</div>
