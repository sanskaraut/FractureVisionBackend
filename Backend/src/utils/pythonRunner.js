import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const PY_MANAGER_PATH = process.env.PY_MANAGER_PATH || './PythonManager.py';

export async function runPythonManager(inputImagePath, workDir) {
  // Output targets the Python script should write to:
  const outGlb = path.join(workDir, 'output.glb');
  const outJson = path.join(workDir, 'output.json');

  const args = [
    PY_MANAGER_PATH,
    '--input', inputImagePath,
    '--out_glb', outGlb,
    '--out_json', outJson,
    '--headless'
  ];

  await new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    proc.stdout.on('data', (d) => process.stdout.write(`[PY] ${d}`));
    proc.stderr.on('data', (d) => process.stderr.write(`[PY_ERR] ${d}`));

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Python exited with code ${code}`));
    });
  });

  // Return paths (may or may not exist if Python is a stub)
  let glbExists = false;
  try {
    await fs.access(outGlb);
    glbExists = true;
  } catch {}

  let jsonObj = null;
  try {
    const j = await fs.readFile(outJson, 'utf-8');
    jsonObj = JSON.parse(j);
  } catch {
    jsonObj = null;
  }

  return {
    glbPath: glbExists ? outGlb : null,
    meta: jsonObj
  };
}
