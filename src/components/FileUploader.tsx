import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { parseFile } from '@/utils/fileParser';
import { addQuestionBank } from '@/utils/storage';
import type { ParseResult, QuestionBank } from '@/types';

interface FileUploaderProps {
  onUploadSuccess: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'parsing' | 'success' | 'error';
  progress: number;
  result?: ParseResult;
  error?: string;
}

export function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 15),
      status: 'pending',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    
    // 自动开始解析
    newFiles.forEach(uploadFile => {
      parseUploadFile(uploadFile);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const parseUploadFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'parsing', progress: 30 } : f
    ));

    try {
      const result = await parseFile(uploadFile.file);
      
      if (result.success && result.questions.length > 0) {
        // 创建题库
        const bank: QuestionBank = {
          id: Math.random().toString(36).substring(2, 15),
          name: uploadFile.file.name.replace(/\.[^/.]+$/, ''),
          questions: result.questions,
          categories: result.categories,
          importTime: Date.now(),
          sourceFile: uploadFile.file.name,
        };
        
        addQuestionBank(bank);
        
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'success', 
            progress: 100,
            result 
          } : f
        ));
        
        onUploadSuccess();
      } else {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'error', 
            progress: 100,
            error: result.error || '未能解析到题目，请检查文件格式' 
          } : f
        ));
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          progress: 100,
          error: (error as Error).message 
        } : f
      ));
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status === 'parsing' || f.status === 'pending'));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700">
          {isDragActive ? '松开以上传文件' : '拖拽文件到此处，或点击选择文件'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          支持 Excel (.xlsx, .xls)、Word (.docx, .doc)、PDF (.pdf)、文本 (.txt, .csv)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">上传进度</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCompleted}
            >
              清除已完成
            </Button>
          </div>
          
          {files.map(uploadFile => (
            <div 
              key={uploadFile.id}
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {uploadFile.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(uploadFile.file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(uploadFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Progress value={uploadFile.progress} className="h-2" />
              
              {uploadFile.status === 'success' && uploadFile.result && (
                <p className="text-xs text-green-600">
                  成功解析 {uploadFile.result.questions.length} 道题目
                  {uploadFile.result.categories.length > 0 && 
                    `，分类: ${uploadFile.result.categories.join(', ')}`
                  }
                </p>
              )}
              
              {uploadFile.status === 'error' && (
                <p className="text-xs text-red-600">
                  {uploadFile.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
