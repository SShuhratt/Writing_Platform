'use client';

import React, { useState } from 'react';
import { useWritingStore } from '@/lib/store';
import { SubmissionReport } from '@/types/ielts';
import { 
  Award, 
  Target, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  Download, 
  X,
  TrendingUp,
  Layers,
  ListOrdered
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DualLayerReportModalProps {
  report: SubmissionReport | null;
  onClose: () => void;
}

export const DualLayerReportModal: React.FC<DualLayerReportModalProps> = ({ report, onClose }) => {
  const [activeTab, setActiveTab] = useState<'LAYER_1' | 'LAYER_2'>('LAYER_1');

  if (!report) return null;

  const { layer1ExaminerReport, layer2AlignmentReport, targetBandAtSubmission, modeAtSubmission, wordCount } = report;

  // Trigger celebration confetti if target achieved or exceeded
  if (layer2AlignmentReport.targetStatus !== 'TARGET_NOT_MET') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  const getStatusBadge = () => {
    switch (layer2AlignmentReport.targetStatus) {
      case 'TARGET_ACHIEVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Target Band Achieved!
          </span>
        );
      case 'EXCEEDED_TARGET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Target Exceeded! (+{(layer2AlignmentReport.achievedBand - parseFloat(targetBandAtSubmission)).toFixed(1)})
          </span>
        );
      case 'TARGET_NOT_MET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Target Not Met (Gap: {(parseFloat(targetBandAtSubmission) - layer2AlignmentReport.achievedBand).toFixed(1)})
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl glass-panel rounded-2xl p-6 border border-gray-700/80 shadow-2xl relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-gray-950 font-black text-xl shadow-lg shadow-amber-500/20">
              {layer1ExaminerReport.overallBand.toFixed(1)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-white">Official IELTS Dual-Layer Assessment Report</h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-gray-400">
                Submitted in {modeAtSubmission === 'ACTIVE_ASSISTANT' ? 'Active Mentor Mode' : 'Focus Exam Mode'} • Target: Band {targetBandAtSubmission} • Words: {wordCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-all text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Print/PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dual Layer Navigation Tabs */}
        <div className="flex items-center gap-2 bg-gray-900/90 p-1 rounded-xl border border-gray-800 mb-5">
          <button
            onClick={() => setActiveTab('LAYER_1')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'LAYER_1'
                ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Layer 1: Objective Examiner Band Score</span>
          </button>

          <button
            onClick={() => setActiveTab('LAYER_2')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'LAYER_2'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Layer 2: Target Alignment & Gap Analysis</span>
          </button>
        </div>

        {/* Content View */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-5">
          
          {/* LAYER 1 VIEW */}
          {activeTab === 'LAYER_1' && (
            <div className="space-y-5">
              
              {/* Overall Examiner Summary */}
              <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">Examiner Synthesis</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {layer1ExaminerReport.examinerSummary}
                </p>
              </div>

              {/* 4 Official Criteria Sub-Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Task Response / Achievement */}
                <div className="p-4 rounded-xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Task Achievement / Response</span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-sm border border-amber-500/30">
                      Band {layer1ExaminerReport.taskResponse.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{layer1ExaminerReport.taskResponse.commentary}</p>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-emerald-400 font-semibold">Strengths:</div>
                    <ul className="list-disc list-inside text-gray-400">
                      {layer1ExaminerReport.taskResponse.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 2. Coherence & Cohesion */}
                <div className="p-4 rounded-xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Coherence & Cohesion</span>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-extrabold text-sm border border-sky-500/30">
                      Band {layer1ExaminerReport.coherenceCohesion.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{layer1ExaminerReport.coherenceCohesion.commentary}</p>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-emerald-400 font-semibold">Strengths:</div>
                    <ul className="list-disc list-inside text-gray-400">
                      {layer1ExaminerReport.coherenceCohesion.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 3. Lexical Resource */}
                <div className="p-4 rounded-xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Lexical Resource</span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-extrabold text-sm border border-purple-500/30">
                      Band {layer1ExaminerReport.lexicalResource.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{layer1ExaminerReport.lexicalResource.commentary}</p>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-emerald-400 font-semibold">Strengths:</div>
                    <ul className="list-disc list-inside text-gray-400">
                      {layer1ExaminerReport.lexicalResource.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 4. Grammatical Range & Accuracy */}
                <div className="p-4 rounded-xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Grammatical Range & Accuracy</span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold text-sm border border-indigo-500/30">
                      Band {layer1ExaminerReport.grammaticalAccuracy.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{layer1ExaminerReport.grammaticalAccuracy.commentary}</p>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-emerald-400 font-semibold">Strengths:</div>
                    <ul className="list-disc list-inside text-gray-400">
                      {layer1ExaminerReport.grammaticalAccuracy.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* LAYER 2 VIEW */}
          {activeTab === 'LAYER_2' && (
            <div className="space-y-5">
              
              {/* Gap Analysis Summary Banner */}
              <div className="p-5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-400" />
                    Target Alignment Audit (Selected: Band {targetBandAtSubmission})
                  </h4>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">
                  {layer2AlignmentReport.gapAnalysis}
                </p>
              </div>

              {/* Paragraph-by-Paragraph Alignment Audit Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-gray-300 uppercase tracking-wider">Paragraph Alignment Breakdown</h4>
                <div className="space-y-2">
                  {layer2AlignmentReport.paragraphAudits.map((audit) => (
                    <div
                      key={audit.paragraphNumber}
                      className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>Paragraph {audit.paragraphNumber}</span>
                          <span className="text-[10px] text-gray-500 italic">&quot;{audit.textSnippet}&quot;</span>
                        </div>
                        <p className="text-gray-300">{audit.analysis}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 ${
                        audit.status === 'MET'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : audit.status === 'EXCEEDED'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {audit.status === 'MET' ? 'Target Met' : audit.status === 'EXCEEDED' ? 'Exceeded' : 'Below Target'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Improvement Roadmap */}
              <div className="p-5 rounded-xl glass-card space-y-3 border-l-4 border-l-brand-500">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-brand-400" />
                  Actionable Gap-Bridging Roadmap for Next Session
                </h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  {layer2AlignmentReport.actionableRoadmap.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-brand-500/20 text-brand-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
