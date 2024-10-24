function getSimilarCommands(commandName, commands) {
    const similarityThreshold = 0.6;
    const partialMatches = [];
    const similarCommands = [];

    for (const command of commands) {
        const cmdName = command.name;

        if (cmdName.includes(commandName) || commandName.includes(cmdName)) {
            partialMatches.push(cmdName);
        }

        const similarity = calculateSimilarity(commandName, cmdName);
        if (similarity >= similarityThreshold) {
            similarCommands.push({ name: cmdName, similarity });
        }

        if (command.aliases && command.aliases.length > 0) {
            for (const alias of command.aliases) {
                if (alias.includes(commandName) || commandName.includes(alias)) {
                    partialMatches.push(alias);
                }

                const aliasSimilarity = calculateSimilarity(commandName, alias);
                if (aliasSimilarity >= similarityThreshold) {
                    similarCommands.push({ name: alias, similarity: aliasSimilarity });
                }
            }
        }
    }

    const combinedCommands = new Set([...partialMatches, ...similarCommands.map(cmd => cmd.name)]);
    const uniqueCommands = Array.from(combinedCommands);

    similarCommands.sort((a, b) => b.similarity - a.similarity);

    return uniqueCommands.sort((a, b) => {
        const aIndex = similarCommands.findIndex(cmd => cmd.name === a);
        const bIndex = similarCommands.findIndex(cmd => cmd.name === b);
        return bIndex - aIndex;
    });
}

function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return 1 - matrix[len1][len2] / Math.max(len1, len2);
}

module.exports = { getSimilarCommands };
