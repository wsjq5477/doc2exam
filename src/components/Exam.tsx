import { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addExamRecord, updateExamRecord, addWrongAnswer } from '@/utils/storage';
import type { Question, ExamRecord } from '@/types';

interface ExamProps {
  questions: Question[];
  title: string;
  onFinish: () => void;
  onExit: () => void;
}

export function Exam({ questions, title, onFinish, onExit }: ExamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [examRecord, setExamRecord] = useState<ExamRecord | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  useEffect(() => {
    // 创建考试记录
    const record: ExamRecord = {
      id: Math.random().toString(36).substring(2, 15),
      title,
      startTime: Date.now(),
      questions,
      answers: {},
      isCompleted: false,
    };
    setExamRecord(record);
    addExamRecord(record);

    // 计时器
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const toggleMark = () => {
    setMarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / totalQuestions) * 100);
  };

  const handleSubmit = async () => {
    if (!examRecord) return;
    
    setIsSubmitting(true);
    
    const score = calculateScore();
    const completedRecord: ExamRecord = {
      ...examRecord,
      endTime: Date.now(),
      answers,
      score,
      isCompleted: true,
    };
    
    // 记录错题
    questions.forEach(q => {
      if (answers[q.id] !== q.correctAnswer) {
        addWrongAnswer(q, answers[q.id] || '', examRecord.id);
      }
    });
    
    updateExamRecord(completedRecord);
    setExamRecord(completedRecord);
    setShowSubmitDialog(false);
    setShowResultDialog(true);
    setIsSubmitting(false);
  };

  const handleFinish = () => {
    setShowResultDialog(false);
    onFinish();
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '中等';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-white border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Badge variant="outline">
              {currentIndex + 1} / {totalQuestions}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onExit}>
              退出
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧题目区 */}
        <div className="flex-1 p-6 overflow-auto">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-6 space-y-6">
              {/* 题目头部 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                    {getDifficultyLabel(currentQuestion.difficulty)}
                  </Badge>
                  <Badge variant="outline">{currentQuestion.category}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMark}
                  className={markedQuestions.has(currentQuestion.id) ? 'text-yellow-500' : ''}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {markedQuestions.has(currentQuestion.id) ? '已标记' : '标记'}
                </Button>
              </div>

              {/* 题目内容 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium leading-relaxed">
                  {currentIndex + 1}. {currentQuestion.content}
                </h3>

                {/* 选项 */}
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    return (
                      <div
                        key={index}
                        className={`
                          flex items-center space-x-3 p-4 rounded-lg border cursor-pointer
                          transition-colors duration-200
                          ${answers[currentQuestion.id] === optionLetter
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                        onClick={() => handleAnswer(optionLetter)}
                      >
                        <RadioGroupItem value={optionLetter} id={`option-${index}`} />
                        <Label 
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          <span className="font-medium mr-2">{optionLetter}.</span>
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* 导航按钮 */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一题
                </Button>
                
                {currentIndex === totalQuestions - 1 ? (
                  <Button 
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={answeredCount < totalQuestions}
                  >
                    提交试卷
                  </Button>
                ) : (
                  <Button
                    onClick={() => goToQuestion(currentIndex + 1)}
                  >
                    下一题
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧题号导航 */}
        <div className="w-64 bg-gray-50 border-l p-4 hidden lg:block">
          <h4 className="font-medium mb-4">题目导航</h4>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, index) => {
                const isAnswered = !!answers[q.id];
                const isMarked = markedQuestions.has(q.id);
                const isCurrent = index === currentIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(index)}
                    className={`
                      w-10 h-10 rounded-lg text-sm font-medium transition-colors
                      ${isCurrent
                        ? 'bg-primary text-white'
                        : isAnswered
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-white border hover:bg-gray-50'
                      }
                      ${isMarked && !isCurrent ? 'ring-2 ring-yellow-400' : ''}
                    `}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded" />
              <span>已作答</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border rounded" />
              <span>未作答</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 ring-2 ring-yellow-400 rounded" />
              <span>已标记</span>
            </div>
          </div>
        </div>
      </div>

      {/* 提交确认对话框 */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认提交</DialogTitle>
            <DialogDescription>
              您已作答 {answeredCount} / {totalQuestions} 道题目
              {answeredCount < totalQuestions && '，还有未完成的题目'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              继续答题
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '确认提交'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 考试结果对话框 */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">考试结果</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl font-bold text-primary">
              {examRecord?.score}分
            </div>
            <div className="text-gray-600">
              用时: {formatTime(Math.floor((examRecord?.endTime! - examRecord?.startTime!) / 1000))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-600 font-medium">答对</div>
                <div className="text-2xl font-bold text-green-700">
                  {questions.filter(q => answers[q.id] === q.correctAnswer).length}
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-red-600 font-medium">答错</div>
                <div className="text-2xl font-bold text-red-700">
                  {questions.filter(q => answers[q.id] !== q.correctAnswer).length}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleFinish} className="w-full">
              完成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
