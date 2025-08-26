import { Plugin, App, Editor, MarkdownView, Notice, Modal, TFolder, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from './src/utils/constants';
import { ObsidianCutSettings } from './src/settings/types';
import { ObsidianCutSettingTab } from './src/settings/SettingsTab';
import { FileManager } from './src/services/FileManager';
import { ContentFormatter } from './src/services/ContentFormatter';
import { HotkeyManager } from './src/services/HotkeyManager';
import { FileInfo, PanelState } from './src/settings/types';
import { FloatingPanel, FloatingPanelOptions } from './src/ui/FloatingPanel';



// 创建文件模态框类
class CreateFileModal extends Modal {
  private plugin: ObsidianCutPlugin;

  constructor(app: App, plugin: ObsidianCutPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('obsidian-smartpaste-create-file-modal');

    // 创建标题
    const title = contentEl.createEl('h2', { text: '创建新文件' });
    title.style.marginBottom = '20px';

    // 创建文件夹选择器
    const folderContainer = contentEl.createEl('div');
    folderContainer.style.marginBottom = '15px';

    const folderLabel = folderContainer.createEl('label', { text: '选择文件夹:' });
    folderLabel.style.display = 'block';
    folderLabel.style.marginBottom = '5px';
    folderLabel.style.fontWeight = '500';

    const folderSelect = folderContainer.createEl('select');
    folderSelect.style.width = '100%';
    folderSelect.style.padding = '8px';
    folderSelect.style.border = '1px solid var(--background-modifier-border)';
    folderSelect.style.borderRadius = '4px';
    folderSelect.style.backgroundColor = 'var(--background-primary)';
    folderSelect.style.color = 'var(--text-normal)';

    // 添加根目录选项
    const rootOption = folderSelect.createEl('option');
    rootOption.value = '';
    rootOption.textContent = '根目录';

    // 获取所有文件夹并添加到选择器
    const folders = this.plugin.fileManager.getFolders();
    const sortedFolders = folders.sort((a, b) => a.path.localeCompare(b.path));
    
    // 按层级结构显示文件夹
    const folderTree = this.buildFolderTree(sortedFolders);
    this.renderFolderOptions(folderSelect, folderTree);

    // 创建文件名输入
    const nameContainer = contentEl.createEl('div');
    nameContainer.style.marginBottom = '20px';

    const nameLabel = nameContainer.createEl('label', { text: '文件名:' });
    nameLabel.style.display = 'block';
    nameLabel.style.marginBottom = '5px';
    nameLabel.style.fontWeight = '500';

    const nameInput = nameContainer.createEl('input', {
      type: 'text'
    });
    nameInput.setAttribute('placeholder', '文件名（不需要.md扩展名）');
    nameInput.style.width = '100%';
    nameInput.style.padding = '8px';
    nameInput.style.border = '1px solid var(--background-modifier-border)';
    nameInput.style.borderRadius = '4px';
    nameInput.style.backgroundColor = 'var(--background-primary)';
    nameInput.style.color = 'var(--text-normal)';

    // 创建按钮容器
    const buttonContainer = contentEl.createEl('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'flex-end';

    // 创建按钮
    const createButton = buttonContainer.createEl('button', { text: '创建文件' });
    createButton.style.padding = '8px 16px';
    createButton.style.backgroundColor = 'var(--interactive-accent)';
    createButton.style.color = 'var(--text-on-accent)';
    createButton.style.border = 'none';
    createButton.style.borderRadius = '4px';
    createButton.style.cursor = 'pointer';

    const cancelButton = buttonContainer.createEl('button', { text: '取消' });
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = 'var(--background-secondary)';
    cancelButton.style.color = 'var(--text-normal)';
    cancelButton.style.border = '1px solid var(--background-modifier-border)';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';

    // 绑定事件
    createButton.onclick = async () => {
      const selectedFolder = folderSelect.value;
      const name = nameInput.value.trim();
      
      if (!name) {
        new Notice('请输入文件名');
        return;
      }

      // 构建完整路径
      let fullPath = '';
      if (selectedFolder) {
        fullPath = `${selectedFolder}/${name}.md`;
      } else {
        fullPath = `${name}.md`;
      }

      try {
        // 创建文件
        const file = await this.plugin.fileManager.createNewFile(selectedFolder, name);
        if (file) {
          new Notice(`文件 ${fullPath} 创建成功`);
          
          // 将新文件添加到已选择列表
          if (!this.plugin.settings.selectedFiles.includes(fullPath)) {
            this.plugin.settings.selectedFiles.push(fullPath);
            await this.plugin.saveSettings();
            // 使用公开方法更新文件列表
            await this.plugin.loadFileList();
            this.plugin.updateFloatingPanel();
          }
          
          this.close();
        } else {
          new Notice('创建文件失败');
        }
      } catch (error) {
        console.error('创建文件失败:', error);
        new Notice('创建文件失败');
      }
    };

    cancelButton.onclick = () => {
      this.close();
    };

    // 回车键创建文件
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        createButton.click();
      }
    };

    nameInput.addEventListener('keypress', handleKeyPress);
  }

  /**
   * 构建文件夹树结构
   */
  private buildFolderTree(folders: TFolder[]): any[] {
    const folderMap = new Map<string, any>();
    const rootFolders: any[] = [];

    // 创建所有文件夹的映射
    folders.forEach(folder => {
      folderMap.set(folder.path, {
        path: folder.path,
        name: folder.name,
        children: []
      });
    });

    // 构建层级关系
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.path);
      const parentPath = this.getParentPath(folder.path);
      
      if (parentPath && folderMap.has(parentPath)) {
        const parentNode = folderMap.get(parentPath);
        parentNode.children.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders;
  }

  /**
   * 渲染文件夹选项
   */
  private renderFolderOptions(select: HTMLSelectElement, folderTree: any[], level: number = 0): void {
    folderTree.forEach(folder => {
      const option = select.createEl('option');
      option.value = folder.path;
      option.textContent = '　'.repeat(level) + folder.name;
      
      // 递归渲染子文件夹
      if (folder.children.length > 0) {
        this.renderFolderOptions(select, folder.children, level + 1);
      }
    });
  }

  /**
   * 获取父文件夹路径
   */
  private getParentPath(path: string): string | null {
    const lastSlashIndex = path.lastIndexOf('/');
    return lastSlashIndex > 0 ? path.substring(0, lastSlashIndex) : null;
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export default class ObsidianCutPlugin extends Plugin {
  settings: ObsidianCutSettings;
  fileManager: FileManager;
  hotkeyManager: HotkeyManager;
  floatingPanel: FloatingPanel | null = null;
  panelState: PanelState = {
    isVisible: false,
    isFixed: false,
    position: { x: 100, y: 100 },
    selectedIndex: 0,
    searchText: ''
  };
  selectedContent: string = '';
  allFiles: FileInfo[] = [];

  async onload() {
    console.log('Loading Obsidian SmartPaste plugin');

    // 加载设置
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // 初始化服务
    this.fileManager = new FileManager(this.app);
    this.hotkeyManager = new HotkeyManager(this.app, this.settings);

    // 注册设置页面
    this.addSettingTab(new ObsidianCutSettingTab(this.app, this));

    // 注册快捷键
    this.hotkeyManager.registerHotkeys();

    // 注册复制到文件的快捷键
    this.registerCopyToFileHotkey();

    // 注册事件监听器
    this.registerEventListeners();

    // 加载文件列表
    await this.loadFileList();

    // 初始化悬浮窗
    this.initializeFloatingPanel();

    // 如果有选中的文件，显示面板
    if (this.settings.selectedFiles.length > 0) {
      this.showFloatingPanel();
    }

    console.log('Obsidian SmartPaste plugin loaded successfully');
  }

  onunload() {
    console.log('Unloading Obsidian SmartPaste plugin');

    // 清理悬浮窗
    if (this.floatingPanel) {
      this.floatingPanel.destroy();
      this.floatingPanel = null;
    }

    // 注销快捷键
    this.hotkeyManager.unregisterHotkeys();

    // 移除事件监听器
    this.removeEventListeners();

    console.log('Obsidian SmartPaste plugin unloaded');
  }

  private registerEventListeners(): void {
    // 监听选择变化
    this.registerDomEvent(document, 'selectionchange', this.handleSelectionChange.bind(this));

    // 监听鼠标移动（用于显示/隐藏悬浮窗）
    this.registerDomEvent(document, 'mousemove', this.handleMouseMove.bind(this));

    // 监听键盘事件
    this.registerDomEvent(document, 'keydown', this.handleKeyDown.bind(this));

    // 监听工作区事件
    this.app.workspace.on('file-open', this.handleFileOpen.bind(this));
    
    // 监听活动叶子变化，重新创建悬浮栏
    this.app.workspace.on('active-leaf-change', this.handleActiveLeafChange.bind(this));
  }

  private removeEventListeners(): void {
    // 事件监听器会在插件卸载时自动清理
  }

  private registerCopyToFileHotkey(): void {
    // 注册复制到文件的快捷键
    this.addCommand({
      id: 'copy-to-selected-file',
      name: '复制选中内容到高亮文件',
      hotkeys: this.parseHotkey(this.settings.copyToFileHotkey),
      callback: () => {
        this.copySelectedContentToFile();
      }
    });
  }

  /**
   * 重新注册复制到文件快捷键（用于设置更改时）
   */
  public reregisterCopyToFileHotkey(): void {
    // 重新注册命令（Obsidian会自动处理重复注册）
    this.addCommand({
      id: 'copy-to-selected-file',
      name: '复制选中内容到高亮文件',
      hotkeys: this.parseHotkey(this.settings.copyToFileHotkey),
      callback: () => {
        this.copySelectedContentToFile();
      }
    });
  }

  /**
   * 解析快捷键字符串为Obsidian格式
   */
  private parseHotkey(hotkeyString: string): Array<{ modifiers: ('Ctrl' | 'Mod' | 'Alt' | 'Shift')[]; key: string }> {
    if (!hotkeyString || !hotkeyString.trim()) {
      // 默认快捷键
      return [{ modifiers: ['Ctrl', 'Shift'], key: 'X' }];
    }
    
    const parts = hotkeyString.split('+').map(part => part.trim());
    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1);
    
    return [{
      modifiers: modifiers.map(mod => {
        switch (mod.toLowerCase()) {
          case 'ctrl': return 'Ctrl';
          case 'cmd': 
          case 'command': return 'Mod';
          case 'alt': return 'Alt';
          case 'shift': return 'Shift';
          default: return 'Ctrl';
        }
      }) as ('Ctrl' | 'Mod' | 'Alt' | 'Shift')[],
      key: key.toUpperCase()
    }];
  }

  private async copySelectedContentToFile(): Promise<void> {
    // 获取当前选中的内容
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice('没有活动的编辑器');
      return;
    }

    const selection = activeView.editor.getSelection();
    if (!selection || !selection.trim()) {
      new Notice('请先选择要复制的内容');
      return;
    }

    // 获取悬浮栏中高亮的文件
    if (!this.floatingPanel) {
      new Notice('请先打开悬浮栏');
      return;
    }

    // 获取当前选中的文件
    const selectedFiles = this.settings.selectedFiles;
    if (selectedFiles.length === 0) {
      new Notice('没有选择任何文件');
      return;
    }

    // 获取当前高亮的文件（这里需要从悬浮栏获取）
    const highlightedFile = this.getHighlightedFile();
    if (!highlightedFile) {
      new Notice('请先选择一个目标文件');
      return;
    }

    try {
      console.log('copySelectedContentToFile - 原始选择内容:', selection);
      console.log('copySelectedContentToFile - 当前格式设置:', this.settings.pasteFormat);
      
      // 获取目标文件的现有内容（用于连续序号）
      let existingContent = '';
      try {
        existingContent = await this.fileManager.readFileContent(highlightedFile) || '';
        console.log('copySelectedContentToFile - 目标文件现有内容长度:', existingContent.length);
      } catch (error) {
        console.log('copySelectedContentToFile - 无法读取目标文件内容，使用空内容');
      }
      
      // 格式化内容（支持连续序号）
      const formattedContent = ContentFormatter.formatContentWithContinuousNumbering(selection, {
        format: this.settings.pasteFormat,
        customTemplate: undefined,
        addTimestamp: false,
        addSource: false
      }, existingContent);

      console.log('copySelectedContentToFile - 格式化后内容:', formattedContent);

      // 追加到文件
      const success = await this.fileManager.appendToFile(highlightedFile, formattedContent);
      
      if (success) {
        new Notice(`内容已复制到 ${highlightedFile}`);
      } else {
        new Notice('复制失败');
      }
    } catch (error) {
      console.error('复制内容失败:', error);
      new Notice('复制失败');
    }
  }

  private getHighlightedFile(): string | null {
    // 从悬浮栏获取当前高亮的文件
    if (!this.floatingPanel) return null;
    
    // 这里需要从悬浮栏的DOM中获取当前选中的文件
    const selectedElement = document.querySelector('.floating-toc-div .heading-list-item.selected');
    if (selectedElement) {
      const filePath = selectedElement.getAttribute('data-path');
      return filePath;
    }
    
    // 如果没有高亮的文件，返回第一个选中的文件
    return this.settings.selectedFiles[0] || null;
  }

  private async handleSelectionChange(): Promise<void> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const editor = activeView.editor;
    const selection = editor.getSelection();
    
    console.log('Selection changed:', selection ? selection.substring(0, 50) + '...' : 'no selection');
    
    if (selection && selection.trim() && selection !== this.selectedContent) {
      this.selectedContent = selection;
      console.log('Selected content:', this.selectedContent.substring(0, 50) + '...');
      
      if (this.settings.autoShowPanel && !this.panelState.isFixed) {
        console.log('Showing floating panel...');
        this.showFloatingPanel();
      }
    } else if (!selection && this.selectedContent) {
      this.selectedContent = '';
      console.log('Cleared selected content');
      
      if (!this.panelState.isFixed) {
        console.log('Hiding floating panel...');
        this.hideFloatingPanel();
      }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.settings.autoShowPanel || this.panelState.isFixed) return;

    // 检查鼠标是否在悬浮窗附近
    if (this.panelState.isVisible) {
      const container = document.getElementById('obsidian-smartpaste-panel-container');
      if (container) {
        const panel = container.querySelector('.obsidian-smartpaste-panel');
        if (panel) {
          const rect = panel.getBoundingClientRect();
          const mouseX = event.clientX;
          const mouseY = event.clientY;
          
          // 如果鼠标离开悬浮窗区域，隐藏悬浮窗
          if (mouseX < rect.left - 50 || mouseX > rect.right + 50 || 
              mouseY < rect.top - 50 || mouseY > rect.bottom + 50) {
            this.hideFloatingPanel();
          }
        }
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // 处理快捷键
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      this.toggleFloatingPanel();
    }
  }

  private handleFileOpen(): void {
    // 文件打开时刷新文件列表
    this.loadFileList();
  }

  private handleActiveLeafChange(): void {
    // 当活动叶子变化时，重新创建悬浮栏
    if (this.floatingPanel) {
      this.floatingPanel.destroy();
      this.floatingPanel = null;
    }
    
    // 检查是否有活动的Markdown视图，如果有则重新初始化悬浮栏
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      this.initializeFloatingPanel();
    }
  }

  // 公开方法，供外部调用
  public async loadFileList(): Promise<void> {
    try {
      this.allFiles = await this.fileManager.getAllFiles();
      this.allFiles = this.fileManager.sortFiles(this.allFiles, this.settings.fileSortOrder);
      this.updateFloatingPanel();
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  }

  private initializeFloatingPanel(): void {
    console.log('Initializing floating panel...');
    
    // 等待工作区加载完成后再创建悬浮窗
    this.app.workspace.onLayoutReady(() => {
      this.createFloatingPanel();
    });
  }

  private createFloatingPanel(): void {
    // 获取当前活动的编辑器视图
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      console.error('No active markdown view found');
      return;
    }

    // 初始化悬浮窗状态 - 从设置中读取固定状态
    this.panelState.position = this.settings.panelPosition;
    this.panelState.isFixed = this.settings.fixedPanel;
    
    // 如果面板设置为固定，确保它可见
    if (this.panelState.isFixed) {
      this.panelState.isVisible = true;
      console.log('Panel is fixed, setting it to visible');
    }
    
    console.log('createFloatingPanel: panelState.isFixed from settings:', this.panelState.isFixed);
    console.log('createFloatingPanel: panelState.isVisible:', this.panelState.isVisible);
    
    // 创建新的FloatingPanel实例
    const panelOptions: FloatingPanelOptions = {
      files: this.allFiles,
      selectedFiles: this.settings.selectedFiles,
      panelState: this.panelState,
      settings: this.settings,
      onFileSelect: this.selectFile.bind(this),
      onFileOpen: this.openFile.bind(this),
      onFileOpenInSplit: this.openFileInSplit.bind(this),
      onToggleFixed: this.toggleFixed.bind(this),
      onOpenSettings: this.openSettings.bind(this),
      onOrganizeContent: this.organizeContent.bind(this),
      onCreateFile: this.createNewFile.bind(this),
      onClose: this.hideFloatingPanel.bind(this),
      onSortChange: this.handleSortChange.bind(this),
      onPositionChange: this.handlePositionChange.bind(this),
      onSelectionChange: this.handleFileSelectionChange.bind(this)
    };
    
    this.floatingPanel = new FloatingPanel(view, panelOptions);
    
    console.log('Floating panel initialized with new component');
  }

  // 公开方法，供设置页面调用
  public showFloatingPanel(): void {
    console.log('showFloatingPanel called, current state:', this.panelState.isVisible);
    if (this.panelState.isVisible) return;

    this.panelState.isVisible = true;
    console.log('Panel state set to visible');
    this.updateFloatingPanel();
  }

  public hideFloatingPanel(): void {
    // 如果面板是固定的，不要隐藏
    if (this.panelState.isFixed) {
      console.log('Panel is fixed, not hiding');
      return;
    }

    if (!this.panelState.isVisible) return;

    this.panelState.isVisible = false;
    this.updateFloatingPanel();
  }

  public toggleFloatingPanel(): void {
    console.log('toggleFloatingPanel called, current state:', this.panelState.isVisible);
    
    if (this.panelState.isVisible) {
      console.log('Panel is visible, hiding it');
      this.hideFloatingPanel();
    } else {
      console.log('Panel is hidden, showing it');
      this.showFloatingPanel();
    }
  }

  private sortSelectedFiles(selectedFiles: string[]): string[] {
    const files = selectedFiles.map(path => this.allFiles.find(f => f.path === path)).filter(Boolean);
    
    switch (this.settings.fileSortOrder) {
      case 'name':
        return files.sort((a, b) => a.name.localeCompare(b.name)).map(f => f.path);
      case 'modified':
        return files.sort((a, b) => b.modifiedTime - a.modifiedTime).map(f => f.path);
      case 'created':
        return files.sort((a, b) => b.createdTime - a.createdTime).map(f => f.path);
      default:
        return selectedFiles;
    }
  }

  private async selectFile(filePath: string): Promise<void> {
    if (!this.selectedContent) {
      new Notice('请先选择要复制的内容');
      return;
    }

    try {
      // 格式化内容
      const formattedContent = ContentFormatter.formatContent(this.selectedContent, {
        format: this.settings.pasteFormat
      });

      // 追加到文件
      const success = await this.fileManager.appendToFile(filePath, formattedContent);
      
      if (success) {
        new Notice(`内容已成功添加到 ${this.getFileName(filePath)}`);
        
        // 将文件添加到已选择列表
        if (!this.settings.selectedFiles.includes(filePath)) {
          this.settings.selectedFiles.push(filePath);
          await this.saveSettings();
          this.updateFloatingPanel();
        }
      } else {
        new Notice('添加内容失败');
      }
    } catch (error) {
      console.error('选择文件失败:', error);
      new Notice('操作失败');
    }
  }

  private openFile(filePath: string): void {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      // 在当前标签页打开文件
      this.app.workspace.openLinkText(filePath, '', false, { active: true });
    }
  }

  private openFileInSplit(filePath: string): void {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      // 创建左右分屏并打开文件
      const leaf = this.app.workspace.splitActiveLeaf('vertical');
      if (leaf) {
        leaf.openFile(file);
      }
    }
  }

  private async createNewFile(): Promise<void> {
    const modal = new CreateFileModal(this.app, this);
    modal.open();
  }

  private toggleFixed(): void {
    console.log('toggleFixed called, current isFixed:', this.panelState.isFixed);
    
    this.panelState.isFixed = !this.panelState.isFixed;
    this.settings.fixedPanel = this.panelState.isFixed;
    
    console.log('toggleFixed: new isFixed:', this.panelState.isFixed);
    
    // 如果设置为固定，确保面板可见
    if (this.panelState.isFixed && !this.panelState.isVisible) {
      this.panelState.isVisible = true;
      console.log('Panel set to fixed, making it visible');
    }
    
    // 保存设置
    this.saveSettings();
    
    // 更新悬浮栏 - 确保重新创建以应用固定状态
    if (this.floatingPanel) {
      this.floatingPanel.destroy();
      this.floatingPanel = null;
    }
    this.initializeFloatingPanel();
    
    new Notice(this.panelState.isFixed ? '悬浮窗已固定' : '悬浮窗已取消固定');
  }

  private openSettings(): void {
    // 打开插件设置面板
    (this.app as any).setting.open();
    (this.app as any).setting.openTabById(this.manifest.id);
  }

  public async organizeContent(filePath: string): Promise<void> {
    if (!filePath) {
      new Notice('请先选择一个文件');
      return;
    }

    try {
      console.log('开始整理文件:', filePath);
      const content = await this.fileManager.readFileContent(filePath);
      console.log('原始内容长度:', content.length);
      
      if (content) {
        // 检查内容整理规则是否启用
        if (!this.settings.contentSortRules.enabled) {
          console.log('内容整理功能未启用，使用默认规则');
          // 使用默认规则进行整理
          const defaultRules = {
            sortBy: 'alphabetical' as 'alphabetical' | 'length' | 'date',
            removeDuplicates: true,
            trimWhitespace: true
          };
          const organizedContent = ContentFormatter.organizeContent(content, defaultRules);
          console.log('整理后内容长度:', organizedContent.length);
          
          const success = await this.fileManager.replaceFileContent(filePath, organizedContent);
          
          if (success) {
            new Notice('文件内容整理完成');
            console.log('文件内容整理成功');
          } else {
            new Notice('整理文件内容失败');
            console.log('文件内容整理失败');
          }
        } else {
          console.log('使用用户设置的内容整理规则');
          const organizedContent = ContentFormatter.organizeContent(content, this.settings.contentSortRules);
          console.log('整理后内容长度:', organizedContent.length);
          
          const success = await this.fileManager.replaceFileContent(filePath, organizedContent);
          
          if (success) {
            new Notice('文件内容整理完成');
            console.log('文件内容整理成功');
          } else {
            new Notice('整理文件内容失败');
            console.log('文件内容整理失败');
          }
        }
      } else {
        new Notice('文件为空或读取失败');
        console.log('文件为空或读取失败');
      }
    } catch (error) {
      console.error('整理文件内容失败:', error);
      new Notice('整理文件内容失败');
    }
  }

  private async handleSortChange(sortOrder: string): Promise<void> {
    this.settings.fileSortOrder = sortOrder as 'name' | 'modified' | 'created';
    await this.saveSettings();
    await this.loadFileList();
    this.updateFloatingPanel();
  }

  // 公开方法，供外部调用
  public updateFloatingPanel(): void {
    console.log('updateFloatingPanel called, floatingPanel:', !!this.floatingPanel);
    
    // 更新CSS变量以应用宽度设置
    document.documentElement.style.setProperty('--panel-width', `${this.settings.panelWidth}px`);
    
    if (this.floatingPanel) {
      console.log('Updating floating panel with state:', this.panelState);
      this.floatingPanel.update({
        files: this.allFiles,
        selectedFiles: this.settings.selectedFiles,
        panelState: this.panelState,
        settings: this.settings
      });
    } else {
      console.log('FloatingPanel is null, cannot update');
    }
  }

  private handlePositionChange(position: { x: number; y: number }): void {
    this.panelState.position = position;
    this.settings.panelPosition = position;
    this.saveSettings();
  }

  private handleFileSelectionChange(index: number): void {
    this.settings.selectedFileIndex = index;
    this.saveSettings();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  }

  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
} 