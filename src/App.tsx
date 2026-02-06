import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  Play, 
  XCircle, 
  History, 
  Menu,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { FileUploader } from '@/components/FileUploader';
import { QuestionBankManager } from '@/components/QuestionBankManager';
import { ExamSettings } from '@/components/ExamSettings';
import { Exam } from '@/components/Exam';
import { WrongAnswers } from '@/components/WrongAnswers';
import { ExamHistory } from '@/components/ExamHistory';
import { getAllQuestions } from '@/utils/storage';
import type { Question } from '@/types';

type TabType = 'banks' | 'upload' | 'exam' | 'wrong' | 'history';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('banks');
  const [isExamMode, setIsExamMode] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 初始化时加载题目数量
    const questions = getAllQuestions();
    setQuestionCount(questions.length);
  }, []);

  const handleUploadSuccess = () => {
    toast.success('题库导入成功！');
    setActiveTab('banks');
    const questions = getAllQuestions();
    setQuestionCount(questions.length);
  };

  const handleBanksChange = () => {
    const questions = getAllQuestions();
    setQuestionCount(questions.length);
  };

  const handleStartExam = (questions: Question[], title: string) => {
    if (questions.length === 0) {
      toast.error('没有可用的题目');
      return;
    }
    setExamQuestions(questions);
    setExamTitle(title);
    setIsExamMode(true);
  };

  const handleExamFinish = () => {
    setIsExamMode(false);
    setExamQuestions([]);
    setActiveTab('history');
    toast.success('考试完成！');
  };

  const handleExamExit = () => {
    if (confirm('确定要退出考试吗？当前进度将不会保存。')) {
      setIsExamMode(false);
      setExamQuestions([]);
    }
  };

  const renderSidebarContent = () => (
    <div className="space-y-2">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-2 py-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bold text-lg">智能考试系统</h1>
            <p className="text-xs text-gray-500">{questionCount} 道题目</p>
          </div>
        </div>
      </div>
      
      <nav className="space-y-1 px-2">
        <Button
          variant={activeTab === 'banks' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => {
            setActiveTab('banks');
            setIsMobileMenuOpen(false);
          }}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          题库管理
        </Button>
        
        <Button
          variant={activeTab === 'upload' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => {
            setActiveTab('upload');
            setIsMobileMenuOpen(false);
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          导入题库
        </Button>
        
        <Button
          variant={activeTab === 'exam' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => {
            setActiveTab('exam');
            setIsMobileMenuOpen(false);
          }}
        >
          <Play className="h-4 w-4 mr-2" />
          开始考试
        </Button>
        
        <Button
          variant={activeTab === 'wrong' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => {
            setActiveTab('wrong');
            setIsMobileMenuOpen(false);
          }}
        >
          <XCircle className="h-4 w-4 mr-2" />
          错题本
        </Button>
        
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => {
            setActiveTab('history');
            setIsMobileMenuOpen(false);
          }}
        >
          <History className="h-4 w-4 mr-2" />
          考试记录
        </Button>
      </nav>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'banks':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">题库管理</h2>
              <Button onClick={() => setActiveTab('upload')}>
                <Upload className="h-4 w-4 mr-2" />
                导入题库
              </Button>
            </div>
            <QuestionBankManager onBanksChange={handleBanksChange} />
          </div>
        );
      
      case 'upload':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">导入题库</h2>
            <div className="max-w-2xl">
              <FileUploader onUploadSuccess={handleUploadSuccess} />
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">支持的文件格式</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Excel (.xlsx, .xls) - 推荐格式，按列导入题目、选项、答案</li>
                <li>• Word (.docx, .doc) - 自动识别选择题格式</li>
                <li>• PDF (.pdf) - 尝试提取文本内容</li>
                <li>• 文本 (.txt, .csv) - 纯文本格式</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">题目格式示例</h3>
              <pre className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded overflow-auto">
{`1. 这是题目内容
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案: A
分类: 数学
难度: 中等
解析: 这是答案解析`}
              </pre>
            </div>
          </div>
        );
      
      case 'exam':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">开始考试</h2>
            <ExamSettings onStartExam={handleStartExam} />
          </div>
        );
      
      case 'wrong':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">错题本</h2>
            <WrongAnswers />
          </div>
        );
      
      case 'history':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">考试记录</h2>
            <ExamHistory />
          </div>
        );
      
      default:
        return null;
    }
  };

  // 考试模式全屏显示
  if (isExamMode) {
    return (
      <div className="h-screen">
        <Exam 
          questions={examQuestions}
          title={examTitle}
          onFinish={handleExamFinish}
          onExit={handleExamExit}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 桌面端侧边栏 */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r hidden lg:block">
        {renderSidebarContent()}
      </aside>

      {/* 移动端顶部导航 */}
      <header className="lg:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold">智能考试系统</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {renderSidebarContent()}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <Toaster />
    </div>
  );
}

export default App;
