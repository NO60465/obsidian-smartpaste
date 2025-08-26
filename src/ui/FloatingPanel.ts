import { FileInfo, PanelState } from '../settings/types';
import { MarkdownView, Notice } from 'obsidian';

/**
 * FloatingPanel - 悬浮窗组件
 * 
 * 设计灵感来源于 Obsidian Floating TOC 插件
 * 参考了其悬浮窗的UI设计和交互逻辑实现
 * 原始项目: https://github.com/liamcain/obsidian-floating-toc-plugin
 */

export interface FloatingPanelOptions {
  files: FileInfo[];
  selectedFiles: string[];
  panelState: PanelState;
  settings: any;
  onFileSelect: (filePath: string) => void;
  onFileOpen: (filePath: string) => void;
  onFileOpenInSplit: (filePath: string) => void;
  onToggleFixed: () => void;
  onOpenSettings: () => void;
  onOrganizeContent: (filePath: string) => void;
  onCreateFile: () => void;
  onClose: () => void;
  onSortChange: (sortOrder: string) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSelectionChange?: (index: number) => void;
}

export class FloatingPanel {
  private view: MarkdownView;
  private options: FloatingPanelOptions;
  private filteredFiles: FileInfo[] = [];
  private selectedIndex: number = 0;
  private floatingTocWrapper: HTMLElement | null = null;
  
  // 绑定事件处理器，避免重复绑定
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandleContainerClick: (event: Event) => void;

  constructor(view: MarkdownView, options: FloatingPanelOptions) {
    this.view = view;
    this.options = options;
    this.filteredFiles = this.getFilteredFiles();
    
    // 从设置中恢复选中的文件索引
    this.selectedIndex = Math.min(options.settings.selectedFileIndex || 0, this.filteredFiles.length - 1);
    
    // 绑定事件处理器
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleContainerClick = this.handleContainerClick.bind(this);
    
    this.render();
    this.addEventListeners();
  }

  public update(options: Partial<FloatingPanelOptions>): void {
    console.log('FloatingPanel.update called with options:', options);
    this.options = { ...this.options, ...options };
    this.filteredFiles = this.getFilteredFiles();
    console.log('Filtered files count:', this.filteredFiles.length);
    
    // 如果面板已存在，只更新内容；否则重新渲染
    if (this.floatingTocWrapper && this.floatingTocWrapper.parentNode) {
      this.updateContent();
    } else {
      this.render();
    }
  }

  public destroy(): void {
    this.removeEventListeners();
    if (this.floatingTocWrapper) {
      this.floatingTocWrapper.remove();
      this.floatingTocWrapper = null;
    }
  }

  private getFilteredFiles(): FileInfo[] {
    const { files, selectedFiles } = this.options;
    console.log('getFilteredFiles - files count:', files.length, 'selectedFiles:', selectedFiles);
    const filtered = files.filter(file => selectedFiles.includes(file.path));
    console.log('getFilteredFiles - filtered count:', filtered.length);
    return filtered;
  }

  private addEventListeners(): void {
    // 键盘事件
    document.addEventListener('keydown', this.boundHandleKeyDown);
    
    // 文件点击事件
    if (this.floatingTocWrapper) {
      this.floatingTocWrapper.addEventListener('click', this.boundHandleContainerClick);
    }
  }

