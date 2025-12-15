import React, { useState } from 'react';
import { QuestionData, EvaluationData, MODELS } from '../types';
import { Upload, Trash2, RefreshCcw, FileJson, FileSpreadsheet, Check, Download, ArchiveRestore, UserPlus, Eraser } from 'lucide-react';

interface DataEntryProps {
  questions: QuestionData[];
  setQuestions: (questions: QuestionData[]) => void;
  evaluations: EvaluationData;
  setEvaluations: (evaluations: EvaluationData) => void;
  onReset: () => void;
  onClearEvaluations: () => void;
}

const DataEntry: React.FC<DataEntryProps> = ({ questions, setQuestions, evaluations, setEvaluations, onReset, onClearEvaluations }) => {
  const [activeTab, setActiveTab] = useState<'session' | 'import' | 'backup'>('session');
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // --- Handlers for Question Import ---
  const handleQuestionImport = () => {
    try {
      let newQuestions: QuestionData[] = [];

      if (importFormat === 'JSON') {
        const parsed = JSON.parse(importText);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array of objects.");
        newQuestions = parsed.map((item: any, index: number) => ({
            id: item.id || index + 1,
            question: item.question || "Untitled Question",
            answers: item.answers || {}
        }));
      } else {
        // CSV Parser
        const lines = importText.trim().split('\n');
        if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        newQuestions = lines.slice(1).map((line, idx) => {
           // Handle simple comma splitting
           const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
           const row: any = {};
           headers.forEach((h, i) => {
             row[h] = parts[i]?.replace(/^"|"$/g, '').trim() || ""; 
           });

           return {
             id: parseInt(row['id']) || idx + 1,
             question: row['question'] || "Untitled Question",
             answers: {
               deepseek: row['answer_deepseek'] || row['deepseek'] || "",
               gemini: row['answer_gemini'] || row['gemini'] || "",
               qwen: row['answer_qwen'] || row['qwen'] || "",
               chatgpt: row['answer_chatgpt'] || row['chatgpt'] || ""
             }
           };
        });
      }

      if (newQuestions.length === 0) throw new Error("No valid questions found.");
      
      setQuestions(newQuestions);
      setStatusMsg({ type: 'success', text: `Successfully imported ${newQuestions.length} questions!` });
      setImportText('');
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `Import Failed: ${e.message}` });
    }
  };

  // --- Handlers for Full Backup/Restore ---
  const handleBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      questions,
      evaluations
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `llm_eval_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMsg({ type: 'success', text: "Project backup downloaded successfully." });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data.questions || !Array.isArray(data.questions)) {
           throw new Error("Invalid backup file: Missing questions data.");
        }
        
        if (window.confirm(`Found ${data.questions.length} questions and evaluation data from ${new Date(data.timestamp).toLocaleString()}. Overwrite current project?`)) {
           setQuestions(data.questions);
           setEvaluations(data.evaluations || {});
           setStatusMsg({ type: 'success', text: "Project restored successfully!" });
        }
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: "Failed to restore: " + err.message });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="p-8 bg-slate-50 min-h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-2">
           <div>
            <h1 className="text-2xl font-bold text-slate-800">Data Management</h1>
            <p className="text-slate-500 mt-1">Manage questions, backups, and evaluation sessions.</p>
           </div>
           <div className="text-right">
             <div className="text-3xl font-bold text-indigo-600">{questions.length}</div>
             <div className="text-xs text-slate-400 uppercase font-semibold">Total Questions</div>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
           <button 
            onClick={() => setActiveTab('session')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'session' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Session Control
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'import' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Import Questions
          </button>
          <button 
            onClick={() => setActiveTab('backup')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'backup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Backup & Restore
          </button>
        </div>

        {/* Notification Area */}
        {statusMsg && (
          <div className={`p-4 rounded-lg text-sm flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {statusMsg.type === 'success' ? <Check size={18}/> : <AlertCircleIcon size={18}/>}
            {statusMsg.text}
            <button onClick={() => setStatusMsg(null)} className="ml-auto opacity-50 hover:opacity-100">×</button>
          </div>
        )}

        {/* TAB: Session Control (New) */}
        {activeTab === 'session' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-start gap-4">
               <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                 <UserPlus size={24} />
               </div>
               <div className="flex-1">
                 <h3 className="text-lg font-bold text-slate-800">New Evaluator / Start Fresh</h3>
                 <p className="text-sm text-slate-600 mt-1 mb-4">
                   Finished grading? Use this to clear all <b>Score</b> data but keep the <b>Questions</b> loaded. This allows the next person to start evaluating the same questions from scratch.
                 </p>
                 <div className="flex gap-3">
                   <button 
                    onClick={onClearEvaluations}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors shadow-sm"
                   >
                     <Eraser size={16} />
                     Clear Scores & Start New Session
                   </button>
                 </div>
                 <p className="text-xs text-slate-400 mt-3 italic">
                   Note: Make sure you have exported/backed up the previous results first!
                 </p>
               </div>
             </div>
           </div>
        )}

        {/* TAB: Import Questions */}
        {activeTab === 'import' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4">
               <button 
                  onClick={() => setImportFormat('JSON')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importFormat === 'JSON' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
               >
                 <FileJson size={18} /> JSON
               </button>
               <button 
                  onClick={() => setImportFormat('CSV')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importFormat === 'CSV' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
               >
                 <FileSpreadsheet size={18} /> CSV
               </button>
            </div>
            
            <div className="p-6 space-y-4">
               <p className="text-sm text-slate-600">
                 Paste your 100 questions below to load them into the evaluator. This will verify the format but won't delete your existing evaluations unless you overwrite specific question IDs.
               </p>
               <textarea 
                  className="w-full h-64 p-4 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  placeholder={importFormat === 'JSON' ? JSON_PLACEHOLDER : CSV_PLACEHOLDER}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
               />
               <div className="flex justify-end">
                 <button 
                  onClick={handleQuestionImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Upload size={18} />
                   Load Questions
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* TAB: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Backup Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                  <Download size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Backup Project</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Download a complete copy of your work, including all 100 questions and the scores you have assigned so far.
                </p>
              </div>
              <button 
                onClick={handleBackup}
                className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
              >
                Download .json
              </button>
            </div>

            {/* Restore Card */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                  <ArchiveRestore size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Restore Project</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Upload a previously saved <code>.json</code> backup file to resume your work exactly where you left off.
                </p>
              </div>
              <div className="mt-6 relative">
                 <input 
                  type="file" 
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors flex justify-center items-center gap-2">
                  Select Backup File
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Current Data Preview Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
           <div className="p-4 border-b border-slate-200 flex justify-between items-center">
             <h3 className="font-semibold text-slate-700">Questions Loaded</h3>
             <div className="flex gap-2">
                <button onClick={onReset} className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded bg-slate-100 hover:bg-indigo-50 transition-colors">
                  <RefreshCcw size={14} /> Reset Default
                </button>
                <button onClick={() => {if(window.confirm('Delete all questions?')) setQuestions([])}} className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 transition-colors">
                  <Trash2 size={14} /> Clear
                </button>
             </div>
           </div>
           <div className="overflow-x-auto max-h-96">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                 <tr>
                   <th className="px-6 py-3 border-b">ID</th>
                   <th className="px-6 py-3 border-b w-1/2">Question</th>
                   <th className="px-6 py-3 border-b">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {questions.map((q) => (
                   <tr key={q.id} className="hover:bg-slate-50">
                     <td className="px-6 py-3 font-mono text-xs">{q.id}</td>
                     <td className="px-6 py-3 truncate max-w-xs" title={q.question}>{q.question}</td>
                     <td className="px-6 py-3">
                        {/* Check if this question has been graded */}
                        {evaluations[q.id] ? (
                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                             <Check size={10} /> Graded
                           </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                            Pending
                          </span>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
              {questions.length === 0 && (
               <div className="p-8 text-center text-slate-400">
                 No questions loaded. Import data above.
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

const AlertCircleIcon = ({size}: {size:number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

const JSON_PLACEHOLDER = `[
  {
    "id": 1,
    "question": "Your question here...",
    "answers": {
      "deepseek": "Answer from deepseek...",
      "gemini": "Answer from gemini...",
      "qwen": "Answer from qwen...",
      "chatgpt": "Answer from chatgpt..."
    }
  },
  ...
]`;

const CSV_PLACEHOLDER = `id, question, answer_deepseek, answer_gemini, answer_qwen, answer_chatgpt
1, "What is diabetes?", "Answer A...", "Answer B...", "Answer C...", "Answer D..."
2, "Second question?", "Answer A...", "Answer B...", "Answer C...", "Answer D..."
`;

export default DataEntry;