#!/usr/bin/env bun

import { styleText } from 'node:util';
import { name, version, description } from './package.json';
import * as commander from 'commander';

function getCommandsAndOptions(cli: commander.Command) {
    const commands = cli.commands.map((cmd) => ({
        name: cmd.name(),
        description: cmd.description(),
        options: cmd.options.map((opt) => ({
            flags: opt.flags,
            description: opt.description,
        })),
    }));

    const options = cli.options.map((opt) => ({
        flags: opt.flags,
        description: opt.description,
    }));

    return { commands, options };
}

const cli = new commander.Command(name)
    .version(version);

cli.showHelpAfterError(true);

cli.configureHelp({
    styleCommandText: (str) => styleText(['cyan', 'bold'], str),
    styleCommandDescription: (str) => styleText('blue', str),
    styleOptionText: (str) => styleText('gray', str),
    styleArgumentText: (str) => styleText('blue', str),
    styleSubcommandText: (str) => styleText(['blue', 'bold'], str),
});

cli.addHelpText(
    'before',
    `${description.replace(`${name} `, `${styleText(['blue', 'bold'], name)} `)} ${styleText('gray', `(${version})`)}\n`
)

cli.addHelpText(
    'after',
    '\nMade with love by the indiefellas team:\n  ' + styleText(['green', 'underline'], 'https://team.indieseas.net'),
);

cli.command('edit')
    .option('--editor', 'The executable of the editor of your choice (e.g. code for Visual Studio Code)')
    .option('--site', 'The site you want to create the session for (defaults to your site)')
    .description('Creates an interactive edit session, right in your IDE')
    .action((command) => {
        console.log(command.args)
    })


cli.parse(process.argv)

