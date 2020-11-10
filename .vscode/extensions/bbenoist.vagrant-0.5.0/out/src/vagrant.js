"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const path = require("path");
class OutputParser {
    static unescapeString(str) {
        return str
            .replace(/%!\(VAGRANT_COMMA\)/g, ',')
            .replace(/\\n/g, '\n');
    }
}
exports.OutputParser = OutputParser;
class Command {
    static spawn(args, cwd) {
        return childProcess.spawn('vagrant', ['--no-color'].concat(args), { cwd: cwd });
    }
    static exec(args, cwd, callback) {
        childProcess.exec('vagrant --no-color ' + args.join(' '), { cwd: cwd }, callback);
    }
    static status(cwd, machine, callback) {
        Command.exec(['status', '--machine-readable'], cwd, (error, stdout, stderr) => {
            if (error)
                throw error;
            var obj = {};
            stdout
                .split(/\r?\n/)
                .map((line) => { return line.trim(); })
                .filter((line) => { return line.length > 0; })
                .map((line) => { return line.split(','); })
                .filter((row) => { return row.length == 4; })
                .map((row) => {
                var unescaped = [];
                row.forEach((cell) => {
                    unescaped.push(OutputParser.unescapeString(cell));
                });
                return unescaped;
            })
                .forEach((row) => {
                if (row[1].length > 0) {
                    if (!Object.prototype.hasOwnProperty.call(obj, row[1])) {
                        obj[row[1]] = {};
                    }
                    obj[row[1]][row[2]] = row[3];
                }
            });
            callback(obj);
        });
    }
    static up(cwd, machine, provision) {
        var args = ['up'];
        if (machine)
            args.push(machine);
        if (provision)
            args.push('--provision');
        return this.spawn(args, cwd);
    }
    static provision(cwd, machine) {
        var args = ['provision'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    }
    static suspend(cwd, machine) {
        var args = ['suspend'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    }
    static halt(cwd, machine) {
        var args = ['halt'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    }
    static reload(cwd, machine, provision) {
        var args = ['reload'];
        if (machine)
            args.push(machine);
        if (provision)
            args.push('--provision');
        return this.spawn(args, cwd);
    }
    static destroy(cwd, machine) {
        var args = ['destroy', '-f'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    }
    static ssh(commands, cwd, machine) {
        var args = ['ssh'];
        if (machine)
            args.push(machine);
        if (commands) {
            commands.forEach((cmd) => {
                args.push('-c');
                args.push(cmd);
            });
        }
        return this.spawn(args, cwd);
    }
    static winrm(commands, cwd, machine, shell) {
        var args = ['winrm'];
        if (machine)
            args.push(machine);
        if (shell) {
            args.push('-s');
            args.push(shell);
        }
        if (commands) {
            commands.forEach((cmd) => {
                args.push('-c');
                args.push(cmd);
            });
        }
        return this.spawn(args, cwd);
    }
}
exports.Command = Command;
class Vagrantfile {
    get fileName() {
        return this._file;
    }
    get directory() {
        return path.dirname(this.fileName);
    }
    constructor(file) {
        this._file = file;
    }
    status(machine, callback) {
        Command.status(this.directory, machine, callback);
    }
    machines(callback) {
        this.status(null, (status) => {
            callback(Object.keys(status).map((key) => {
                return new Machine(key, this.directory);
            }), status);
        });
    }
    up(machine, provision) {
        return Command.up(this.directory, machine, provision);
    }
    provision(machine) {
        return Command.provision(this.directory, machine);
    }
    suspend(machine) {
        return Command.suspend(this.directory, machine);
    }
    halt(machine) {
        return Command.halt(this.directory, machine);
    }
    reload(machine, provision) {
        return Command.reload(this.directory, machine, provision);
    }
    destroy(machine) {
        return Command.destroy(this.directory, machine);
    }
    ssh(commands, machine) {
        return Command.ssh(commands, this.directory, machine);
    }
    winrm(commands, machine, shell) {
        return Command.winrm(commands, this.directory, machine, shell);
    }
}
exports.Vagrantfile = Vagrantfile;
class Machine {
    get name() {
        return this._name;
    }
    get directory() {
        return this._directory;
    }
    constructor(name, directory) {
        this._name = name;
        this._directory = directory;
    }
    status(callback) {
        Command.status(this.directory, this.name, (status) => {
            callback(status[this.name]);
        });
    }
    up(provision) {
        return Command.up(this.directory, this.name, provision);
    }
    provision() {
        return Command.provision(this.directory, this.name);
    }
    suspend() {
        return Command.suspend(this.directory, this.name);
    }
    halt() {
        return Command.halt(this.directory, this.name);
    }
    reload(provision) {
        return Command.reload(this.directory, this.name, provision);
    }
    destroy() {
        return Command.destroy(this.directory, this.name);
    }
    ssh(commands) {
        return Command.ssh(commands, this.directory, this.name);
    }
    winrm(commands, shell) {
        return Command.winrm(commands, this.directory, this.name, shell);
    }
}
exports.Machine = Machine;
//# sourceMappingURL=vagrant.js.map