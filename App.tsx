import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PenTool, Database } from 'lucide-react';
import { QuestionData, EvaluationData, ViewMode, Scores } from './types';
import { INITIAL_QUESTIONS } from './constants';
import Evaluator from './components/Evaluator';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EVALUATE);
  const [questions, setQuestions] = useState<QuestionData[]>(INITIAL_QUESTIONS);
  const [evaluations, setEvaluations] = useState<EvaluationData>({});

  // Load Evaluations from local storage
  useEffect(() => {
    const savedEvaluations = localStorage.getItem('llm-eval-data');
    if (savedEvaluations) {
      try {
        setEvaluations(JSON.parse(savedEvaluations));
      } catch (e) {
        console.error("Failed to parse saved evaluations");
      }
    }

    // Load Questions from local storage (if user has imported custom data)
    const savedQuestions = localStorage.getItem('llm-eval-questions');
    if (savedQuestions) {
       try {
        const parsedQ = JSON.parse(savedQuestions);
        if (parsedQ && Array.isArray(parsedQ) && parsedQ.length > 0) {
           setQuestions(parsedQ);
        }
      } catch (e) {
        console.error("Failed to parse saved questions");
      }
    }
  }, []);

  // Save Evaluations to local storage
  useEffect(() => {
    localStorage.setItem('llm-eval-data', JSON.stringify(evaluations));
  }, [evaluations]);

  // Save Questions to local storage
  const handleSetQuestions = (newQuestions: QuestionData[]) => {
    setQuestions(newQuestions);
    localStorage.setItem('llm-eval-questions', JSON.stringify(newQuestions));
  };

  const handleResetQuestions = () => {
    if (window.confirm("Are you sure you want to reset to the default 5 demo questions? This will overwrite your current question list.")) {
      handleSetQuestions(INITIAL_QUESTIONS);
      setEvaluations({}); // Optional: clear evaluations when resetting questions to avoid mismatch
    }
  };

  // NEW: Handler to clear only evaluations (scores) but keep the questions
  const handleClearEvaluations = () => {
    if (window.confirm("Warning: This will delete ALL current scores/grades. This is typically done to let a NEW person start grading.\n\nHave you exported the current results first?\n\nClick OK to clear scores.")) {
      setEvaluations({});
      localStorage.removeItem('llm-eval-data');
      setViewMode(ViewMode.EVALUATE); // Go back to grading screen
    }
  };

  const handleUpdateEvaluation = (questionId: number, modelKey: string, scores: Scores) => {
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [modelKey]: scores
      }
    }));
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-20 bg-slate-900 text-slate-300 flex flex-col items-center py-6 gap-6 z-20 shadow-xl">
        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
          Ev
        </div>
        
        <NavButton 
          active={viewMode === ViewMode.EVALUATE} 
          onClick={() => setViewMode(ViewMode.EVALUATE)} 
          icon={<PenTool size={20} />} 
          label="Grade" 
        />
        <NavButton 
          active={viewMode === ViewMode.DASHBOARD} 
          onClick={() => setViewMode(ViewMode.DASHBOARD)} 
          icon={<LayoutDashboard size={20} />} 
          label="Stats" 
        />
        <NavButton 
          active={viewMode === ViewMode.DATA_ENTRY} 
          onClick={() => setViewMode(ViewMode.DATA_ENTRY)} 
          icon={<Database size={20} />} 
          label="Data" 
        />
        
        <div className="mt-auto mb-4">
          <div className="text-[10px] text-center text-slate-500">v1.3</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {viewMode === ViewMode.EVALUATE && (
          <Evaluator 
            questions={questions} 
            evaluations={evaluations} 
            onUpdateEvaluation={handleUpdateEvaluation}
          />
        )}
        
        {viewMode === ViewMode.DASHBOARD && (
          <Dashboard 
            questions={questions} 
            evaluations={evaluations}
          />
        )}

        {viewMode === ViewMode.DATA_ENTRY && (
          <DataEntry 
            questions={questions}
            setQuestions={handleSetQuestions}
            evaluations={evaluations}
            setEvaluations={setEvaluations}
            onReset={handleResetQuestions}
            onClearEvaluations={handleClearEvaluations}
          />
        )}
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 w-16 rounded-lg transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
