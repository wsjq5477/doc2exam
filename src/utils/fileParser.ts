import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import type { Question, ParseResult } from '@/types';

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// 从文本中提取选择题
export function extractQuestionsFromText(text: string, sourceFile: string): ParseResult {
  const questions: Question[] = [];
  const categories = new Set<string>();
  
  const lines = text.split('\n');
  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 检测新题目开始 (数字开头)
    const questionMatch = line.match(/^(\d+)[:.、]\s*(.+)/);
    
    if (questionMatch) {
      // 保存之前的题目
      if (currentQuestion && currentOptions.length >= 2) {
        const question = createQuestion(currentQuestion, currentOptions, categories, sourceFile);
        if (question) questions.push(question);
      }
      
      // 开始新题目
      currentQuestion = {
        id: generateId(),
        content: questionMatch[2],
      };
      currentOptions = [];
    } else if (currentQuestion) {
      // 检测选项
      const optionMatch = line.match(/^([A-D])[.、)\s]\s*(.+)/);
      if (optionMatch) {
        currentOptions.push(optionMatch[2]);
      }
      
      // 检测答案
      const answerMatch = line.match(/(?:答案|正确答案|Answer)[:：\s]*([A-D])/i);
      if (answerMatch) {
        currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
      }
      
      // 检测分类
      const categoryMatch = line.match(/(?:分类|类别|Category)[:：\s]*(.+)/i);
      if (categoryMatch) {
        currentQuestion.category = categoryMatch[1].trim();
      }
      
      // 检测难度
      const difficultyMatch = line.match(/(?:难度|Difficulty)[:：\s]*(简单|中等|困难|easy|medium|hard)/i);
      if (difficultyMatch) {
        const diffMap: Record<string, 'easy' | 'medium' | 'hard'> = {
          '简单': 'easy', 'easy': 'easy',
          '中等': 'medium', 'medium': 'medium',
          '困难': 'hard', 'hard': 'hard'
        };
        currentQuestion.difficulty = diffMap[difficultyMatch[1].toLowerCase()];
      }
      
      // 检测解析
      const explanationMatch = line.match(/(?:解析|Explanation)[:：\s]*(.+)/i);
      if (explanationMatch) {
        currentQuestion.explanation = explanationMatch[1].trim();
      }
    }
  }
  
  // 保存最后一个题目
  if (currentQuestion && currentOptions.length >= 2) {
    const question = createQuestion(currentQuestion, currentOptions, categories, sourceFile);
    if (question) questions.push(question);
  }
  
  // 如果没有解析到题目，尝试备用解析方法
  if (questions.length === 0) {
    return parseAlternativeFormat(text, sourceFile);
  }
  
  return {
    success: questions.length > 0,
    questions,
    categories: Array.from(categories),
  };
}

// 创建题目对象
function createQuestion(
  partial: Partial<Question>,
  options: string[],
  categories: Set<string>,
  sourceFile: string
): Question | null {
  if (!partial.content || !partial.correctAnswer || options.length < 2) {
    return null;
  }
  
  const category = partial.category || '未分类';
  categories.add(category);
  
  return {
    id: partial.id || generateId(),
    content: partial.content.trim(),
    options,
    correctAnswer: partial.correctAnswer,
    category,
    difficulty: partial.difficulty || 'medium',
    explanation: partial.explanation,
    source: sourceFile,
  };
}

// 备用解析方法 - 处理紧凑格式
function parseAlternativeFormat(text: string, sourceFile: string): ParseResult {
  const questions: Question[] = [];
  const categories = new Set<string>();
  
  // 尝试匹配: 题目 (A)选项A (B)选项B (C)选项C (D)选项D 答案:X
  const regex = /(\d+)[:.、]?\s*([^()]+)\s*\(A\)\s*([^()]+)\s*\(B\)\s*([^()]+)\s*\(C\)\s*([^()]+)(?:\s*\(D\)\s*([^()]+))?\s*(?:答案|Answer)[:：\s]*([A-D])/gi;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    const options = [match[3].trim(), match[4].trim(), match[5].trim()];
    if (match[6]) options.push(match[6].trim());
    
    questions.push({
      id: generateId(),
      content: match[2].trim(),
      options,
      correctAnswer: match[7].toUpperCase(),
      category: '未分类',
      difficulty: 'medium',
      source: sourceFile,
    });
    categories.add('未分类');
  }
  
  return {
    success: questions.length > 0,
    questions,
    categories: Array.from(categories),
  };
}

