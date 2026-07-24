import { spawn } from 'node:child_process';
import waitOn from 'wait-on';

const next = spawn('npm', ['run', 'next:dev'], { stdio: 'inherit', shell: true });
await waitOn({ resources: ['http://localhost:3000'], timeout: 30000 });
const tauri = spawn('npm', ['run', 'tauri:dev'], { stdio: 'inherit', shell: true });
const stop = () => { next.kill(); tauri.kill(); };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(0); });
