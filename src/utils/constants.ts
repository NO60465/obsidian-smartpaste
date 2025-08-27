export const PLUGIN_ID = 'obsidian-smartpaste';
export const PLUGIN_NAME = 'Obsidian SmartPaste';

// 默认设置
export const DEFAULT_SETTINGS = {
  selectedFiles: [] as string[],
  selectedFileIndex: 0,
  pasteFormat: 'newline' as 'newline' | 'unordered-list' | 'ordered-list' | 'plain',
  autoShowPanel: true,
  fixedPanel: false,
  panelPosition: { x: 100, y: 100 },
  openFileHotkey: 'Ctrl+Click',
  copyToFileHotkey: 'Ctrl+Shift+X',
  panelWidth: 300,
  panelHeight: 400,
  fileSortOrder: 'name' as 'name' | 'modified' | 'created',
  showFileExtensions: false,
  contentSortRules: {
    enabled: true,
    sortBy: 'alphabetical' as 'alphabetical' | 'length' | 'date',
    removeDuplicates: true,
    trimWhitespace: true
  }
};

// 粘贴格式选项
export const PASTE_FORMATS = {
  newline: {
    name: '原格式',
    template: '{content}'
  },
  'unordered-list': {
    name: '无序号列表',
    template: '- {content}'
  },
  'ordered-list': {
    name: '有序号列表',
    template: '{index}. {content}'
  },
  plain: {
    name: '纯文本',
    template: '{content}'
  }
};

// 文件排序选项
export const FILE_SORT_OPTIONS = {
  name: '按名称',
  modified: '按修改时间',
  created: '按创建时间'
};

// 内容排序选项
export const CONTENT_SORT_OPTIONS = {
  alphabetical: '按字母顺序',
  length: '按长度',
  date: '按日期'
};

// CSS 类名
export const CSS_CLASSES = {
  floatingPanel: 'obsidian-smartpaste-floating-panel',
  fileItem: 'obsidian-smartpaste-file-item',
  toolbar: 'obsidian-smartpaste-toolbar',
  selected: 'obsidian-smartpaste-selected',
  hover: 'obsidian-smartpaste-hover',
  hidden: 'obsidian-smartpaste-hidden'
};

// 事件名称
export const EVENTS = {
  SELECTION_CHANGED: 'selection-changed',
  FILE_SELECTED: 'file-selected',
  PANEL_TOGGLE: 'panel-toggle',
  SETTINGS_UPDATED: 'settings-updated'
}; 
