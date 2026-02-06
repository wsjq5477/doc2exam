import type { AppState, QuestionBank, ExamRecord, Question } from '@/types';

const STORAGE_KEY = 'exam_system_data';

// 获取默认状态
export function getDefaultState(): AppState {
  return {
    questionBanks: [],
    examHistory: [],
    wrongAnswers: [],
    settings: {
      defaultQuestionCount: 20,
      showExplanation: true,
      randomOrder: true,
    },
  };
}

// 加载状态
export function loadState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...getDefaultState(), ...parsed };
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  }
  return getDefaultState();
}

// 保存状态
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

// 添加题库
export function addQuestionBank(bank: QuestionBank): void {
  const state = loadState();
  state.questionBanks.push(bank);
  saveState(state);
}

// 删除题库
export function deleteQuestionBank(bankId: string): void {
  const state = loadState();
  state.questionBanks = state.questionBanks.filter(b => b.id !== bankId);
  saveState(state);
}

// 添加考试记录
export function addExamRecord(record: ExamRecord): void {
  const state = loadState();
  state.examHistory.push(record);
  saveState(state);
}

// 更新考试记录
export function updateExamRecord(record: ExamRecord): void {
  const state = loadState();
  const index = state.examHistory.findIndex(r => r.id === record.id);
  if (index !== -1) {
    state.examHistory[index] = record;
    saveState(state);
  }
}

// 添加错题
export function addWrongAnswer(question: Question, userAnswer: string, examId: string): void {
  const state = loadState();
  const existingIndex = state.wrongAnswers.findIndex(
    w => w.question.id === question.id
  );
  
  if (existingIndex !== -1) {
    // 更新已有错题
    state.wrongAnswers[existingIndex].count++;
    state.wrongAnswers[existingIndex].userAnswer = userAnswer;
    state.wrongAnswers[existingIndex].timestamp = Date.now();
  } else {
    // 添加新错题
    state.wrongAnswers.push({
      question,
      userAnswer,
      examId,
      timestamp: Date.now(),
      count: 1,
    });
  }
  
  saveState(state);
}

// 删除错题
export function removeWrongAnswer(questionId: string): void {
  const state = loadState();
  state.wrongAnswers = state.wrongAnswers.filter(w => w.question.id !== questionId);
  saveState(state);
}

// 获取所有分类
export function getAllCategories(): string[] {
  const state = loadState();
  const categories = new Set<string>();
  state.questionBanks.forEach(bank => {
    bank.categories.forEach(cat => categories.add(cat));
  });
  return Array.from(categories);
}

// 获取所有题目
export function getAllQuestions(): Question[] {
  const state = loadState();
  const questions: Question[] = [];
  state.questionBanks.forEach(bank => {
    questions.push(...bank.questions);
  });
  return questions;
}

// 根据分类获取题目
export function getQuestionsByCategory(category: string): Question[] {
  const allQuestions = getAllQuestions();
  if (category === 'all') return allQuestions;
  return allQuestions.filter(q => q.category === category);
}

// 更新设置
export function updateSettings(settings: Partial<AppState['settings']>): void {
  const state = loadState();
  state.settings = { ...state.settings, ...settings };
  saveState(state);
}

// 清除所有数据
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 导出数据
export function exportData(): string {
  const state = loadState();
  return JSON.stringify(state, null, 2);
}

// 导入数据
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    const state = { ...getDefaultState(), ...data };
    saveState(state);
    return true;
  } catch (error) {
    console.error('导入数据失败:', error);
    return false;
  }
}
