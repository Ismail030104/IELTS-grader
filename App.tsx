
import React, { useState, useEffect } from 'react';
import { AppScreen, GradingResult, SubscriptionStatus, DetailedBandDescriptor, FeedbackItem } from './types';
import { Icons } from './components/Icons';
import { TRIAL_LIMIT, YEARLY_LIMIT, TASK_1_DESCRIPTORS, TASK_2_DESCRIPTORS, APP_STORE_DATA } from './constants';
import { analyzeEssay } from './services/geminiService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [subscription, setSubscription] = useState<SubscriptionStatus>(() => {
    const saved = localStorage.getItem('subscription');
    return saved ? JSON.parse(saved) : { isPremium: false, essaysRemaining: TRIAL_LIMIT, essaysUsed: 0 };
  });

  useEffect(() => {
    localStorage.setItem('subscription', JSON.stringify(subscription));
  }, [subscription]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (subscription.essaysRemaining <= 0) {
      setCurrentScreen(AppScreen.SUBSCRIPTION);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setIsProcessing(true);
      setError(null);
      try {
        const result = await analyzeEssay(base64);
        setGradingResult(result);
        setSubscription(prev => ({
          ...prev,
          essaysRemaining: prev.essaysRemaining - 1,
          essaysUsed: prev.essaysUsed + 1
        }));
        setCurrentScreen(AppScreen.FEEDBACK);
      } catch (err) {
        setError("Could not process image. Please try again with a clearer photo.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubscribe = () => {
    setSubscription({
      isPremium: true,
      essaysRemaining: YEARLY_LIMIT,
      essaysUsed: 0
    });
    setCurrentScreen(AppScreen.HOME);
  };

  const downloadReport = (format: 'pdf' | 'docx') => {
    alert(`Generating ${format.toUpperCase()} report... (This feature requires a backend for actual file generation)`);
  };

  // Views
  const HomeView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-rose-600">IELTS GradeMaster</h1>
        <p className="text-slate-500 mt-2">Professional Writing Assistant</p>
      </div>
      
      <button 
        onClick={() => setCurrentScreen(AppScreen.DESCRIPTORS)}
        className="w-full max-w-sm bg-white border-2 border-slate-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-4 active:scale-95"
      >
        <div className="bg-rose-50 p-4 rounded-2xl">
          <Icons.Book className="w-10 h-10 text-rose-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Band Descriptors</h2>
          <p className="text-sm text-slate-500 mt-1">Academic Writing Task 1 & 2</p>
        </div>
      </button>

      <button 
        onClick={() => setCurrentScreen(AppScreen.GRADE_UPLOAD)}
        className="w-full max-w-sm bg-rose-600 p-8 rounded-3xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex flex-col items-center gap-4 active:scale-95"
      >
        <div className="bg-white/20 p-4 rounded-2xl">
          <Icons.Grade className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Grade Writing</h2>
          <p className="text-sm text-white/80 mt-1">Scan or Upload Essay</p>
        </div>
      </button>

      <div className="mt-4 text-center">
        <button 
          onClick={() => setCurrentScreen(AppScreen.APP_INFO)}
          className="text-slate-400 flex items-center gap-2 text-sm"
        >
          <Icons.Info className="w-4 h-4" /> App Info & Store Setup
        </button>
      </div>

      <div className="absolute bottom-10 px-4 py-2 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-2">
        <Icons.Alert className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-medium text-rose-700">
          {subscription.essaysRemaining} essay scans remaining
        </span>
      </div>
    </div>
  );

  const BandDescriptorCard = ({ descriptor, type }: { descriptor: DetailedBandDescriptor, type: 'T1' | 'T2' }) => {
    const [expanded, setExpanded] = useState(false);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full p-5 flex items-center justify-between hover:bg-rose-50/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="bg-rose-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
              {descriptor.band}
            </span>
            <span className="font-bold text-slate-800">Band {descriptor.band} Criteria</span>
          </div>
          <Icons.Back className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-90' : '-rotate-90'}`} />
        </button>
        {expanded && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-50 pt-4">
            <div>
              <h4 className="text-[10px] font-bold uppercase text-rose-600 tracking-wider mb-1">
                {type === 'T1' ? 'Task Achievement' : 'Task Response'}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">{descriptor.criterion1}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase text-rose-600 tracking-wider mb-1">Coherence & Cohesion</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{descriptor.coherenceCohesion}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase text-rose-600 tracking-wider mb-1">Lexical Resource</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{descriptor.lexicalResource}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase text-rose-600 tracking-wider mb-1">Grammar Range & Accuracy</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{descriptor.grammarAccuracy}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DescriptorsView = () => {
    const [activeTab, setActiveTab] = useState<'T1' | 'T2'>('T1');

    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <div className="p-6 pb-0 sticky top-0 bg-slate-50 z-20">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setCurrentScreen(AppScreen.HOME)} className="p-2 -ml-2">
              <Icons.Back className="w-6 h-6 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Band Descriptors</h1>
          </div>

          <div className="flex p-1 bg-slate-200 rounded-2xl mb-6">
            <button 
              onClick={() => setActiveTab('T1')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'T1' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
            >
              Task 1 Academic
            </button>
            <button 
              onClick={() => setActiveTab('T2')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'T2' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
            >
              Task 2 Academic
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-10 space-y-4">
          <p className="text-xs text-slate-400 italic mb-4">
            Official IELTS criteria (updated May 2023). Tap a band level to view detailed requirements for each category.
          </p>
          {(activeTab === 'T1' ? TASK_1_DESCRIPTORS : TASK_2_DESCRIPTORS).map(d => (
            <BandDescriptorCard key={d.band} descriptor={d} type={activeTab} />
          ))}
          <div className="text-center py-6">
            <p className="text-[10px] text-slate-400">Please visit IELTS.org for official updates.</p>
          </div>
        </div>
      </div>
    );
  };

  const GradeUploadView = () => (
    <div className="p-6 flex flex-col min-h-screen">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={() => setCurrentScreen(AppScreen.HOME)} className="p-2 -ml-2">
          <Icons.Back className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Grade Essay</h1>
      </div>

      {isProcessing ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Analyzing Essay</h2>
          <p className="text-slate-500">Scanning handwriting and calculating band scores...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <label className="w-full max-w-xs flex flex-col items-center gap-4 p-10 bg-white border-2 border-dashed border-rose-200 rounded-3xl cursor-pointer hover:bg-rose-50 transition-colors">
            <Icons.Camera className="w-12 h-12 text-rose-500" />
            <span className="font-bold text-rose-600">Take a Photo</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
          </label>

          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-slate-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <label className="w-full max-w-xs flex items-center justify-center gap-3 p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
            <Icons.Upload className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-700">Choose from Gallery</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>

          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-sm">
              <Icons.Alert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const FeedbackPoint = ({ item }: { item: FeedbackItem }) => {
    const severityConfig = {
      mistake: {
        bg: 'bg-white',
        border: 'border-red-200',
        accent: 'bg-red-500',
        icon: <Icons.Alert className="w-4 h-4 text-white" />,
        label: 'Correction Required',
        textColor: 'text-red-700',
        subBg: 'bg-red-50/50'
      },
      suggestion: {
        bg: 'bg-white',
        border: 'border-amber-200',
        accent: 'bg-amber-500',
        icon: <Icons.Info className="w-4 h-4 text-white" />,
        label: 'Style Improvement',
        textColor: 'text-amber-700',
        subBg: 'bg-amber-50/50'
      },
      praise: {
        bg: 'bg-white',
        border: 'border-green-200',
        accent: 'bg-green-500',
        icon: <Icons.Check className="w-4 h-4 text-white" />,
        label: 'Strength Identified',
        textColor: 'text-green-700',
        subBg: 'bg-green-50/50'
      }
    };

    const config = severityConfig[item.severity];

    return (
      <div className={`rounded-2xl border-2 ${config.border} ${config.bg} shadow-sm overflow-hidden flex flex-col`}>
        {/* Header Bar */}
        <div className={`px-4 py-2 flex items-center justify-between ${config.subBg} border-b ${config.border}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md ${config.accent}`}>
              {config.icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${config.textColor}`}>
              {config.label} • {item.type}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Mistake Section */}
          {item.originalText && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Student's Writing</span>
              <div className="p-3 bg-slate-50 border-l-4 border-slate-300 rounded-r-lg text-slate-600 text-sm italic font-medium relative group">
                <span className="absolute -left-1 top-0 h-full w-1 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-400"></span>
                "{item.originalText}"
              </div>
            </div>
          )}

          {/* Explanation Section */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">The Issue</span>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {item.explanation}
            </p>
          </div>
          
          {/* Suggestion Section */}
          {item.suggestion && (
            <div className="flex flex-col gap-2 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/50 mt-2">
              <div className="flex items-center gap-1.5">
                <Icons.Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">Recommended Alternative</span>
              </div>
              <p className="text-sm text-emerald-900 font-bold bg-white/60 p-2 rounded-lg border border-emerald-100">
                {item.suggestion}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const FeedbackView = () => (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="p-6 pb-4 border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentScreen(AppScreen.HOME)} className="p-2 -ml-2">
            <Icons.Back className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-full font-bold shadow-lg shadow-rose-200">
            <Icons.Star className="w-4 h-4 fill-white" />
            <span>Overall Band {gradingResult?.overallBand}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {gradingResult && Object.entries(gradingResult.criteria).map(([key, val]) => (
            <div key={key} className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
              <div className="text-[8px] uppercase text-slate-400 font-black tracking-tighter truncate leading-none mb-1">
                {key === 'taskResponse' ? 'Task Res.' : key === 'coherenceCohesion' ? 'Coh/Coh' : key === 'lexicalResource' ? 'Lexical' : 'Grammar'}
              </div>
              <div className="text-base font-bold text-slate-800">{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <section>
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">Examiner Summary</h3>
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-rose-500 text-sm text-slate-700 leading-relaxed italic">
            {gradingResult?.summary}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Feedback Points</h3>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
              {gradingResult?.detailedFeedback.length} items
            </span>
          </div>
          <div className="space-y-5">
            {gradingResult?.detailedFeedback.map((item, i) => (
              <FeedbackPoint key={i} item={item} />
            ))}
          </div>
        </section>
      </div>

      <div className="p-6 border-t bg-white space-y-3">
        <button 
          onClick={() => downloadReport('pdf')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all active:scale-95 shadow-md"
        >
          <Icons.Download className="w-5 h-5" /> Save as PDF Report
        </button>
        <button 
          onClick={() => downloadReport('docx')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Icons.File className="w-5 h-5 text-blue-500" /> Save as Word
        </button>
      </div>
    </div>
  );

  const SubscriptionView = () => (
    <div className="p-6 flex flex-col min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setCurrentScreen(AppScreen.HOME)} className="p-2 -ml-2">
          <Icons.Back className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Go Premium</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center">
          <Icons.Pay className="w-10 h-10 text-rose-600" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">$10 / year</h2>
          <p className="text-slate-500">Unlimited grading and professional tools</p>
        </div>

        <ul className="text-left w-full space-y-4 mt-4">
          <li className="flex items-center gap-3 text-slate-700">
            <Icons.Check className="w-5 h-5 text-green-500" />
            <span>Up to 200 graded essays per year</span>
          </li>
          <li className="flex items-center gap-3 text-slate-700">
            <Icons.Check className="w-5 h-5 text-green-500" />
            <span>AI-powered chat style feedback</span>
          </li>
          <li className="flex items-center gap-3 text-slate-700">
            <Icons.Check className="w-5 h-5 text-green-500" />
            <span>Full Task 1 & Task 2 analysis</span>
          </li>
          <li className="flex items-center gap-3 text-slate-700">
            <Icons.Check className="w-5 h-5 text-green-500" />
            <span>Downloadable PDF & Word reports</span>
          </li>
        </ul>

        <button 
          onClick={handleSubscribe}
          className="w-full p-5 bg-rose-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
        >
          Subscribe Now
        </button>
        <p className="text-[10px] text-slate-400">Cancel anytime. Your subscription will renew annually.</p>
      </div>
    </div>
  );

  const AppInfoView = () => (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setCurrentScreen(AppScreen.HOME)} className="p-2 -ml-2">
          <Icons.Back className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">App Setup Info</h1>
      </div>

      <div className="space-y-6">
        <section className="bg-white p-6 rounded-3xl shadow-sm">
          <h2 className="font-bold text-rose-600 mb-4 flex items-center gap-2">
            <Icons.File className="w-5 h-5" /> App Store Assets
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-bold block">Title:</span>
              <p className="text-slate-600">{APP_STORE_DATA.title}</p>
            </div>
            <div>
              <span className="font-bold block">Subtitle:</span>
              <p className="text-slate-600">{APP_STORE_DATA.subtitle}</p>
            </div>
            <div>
              <span className="font-bold block">Description:</span>
              <p className="text-slate-600">{APP_STORE_DATA.description}</p>
            </div>
            <div>
              <span className="font-bold block">Keywords:</span>
              <p className="text-slate-600">{APP_STORE_DATA.keywords}</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm">
          <h2 className="font-bold text-rose-600 mb-4 flex items-center gap-2">
            <Icons.Check className="w-5 h-5" /> Review Checklist
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <input type="checkbox" checked readOnly className="accent-rose-600" />
              <span>Provide demo account credentials</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" checked readOnly className="accent-rose-600" />
              <span>Clear description of $10/year IAP</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" checked readOnly className="accent-rose-600" />
              <span>Include Privacy Policy URL</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" checked readOnly className="accent-rose-600" />
              <span>Screenshots showing core functionality</span>
            </li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm">
          <h2 className="font-bold text-rose-600 mb-4 flex items-center gap-2">
            <Icons.Next className="w-5 h-5" /> User Flow
          </h2>
          <ol className="space-y-4 text-sm text-slate-600 list-decimal pl-4">
            <li>User opens app, selects "Grade Writing".</li>
            <li>User takes photo of essay or uploads from gallery.</li>
            <li>AI processes image (OCR + Grading logic).</li>
            <li>User views Scores and detailed Chat Feedback.</li>
            <li>User downloads feedback as PDF to share with student.</li>
          </ol>
        </section>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl">
      {currentScreen === AppScreen.HOME && <HomeView />}
      {currentScreen === AppScreen.DESCRIPTORS && <DescriptorsView />}
      {currentScreen === AppScreen.GRADE_UPLOAD && <GradeUploadView />}
      {currentScreen === AppScreen.FEEDBACK && <FeedbackView />}
      {currentScreen === AppScreen.SUBSCRIPTION && <SubscriptionView />}
      {currentScreen === AppScreen.APP_INFO && <AppInfoView />}
    </div>
  );
}
