#!/usr/bin/env bun

import { name, version, description } from './package.json';
import { color } from 'console-log-colors';
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

cli.command('edit')
    .option('--editor', 'The executable of the editor of your choice (e.g. code for Visual Studio Code)')
    .option('--site', 'The site you want to create the session for (defaults to your site)')
    .description('Creates an interactive edit session, right in your IDE')

let { commands, options } = getCommandsAndOptions(cli);

cli.helpInformation = function () {
    return `${description.replace(`${name} `, `${color.blue(color.bold(name))} `)} (${color.gray(version)})

Usage: ${color.bold(`neko ${color.blue('<command>')} ${color.gray('[...options]')}`)}
${commands.length > 0 ? '\nCommands:\n' + 
    commands.map((c) => 
        `  ${color.blue(color.bold(c.name))}${" ".repeat(20 -c.name.length)}${c.description}${c.options.length > 0 ?
        `\n${c.options.map((o) => `    ${o.flags.split(', ').map((s) => 
                color.gray(color.bold(s))).join(', ')}${" ".repeat(18 -o.flags.length)}${o.description}`
            ).join('\n')}` : ''}`
    ).join('\n'):
''}
${options.length > 0 ? '\nOptions:\n' +
    options.map((o) => `  ${o.flags.split(', ').map((s) => 
        color.gray(color.bold(s))).join(', ')}${" ".repeat(20 -o.flags.length)}${o.description}`
    ).join('\n'):
''}

Made with love by the indiefellas team:
   ${color.green('https://team.indieseas.net')}
`};

cli.parse(process.argv)