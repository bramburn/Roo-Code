import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function createTempFolder(): Promise<string> {
  const tempFolderPath = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  // Create fake files, folders, invisible files, and subfolders up to 5 levels
  const folders = ['node_modules', '__pycache__', 'dir1', 'dir2'];
  const files = ['file1', 'file2', '.hiddenFile'];

  folders.forEach(folder => {
    fs.mkdirSync(path.join(tempFolderPath, folder), { recursive: true });
  });

  files.forEach(file => {
    fs.writeFileSync(path.join(tempFolderPath, file), '');
  });

  // Create deep directory structure
  const deepFolder = path.join(tempFolderPath, 'deep', 'folder', 'structure');
  fs.mkdirSync(deepFolder, { recursive: true });

  // Create maximum depth folder
  const maxDepthFolder = path.join(tempFolderPath, 'max', 'depth', 'folder', 'structure', 'level5');
  fs.mkdirSync(maxDepthFolder, { recursive: true });

  return tempFolderPath;
}
