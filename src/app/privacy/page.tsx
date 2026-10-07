import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | IELTS Mentor AI',
  description: 'Privacy Policy and Google User Data compliance statement for IELTS Mentor AI Writing Platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to IELTS Mentor AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">Privacy Policy</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Google API Services Compliant</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
            Last Updated: October 7, 2026 • Effective Date: October 7, 2026
          </p>
        </div>

        {/* Overview Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 leading-relaxed text-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>1. Overview & Commitment</span>
          </h2>
          <p className="text-slate-600 dark:text-gray-300">
            Welcome to <strong>IELTS Mentor AI</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;), located at{' '}
            <a href="https://writing-platform-two.vercel.app" className="text-brand-600 dark:text-brand-400 underline">
              https://writing-platform-two.vercel.app
            </a>.
            We are dedicated to safeguarding your privacy and ensuring transparent handling of your personal information.
            This Privacy Policy explains what data we collect, why we collect it, how it is secured, and your rights as a user.
          </p>
        </div>

        {/* Google User Data Policy Compliance */}
        <div className="p-6 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-4 leading-relaxed text-sm">
          <h2 className="text-lg font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>2. Google User Data Policy & Limited Use Statement</span>
          </h2>
          <p className="text-slate-700 dark:text-gray-200">
            When you sign in with your Google Account, we request only the basic, non-sensitive profile scopes:
            <code className="mx-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-xs font-mono">userinfo.email</code> and{' '}
            <code className="mx-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-xs font-mono">userinfo.profile</code>.
          </p>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800/80 font-medium text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            &ldquo;IELTS Mentor AI&rsquo;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold"
            >
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.&rdquo;
          </div>
          <p className="text-slate-700 dark:text-gray-200 text-xs">
            We do not use Google user data to serve advertisements, train generalized public machine learning models without your consent, or sell your information to any data brokers.
          </p>
        </div>

        {/* Data We Collect */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 leading-relaxed text-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>3. Information We Collect</span>
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-gray-300">
            <li>
              <strong>Account Information:</strong> Your name, email address, and profile avatar URL provided when signing in via Google OAuth or local credentials.
            </li>
            <li>
              <strong>Writing Samples & Practice Submissions:</strong> Essays, task responses, drafts, time-spent metrics, and word counts generated within the workspace.
            </li>
            <li>
              <strong>Assessment Reports:</strong> Dual-layer examiner scores, band evaluations (5.0–9.0), criterion feedback (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy), and custom recommendations.
            </li>
            <li>
              <strong>Technical & Diagnostic Data:</strong> IP address, browser type, device information, and anonymous session telemetry for performance optimization and reliability.
            </li>
          </ul>
        </div>

        {/* How We Use Your Data */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 leading-relaxed text-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>4. How We Use Your Information</span>
          </h2>
          <p className="text-slate-600 dark:text-gray-300">
            Your data is used solely to provide and improve the educational writing service:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-gray-300">
            <li>Authenticating your user identity across devices.</li>
            <li>Tracking your writing progress and score trends over time.</li>
            <li>Triggering real-time Socratic mentor suggestions and examiner reports.</li>
            <li>Maintaining platform security, fraud prevention, and operational stability.</li>
          </ul>
        </div>

        {/* Data Retention & Deletion */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 leading-relaxed text-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Data Retention, Security & Deletion Rights</h2>
          <p className="text-slate-600 dark:text-gray-300">
            All database communications are encrypted using TLS 1.3 in transit and stored in protected cloud databases with restricted access controls.
          </p>
          <p className="text-slate-600 dark:text-gray-300">
            You maintain full rights to access, update, or permanently delete your account and all associated essay history. To request complete data erasure, contact us at{' '}
            <a href="mailto:support@ieltsmentor.ai" className="text-brand-600 dark:text-brand-400 underline font-semibold">
              support@ieltsmentor.ai
            </a>. All personal records will be permanently removed within 30 days of request receipt.
          </p>
        </div>

        {/* Contact */}
        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 text-xs text-slate-600 dark:text-gray-400 space-y-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">6. Contact Information</h3>
          <p>If you have any questions or concerns regarding this policy, please reach out to our privacy team:</p>
          <p className="font-mono">Email: support@ieltsmentor.ai</p>
          <p>Application: IELTS Mentor AI Platform • Hosted on Vercel</p>
        </div>
      </main>
    </div>
  );
}
