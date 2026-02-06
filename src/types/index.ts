// 题目类型
export interface Question {
  id: string;
  content: string; // 题目内容
  options: string[]; // 选项 A, B, C, D...
  correctAnswer: string; // 正确答案: 'A', 'B', 'C', 'D' 等
  category: string; // 分类
  difficulty: 'easy' | 'medium' | 'hard'; // 难度
  explanation?: string; // 解析
  source?: string; // 来源文件
}

// 考试记录
export interface ExamRecord {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  questions: Question[];
  answers: Record<string, string>; // questionId -> answer
  score?: number;
  isCompleted: boolean;
}

// 错题记录
export interface WrongAnswer {
  question: Question;
  userAnswer: string;
  examId: string;
  timestamp: number;
  count: number; // 错误次数
}

// 题库
export interface QuestionBank {
  id: string;
  name: string;
  questions: Question[];
  categories: string[];
  importTime: number;
  sourceFile: string;
}

// 应用状态
export interface AppState {
  questionBanks: QuestionBank[];
  currentExam?: ExamRecord;
  examHistory: ExamRecord[];
  wrongAnswers: WrongAnswer[];
  settings: {
    defaultQuestionCount: number;
    showExplanation: boolean;
    randomOrder: boolean;
  };
}

// 文件解析结果
export interface ParseResult {
  success: boolean;
  questions: Question[];
  error?: string;
  categories: string[];
}
