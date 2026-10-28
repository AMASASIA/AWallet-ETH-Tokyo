import React from 'react';

/**
 * Aether ID（AI専用ID）を別ドメインのまま埋め込む「一方向」ビュー。
 *
 * - AWallet が親、Aether ID が子。Aether ID のコードはここに一切入れない。
 * - 接続先は VITE_AETHERID_URL。未設定なら何も表示せず、既存の画面は今までどおり動く。
 * - 読み取り専用の表示だけ。署名・送金・承認の画面は iframe に入れない。
 * - postMessage は使わない（親から子へ秘密を渡さない）。
 */
const AETHERID_URL: string =
  (((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_AETHERID_URL) || '').trim();

export const AetherIdEmbed: React.FC = () => {
  let src = '';
  try {
    const u = new URL(AETHERID_URL);
    if (u.protocol === 'https:' || u.hostname === 'localhost') src = u.toString();
  } catch {
    /* 未設定・不正なURLは表示しない */
  }
  if (!src) return null;

  return (
    <div className="rounded-xl border border-purple-900/50 overflow-hidden">
      <div className="px-3 py-2 text-[10px] font-mono text-purple-300 bg-purple-950/30">
        Aether ID (separate domain · read-only view)
      </div>
      <iframe
        title="Aether ID"
        src={src}
        className="w-full h-[480px] bg-black"
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};
