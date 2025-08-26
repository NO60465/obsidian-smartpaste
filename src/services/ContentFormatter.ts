import { PASTE_FORMATS } from '../utils/constants';
import { ContentFormatOptions } from '../settings/types';

export class ContentFormatter {
  /**
   * 格式化内容为指定格式
   */
  static formatContent(content: string, options: ContentFormatOptions): string {
    const { format, customTemplate, addTimestamp, addSource } = options;
    
    console.log('ContentFormatter.formatContent - 输入内容:', content);
    console.log('ContentFormatter.formatContent - 输入内容长度:', content.length);
    console.log('ContentFormatter.formatContent - 输入内容包含换行符:', content.includes('\n'));
    console.log('ContentFormatter.formatContent - 输入内容换行符位置:', content.split('').map((char, index) => char === '\n' ? index : -1).filter(pos => pos !== -1));
    console.log('ContentFormatter.formatContent - 格式选项:', format);
    
    let formattedContent: string;
    
    // 对于纯文本格式，先去除Markdown格式，再清理
    if (format === 'plain') {
      formattedContent = this.stripMarkdownFormatting(content);
      formattedContent = this.cleanContent(formattedContent);
    } else if (format === 'unordered-list' || format === 'ordered-list') {
      // 对于列表格式，先去除Markdown格式，再清理，确保是纯文本
      console.log('ContentFormatter.formatContent - 处理列表格式');
      formattedContent = this.stripMarkdownFormatting(content);
      console.log('ContentFormatter.formatContent - 去除Markdown格式后:', formattedContent);
      formattedContent = this.cleanContent(formattedContent);
      console.log('ContentFormatter.formatContent - 清理后:', formattedContent);
    } else {
      // 其他格式，先清理内容
      formattedContent = this.cleanContent(content);
    }
    
    // 应用格式模板
    if (customTemplate) {
      formattedContent = this.applyCustomTemplate(formattedContent, customTemplate);
    } else {
      const formatTemplate = PASTE_FORMATS[format]?.template || PASTE_FORMATS.newline.template;
      formattedContent = this.applyTemplate(formattedContent, formatTemplate);
    }
    
    // 添加时间戳
    if (addTimestamp) {
      formattedContent = this.addTimestamp(formattedContent);
    }
    
    // 添加来源信息
    if (addSource) {
      formattedContent = this.addSource(formattedContent);
    }
    
    return formattedContent;
  }

  /**
   * 格式化内容为指定格式（支持连续序号）
   */
  static formatContentWithContinuousNumbering(content: string, options: ContentFormatOptions, existingContent?: string): string {
    const { format, customTemplate, addTimestamp, addSource } = options;
    
    console.log('ContentFormatter.formatContentWithContinuousNumbering - 输入内容:', content);
    console.log('ContentFormatter.formatContentWithContinuousNumbering - 现有内容:', existingContent);
    
    let formattedContent: string;
    
    // 对于纯文本格式，先去除Markdown格式，再清理
    if (format === 'plain') {
      formattedContent = this.stripMarkdownFormatting(content);
      formattedContent = this.cleanContent(formattedContent);
    } else if (format === 'unordered-list' || format === 'ordered-list') {
      // 对于列表格式，先去除Markdown格式，再清理，确保是纯文本
      console.log('ContentFormatter.formatContentWithContinuousNumbering - 处理列表格式');
      formattedContent = this.stripMarkdownFormatting(content);
      console.log('ContentFormatter.formatContentWithContinuousNumbering - 去除Markdown格式后:', formattedContent);
      formattedContent = this.cleanContent(formattedContent);
      console.log('ContentFormatter.formatContentWithContinuousNumbering - 清理后:', formattedContent);
    } else {
      // 其他格式，先清理内容
      formattedContent = this.cleanContent(content);
    }
    
    // 应用格式模板（支持连续序号）
    if (customTemplate) {
      formattedContent = this.applyCustomTemplate(formattedContent, customTemplate);
    } else {
      const formatTemplate = PASTE_FORMATS[format]?.template || PASTE_FORMATS.newline.template;
      if (format === 'ordered-list' && existingContent) {
        formattedContent = this.applyTemplateWithContinuousNumbering(formattedContent, formatTemplate, existingContent);
      } else {
        formattedContent = this.applyTemplate(formattedContent, formatTemplate);
      }
    }
    
    // 添加时间戳
    if (addTimestamp) {
      formattedContent = this.addTimestamp(formattedContent);
    }
    
    // 添加来源信息
    if (addSource) {
      formattedContent = this.addSource(formattedContent);
    }
    
    return formattedContent;
  }
  
