import { useState, useEffect } from 'react';
import { BookOpen, Trash2, RotateCcw, Filter, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadState, removeWrongAnswer } from '@/utils/storage';
import type { WrongAnswer } from '@/types';

export function WrongAnswers() {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [filteredAnswers, setFilteredAnswers] = useState<WrongAnswer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<WrongAnswer | null>(null);

  useEffect(() => {
    loadWrongAnswers();
  }, []);

  useEffect(() => {
    filterAnswers();
  }, [wrongAnswers, searchTerm, selectedCategory]);

  const loadWrongAnswers = () => {
    const state = loadState();
    // 按错误次数排序
    const sorted = [...state.wrongAnswers].sort((a, b) => b.count - a.count);
    setWrongAnswers(sorted);
    
    // 提取分类
    const cats = new Set<string>();
    sorted.forEach(w => cats.add(w.question.category));
    setCategories(Array.from(cats));
  };

  const filterAnswers = () => {
    let filtered = wrongAnswers;
    
    if (searchTerm) {
      filtered = filtered.filter(w =>
        w.question.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(w => w.question.category === selectedCategory);
    }
    
    setFilteredAnswers(filtered);
  };

  const handleDelete = (questionId: string) => {
    if (confirm('确定从错题本中移除这道题吗？')) {
      removeWrongAnswer(questionId);
      loadWrongAnswers();
    }
  };

  const handlePractice = () => {
    // 可以在这里实现错题重练功能
    alert('错题重练功能可以在考试设置中选择"仅练习错题"');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '中等';
    }
  };

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{wrongAnswers.length}</div>
            <div className="text-sm text-red-700">错题总数</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {wrongAnswers.reduce((sum, w) => sum + w.count, 0)}
            </div>
            <div className="text-sm text-orange-700">累计错误次数</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(wrongAnswers.reduce((sum, w) => sum + w.count, 0) / wrongAnswers.length) || 0}
            </div>
            <div className="text-sm text-blue-700">平均错误次数</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索错题内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handlePractice}>
          <RotateCcw className="h-4 w-4 mr-2" />
          错题重练
        </Button>
      </div>

      {/* 错题列表 */}
      {filteredAnswers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>暂无错题记录</p>
          <p className="text-sm">完成考试后，答错的题目会显示在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnswers.map((wrong, index) => (
            <Card key={wrong.question.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Badge>{wrong.question.category}</Badge>
                      <Badge variant={
                        wrong.question.difficulty === 'easy' ? 'default' :
                        wrong.question.difficulty === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {getDifficultyLabel(wrong.question.difficulty)}
                      </Badge>
                      <Badge variant="outline" className="text-red-500">
                        错 {wrong.count} 次
                      </Badge>
                    </div>
                    <p className="text-gray-800 line-clamp-2">{wrong.question.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>你的答案: 
                        <span className="text-red-600 font-medium ml-1">
                          {wrong.userAnswer || '未作答'}
                        </span>
                      </span>
                      <span>正确答案: 
                        <span className="text-green-600 font-medium ml-1">
                          {wrong.question.correctAnswer}
                        </span>
                      </span>
                      <span>最后错误: {formatDate(wrong.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedQuestion(wrong);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(wrong.question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 题目详情对话框 */}
      <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>错题详情</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedQuestion && (
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <Badge>{selectedQuestion.question.category}</Badge>
                  <Badge variant={
                    selectedQuestion.question.difficulty === 'easy' ? 'default' :
                    selectedQuestion.question.difficulty === 'medium' ? 'secondary' : 'destructive'
                  }>
                    {getDifficultyLabel(selectedQuestion.question.difficulty)}
                  </Badge>
                </div>
                
                <p className="text-lg font-medium">{selectedQuestion.question.content}</p>
                
                <div className="space-y-2">
                  {selectedQuestion.question.options.map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isCorrect = letter === selectedQuestion.question.correctAnswer;
                    const isUserAnswer = letter === selectedQuestion.userAnswer;
                    
                    return (
                      <div
                        key={idx}
                        className={`
                          p-3 rounded-lg border
                          ${isCorrect ? 'bg-green-100 border-green-300' : ''}
                          ${isUserAnswer && !isCorrect ? 'bg-red-100 border-red-300' : ''}
                          ${!isCorrect && !isUserAnswer ? 'bg-gray-50' : ''}
                        `}
                      >
                        <span className="font-medium mr-2">{letter}.</span>
                        {option}
                        {isCorrect && <span className="ml-2 text-green-600 text-sm">(正确答案)</span>}
                        {isUserAnswer && !isCorrect && <span className="ml-2 text-red-600 text-sm">(你的答案)</span>}
                      </div>
                    );
                  })}
                </div>
                
                {selectedQuestion.question.explanation && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-medium text-blue-800 mb-1">解析</div>
                    <div className="text-blue-700">{selectedQuestion.question.explanation}</div>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 pt-4 border-t">
                  <p>错误次数: {selectedQuestion.count}</p>
                  <p>最后错误时间: {formatDate(selectedQuestion.timestamp)}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