  private removeEventListeners(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    
    // 移除点击事件监听器
    if (this.floatingTocWrapper) {
      this.floatingTocWrapper.removeEventListener('click', this.boundHandleContainerClick);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.options.panelState.isVisible) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : this.filteredFiles.length - 1;
        this.updateSelection();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = this.selectedIndex < this.filteredFiles.length - 1 ? this.selectedIndex + 1 : 0;
        this.updateSelection();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.filteredFiles[this.selectedIndex]) {
          this.options.onFileSelect(this.filteredFiles[this.selectedIndex].path);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.options.onClose();
        break;
    }
  }

  private handleContainerClick(event: Event): void {
    const target = event.target as HTMLElement;
    const mouseEvent = event as MouseEvent;
    
    // 处理工具栏按钮点击
    if (target.classList.contains('toolbar-btn')) {
      if (target.textContent?.includes('📄')) {
        this.options.onCreateFile();
      } else if (target.textContent?.includes('⚙️')) {
        this.options.onOpenSettings();
      } else if (target.textContent?.includes('🔧')) {
        this.options.onOrganizeContent('');
      } else if (target.textContent?.includes('📌') || target.textContent?.includes('📍')) {
        this.options.onToggleFixed();
      }
    }
    
    // 处理文件项点击
    const fileItem = target.closest('.heading-list-item') as HTMLElement;
    if (fileItem && !fileItem.classList.contains('empty-content')) {
      const filePath = fileItem.getAttribute('data-path');
      if (filePath) {
        // 更新选中状态
        this.updateSelectedFile(filePath);
        
        if (mouseEvent.ctrlKey) {
          this.options.onFileOpenInSplit(filePath);
        }
        // 单击只选中文件，不打开文件
      }
    }
  }

  private updateSelectedFile(filePath: string): void {
    // 找到文件在列表中的索引
    const index = this.filteredFiles.findIndex(file => file.path === filePath);
    if (index !== -1) {
      this.selectedIndex = index;
    }
    
    // 移除所有选中状态
    const allItems = this.floatingTocWrapper?.querySelectorAll('.heading-list-item');
    allItems?.forEach(item => {
      item.classList.remove('selected');
    });
    
    // 添加选中状态到当前文件
    const currentItem = this.floatingTocWrapper?.querySelector(`[data-path="${filePath}"]`);
    if (currentItem) {
      currentItem.classList.add('selected');
    }
    
    // 保存选中的索引
    this.saveSelectedIndex();
  }

  private updateSelection(): void {
    if (!this.floatingTocWrapper) return;
    
    const items = this.floatingTocWrapper.querySelectorAll('.heading-list-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // 保存选中的索引到设置
    this.saveSelectedIndex();
  }

  private saveSelectedIndex(): void {
    // 通知主插件保存选中的索引
    if (this.options.onSelectionChange) {
      this.options.onSelectionChange(this.selectedIndex);
    }
  }

  private render(): void {
    const { panelState, settings } = this.options;
    const { filteredFiles } = this;
    
    // 初始化选中索引为0（只在第一次渲染时）
    if (this.selectedIndex === 0 && filteredFiles.length > 0) {
      this.selectedIndex = 0;
    }

    console.log('FloatingPanel.render called, panelState.isVisible:', panelState.isVisible, 'panelState.isFixed:', panelState.isFixed);

    // 检查是否已存在悬浮栏元素
    const existingPanel = this.view.contentEl?.querySelector(".floating-toc-div") as HTMLElement;
    if (existingPanel && existingPanel !== this.floatingTocWrapper) {
      existingPanel.remove();
    }

    // 如果已存在且是同一个元素，只更新内容
    if (this.floatingTocWrapper && this.floatingTocWrapper.parentNode) {
      this.updateContent();
      return;
    }

    // 移除现有的面板
    if (this.floatingTocWrapper) {
      this.floatingTocWrapper.remove();
    }

    // 创建悬浮窗容器 - 参考参考代码的HTML结构
    this.floatingTocWrapper = document.createElement('div');
    this.floatingTocWrapper.addClass('floating-toc-div');
    this.floatingTocWrapper.addClass('floating-right'); // 默认右侧显示
    
    // 确保CSS类只添加一次
    if (!document.body.classList.contains('enable-bar-heading-text')) {
      document.body.addClass('enable-bar-heading-text');
    }

    // 根据固定状态添加CSS类
    if (panelState.isFixed) {
      this.floatingTocWrapper.addClass('pin');
      console.log('Added pin class to floating panel');
    } else {
      this.floatingTocWrapper.removeClass('pin');
      console.log('Removed pin class from floating panel');
    }

    // 创建工具栏
    const toolbar = this.floatingTocWrapper.createEl('div');
    toolbar.addClass('toolbar');
    this.createToolbar(toolbar);

    // 创建文件列表容器
    const ulDom = this.floatingTocWrapper.createEl('ul');
    ulDom.addClass('floating-toc');

    // 渲染文件列表
    console.log('Rendering file list, filteredFiles.length:', filteredFiles.length);
    if (filteredFiles.length === 0) {
      console.log('Rendering empty state');
      // 空状态
      const emptyLi = ulDom.createEl('li');
      emptyLi.addClass('heading-list-item');
      emptyLi.addClass('empty-content');
      emptyLi.setAttribute('data-level', '1');
      emptyLi.setAttribute('data-id', 'empty');
      
      const emptyTextDom = emptyLi.createEl('div');
      emptyTextDom.addClass('text-wrap');
      
      const emptyText = emptyTextDom.createEl('div');
      emptyText.addClass('text');
      emptyText.textContent = '请在设置中添加文件到列表';
      
      const emptyLineDom = emptyLi.createEl('div');
      emptyLineDom.addClass('line-wrap');
      emptyLineDom.createDiv().addClass('line');
    } else {
      console.log('Rendering file list with', filteredFiles.length, 'files');
      // 渲染文件列表
      filteredFiles.forEach((file, index) => {
        const fileLi = ulDom.createEl('li');
        fileLi.addClass('heading-list-item');
        fileLi.setAttribute('data-level', '1');
        fileLi.setAttribute('data-id', index.toString());
        fileLi.setAttribute('data-path', file.path);
        
        if (index === this.selectedIndex) {
          fileLi.addClass('selected');
        }
        
        // 创建文件文本容器
        const textDom = fileLi.createEl('div');
        textDom.addClass('text-wrap');
        
        const text = textDom.createEl('div');
        text.addClass('text');
        text.textContent = settings.showFileExtensions ? file.name : file.basename;
        
        // 创建指示条
        const lineDom = fileLi.createEl('div');
        lineDom.addClass('line-wrap');
        lineDom.createDiv().addClass('line');
      });
    }

    // 插入到页面 - 参考参考代码的方式
    const insertResult = this.view.contentEl
      ?.querySelector(".markdown-source-view")
      ?.insertAdjacentElement("beforebegin", this.floatingTocWrapper) ||
      this.view.contentEl
        ?.querySelector(".markdown-reading-view")
        ?.insertAdjacentElement("beforebegin", this.floatingTocWrapper);
    
    if (!insertResult) {
      console.error('Failed to insert floating panel');
      return;
    }

    // 重新绑定事件监听器
    this.addEventListeners();
  }

  private updateContent(): void {
    if (!this.floatingTocWrapper) return;

    const { panelState, settings } = this.options;
    const { filteredFiles } = this;
    
    // 保持当前选中的文件
    const currentSelectedItem = this.floatingTocWrapper.querySelector('.heading-list-item.selected');
    const currentSelectedPath = currentSelectedItem?.getAttribute('data-path');
    
    // 如果当前有选中的文件，找到它在新的文件列表中的索引
    if (currentSelectedPath) {
      const index = filteredFiles.findIndex(file => file.path === currentSelectedPath);
      if (index !== -1) {
        this.selectedIndex = index;
      } else {
        // 如果当前选中的文件不在新列表中，重置为0
        this.selectedIndex = 0;
      }
    } else {
      // 如果没有选中的文件，保持当前的selectedIndex
      // 但确保它在有效范围内
      if (this.selectedIndex >= filteredFiles.length) {
        this.selectedIndex = 0;
      }
    }

    // 更新固定状态
    if (panelState.isFixed) {
      this.floatingTocWrapper.addClass('pin');
    } else {
      this.floatingTocWrapper.removeClass('pin');
    }

    // 更新工具栏
    const toolbar = this.floatingTocWrapper.querySelector('.toolbar');
    if (toolbar) {
      this.updateToolbar(toolbar as HTMLElement);
    }

    // 更新文件列表
    const ulDom = this.floatingTocWrapper.querySelector('.floating-toc');
    if (ulDom) {
      ulDom.innerHTML = '';
      
      if (filteredFiles.length === 0) {
        // 空状态
        const emptyLi = ulDom.createEl('li');
        emptyLi.addClass('heading-list-item');
        emptyLi.addClass('empty-content');
        emptyLi.setAttribute('data-level', '1');
        emptyLi.setAttribute('data-id', 'empty');
        
        const emptyTextDom = emptyLi.createEl('div');
        emptyTextDom.addClass('text-wrap');
        
        const emptyText = emptyTextDom.createEl('div');
        emptyText.addClass('text');
        emptyText.textContent = '请在设置中添加文件到列表';
        
        const emptyLineDom = emptyLi.createEl('div');
        emptyLineDom.addClass('line-wrap');
        emptyLineDom.createDiv().addClass('line');
      } else {
        // 渲染文件列表
        filteredFiles.forEach((file, index) => {
          const fileLi = ulDom.createEl('li');
          fileLi.addClass('heading-list-item');
          fileLi.setAttribute('data-level', '1');
          fileLi.setAttribute('data-id', index.toString());
          fileLi.setAttribute('data-path', file.path);
          
          if (index === this.selectedIndex) {
            fileLi.addClass('selected');
          }
          
          // 创建文件文本容器
          const textDom = fileLi.createEl('div');
          textDom.addClass('text-wrap');
          
          const text = textDom.createEl('div');
          text.addClass('text');
          text.textContent = settings.showFileExtensions ? file.name : file.basename;
          
          // 创建指示条
          const lineDom = fileLi.createEl('div');
          lineDom.addClass('line-wrap');
          lineDom.createDiv().addClass('line');
        });
      }
    }
  }

  private createToolbar(toolbar: HTMLElement): void {
    // 创建工具栏按钮
    const buttons = [
      { icon: '📄', title: '新建文件', onClick: () => this.options.onCreateFile() },
      { icon: '⚙️', title: '打开设置', onClick: () => this.options.onOpenSettings() },
      { icon: '🔧', title: '整理文件内容', onClick: () => this.organizeCurrentFile() },
      { icon: this.options.panelState.isFixed ? '📌' : '📍', title: this.options.panelState.isFixed ? '取消固定' : '固定位置', onClick: () => this.options.onToggleFixed() }
    ];

    buttons.forEach(btn => {
      const button = toolbar.createEl('button');
      button.addClass('toolbar-btn');
      button.innerHTML = btn.icon;
      button.title = btn.title;
      button.onclick = btn.onClick;
    });
  }

  private organizeCurrentFile(): void {
    // 获取当前选中的文件
    const currentSelectedItem = this.floatingTocWrapper?.querySelector('.heading-list-item.selected');
    if (currentSelectedItem) {
      const filePath = currentSelectedItem.getAttribute('data-path');
      if (filePath) {
        this.options.onOrganizeContent(filePath);
      } else {
        new Notice('请先选择一个文件');
      }
    } else {
      new Notice('请先选择一个文件');
    }
  }

  private updateToolbar(toolbar: HTMLElement): void {
    const pinButton = toolbar.querySelector('.toolbar-btn:nth-child(4)') as HTMLElement;
    if (pinButton) {
      pinButton.innerHTML = this.options.panelState.isFixed ? '📌' : '📍';
      pinButton.title = this.options.panelState.isFixed ? '取消固定' : '固定位置';
    }
  }
} 