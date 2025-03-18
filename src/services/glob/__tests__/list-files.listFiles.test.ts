import { listFiles } from '../list-files';
import * as path from 'path';
import * as os from 'os';
import { globby } from 'globby';
import { arePathsEqual } from '../../../utils/path';

// Properly mock the path module
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn(),
  parse: jest.fn()
}));

// Properly mock the os module
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: jest.fn()
}));

const mockPath = jest.mocked(path);
const mockOs = jest.mocked(os);

jest.mock('globby', () => ({
  __esModule: true,
  globby: jest.fn()
}));

const mockGlobby = globby as jest.MockedFunction<typeof globby>;

describe('listFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.resolve.mockImplementation((p) => p);
    mockPath.parse.mockImplementation((p) => ({
      root: p,
      dir: '',
      base: '',
      ext: '',
      name: ''
    }));
    mockOs.homedir.mockReturnValue('/home/user');
  });

  describe('special directories', () => {
    it('should return root directory when path is root', async () => {
      mockPath.resolve.mockReturnValue('/');
      const [files, isLimited] = await listFiles('/', false, 10);
      expect(files).toEqual(['/']);
      expect(isLimited).toBe(false);
    });

    it('should return home directory when path is home', async () => {
      const [files, isLimited] = await listFiles('/home/user', false, 10);
      expect(files).toEqual(['/home/user']);
      expect(isLimited).toBe(false);
    });
  });

  describe('file listing behavior', () => {
    it('should list files with recursion and limit', async () => {
      mockGlobby.mockResolvedValue(['file1', 'file2', 'file3']);
      const [files, isLimited] = await listFiles('/test', true, 2);
      expect(files).toEqual(['file1', 'file2']);
      expect(isLimited).toBe(true);
    });

    it('should not ignore default directories when not recursive', async () => {
      mockGlobby.mockResolvedValue(['node_modules/file1', '__pycache__/file2']);
      const [files, isLimited] = await listFiles('/test', false, 10);
      expect(files).toEqual(['node_modules/file1', '__pycache__/file2']);
      expect(isLimited).toBe(false);
    });

    it('should handle limit correctly', async () => {
      const mockFiles = Array.from({ length: 15 }, (_, i) => `file${i + 1}`);
      mockGlobby.mockResolvedValue(mockFiles);
      const [files, isLimited] = await listFiles('/test', true, 10);
      expect(files.length).toBe(10);
      expect(isLimited).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error when globby fails', async () => {
      mockGlobby.mockRejectedValue(new Error('Globby error'));
      await expect(listFiles('/test', true, 10)).rejects.toThrow('Globby error');
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
