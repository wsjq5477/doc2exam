import { useState, useEffect } from 'react';
import { BookOpen, Trash2, Calendar, FolderOpen, FileText, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteQuestionBank, loadState } from '@/utils/storage';
import type { QuestionBank } from '@/types';

interface QuestionBankManagerProps {
  onBanksChange: () => void;
}

export function QuestionBankManager({ onBanksChange }: QuestionBankManagerProps) {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = () => {
    const state = loadState();
    setBanks(state.questionBanks);
  };

  const handleDelete = (bankId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个题库吗？此操作不可恢复。')) {
      deleteQuestionBank(bankId);
      loadBanks();
      onBanksChange();
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索题库名称或分类..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadBanks}>
          刷新
        </Button>
      </div>

      {filteredBanks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>暂无题库</p>
          <p className="text-sm">上传文件以创建题库</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBanks.map((bank) => (
            <Card 
              key={bank.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedBank(bank)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="truncate max-w-[150px]">{bank.name}</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={(e) => handleDelete(bank.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>{bank.questions.length} 道题目</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FolderOpen className="h-4 w-4" />
                  <span>{bank.categories.length} 个分类</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(bank.importTime)}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-2">
                  {bank.categories.slice(0, 3).map((cat, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {bank.categories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{bank.categories.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 题库详情对话框 */}
      <Dialog open={!!selectedBank} onOpenChange={() => setSelectedBank(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedBank?.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedBank(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              共 {selectedBank?.questions.length} 道题目
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 p-4">
              {selectedBank?.questions.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-500">{index + 1}.</span>
                      <div className="flex-1">
                        <p className="font-medium">{question.content}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{question.category}</Badge>
                          <Badge variant={
                            question.difficulty === 'easy' ? 'default' :
                            question.difficulty === 'medium' ? 'secondary' : 'destructive'
                          }>
                            {question.difficulty === 'easy' ? '简单' :
                             question.difficulty === 'medium' ? '中等' : '困难'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {question.options.map((option, optIdx) => (
                        <div 
                          key={optIdx}
                          className={`p-2 rounded text-sm ${
                            String.fromCharCode(65 + optIdx) === question.correctAnswer
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-50'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}. {option}
                        </div>
                      ))}
                    </div>
                    {question.explanation && (
                      <div className="pl-6 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        <span className="font-medium">解析：</span>
                        {question.explanation}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
