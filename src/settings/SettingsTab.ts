import { PluginSettingTab, Setting, Modal } from 'obsidian';
import { ObsidianCutSettings } from './types';
import { PASTE_FORMATS, FILE_SORT_OPTIONS, CONTENT_SORT_OPTIONS } from '../utils/constants';
import { Notice } from 'obsidian';

export class ObsidianCutSettingTab extends PluginSettingTab {
  plugin: any;

  constructor(app: any, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Obsidian SmartPaste 设置' });

    // 文件选择设置
    this.createFileSelectionSettings(containerEl);

    // 粘贴格式设置
    this.createPasteFormatSettings(containerEl);

    // 悬浮窗设置
    this.createPanelSettings(containerEl);

    // 快捷键设置
    this.createHotkeySettings(containerEl);

    // 内容整理设置
    this.createContentOrganizationSettings(containerEl);
  }

  private createFileSelectionSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '文件选择' });

    // 已选择的文件列表
    new Setting(containerEl)
      .setName('已选择的文件')
      .setDesc('在悬浮窗中显示的文件列表')
      .addButton(button => {
        button.setButtonText('管理文件列表');
        button.onClick(async () => {
          await this.showFileSelector();
        });
      });

    // 显示已选择的文件
    if (this.plugin.settings.selectedFiles.length > 0) {
      const fileListContainer = containerEl.createEl('div');
      fileListContainer.addClass('obsidian-smartpaste-selected-files-container');
      
      // 添加标题
      const title = fileListContainer.createEl('h4', {
        text: `已选择的文件 (${this.plugin.settings.selectedFiles.length})`
      });
      title.addClass('obsidian-smartpaste-selected-files-title');
      
      // 创建文件卡片网格
      const fileGrid = fileListContainer.createEl('div');
      fileGrid.addClass('obsidian-smartpaste-file-grid');
      
      this.plugin.settings.selectedFiles.forEach((filePath, index) => {
        const fileCard = fileGrid.createEl('div');
        fileCard.addClass('obsidian-smartpaste-file-card');
        
        // 文件图标
        const fileIcon = fileCard.createEl('div');
        fileIcon.addClass('obsidian-smartpaste-file-card-icon');
        fileIcon.innerHTML = '📄';
        
        // 文件信息
        const fileInfo = fileCard.createEl('div');
        fileInfo.addClass('obsidian-smartpaste-file-card-info');
        
        const fileName = fileInfo.createEl('div');
        fileName.addClass('obsidian-smartpaste-file-card-name');
        fileName.textContent = filePath.split('/').pop()?.replace('.md', '') || filePath;
        
        // 移除文件路径显示
        // const filePathText = fileInfo.createEl('div');
        // filePathText.addClass('obsidian-smartpaste-file-card-path');
        // filePathText.textContent = filePath;
        
        // 操作按钮
        const actions = fileCard.createEl('div');
        actions.addClass('obsidian-smartpaste-file-card-actions');
        
        // 移除按钮
        const removeButton = actions.createEl('button');
        removeButton.addClass('obsidian-smartpaste-file-card-button');
        removeButton.innerHTML = '🗑️';
        removeButton.title = '从列表中移除';
        removeButton.onclick = async () => {
          this.plugin.settings.selectedFiles.splice(index, 1);
          await this.plugin.saveSettings();
          this.display(); // 重新渲染设置页面
        };
      });
    }
  }

  private createPasteFormatSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '粘贴格式' });

    // 默认粘贴格式
    new Setting(containerEl)
      .setName('默认粘贴格式')
      .setDesc('选择内容粘贴到文件时的默认格式')
      .addDropdown(dropdown => {
        Object.entries(PASTE_FORMATS).forEach(([key, value]) => {
          dropdown.addOption(key, value.name);
        });
        dropdown.setValue(this.plugin.settings.pasteFormat);
        dropdown.onChange(async (value) => {
          this.plugin.settings.pasteFormat = value as any;
          await this.plugin.saveSettings();
        });
      });
  }



  private createPanelSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '悬浮窗设置' });

    // 自动显示悬浮窗
    new Setting(containerEl)
      .setName('自动显示悬浮窗')
      .setDesc('选中文本时自动显示悬浮窗')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.autoShowPanel);
        toggle.onChange(async (value) => {
          this.plugin.settings.autoShowPanel = value;
          await this.plugin.saveSettings();
        });
      });



    // 悬浮窗宽度
    new Setting(containerEl)
      .setName('悬浮窗宽度')
      .setDesc('设置悬浮窗的宽度（像素）')
      .addSlider(slider => {
        slider.setLimits(200, 600, 50);
        slider.setValue(this.plugin.settings.panelWidth);
        slider.setDynamicTooltip();
        slider.onChange(async (value) => {
          this.plugin.settings.panelWidth = value;
          await this.plugin.saveSettings();
        });
      });

    // 悬浮窗高度
    new Setting(containerEl)
      .setName('悬浮窗高度')
      .setDesc('设置悬浮窗的高度（像素）')
      .addSlider(slider => {
        slider.setLimits(200, 800, 50);
        slider.setValue(this.plugin.settings.panelHeight);
        slider.setDynamicTooltip();
        slider.onChange(async (value) => {
          this.plugin.settings.panelHeight = value;
          await this.plugin.saveSettings();
        });
      });
  }

  private createHotkeySettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '快捷键设置' });

    // 打开文件快捷键
    new Setting(containerEl)
      .setName('打开文件快捷键')
      .setDesc('设置以分屏方式打开文件的快捷键')
      .addText(text => {
        text.setValue(this.plugin.settings.openFileHotkey);
        text.onChange(async (value) => {
          this.plugin.settings.openFileHotkey = value;
          await this.plugin.saveSettings();
        });
      });
  }

  /**
   * 验证快捷键格式
   */
  private isValidHotkey(hotkey: string): boolean {
    if (!hotkey || !hotkey.trim()) return false;
    
    const parts = hotkey.split('+').map(part => part.trim());
    if (parts.length < 2) return false;
    
    const validModifiers = ['ctrl', 'cmd', 'command', 'alt', 'shift'];
    const validKeys = /^[a-zA-Z0-9]$/;
    
    // 检查修饰键
    for (let i = 0; i < parts.length - 1; i++) {
      if (!validModifiers.includes(parts[i].toLowerCase())) {
        return false;
      }
    }
    
    // 检查主键
    const mainKey = parts[parts.length - 1];
    return validKeys.test(mainKey);
  }

  private createContentOrganizationSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '内容整理设置' });

    // 启用内容整理
    new Setting(containerEl)
      .setName('启用内容整理')
      .setDesc('启用文件内容整理功能')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.contentSortRules.enabled);
        toggle.onChange(async (value) => {
          this.plugin.settings.contentSortRules.enabled = value;
          await this.plugin.saveSettings();
        });
      });

    // 排序方式
    new Setting(containerEl)
      .setName('内容排序方式')
      .setDesc('选择内容整理时的排序方式')
      .addDropdown(dropdown => {
        Object.entries(CONTENT_SORT_OPTIONS).forEach(([key, value]) => {
          dropdown.addOption(key, value);
        });
        dropdown.setValue(this.plugin.settings.contentSortRules.sortBy);
        dropdown.onChange(async (value) => {
          this.plugin.settings.contentSortRules.sortBy = value as any;
          await this.plugin.saveSettings();
        });
      });

    // 去除重复
    new Setting(containerEl)
      .setName('去除重复内容')
      .setDesc('整理内容时去除重复的行')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.contentSortRules.removeDuplicates);
        toggle.onChange(async (value) => {
          this.plugin.settings.contentSortRules.removeDuplicates = value;
          await this.plugin.saveSettings();
        });
      });

    // 去除首尾空格
    new Setting(containerEl)
      .setName('去除首尾空格')
      .setDesc('整理内容时去除每行的首尾空格')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.contentSortRules.trimWhitespace);
        toggle.onChange(async (value) => {
          this.plugin.settings.contentSortRules.trimWhitespace = value;
          await this.plugin.saveSettings();
        });
      });
  }

  private async showFileSelector(): Promise<void> {
    try {
      console.log('Opening file selector...');
      
      // 获取所有 Markdown 文件
      const files = this.app.vault.getMarkdownFiles();
      const availableFiles = files.filter(f => 
        !this.plugin.settings.selectedFiles.includes(f.path)
      );
      
      if (availableFiles.length === 0) {
        new Notice('没有可选择的文件');
        return;
      }
      
      // 创建模态对话框
      const modal = new Modal(this.app);
      modal.titleEl.setText('选择要添加的文件');
      modal.containerEl.addClass('obsidian-smartpaste-file-selector');
      
      const content = modal.contentEl;
      content.empty();
      
      // 添加说明
      const description = content.createEl('p', {
        text: '点击文件夹展开/折叠，点击文件选择/取消选择：'
      });
      description.addClass('obsidian-smartpaste-description');
      
      // 创建搜索框
      const searchContainer = content.createEl('div');
      searchContainer.addClass('obsidian-smartpaste-search-container');
      
      const searchInput = searchContainer.createEl('input', {
        type: 'text'
      });
      searchInput.setAttribute('placeholder', '搜索文件或文件夹...');
      searchInput.addClass('obsidian-smartpaste-search-input');
      
      // 创建文件列表容器
      const fileListContainer = content.createEl('div');
      fileListContainer.addClass('obsidian-smartpaste-file-list-container');
      
      // 存储选中的文件
      const selectedFiles = new Set<string>();
      
      // 构建真实的文件夹树结构
      const buildFolderTree = (files: any[]) => {
        const tree: { [key: string]: any } = {};
        
        files.forEach(file => {
          const pathParts = file.path.split('/');
          let currentLevel = tree;
          
          // 处理文件夹路径
          for (let i = 0; i < pathParts.length - 1; i++) {
            const folderName = pathParts[i];
            if (!currentLevel[folderName]) {
              currentLevel[folderName] = { type: 'folder', children: {} };
            }
            currentLevel = currentLevel[folderName].children;
          }
          
          // 添加文件
          const fileName = pathParts[pathParts.length - 1];
          currentLevel[fileName] = { type: 'file', data: file };
        });
        
        return tree;
      };
      
      // 递归渲染文件夹树
      const renderFolderTree = (tree: any, container: HTMLElement, level: number = 0) => {
        const sortedKeys = Object.keys(tree).sort((a, b) => {
          const aIsFolder = tree[a].type === 'folder';
          const bIsFolder = tree[b].type === 'folder';
          
          // 文件夹在前，文件在后
          if (aIsFolder && !bIsFolder) return -1;
          if (!aIsFolder && bIsFolder) return 1;
          
          // 同类型按名称排序
          return a.localeCompare(b);
        });
        
        sortedKeys.forEach(key => {
          const item = tree[key];
          
          if (item.type === 'folder') {
            // 创建文件夹项
            const folderItem = container.createEl('div');
            folderItem.addClass('obsidian-smartpaste-folder-item');
            
            const folderHeader = folderItem.createEl('div');
            folderHeader.addClass('obsidian-smartpaste-folder-header');
            folderHeader.style.cursor = 'pointer';
            folderHeader.style.paddingLeft = `${level * 20}px`;
            
            const folderIcon = folderHeader.createEl('span', {
              text: '📁'
            });
            folderIcon.addClass('obsidian-smartpaste-folder-icon');
            
            const folderName = folderHeader.createEl('span', {
              text: key
            });
            folderName.addClass('obsidian-smartpaste-folder-name');
            
            // 计算文件夹下的文件数量
            const countFiles = (children: any): number => {
              let count = 0;
              Object.values(children).forEach((child: any) => {
                if (child.type === 'file') {
                  count++;
                } else if (child.type === 'folder') {
                  count += countFiles(child.children);
                }
              });
              return count;
            };
            
            const fileCount = folderHeader.createEl('span', {
              text: ` (${countFiles(item.children)})`
            });
            fileCount.addClass('obsidian-smartpaste-file-count');
            
            // 创建子文件夹容器
            const folderChildren = folderItem.createEl('div');
            folderChildren.addClass('obsidian-smartpaste-folder-children');
            folderChildren.style.display = 'none'; // 默认折叠
            
            // 递归渲染子项
            renderFolderTree(item.children, folderChildren, level + 1);
            
            // 点击展开/折叠文件夹
            folderHeader.onclick = () => {
              const isExpanded = folderChildren.style.display !== 'none';
              folderChildren.style.display = isExpanded ? 'none' : 'block';
              folderIcon.textContent = isExpanded ? '📁' : '📂';
            };
            folderItem.appendChild(folderChildren); // 确保子容器被添加到文件夹项中
            
          } else if (item.type === 'file') {
            // 创建文件项
            const fileItem = container.createEl('div');
            fileItem.addClass('obsidian-smartpaste-file-item');
            fileItem.style.paddingLeft = `${level * 20}px`;
            
            const fileIcon = fileItem.createEl('span', {
              text: '📄'
            });
            fileIcon.addClass('obsidian-smartpaste-file-icon');
            
            const fileName = fileItem.createEl('span', {
              text: key.replace('.md', '')
            });
            fileName.addClass('obsidian-smartpaste-file-name');
            
            // 点击选择文件
            fileItem.onclick = () => {
              if (selectedFiles.has(item.data.path)) {
                selectedFiles.delete(item.data.path);
                fileItem.classList.remove('selected');
              } else {
                selectedFiles.add(item.data.path);
                fileItem.classList.add('selected');
              }
              // 更新添加按钮文本
              addButton.setText(`添加选中文件 (${selectedFiles.size})`);
            };
          }
        });
      };
      
      // 渲染文件列表的函数
      const renderFileList = (filterText: string = '') => {
        fileListContainer.empty();
        
        const filteredFiles = availableFiles.filter(file => 
          file.basename.toLowerCase().includes(filterText.toLowerCase()) ||
          file.path.toLowerCase().includes(filterText.toLowerCase())
        );
        
        if (filteredFiles.length === 0) {
          const noFiles = fileListContainer.createEl('div', {
            text: filterText ? '没有找到匹配的文件' : '没有可选择的文件'
          });
          noFiles.addClass('obsidian-smartpaste-no-files');
          return;
        }
        
        const folderTree = buildFolderTree(filteredFiles);
        renderFolderTree(folderTree, fileListContainer);
      };
      
      // 初始渲染
      renderFileList();
      
      // 搜索功能
      searchInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        renderFileList(target.value);
      });
      
      // 添加按钮容器
      const buttonContainer = content.createEl('div');
      buttonContainer.addClass('obsidian-smartpaste-button-container');
      
      // 全选按钮
      const selectAllButton = buttonContainer.createEl('button', {
        text: '全选'
      });
      selectAllButton.addClass('obsidian-smartpaste-select-all-button');
      selectAllButton.onclick = () => {
        const fileItems = fileListContainer.querySelectorAll('.obsidian-smartpaste-file-item') as NodeListOf<HTMLElement>;
        fileItems.forEach(fileItem => {
          const fileName = fileItem.querySelector('.obsidian-smartpaste-file-name')?.textContent;
          if (fileName) {
            // 找到对应的文件路径
            const file = availableFiles.find(f => f.basename === fileName);
            if (file) {
              selectedFiles.add(file.path);
              fileItem.classList.add('selected');
            }
          }
        });
        addButton.setText(`添加选中文件 (${selectedFiles.size})`);
      };
      
      // 取消全选按钮
      const deselectAllButton = buttonContainer.createEl('button', {
        text: '取消全选'
      });
      deselectAllButton.addClass('obsidian-smartpaste-deselect-all-button');
      deselectAllButton.onclick = () => {
        const fileItems = fileListContainer.querySelectorAll('.obsidian-smartpaste-file-item') as NodeListOf<HTMLElement>;
        fileItems.forEach(fileItem => {
          fileItem.classList.remove('selected');
        });
        selectedFiles.clear();
        addButton.setText(`添加选中文件 (${selectedFiles.size})`);
      };
      
      // 添加选中文件按钮
      const addButton = buttonContainer.createEl('button', {
        text: `添加选中文件 (${selectedFiles.size})`
      });
      addButton.addClass('obsidian-smartpaste-add-button');
      addButton.onclick = async () => {
        if (selectedFiles.size === 0) {
          new Notice('请先选择文件');
          return;
        }
        
        try {
          let addedCount = 0;
          for (const filePath of selectedFiles) {
            if (!this.plugin.settings.selectedFiles.includes(filePath)) {
              this.plugin.settings.selectedFiles.push(filePath);
              addedCount++;
            }
          }
          
          await this.plugin.saveSettings();
          new Notice(`已添加 ${addedCount} 个文件`);
          modal.close();
          this.display(); // 重新渲染设置页面
        } catch (error) {
          console.error('添加文件失败:', error);
          new Notice('添加文件失败');
        }
      };
      
      // 关闭按钮
      const closeButton = buttonContainer.createEl('button', {
        text: '关闭'
      });
      closeButton.addClass('obsidian-smartpaste-close-button');
      closeButton.onclick = () => modal.close();
      
      modal.open();
      console.log('File selector modal opened successfully');
      
    } catch (error) {
      console.error('打开文件选择器失败:', error);
      new Notice('打开文件选择器失败');
    }
  }
} 