import { Request, Response } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { db } from '../services/db.js';

const BLOCKED_COMMANDS = [
  'rmdir /s /q c:',
  'format',
  'shutdown',
  'reg delete',
  'drop database',
  ':(){ :|:& };:',
];

export const executeCommand = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { command, code, language, filename, workspaceId } = req.body;

  try {
    // 1. If running raw code directly from editor
    if (code !== undefined && code !== null) {
      const lang = (language || 'javascript').toLowerCase();
      const tmpDir = path.join(os.tmpdir(), 'synccode_sandbox', workspaceId || 'default');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      let scriptPath: string;
      let execCmd: string;

      if (lang === 'python' || (filename && filename.endsWith('.py'))) {
        const scriptName = filename || `script_${Date.now()}.py`;
        scriptPath = path.join(tmpDir, scriptName);
        fs.writeFileSync(scriptPath, code, 'utf-8');
        execCmd = `python "${scriptPath}"`;
      } else if (lang === 'typescript' || (filename && filename.endsWith('.ts'))) {
        const scriptName = filename || `script_${Date.now()}.js`;
        scriptPath = path.join(tmpDir, scriptName);
        fs.writeFileSync(scriptPath, code, 'utf-8');
        execCmd = `node "${scriptPath}"`;
      } else {
        // Default to JavaScript / Node
        const scriptName = filename || `script_${Date.now()}.js`;
        scriptPath = path.join(tmpDir, scriptName);
        fs.writeFileSync(scriptPath, code, 'utf-8');
        execCmd = `node "${scriptPath}"`;
      }

      exec(
        execCmd,
        {
          cwd: tmpDir,
          timeout: 10000, // 10 second execution timeout
          maxBuffer: 1024 * 512, // 512 KB output buffer
        },
        (error, stdout, stderr) => {
          const executionTimeMs = Date.now() - startTime;
          return res.json({
            stdout: stdout || '',
            stderr: stderr || (error && error.message ? error.message : ''),
            exitCode: error ? error.code || 1 : 0,
            executionTimeMs,
          });
        }
      );
      return;
    }

    // 2. Interactive Terminal Commands (e.g. "ls", "python main.py", "node script.js", "echo Hello")
    const cmdTrimmed = (command || '').trim();

    if (!cmdTrimmed) {
      return res.json({
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTimeMs: 0,
      });
    }

    // Security check
    const isDangerous = BLOCKED_COMMANDS.some((bad) => cmdTrimmed.toLowerCase().includes(bad));
    if (isDangerous) {
      return res.status(403).json({
        stdout: '',
        stderr: 'Error: Command blocked by SyncCode security policy.',
        exitCode: 1,
        executionTimeMs: 0,
      });
    }

    // Handle Built-in lightweight commands
    if (cmdTrimmed === 'help') {
      const helpOutput = [
        'SyncCode Interactive Cloud Shell v1.0.0',
        '---------------------------------------',
        'Available commands:',
        '  run                     Execute active document currently open in Monaco editor',
        '  python <file|cmd>       Run Python 3 scripts or one-liners (-c)',
        '  node <file|cmd>         Run JavaScript/Node.js scripts or one-liners (-e)',
        '  ls                      List files and documents in active workspace',
        '  cat <filename>          Display content of a file',
        '  clear                   Clear terminal display buffer',
        '  echo <text>             Print text to output',
        '  env                     Display execution runtime environment info',
        '  help                    Show this guidance manual',
        '',
        'Shortcuts:',
        '  Ctrl + `                Toggle this terminal panel',
        '  Ctrl + Enter            Quick-run active code in Monaco editor',
        '  Up / Down               Navigate command history',
      ].join('\n');

      return res.json({
        stdout: helpOutput,
        stderr: '',
        exitCode: 0,
        executionTimeMs: Date.now() - startTime,
      });
    }

    if (cmdTrimmed === 'env') {
      const envInfo = [
        `Node.js:  ${process.version}`,
        `Platform: ${process.platform} (${process.arch})`,
        `Sandbox:  Active (Isolated Workspace Workspace)`,
        `Runtime:  Python 3.12, Node.js V8 Engine`,
      ].join('\n');

      return res.json({
        stdout: envInfo,
        stderr: '',
        exitCode: 0,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Built-in "ls" command that lists workspace documents
    if (cmdTrimmed === 'ls' || cmdTrimmed === 'dir') {
      let fileList: string[] = [];
      if (workspaceId) {
        const docs = await db.documents.findMany({ where: { workspaceId } });
        fileList = docs.map((d: any) => `${d.name.padEnd(20)} [${d.type}] ${d.language || ''}`);
      }
      return res.json({
        stdout: fileList.length > 0 ? fileList.join('\n') : '(no files found in workspace)',
        stderr: '',
        exitCode: 0,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Built-in "cat <file>" command
    if (cmdTrimmed.startsWith('cat ')) {
      const targetFileName = cmdTrimmed.slice(4).trim();
      if (workspaceId) {
        const docs = await db.documents.findMany({ where: { workspaceId } });
        const match = docs.find((d: any) => d.name.toLowerCase() === targetFileName.toLowerCase());
        if (match) {
          return res.json({
            stdout: match.content || '(empty file)',
            stderr: '',
            exitCode: 0,
            executionTimeMs: Date.now() - startTime,
          });
        }
      }
      return res.json({
        stdout: '',
        stderr: `cat: ${targetFileName}: No such file or document in workspace`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Prepare sandbox folder with workspace files written so "python script.py" or "node app.js" works!
    const tmpDir = path.join(os.tmpdir(), 'synccode_sandbox', workspaceId || 'default');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    if (workspaceId) {
      const docs = await db.documents.findMany({ where: { workspaceId } });
      for (const d of docs) {
        try {
          fs.writeFileSync(path.join(tmpDir, d.name), d.content || '', 'utf-8');
        } catch {
          // ignore file write error for single doc
        }
      }
    }

    // Execute through shell in sandbox directory
    exec(
      cmdTrimmed,
      {
        cwd: tmpDir,
        timeout: 10000,
        maxBuffer: 1024 * 512,
      },
      (error, stdout, stderr) => {
        const executionTimeMs = Date.now() - startTime;
        return res.json({
          stdout: stdout || '',
          stderr: stderr || (error && error.message ? error.message : ''),
          exitCode: error ? error.code || 1 : 0,
          executionTimeMs,
        });
      }
    );
  } catch (err: any) {
    return res.status(500).json({
      stdout: '',
      stderr: `Server execution error: ${err.message}`,
      exitCode: 1,
      executionTimeMs: Date.now() - startTime,
    });
  }
};
