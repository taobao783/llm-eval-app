import React, { useState, useEffect } from 'react';
import { QuestionData, EvaluationData, Scores, MODELS } from '../types';
import { ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EvaluatorProps {
  questions: QuestionData[];
  evaluations: EvaluationData;
  onUpdateEvaluation: (questionId: number, modelKey: string, scores: Scores) => void;
}

const Evaluator: React.FC<EvaluatorProps> = ({ questions, evaluations, onUpdateEvaluation }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  
  // Handlers for navigation
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(prev => prev + 1);
  };
  
  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
  };

  const getScore = (modelKey: string): Scores => {
    return evaluations[currentQuestion.id]?.[modelKey] || { accuracy: 0, completeness: 0, readability: 0, detail: 0 };
  };

  const updateScore = (modelKey: string, field: keyof Scores, value: number) => {
    const currentScores = getScore(modelKey);
    const newScores = { ...currentScores, [field]: value };
    
    // Logic: If Accuracy is 1, Completeness is not graded (reset to 0 or treat as N/A visually)
    if (field === 'accuracy' && value === 1) {
      newScores.completeness = 0; 
    }

    onUpdateEvaluation(currentQuestion.id, modelKey, newScores);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Sticky Header for Question Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Question {currentQuestion.id} of {questions.length}
          </h2>
          <div className="flex gap-2">
             <button 
              onClick={handlePrev} 
              disabled={currentQuestionIndex === 0}
              className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button 
              onClick={handleNext} 
              disabled={currentQuestionIndex === questions.length - 1}
              className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-800 leading-tight">
          {currentQuestion.question}
        </h1>
      </div>

      {/* Main Content: 4 Columns for Models */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {MODELS.map((model) => (
            <ModelCard 
              key={model.key}
              model={model}
              answer={currentQuestion.answers[model.key]}
              scores={getScore(model.key)}
              onUpdate={(field, val) => updateScore(model.key, field, val)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ModelCardProps {
  model: { name: string; color: string };
  answer: string;
  scores: Scores;
  onUpdate: (field: keyof Scores, val: number) => void;
}

// Sub-component for individual model card
const ModelCard: React.FC<ModelCardProps> = ({ model, answer, scores, onUpdate }) => {
  
  // Logic helpers
  const isAccuracyOne = scores.accuracy === 1;

  // Readability Label Helper
  const getReadabilityLabel = (score: number) => {
    if (score === 0) return "Not Rated";
    if (score >= 90) return "Very Easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Reasonably Easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Reasonably Difficult";
    if (score >= 30) return "Difficult";
    return "Very Difficult";
  };
  
  // Detail Label Helper
  const getDetailLabel = (score: number) => {
    if (score === 0) return "Not Rated";
    if (score >= 90) return "Very Detailed";
    if (score >= 80) return "Fairly Detailed";
    if (score >= 70) return "Somewhat Detailed";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Overly Brief";
    if (score >= 30) return "Very Brief";
    return "Lacking Detail";
  };

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
      {/* Model Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2" style={{ borderTop: `4px solid ${model.color}` }}>
        <span className="font-bold text-slate-700">{model.name}</span>
      </div>

      {/* Answer Content */}
      <div className="p-4 bg-slate-50 min-h-[160px] max-h-[300px] overflow-y-auto text-slate-700 text-sm leading-relaxed border-b border-slate-100 custom-scrollbar">
        {answer || <span className="text-slate-400 italic">No answer provided.</span>}
      </div>

      {/* Grading Controls */}
      <div className="p-4 space-y-5">
        
        {/* Metric 1: Accuracy (1-6) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Accuracy</label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${scores.accuracy > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
              {scores.accuracy || '-'} / 6
            </span>
          </div>
          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5, 6].map((val) => (
              <button
                key={val}
                onClick={() => onUpdate('accuracy', val)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  scores.accuracy === val 
                    ? 'bg-blue-600 text-white shadow-md scale-110' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`Level ${val}`}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Incorrect</span>
            <span>Correct</span>
          </div>
        </div>

        {/* Metric 2: Completeness (1-3) */}
        <div className={`transition-opacity duration-300 ${isAccuracyOne ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
           <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Completeness</label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${scores.completeness > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>
              {isAccuracyOne ? 'N/A' : (scores.completeness || '-') + ' / 3'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
             {[
               { val: 1, label: 'Incomplete' },
               { val: 2, label: 'Adequate' },
               { val: 3, label: 'Comp.' }
             ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => onUpdate('completeness', opt.val)}
                className={`py-1.5 px-2 rounded text-xs font-medium transition-colors border ${
                  scores.completeness === opt.val
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                }`}
              >
                {opt.label}
              </button>
             ))}
          </div>
           {isAccuracyOne && <p className="text-[10px] text-red-500 mt-1">Skipped because Accuracy is 1.</p>}
        </div>

        {/* Metric 3: Readability (Slider 0-100) */}
        <div>
           <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Readability (FRES)</label>
            <span className="text-xs text-slate-500">{getReadabilityLabel(scores.readability)}</span>
          </div>
          <div className="flex items-center gap-3">
             <input 
              type="range" 
              min="0" 
              max="100" 
              value={scores.readability} 
              onChange={(e) => onUpdate('readability', parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <span className="text-sm font-mono w-8 text-right font-medium text-slate-700">{scores.readability}</span>
          </div>
          {/* FRES Color Bar visual aid */}
          <div className="w-full h-1 mt-1 rounded-full overflow-hidden flex opacity-60">
             <div className="bg-red-400 w-[30%]"></div>
             <div className="bg-orange-400 w-[20%]"></div>
             <div className="bg-yellow-400 w-[10%]"></div>
             <div className="bg-green-300 w-[20%]"></div>
             <div className="bg-green-500 w-[20%]"></div>
          </div>
        </div>

        {/* Metric 4: Level of Detail (Slider 0-100) */}
        <div>
           <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Level of Detail</label>
             <span className="text-xs text-slate-500">{getDetailLabel(scores.detail)}</span>
          </div>
           <div className="flex items-center gap-3">
             <input 
              type="range" 
              min="0" 
              max="100" 
              value={scores.detail} 
              onChange={(e) => onUpdate('detail', parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-sm font-mono w-8 text-right font-medium text-slate-700">{scores.detail}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Evaluator;
