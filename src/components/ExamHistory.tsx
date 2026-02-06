import { useState, useEffect } from 'react';
import { History, Calendar, Clock, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadState } from '@/utils/storage';
import type { ExamRecord } from '@/types';

export function ExamHistory() {
  const [history, setHistory] = useState<ExamRecord[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamRecord | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const state = loadState();
    // 按时间倒序排列
    const sorted = [...state.examHistory].sort((a, b) => b.startTime - a.startTime);
    setHistory(sorted);
  };

  const handleDelete = (examId: string) => {
    if (confirm('确定要删除这条考试记录吗？')) {
      const state = loadState();
      state.examHistory = state.examHistory.filter(h => h.id !== examId);
      // 重新保存状态
      localStorage.setItem('exam_system_data', JSON.stringify(state));
      loadHistory();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: number, end?: number) => {
    if (!end) return '未完成';
    const duration = Math.floor((end - start) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}分${secs}秒`;
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return <Badge variant="outline">未完成</Badge>;
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">优秀</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">及格</Badge>;
    return <Badge className="bg-red-100 text-red-800">不及格</Badge>;
  };

  // 计算统计数据
  const completedExams = history.filter(h => h.isCompleted);
  const averageScore = completedExams.length > 0
    ? Math.round(completedExams.reduce((sum, h) => sum + (h.score || 0), 0) / completedExams.length)
    : 0;
  const highestScore = completedExams.length > 0
    ? Math.max(...completedExams.map(h => h.score || 0))
    : 0;
  const lowestScore = completedExams.length > 0
    ? Math.min(...completedExams.map(h => h.score || 0))
    : 0;

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{history.length}</div>
            <div className="text-sm text-blue-700">总考试次数</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{averageScore}</div>
            <div className="text-sm text-green-700">平均分</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{highestScore}</div>
            <div className="text-sm text-purple-700">最高分</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{lowestScore}</div>
            <div className="text-sm text-orange-700">最低分</div>
          </CardContent>
        </Card>
      </div>

      {/* 历史记录列表 */}
      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>暂无考试记录</p>
          <p className="text-sm">完成考试后，记录会显示在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-lg">{exam.title}</span>
                      {getScoreBadge(exam.score)}
                      {!exam.isCompleted && (
                        <Badge variant="secondary">进行中</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(exam.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(exam.startTime, exam.endTime)}
                      </span>
                      <span>
                        {exam.questions.length} 题
                      </span>
                      {exam.isCompleted && (
                        <span>
                          答对 {exam.questions.filter(q => exam.answers[q.id] === q.correctAnswer).length} 题
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {exam.isCompleted && (
                      <div className={`text-4xl font-bold ${getScoreColor(exam.score)}`}>
                        {exam.score}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedExam(exam)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(exam.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 考试详情对话框 */}
      <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>考试详情</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedExam && (
              <div className="space-y-4 p-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">考试名称</div>
                      <div className="font-medium">{selectedExam.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">考试时间</div>
                      <div className="font-medium">{formatDate(selectedExam.startTime)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">用时</div>
                      <div className="font-medium">
                        {formatDuration(selectedExam.startTime, selectedExam.endTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">得分</div>
                      <div className={`text-2xl font-bold ${getScoreColor(selectedExam.score)}`}>
                        {selectedExam.score}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">答题详情</h4>
                  {selectedExam.questions.map((question, idx) => {
                    const userAnswer = selectedExam.answers[question.id];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <div key={question.id} className="border rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium">{question.content}</p>
                            <div className="mt-2 space-y-1">
                              {question.options.map((option, optIdx) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                const isSelected = userAnswer === letter;
                                const isCorrectAnswer = letter === question.correctAnswer;
                                
                                return (
                                  <div
                                    key={optIdx}
                                    className={`
                                      text-sm p-1 rounded
                                      ${isCorrectAnswer ? 'bg-green-100 text-green-800' : ''}
                                      ${isSelected && !isCorrectAnswer ? 'bg-red-100 text-red-800' : ''}
                                    `}
                                  >
                                    {letter}. {option}
                                    {isCorrectAnswer && ' (正确答案)'}
                                    {isSelected && !isCorrectAnswer && ' (你的答案)'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            {isCorrect ? (
                              <Badge className="bg-green-100 text-green-800">正确</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">错误</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