  /**
   * 清理内容
   */
  private static cleanContent(content: string): string {
    return content
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  /**
   * 去除Markdown格式
   */
  private static stripMarkdownFormatting(content: string): string {
    return content
      // 去除粗体格式 **text** 或 __text__
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // 去除斜体格式 *text* 或 _text_
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // 去除删除线 ~~text~~
      .replace(/~~(.*?)~~/g, '$1')
      // 去除行内代码 `code`
      .replace(/`(.*?)`/g, '$1')
      // 去除链接格式 [text](url)
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // 去除图片格式 ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // 去除标题格式 # ## ### 等
      .replace(/^#{1,6}\s+/gm, '')
      // 去除列表标记 - * + 1. 等
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // 去除引用格式 > text
      .replace(/^>\s+/gm, '')
      // 去除代码块标记 ```
      .replace(/^```[\s\S]*?```$/gm, '')
      // 去除表格格式 | | |
      .replace(/^\|.*\|$/gm, '')
      // 去除水平分割线 --- 或 ***
      .replace(/^[-*]{3,}$/gm, '')
      // 去除脚注格式 [^1]
      .replace(/\[\^[^\]]*\]/g, '')
      // 去除任务列表格式 - [ ] 或 - [x]
      .replace(/^[\s]*-\s+\[[\sx]\]\s+/gm, '')
      // 清理多余的空行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // 去除行首行尾的空白字符
      .replace(/^\s+|\s+$/gm, '');
  }
  
  /**
   * 应用模板
   */
  private static applyTemplate(content: string, template: string): string {
    console.log('ContentFormatter.applyTemplate - 输入内容:', content);
    console.log('ContentFormatter.applyTemplate - 输入模板:', template);
    
    if (template.includes('{content}')) {
      if (template === '{index}. {content}') {
        // 有序列表，需要递增序号
        console.log('ContentFormatter.applyTemplate - 处理有序列表');
        const lines = content.split('\n').filter(line => line.trim());
        console.log('ContentFormatter.applyTemplate - 过滤后的行数:', lines.length);
        console.log('ContentFormatter.applyTemplate - 过滤后的行:', lines);
        
        const result = lines.map((line, index) => {
          const replaced = template.replace('{index}', (index + 1).toString()).replace('{content}', line);
          console.log(`ContentFormatter.applyTemplate - 第${index + 1}行: "${line}" -> "${replaced}"`);
          return replaced;
        }).join('\n');
        
        console.log('ContentFormatter.applyTemplate - 有序列表最终结果:', result);
        return result;
      } else if (template === '- {content}') {
        // 无序列表
        console.log('ContentFormatter.applyTemplate - 处理无序列表');
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map((line) => {
          return template.replace('{content}', line);
        }).join('\n');
      } else if (template === '{content}') {
        // 原格式，保持原格式，每行用换行符分隔
        console.log('ContentFormatter.applyTemplate - 处理原格式');
        const lines = content.split('\n');
        return lines.map(line => line.trim()).filter(line => line).join('\n');
      } else if (template === 'plain') {
        // 纯文本格式，直接返回内容（已经在formatContent中处理过了）
        console.log('ContentFormatter.applyTemplate - 处理纯文本格式');
        return content;
      } else {
        // 其他格式（如列表格式）
        console.log('ContentFormatter.applyTemplate - 处理其他格式');
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => template.replace('{content}', line)).join('\n'); // 使用换行符连接
      }
    }
    
    console.log('ContentFormatter.applyTemplate - 进入默认分支');
    return template + content;
  }

  /**
   * 应用模板（支持连续序号）
   */
  private static applyTemplateWithContinuousNumbering(content: string, template: string, existingContent: string): string {
    console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 输入内容:', content);
    console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 输入模板:', template);
    console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 现有内容:', existingContent);
    
    if (template.includes('{content}')) {
      if (template === '{index}. {content}') {
        // 有序列表，需要计算下一个序号
        console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 处理有序列表');
        const lines = content.split('\n').filter(line => line.trim());
        console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 过滤后的行数:', lines.length);
        console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 过滤后的行:', lines);
        
        // 计算下一个序号
        const nextIndex = this.getNextOrderedListIndex(existingContent);
        console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 下一个序号:', nextIndex);
        
        const result = lines.map((line, index) => {
          const currentIndex = nextIndex + index;
          const replaced = template.replace('{index}', currentIndex.toString()).replace('{content}', line);
          console.log(`ContentFormatter.applyTemplateWithContinuousNumbering - 第${currentIndex}行: "${line}" -> "${replaced}"`);
          return replaced;
        }).join('\n');
        
        console.log('ContentFormatter.applyTemplateWithContinuousNumbering - 有序列表最终结果:', result);
        return result;
      } else {
        // 其他格式，使用普通模板处理
        return this.applyTemplate(content, template);
      }
    }
    
    return template + content;
  }

