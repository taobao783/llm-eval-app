import React from 'react';
import { EvaluationData, MODELS, QuestionData, Scores } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface DashboardProps {
  questions: QuestionData[];
  evaluations: EvaluationData;
}

const Dashboard: React.FC<DashboardProps> = ({ questions, evaluations }) => {
  
  // Calculate stats
  const stats = MODELS.map(model => {
    let accSum = 0, compSum = 0, readSum = 0, detailSum = 0;
    let accCount = 0, compCount = 0, readCount = 0, detailCount = 0;

    Object.values(evaluations).forEach((qEval) => {
      const scores = qEval[model.key];
      if (scores) {
        if (scores.accuracy > 0) { accSum += scores.accuracy; accCount++; }
        // Completeness only counts if accuracy > 1
        if (scores.accuracy > 1 && scores.completeness > 0) { compSum += scores.completeness; compCount++; }
        if (scores.readability > 0) { readSum += scores.readability; readCount++; }
        if (scores.detail > 0) { detailSum += scores.detail; detailCount++; }
      }
    });

    return {
      name: model.name,
      key: model.key,
      color: model.color,
      avgAccuracy: accCount ? (accSum / accCount).toFixed(2) : 0,
      avgCompleteness: compCount ? (compSum / compCount).toFixed(2) : 0,
      avgReadability: readCount ? (readSum / readCount).toFixed(0) : 0,
      avgDetail: detailCount ? (detailSum / detailCount).toFixed(0) : 0,
      count: accCount // Total questions graded for this model
    };
  });

  const completionPercentage = Math.round((stats.reduce((acc, curr) => acc + curr.count, 0) / (questions.length * 4)) * 100);

  return (
    <div className="p-8 bg-slate-50 min-h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium uppercase">Overall Progress</h3>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-800">{completionPercentage}%</span>
              <span className="text-slate-400 mb-1">graded</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
              <div className="bg-slate-800 h-2 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-2">
             <h3 className="text-slate-500 text-sm font-medium uppercase mb-4">Export Data</h3>
             <p className="text-slate-600 text-sm mb-4">Download your evaluation dataset as a CSV file compatible with Excel, SPSS, or R.</p>
             <button 
                onClick={() => downloadCSV(questions, evaluations)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
             >
               Download CSV Report
             </button>
           </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Accuracy & Completeness Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Average Accuracy (1-6)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 6]} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="avgAccuracy" fill="#3b82f6" name="Accuracy" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Average Completeness (1-3)</h3>
              <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 3]} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="avgCompleteness" fill="#8b5cf6" name="Completeness" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Readability vs Detail */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Readability vs. Level of Detail (0-100)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgReadability" fill="#10b981" name="Readability (FRES)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgDetail" fill="#f59e0b" name="Level of Detail" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// CSV Export Utility
const downloadCSV = (questions: QuestionData[], evaluations: EvaluationData) => {
  const headers = ['QuestionID', 'Question', 'Model', 'Accuracy', 'Completeness', 'Readability', 'Detail'];
  const rows: string[] = [];

  questions.forEach(q => {
    MODELS.forEach(m => {
      const scores = evaluations[q.id]?.[m.key] || { accuracy: 0, completeness: 0, readability: 0, detail: 0 };
      // Escape question text for CSV (replace quotes with double quotes)
      const safeQuestion = `"${q.question.replace(/"/g, '""')}"`;
      rows.push(`${q.id},${safeQuestion},${m.name},${scores.accuracy},${scores.completeness},${scores.readability},${scores.detail}`);
    });
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "llm_evaluation_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default Dashboard;
