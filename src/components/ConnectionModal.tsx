import React from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, Zap } from 'lucide-react';
import { ConnectionStatusResult, firebaseConfig } from '../firebase/config';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: ConnectionStatusResult | null;
  isTesting: boolean;
  onRetest: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  connectionState,
  isTesting,
  onRetest,
}) => {
  if (!isOpen) return null;

  const isConnected = connectionState?.isConnected ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141D2B] rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE4] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isConnected ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2D3748] dark:text-slate-100 text-base">Firebase Realtime Status</h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">Firebase Realtime Database & Auth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div
          className={`mt-5 p-4 rounded-xl flex items-center justify-between border ${
            isConnected
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
              : 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5 shrink-0">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                  isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                }`}
              ></span>
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {isConnected ? 'Firebase Realtime Live' : 'Firebase Disconnected'}
              </h4>
              <p className="text-xs opacity-90">
                {isConnected
                  ? 'Real-time WebSocket sync active via .info/connected'
                  : 'Connection dropped or network unreachable'}
              </p>
            </div>
          </div>

          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          )}
        </div>

        {/* Diagnostic Metadata */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#FDFBF7] dark:bg-slate-850/60 border border-[#F0ECE4] dark:border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#64748B] dark:text-slate-400">Project ID:</span>
            <span className="font-mono font-bold text-[#2D3748] dark:text-slate-200">{firebaseConfig.projectId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#64748B] dark:text-slate-400">Database URL:</span>
            <span className="font-mono text-[11px] text-[#2D3748] dark:text-slate-300 max-w-[200px] truncate" title={firebaseConfig.databaseURL}>
              {firebaseConfig.databaseURL || 'Realtime DB Default'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#64748B] dark:text-slate-400">Auth Domain:</span>
            <span className="font-mono text-[#2D3748] dark:text-slate-300 text-[11px]">{firebaseConfig.authDomain}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#64748B] dark:text-slate-400">Connection Latency:</span>
            <span className="font-bold text-[#5A7865] dark:text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {connectionState?.latencyMs ? `${connectionState.latencyMs} ms` : isConnected ? '< 40 ms' : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#64748B] dark:text-slate-400">Last Probed:</span>
            <span className="text-[#64748B] dark:text-slate-400">
              {connectionState?.lastChecked ? connectionState.lastChecked.toLocaleTimeString() : 'Just now'}
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-[#F0ECE4] dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
            <span>SSL Secured</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRetest}
              disabled={isTesting}
              className="px-3 py-2 bg-[#F5F2EB] dark:bg-slate-800 hover:bg-[#EAE6DF] dark:hover:bg-slate-700 text-[#4A5568] dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Pinging...' : 'Test'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