  /**
   * 获取下一个有序列表序号
   */
  private static getNextOrderedListIndex(existingContent: string): number {
    if (!existingContent) return 1;
    
    // 查找现有的有序列表项
    const orderedListPattern = /^\s*(\d+)\.\s+/gm;
    const matches = [...existingContent.matchAll(orderedListPattern)];
    
    if (matches.length === 0) {
      return 1;
    }
    
    // 找到最大的序号
    const maxIndex = Math.max(...matches.map(match => parseInt(match[1])));
    console.log('ContentFormatter.getNextOrderedListIndex - 现有最大序号:', maxIndex);
    
    return maxIndex + 1;
  }
  
  /**
   * 应用自定义模板
   */
  private static applyCustomTemplate(content: string, template: string): string {
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      return template
        .replace('{content}', line)
        .replace('{timestamp}', new Date().toISOString())
        .replace('{date}', new Date().toLocaleDateString())
        .replace('{time}', new Date().toLocaleTimeString());
    }).join('');
  }
  
  /**
   * 添加时间戳
   */
  private static addTimestamp(content: string): string {
    const timestamp = new Date().toLocaleString();
    return `<!-- Added: ${timestamp} -->\n${content}`;
  }
  
  /**
   * 添加来源信息
   */
  private static addSource(content: string): string {
    const source = `<!-- Source: ${window.location.href} -->\n`;
    return source + content;
  }
  
  /**
   * 整理文件内容
   */
  static organizeContent(content: string, rules: {
    sortBy: 'alphabetical' | 'length' | 'date';
    removeDuplicates: boolean;
    trimWhitespace: boolean;
  }): string {
    let lines = content.split('\n');
    
    console.log('原始行数:', lines.length);
    
    // 去除首尾空格（如果启用）
    if (rules.trimWhitespace) {
      lines = lines.map(line => line.trim());
    }
    
    // 去除重复（如果启用）
    if (rules.removeDuplicates) {
      const uniqueLines = [];
      const seen = new Set();
      for (const line of lines) {
        if (!seen.has(line)) {
          seen.add(line);
          uniqueLines.push(line);
        }
      }
      lines = uniqueLines;
      console.log('去重后行数:', lines.length);
    }
    
    // 排序（只对非空行进行排序）
    const nonEmptyLines = lines.filter(line => line.trim());
    const emptyLines = lines.filter(line => !line.trim());
    
    switch (rules.sortBy) {
      case 'alphabetical':
        nonEmptyLines.sort((a, b) => a.localeCompare(b));
        break;
      case 'length':
        nonEmptyLines.sort((a, b) => a.length - b.length);
        break;
      case 'date':
        // 尝试按日期排序，如果失败则按字母排序
        nonEmptyLines.sort((a, b) => {
          const dateA = this.extractDate(a);
          const dateB = this.extractDate(b);
          if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
          }
          return a.localeCompare(b);
        });
        break;
    }
    
    // 合并非空行和空行
    const result = [...nonEmptyLines, ...emptyLines].join('\n');
    console.log('整理后内容长度:', result.length);
    
    return result;
  }
  
  /**
   * 提取日期
   */
  private static extractDate(text: string): Date | null {
    // 匹配常见的日期格式
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/,
      /\d{2}\/\d{2}\/\d{4}/,
      /\d{2}-\d{2}-\d{4}/,
      /\d{4}\/\d{2}\/\d{2}/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 检测内容类型
   */
  static detectContentType(content: string): 'text' | 'list' | 'code' | 'mixed' {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return 'text';
    
    const hasListItems = lines.some(line => /^[\-\*\+]\s/.test(line) || /^\d+\.\s/.test(line));
    const hasCodeBlocks = lines.some(line => line.startsWith('```') || line.startsWith('`'));
    const hasCodeIndentation = lines.some(line => /^\s{4,}/.test(line));
    
    if (hasCodeBlocks || hasCodeIndentation) return 'code';
    if (hasListItems) return 'list';
    return 'mixed';
  }
} 