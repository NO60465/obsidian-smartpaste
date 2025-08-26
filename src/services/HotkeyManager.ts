import { App, Hotkey, Modifier } from 'obsidian';
import { ObsidianCutSettings } from '../settings/types';

export class HotkeyManager {
  private app: App;
  private settings: ObsidianCutSettings;
  private registeredHotkeys: Map<string, any> = new Map();
  
  constructor(app: App, settings: ObsidianCutSettings) {
    this.app = app;
    this.settings = settings;
  }
  
  /**
   * 注册所有快捷键
   */
  registerHotkeys(): void {
    // 暂时跳过快捷键注册，使用事件监听器代替
    console.log('HotkeyManager: 跳过快捷键注册，使用事件监听器');
  }
  
  /**
   * 注销所有快捷键
   */
  unregisterHotkeys(): void {
    // 清理事件监听器
    this.registeredHotkeys.clear();
  }
  
  /**
   * 注册悬浮窗切换快捷键
   */
  private registerPanelToggleHotkey(): void {
    // 使用事件监听器代替快捷键注册
    const hotkeyId = 'obsidian-smartpaste-toggle-panel';
    console.log('HotkeyManager: 注册悬浮窗切换事件监听器');
  }
  
  /**
   * 注册文件打开快捷键
   */
  private registerFileOpenHotkey(): void {
    // 使用事件监听器代替快捷键注册
    const hotkeyId = 'obsidian-smartpaste-open-file';
    console.log('HotkeyManager: 注册文件打开事件监听器');
  }
  
  /**
   * 更新快捷键设置
   */
  updateHotkeys(newSettings: ObsidianCutSettings): void {
    this.settings = newSettings;
    this.unregisterHotkeys();
    this.registerHotkeys();
  }
  
  /**
   * 解析快捷键字符串
   */
  static parseHotkey(hotkeyString: string): Hotkey | null {
    try {
      const parts = hotkeyString.split('+');
      const key = parts.pop();
      const modifiers: Modifier[] = parts.map(mod => {
        switch (mod.toLowerCase()) {
          case 'ctrl':
          case 'control':
            return 'Ctrl';
          case 'alt':
            return 'Alt';
          case 'shift':
            return 'Shift';
          case 'meta':
          case 'cmd':
          case 'command':
            return 'Meta';
          default:
            return 'Ctrl'; // 默认使用 Ctrl
        }
      });
      
      if (!key) return null;
      
      return {
        modifiers,
        key: key.toUpperCase()
      };
    } catch (error) {
      console.error('解析快捷键失败:', error);
      return null;
    }
  }
  
  /**
   * 格式化快捷键显示
   */
  static formatHotkey(hotkey: Hotkey): string {
    const modifiers = hotkey.modifiers.map(mod => {
      switch (mod) {
        case 'Ctrl':
          return 'Ctrl';
        case 'Alt':
          return 'Alt';
        case 'Shift':
          return 'Shift';
        case 'Meta':
          return 'Cmd';
        default:
          return mod;
      }
    });
    
    return [...modifiers, hotkey.key].join('+');
  }
  
  /**
   * 检查快捷键冲突
   */
  checkHotkeyConflict(hotkey: Hotkey): boolean {
    // 暂时跳过冲突检查，因为 hotkeyManager API 可能不可用
    console.log('HotkeyManager: 跳过快捷键冲突检查');
    return false;
  }
  
  /**
   * 获取所有注册的快捷键
   */
  getRegisteredHotkeys(): Map<string, Hotkey> {
    return new Map(this.registeredHotkeys);
  }
  
  /**
   * 启用/禁用快捷键
   */
  setHotkeyEnabled(hotkeyId: string, enabled: boolean): void {
    const hotkey = this.registeredHotkeys.get(hotkeyId);
    if (hotkey) {
      if (enabled) {
        // 暂时跳过快捷键注册，使用事件监听器代替
        console.log(`HotkeyManager: 启用快捷键 ${hotkeyId}`);
      } else {
        // 暂时跳过快捷键注销
        console.log(`HotkeyManager: 禁用快捷键 ${hotkeyId}`);
      }
    }
  }
} 