import { DEFAULT_SETTINGS } from '../utils/constants';

export interface ObsidianCutSettings {
  selectedFiles: string[];
  selectedFileIndex: number;
  pasteFormat: 'newline' | 'unordered-list' | 'ordered-list' | 'plain';
  autoShowPanel: boolean;
  fixedPanel: boolean;
  panelPosition: { x: number; y: number };
  openFileHotkey: string;
  copyToFileHotkey: string;
  panelWidth: number;
  panelHeight: number;
  fileSortOrder: 'name' | 'modified' | 'created';
  showFileExtensions: boolean;
  contentSortRules: {
    enabled: boolean;
    sortBy: 'alphabetical' | 'length' | 'date';
    removeDuplicates: boolean;
    trimWhitespace: boolean;
  };
}

export type ObsidianCutSettingsTab = {
  display(): void;
  hide(): void;
  containerEl: HTMLElement;
};

export interface FileInfo {
  path: string;
  name: string;
  basename: string;
  extension: string;
  modifiedTime: number;
  createdTime: number;
  size: number;
}

export interface ContentFormatOptions {
  format: 'newline' | 'unordered-list' | 'ordered-list' | 'plain';
  customTemplate?: string;
  addTimestamp?: boolean;
  addSource?: boolean;
}

export interface PanelState {
  isVisible: boolean;
  isFixed: boolean;
  position: { x: number; y: number };
  selectedIndex: number;
  searchText: string;
} 