// 解析Excel文件
export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        const questions: Question[] = [];
        const categories = new Set<string>();
        
        // 假设第一行是表头
        // 列: 题目, 选项A, 选项B, 选项C, 选项D, 答案, 分类, 难度, 解析
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 3) continue;
          
          const options: string[] = [];
          for (let j = 1; j <= 4; j++) {
            if (row[j]) options.push(String(row[j]));
          }
          
          if (options.length < 2 || !row[0]) continue;
          
          const category = row[6] ? String(row[6]) : '未分类';
          categories.add(category);
          
          const diffMap: Record<string, 'easy' | 'medium' | 'hard'> = {
            '简单': 'easy', 'easy': 'easy',
            '中等': 'medium', 'medium': 'medium',
            '困难': 'hard', 'hard': 'hard'
          };
          
          questions.push({
            id: generateId(),
            content: String(row[0]),
            options,
            correctAnswer: String(row[5] || 'A').toUpperCase(),
            category,
            difficulty: diffMap[String(row[7] || 'medium').toLowerCase()] || 'medium',
            explanation: row[8] ? String(row[8]) : undefined,
            source: file.name,
          });
        }
        
        resolve({
          success: questions.length > 0,
          questions,
          categories: Array.from(categories),
        });
      } catch (error) {
        resolve({
          success: false,
          questions: [],
          error: '解析Excel文件失败: ' + (error as Error).message,
          categories: [],
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// 解析Word文件
export async function parseWordFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const parseResult = extractQuestionsFromText(result.value, file.name);
        resolve(parseResult);
      } catch (error) {
        resolve({
          success: false,
          questions: [],
          error: '解析Word文件失败: ' + (error as Error).message,
          categories: [],
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// 解析文本文件
export async function parseTextFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parseResult = extractQuestionsFromText(text, file.name);
        resolve(parseResult);
      } catch (error) {
        resolve({
          success: false,
          questions: [],
          error: '解析文本文件失败: ' + (error as Error).message,
          categories: [],
        });
      }
    };
    reader.readAsText(file);
  });
}

// 解析PDF文件 (简化版，实际PDF解析较复杂)
export async function parsePdfFile(file: File): Promise<ParseResult> {
  // 由于pdf-parse在浏览器环境中有兼容性问题，我们使用文本提取方式
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // 尝试提取PDF中的文本内容
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const textDecoder = new TextDecoder('utf-8');
        let text = '';
        
        // 简单提取PDF中的文本流
        try {
          const uint8Array = new Uint8Array(arrayBuffer);
          text = textDecoder.decode(uint8Array);
          
          // 清理PDF格式垃圾
          text = text.replace(/stream[\s\S]*?endstream/g, '');
          text = text.replace(/<<[\s\S]*?>>/g, '');
          text = text.replace(/\/[A-Za-z]+/g, ' ');
          text = text.replace(/[\x00-\x1F\x7F-\xFF]/g, ' ');
          text = text.replace(/\s+/g, ' ');
        } catch {
          text = '';
        }
        
        if (text.length < 50) {
          resolve({
            success: false,
            questions: [],
            error: '无法从PDF中提取文本。请尝试将PDF转换为Word或文本格式后导入。',
            categories: [],
          });
          return;
        }
        
        const parseResult = extractQuestionsFromText(text, file.name);
        resolve(parseResult);
      } catch (error) {
        resolve({
          success: false,
          questions: [],
          error: '解析PDF文件失败: ' + (error as Error).message,
          categories: [],
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// 通用文件解析入口
export async function parseFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelFile(file);
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return parseWordFile(file);
  } else if (fileName.endsWith('.pdf')) {
    return parsePdfFile(file);
  } else if (fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
    return parseTextFile(file);
  } else {
    return {
      success: false,
      questions: [],
      error: '不支持的文件格式。请上传 Excel, Word, PDF 或文本文件。',
      categories: [],
    };
  }
}
