#!/usr/bin/env bun

import { styleText } from 'node:util';
import fs, { readFileSync, watch } from 'node:fs';
import path from 'node:path';
import { name, version, description } from './package.json';
import * as commander from 'commander';
import NekowebAPI from '@indiefellas/nekoweb-api';
import { tmpdir } from 'node:os';
import yauzl from 'yauzl';
import launchEditor from 'launch-editor';
import isBinaryPath from 'is-binary-path';
import { buffer } from 'node:stream/consumers';
import Watcher from 'watcher';

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

const neko = new NekowebAPI({
    apiKey: '// YOUR API KEY (temporary, i will put a permanent solution for this)',
    appName: 'nekocli'
})

let hasEvent = false;
function watchDir(dest: string, extWatcher?: Watcher) {
    if (extWatcher) extWatcher.close();
    let watcher = new Watcher(dest, { ignoreInitial: true, recursive: true, renameDetection: true });
    watcher.on('error', (err) => {})
    watcher.on('all', async (ev, n: string, nN?: string) => {
        if (hasEvent) {
            console.log(styleText('yellow', '[WRN]'), `Recieved a event while still processing a existing event. Ignoring...`)
            return;
        };
        hasEvent = true;
        let name = n.replace(dest, '')
        let nameNext = nN?.replace(dest, '')
        let dir = false;
        try {
            switch (ev) {
                case 'add':
                case 'addDir':
                    let dir = ev === 'addDir';
                    console.log(styleText('blue', '[INF]'), `Detected ${!dir ? 'File' : 'Folder'}AddEvent on ${name}`)
                    var r = await neko.create(name, dir) as ArrayBuffer;
                    var b = Buffer.from(r);
                    console.log(styleText('blue', '[INF]'), b.toString())
                    watchDir(dest, watcher);
                    break;
                case 'change':
                    console.log(styleText('blue', '[INF]'), `Detected WriteEvent on ${name}`);
                    let f = readFileSync(path.join(dest, name));
                    if (isBinaryPath(path.join(dest, name))) {
                        let r = await neko.upload('/' + name, f) as ArrayBuffer;
                        let b = Buffer.from(r);
                        console.log(styleText('blue', '[INF]'), b.toString())
                    } else {
                        let r = await neko.edit('/' + name, f.toString()) as ArrayBuffer;
                        let b = Buffer.from(r);
                        console.log(styleText('blue', '[INF]'), b.toString())
                    }
                    break;
                case 'rename':
                case 'renameDir':
                    if (!nameNext) break;
                    console.log(styleText('blue', '[INF]'), `Detected RenameEvent on ${name}`)
                    var r = await neko.rename(name, nameNext) as ArrayBuffer;
                    var b = Buffer.from(r);
                    console.log(styleText('blue', '[INF]'), b.toString())
                    break;
                case 'unlink':
                case 'unlinkDir':
                    console.log(styleText('blue', '[INF]'), `Detected DeleteEvent on ${name}`)
                    var r = await neko.delete(name) as ArrayBuffer;
                    var b = Buffer.from(r);
                    console.log(styleText('blue', '[INF]'), b.toString())
                    break;
            }
        } catch (err) {
            console.error(styleText('red', '[ERR]'), (err as Error).message)
        }
        hasEvent = false;
    })
}

cli.command('edit')
    .option('--editor', 'The executable of the editor of your choice (e.g. code for Visual Studio Code)')
    .option('--site', 'The site you want to create the session for (defaults to your site)')
    .description('Creates an interactive edit session, right in your IDE')
    .action(async (command) => {
        console.log(styleText('blue', '[INF]'), 'Downloading your site...');
        var user = await neko.getSiteInfo();
        var file: ArrayBuffer = await neko.generic('/files/export');
        fs.mkdtemp(path.join(tmpdir(), `.nekocli-${user.username}-`), (e, dest) => {
            console.log(styleText('blue', '[INF]'), `Downloaded. Extracting it on ${dest}...`);
            yauzl.fromBuffer(Buffer.from(file), { lazyEntries: true }, (err, zipfile) => {
                if (err) throw err;
                zipfile.readEntry();
                zipfile.on("entry", (entry) => {
                    if (/\/$/.test(entry.fileName)) {
                        fs.mkdirSync(path.join(dest, entry.fileName), { recursive: true });
                        zipfile.readEntry();
                    } else {
                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err) throw err;
                            fs.mkdirSync(path.dirname(path.join(dest, entry.fileName)), { recursive: true });
                            readStream.on("end", () => {
                                zipfile.readEntry();
                            });
                            const writeStream = fs.createWriteStream(path.join(dest, entry.fileName));
                            readStream.pipe(writeStream);
                        });
                    }
                });
                zipfile.on("end", () => {
                    launchEditor(dest);
                    console.log(styleText('blue', '[INF]'), "Finished extracting.");
                    console.log();
                    console.log(styleText('green', '[NKO]'), `   NekoCLI ${version} -`, styleText('green', `(editing site ${user.username}.nekoweb.org)`));
                    console.log(styleText('green', '[NKO]'), `   watching ${dest}`);
                    console.log();
                    watchDir(dest);
                });
                zipfile.on("close", () => {
                    console.log(styleText('yellow', '[WRN]'), "Zip file closed.");
                });
                zipfile.on("error", (err) => {
                    console.error(styleText('red', '[ERR]'), "Error unzipping:", err);
                });
            });
        })
    })


cli.parse(process.argv)


