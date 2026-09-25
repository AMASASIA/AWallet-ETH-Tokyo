import React from 'react';
import { Wallet, History, MoreHorizontal } from 'lucide-react';

export type TabType = 'home' | 'activity' | 'tive' | 'more';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingMoreCount?: number;
  pendingTiveCount?: number;
}

const TiveEyeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <span
    className={`inline-flex items-center justify-center font-bold select-none leading-none ${className}`}
    style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
    aria-label="Tive ◉AI"
  >
    ◉
  </span>
);

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onChangeTab, 
  pendingMoreCount = 0,
  pendingTiveCount = 0 
}) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ size: number; className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Wallet },
    { id: 'tive', label: 'Tive ◉AI', icon: TiveEyeIcon },
    { id: 'activity', label: 'Activity', icon: History },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-zinc-900 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasBadge = (tab.id === 'more' && pendingMoreCount > 0) || (tab.id === 'tive' && pendingTiveCount > 0);

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? (tab.id === 'tive' ? 'text-pink-400' : 'text-white') : 'text-zinc-500'} />
                {hasBadge && (
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ${
                    tab.id === 'tive' ? 'bg-pink-400' : 'bg-white'
                  }`} />
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive && tab.id === 'tive' ? 'text-pink-300' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
