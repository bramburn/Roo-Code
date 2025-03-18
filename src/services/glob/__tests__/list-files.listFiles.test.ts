import { listFiles } from '../list-files';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { globby } from 'globby';
import { arePathsEqual } from '../../../utils/path';
import { createTempFolder } from '../../utils/temp-folder-creator';

jest.mock('globby', () => ({
  __esModule: true,
  globby: jest.fn()
}));

const mockGlobby = globby as jest.MockedFunction<typeof globby>;

describe('listFiles', () => {
  let tempFolderPath: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    tempFolderPath = await createTempFolder();
  });

  afterEach(() => {
    fs.rmSync(tempFolderPath, { recursive: true, force: true });
  });

  describe('special directories', () => {
    it('should return root directory when path is root', async () => {
      const [files, isLimited] = await listFiles('/', false, 10);
      expect(files).toEqual(['/']);
      expect(isLimited).toBe(false);
    });

    it('should return home directory when path is home', async () => {
      const [files, isLimited] = await listFiles(os.homedir(), false, 10);
      expect(files).toEqual([os.homedir()]);
      expect(isLimited).toBe(false);
    });
  });

  describe('file listing behavior', () => {
    it('should list files with recursion and limit', async () => {
      const [files, isLimited] = await listFiles(tempFolderPath, true, 3);
      expect(files.length).toBeLessThanOrEqual(3);
      expect(isLimited).toBe(true);
    });

    it('should not ignore default directories when not recursive', async () => {
      const [files, isLimited] = await listFiles(tempFolderPath, false, 10);
      expect(files).toEqual(expect.arrayContaining([
        expect.stringMatching(/node_modules\/file1/),
        expect.stringMatching(/__pycache__\/file2/)
      ]));
      expect(isLimited).toBe(false);
    });

    it('should handle limit correctly', async () => {
      const [files, isLimited] = await listFiles(tempFolderPath, false, 10);
      expect(files.length).toBeLessThanOrEqual(10);
      expect(isLimited).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error when globby fails', async () => {
      mockGlobby.mockImplementation(() => Promise.reject(new Error('Globby error')));
      await expect(listFiles(tempFolderPath, true, 10)).rejects.toThrow('Globby error');
    });

    it('should handle timeout gracefully', async () => {
      mockGlobby.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(['file1']), 500)));
      const [files, isLimited] = await listFiles(tempFolderPath, true, 10);
      expect(files.length).toBeLessThanOrEqual(10);
      expect(isLimited).toBe(false);
    }, 6000); // Increase test timeout to 6 seconds

    it('should handle directory markers correctly', async () => {
      const [files] = await listFiles(tempFolderPath, true, 5);
      expect(files).toContain(expect.stringMatching(/dir1\//));
      expect(files).toContain(expect.stringMatching(/dir2\//));
      expect(files).toContain(expect.stringMatching(/file1/));
    });
  });

  describe('hidden files', () => {
    it('should ignore hidden files', async () => {
      const [files] = await listFiles(tempFolderPath, true, 10);
      expect(files).not.toContain(expect.stringMatching(/\/\..+/));
    });
  });

  describe('edge cases', () => {
    it('should handle empty directory', async () => {
      const emptyFolder = path.join(tempFolderPath, 'empty');
      fs.mkdirSync(emptyFolder);
      const [files, isLimited] = await listFiles(emptyFolder, true, 10);
      expect(files).toEqual([]);
      expect(isLimited).toBe(false);
    });

    it('should handle deep directory structure', async () => {
      const deepFolder = path.join(tempFolderPath, 'deep', 'folder', 'structure');
      fs.mkdirSync(deepFolder, { recursive: true });
      const [files, isLimited] = await listFiles(deepFolder, true, 10);
      expect(files.length).toBeLessThanOrEqual(10);
      expect(isLimited).toBe(true);
    });

    it('should handle maximum depth', async () => {
      const maxDepthFolder = path.join(tempFolderPath, 'max', 'depth', 'folder', 'structure', 'level5');
      fs.mkdirSync(maxDepthFolder, { recursive: true });
      const [files, isLimited] = await listFiles(tempFolderPath, true, 10, 5);
      expect(files.length).toBeLessThanOrEqual(10);
      expect(isLimited).toBe(true);
    });
  });
});

describe('arePathsEqual', () => {
  it('should return true for identical paths', () => {
    expect(arePathsEqual('/test', '/test')).toBe(true);
  });

  it('should return false for different paths', () => {
    expect(arePathsEqual('/test', '/different')).toBe(false);
  });
});
