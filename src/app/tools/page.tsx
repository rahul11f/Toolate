import Link from 'next/link';
import { FileText, Calculator, Users, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Free Tools | Toolate',
  description: 'Free utilities for renters and landlords including room agreements, rent estimators, and expense splitters.',
};

export default function ToolsHubPage() {
  const tools = [
    {
      id: 'agreement',
      title: 'Room Agreement Generator',
      description: 'Quickly generate a standard room rental or roommate agreement document to share or print.',
      icon: <FileText className="w-8 h-8 text-indigo-500" />,
      href: '/tools/agreement',
      color: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300',
    },
    {
      id: 'estimator',
      title: 'Rent & Budget Estimator',
      description: 'Calculate your total monthly living costs including base rent, utilities, and hidden fees.',
      icon: <Calculator className="w-8 h-8 text-emerald-500" />,
      href: '/tools/estimator',
      color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300',
    },
    {
      id: 'split',
      title: 'Roommate Expense Splitter',
      description: 'Easily calculate how to fairly split rent, security deposit, and monthly bills among roommates.',
      icon: <Users className="w-8 h-8 text-fuchsia-500" />,
      href: '/tools/split',
      color: 'bg-fuchsia-50 border-fuchsia-100 hover:border-fuchsia-300',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Free Utility Tools</h1>
        <p className="text-lg text-slate-500 font-medium">
          A collection of standalone tools to make renting, hosting, and room-sharing easier. No signup required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        {tools.map((tool) => (
          <Link key={tool.id} href={tool.href} className="group relative">
            <div className={`h-full border rounded-3xl p-8 transition-all duration-300 hover:shadow-xl ${tool.color}`}>
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6">
                {tool.icon}
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">{tool.title}</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">{tool.description}</p>
              
              <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
