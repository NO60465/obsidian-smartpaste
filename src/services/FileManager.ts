import { App, TFile, TFolder } from 'obsidian';
import { FileInfo } from '../settings/types';
import { FILE_SORT_OPTIONS } from '../utils/constants';

export class FileManager {
  private app: App;
  
  constructor(app: App) {
    this.app = app;
  }
  
  /**
   * 获取所有文件信息
   */
  async getAllFiles(): Promise<FileInfo[]> {
    const files = this.app.vault.getMarkdownFiles();
    const fileInfos: FileInfo[] = [];
    
    for (const file of files) {
      const fileInfo = await this.getFileInfo(file);
      fileInfos.push(fileInfo);
    }
    
    return fileInfos;
  }
  
  /**
   * 获取指定文件的信息
   */
  async getFileInfo(file: TFile): Promise<FileInfo> {
    const stat = await this.app.vault.adapter.stat(file.path);
    const basename = file.basename;
    const extension = file.extension;
    
    return {
      path: file.path,
      name: file.name,
      basename,
      extension,
      modifiedTime: stat.mtime,
      createdTime: stat.ctime,
      size: stat.size
    };
  }
  
  /**
   * 排序文件列表
   */
  sortFiles(files: FileInfo[], sortOrder: 'name' | 'modified' | 'created'): FileInfo[] {
    const sortedFiles = [...files];
    
    switch (sortOrder) {
      case 'name':
        sortedFiles.sort((a, b) => a.basename.localeCompare(b.basename));
        break;
      case 'modified':
        sortedFiles.sort((a, b) => b.modifiedTime - a.modifiedTime);
        break;
      case 'created':
        sortedFiles.sort((a, b) => b.createdTime - a.createdTime);
        break;
    }
    
    return sortedFiles;
  }
  
  /**
   * 过滤已选择的文件
   */
  filterSelectedFiles(allFiles: FileInfo[], selectedFiles: string[]): FileInfo[] {
    return allFiles.filter(file => !selectedFiles.includes(file.path));
  }
  
  /**
   * 获取已选择的文件信息
   */
  async getSelectedFileInfos(selectedPaths: string[]): Promise<FileInfo[]> {
    const fileInfos: FileInfo[] = [];
    
    for (const path of selectedPaths) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        const fileInfo = await this.getFileInfo(file);
        fileInfos.push(fileInfo);
      }
    }
    
    return fileInfos;
  }
  
  /**
   * 创建新文件
   */
  async createNewFile(folderPath: string, fileName: string): Promise<TFile | null> {
    try {
      const fullPath = folderPath ? `${folderPath}/${fileName}.md` : `${fileName}.md`;
      const file = await this.app.vault.create(fullPath, '');
      return file;
    } catch (error) {
      console.error('创建文件失败:', error);
      return null;
    }
  }
  
  /**
   * 向文件追加内容
   */
  async appendToFile(filePath: string, content: string): Promise<boolean> {
    try {
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) {
        return false;
      }
      
      const currentContent = await this.app.vault.read(file);
      const newContent = currentContent + '\n' + content;
      await this.app.vault.modify(file, newContent);
      return true;
    } catch (error) {
      console.error('追加内容失败:', error);
      return false;
    }
  }
  
  /**
   * 替换文件内容
   */
  async replaceFileContent(filePath: string, content: string): Promise<boolean> {
    try {
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) {
        return false;
      }
      
      await this.app.vault.modify(file, content);
      return true;
    } catch (error) {
      console.error('替换内容失败:', error);
      return false;
    }
  }
  
  /**
   * 读取文件内容
   */
  async readFileContent(filePath: string): Promise<string> {
    try {
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) {
        return '';
      }
      
      return await this.app.vault.read(file);
    } catch (error) {
      console.error('读取文件失败:', error);
      return '';
    }
  }
  
  /**
   * 搜索文件
   */
  searchFiles(files: FileInfo[], searchText: string): FileInfo[] {
    if (!searchText.trim()) {
      return files;
    }
    
    const searchLower = searchText.toLowerCase();
    return files.filter(file => 
      file.basename.toLowerCase().includes(searchLower) ||
      file.path.toLowerCase().includes(searchLower)
    );
  }
  
  /**
   * 获取文件夹列表
   */
  getFolders(): TFolder[] {
    return this.app.vault.getAllLoadedFiles().filter(file => file instanceof TFolder) as TFolder[];
  }
  
  /**
   * 检查文件是否存在
   */
  fileExists(filePath: string): boolean {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    return file instanceof TFile;
  }
  
  /**
   * 获取文件大小的人类可读格式
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 获取文件修改时间的相对时间
   */
  getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  }
} 