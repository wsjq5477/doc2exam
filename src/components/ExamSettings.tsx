import { useState, useEffect } from 'react';
import { Play, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllCategories, getQuestionsByCategory, loadState } from '@/utils/storage';
import type { Question } from '@/types';

interface ExamSettingsProps {
  onStartExam: (questions: Question[], title: string) => void;
}

export function ExamSettings({ onStartExam }: ExamSettingsProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [questionCount, setQuestionCount] = useState(20);
  const [randomOrder, setRandomOrder] = useState(true);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [useWrongAnswers, setUseWrongAnswers] = useState(false);

  useEffect(() => {
    loadCategories();
    loadQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [availableQuestions, selectedCategory, difficulty, useWrongAnswers]);

  const loadCategories = () => {
    const cats = getAllCategories();
    setCategories(cats);
  };

  const loadQuestions = () => {
    const questions = getQuestionsByCategory('all');
    setAvailableQuestions(questions);
  };

  const filterQuestions = () => {
    let filtered = useWrongAnswers 
      ? loadState().wrongAnswers.map(w => w.question)
      : [...availableQuestions];
    
    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    
    // 按难度筛选
    if (difficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    
    setFilteredQuestions(filtered);
    
    // 调整题目数量
    if (filtered.length < questionCount) {
      setQuestionCount(filtered.length);
    }
  };

  const handleStartExam = () => {
    let questions = [...filteredQuestions];
    
    // 随机打乱
    if (randomOrder) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    
    // 截取指定数量
    questions = questions.slice(0, questionCount);
    
    // 生成标题
    let title = '';
    if (useWrongAnswers) {
      title = '错题重练';
    } else if (selectedCategory === 'all') {
      title = '综合练习';
    } else {
      title = selectedCategory;
    }
    title += ` (${questions.length}题)`;
    
    onStartExam(questions, title);
  };

  const totalQuestions = loadState().wrongAnswers.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            考试设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 错题重练选项 */}
          {totalQuestions > 0 && (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  错题重练模式
                </Label>
                <p className="text-sm text-gray-600">
                  你共有 {totalQuestions} 道错题，是否只练习错题？
                </p>
              </div>
              <Switch
                checked={useWrongAnswers}
                onCheckedChange={setUseWrongAnswers}
              />
            </div>
          )}

          {/* 分类选择 */}
          {!useWrongAnswers && (
            <div className="space-y-2">
              <Label>选择分类</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择题目分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 难度选择 */}
          <div className="space-y-2">
            <Label>难度筛选</Label>
            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
              <SelectTrigger>
                <SelectValue placeholder="选择难度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部难度</SelectItem>
                <SelectItem value="easy">简单</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="hard">困难</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 题目数量 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>题目数量</Label>
              <span className="text-sm font-medium">{questionCount} 题</span>
            </div>
            <Slider
              value={[questionCount]}
              onValueChange={(value) => setQuestionCount(value[0])}
              max={Math.min(filteredQuestions.length, 100)}
              min={1}
              step={1}
              disabled={filteredQuestions.length === 0}
            />
            <p className="text-sm text-gray-500">
              可用题目: {filteredQuestions.length} 题
            </p>
          </div>

          {/* 随机顺序 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>随机顺序</Label>
              <p className="text-sm text-gray-500">打乱题目顺序</p>
            </div>
            <Switch
              checked={randomOrder}
              onCheckedChange={setRandomOrder}
            />
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{filteredQuestions.length}</div>
              <div className="text-sm text-gray-500">可用题目</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{questionCount}</div>
              <div className="text-sm text-gray-500">将出题数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round((questionCount / (filteredQuestions.length || 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-500">覆盖率</div>
            </div>
          </div>

          {/* 开始按钮 */}
          <Button 
            className="w-full" 
            size="lg"
            disabled={filteredQuestions.length === 0 || questionCount === 0}
            onClick={handleStartExam}
          >
            <Play className="h-5 w-5 mr-2" />
            开始考试
          </Button>

          {filteredQuestions.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                没有符合条件的题目，请调整筛选条件或导入更多题目
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
