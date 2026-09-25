#!/usr/bin/env python3
"""
Tive ◉AI — Butterfly Effect Engine
====================================
「小さな一手（特徴選択・ハイパーパラメータの微調整）の連鎖が、
モデル全体の性能を大きく変える」という考え方から Butterfly Effect
と命名した、群知能(ABC: Artificial Bee Colony)ベースのAutoMLエンジン。

前身の tive_abc_automl.py と機能は同一だが、以下を追加している:

  1. 実行の暴走を止める仕組み（サーキットブレーカー）
     - 世代数・コロニーサイズに上限を設け、想定外の巨大パラメータで
       リソースを食い潰す事態を防ぐ
     - 壁時計時間の上限(--max-seconds)を超えたら、その時点までの
       最良結果を確定させて安全に打ち切る
  2. 入力の検証（サイバー攻撃・不正入力からの防御）
     - データファイルのパスを正規化し、想定ディレクトリ外や
       シンボリックリンク経由の読み出しを拒否
     - ファイルサイズに上限を設け、意図的な巨大ファイルによる
       ディスク/メモリ枯渇攻撃を防ぐ
     - 目的変数列・数値列以外は明示的に無視し、想定外の型は
       例外として扱う
  3. 改ざん検知可能な監査ログ（tamper-evident audit log）
     - 各実行の入力ハッシュ・パラメータ・結果ハッシュを
       ハッシュチェーン形式で追記していく。ARTFACTのArtifact監査ログ
       と同じ「後から改ざんすると直後のエントリのハッシュと矛盾する」
       設計を踏襲
  4. 例外の非露出化
     - 想定外のエラーはスタックトレースをそのまま出力せず、
       監査ログにのみ詳細を記録し、標準出力には要約のみ返す
       （エラーメッセージ経由での内部情報漏洩を防ぐ）

依存ライブラリは前身同様 numpy / pandas / scikit-learn / joblib のみ。
外部ネットワーク通信は一切行わない（完全ローカル/デスクトップ完結）。

使い方:
    python tive_butterfly_effect.py --data path/to/data.csv --target 列名 \
        --output out_dir --colony-size 20 --max-iter 30 --max-seconds 1800

出力:
    out_dir/best_model.joblib     ... 最良モデル
    out_dir/report.json           ... 選択特徴・ハイパーパラメータ・スコア推移
    out_dir/butterfly_audit.log   ... 改ざん検知可能な実行監査ログ(JSON Lines)
"""

import argparse
import hashlib
import json
import os
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from joblib import dump
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold
from sklearn.preprocessing import LabelEncoder


BRAND = "Butterfly Effect"
LOG_PREFIX = f"[Tive ◉AI / {BRAND}]"

# ----------------------------------------------------------------------
# 暴走防止のための安全上限（サーキットブレーカー）
# ----------------------------------------------------------------------
SAFE_MAX_COLONY_SIZE = 200      # これ以上のコロニーサイズは拒否
SAFE_MAX_ITER = 1000            # これ以上の世代数は拒否
SAFE_MAX_FILE_MB = 500          # 入力CSVの最大サイズ(MB)
SAFE_MAX_WALL_SECONDS_DEFAULT = 1800  # 既定の最大実行時間(秒)


# ----------------------------------------------------------------------
# 監査ログ（改ざん検知可能なハッシュチェーン）
# ----------------------------------------------------------------------
class AuditLog:
    """
    各エントリに「直前のエントリのハッシュ」を含めることで、
    後からログの途中を書き換えるとそれ以降の全エントリの整合性が
    崩れる構造にしている（ブロックチェーンの発想を軽量に流用）。
    実運用ではこのログをARTFACT側のArtifact監査ログに転送する
    想定（本スクリプト単体ではローカルファイルへの追記のみ）。
    """

    def __init__(self, path: Path):
        self.path = path
        self.prev_hash = self._load_last_hash()

    def _load_last_hash(self) -> str:
        if not self.path.exists():
            return "0" * 64
        last = "0" * 64
        with open(self.path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    last = entry.get("entry_hash", last)
                except json.JSONDecodeError:
                    continue
        return last

    def append(self, event: str, details: dict):
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "details": details,
            "prev_hash": self.prev_hash,
        }
        payload = json.dumps(record, ensure_ascii=False, sort_keys=True)
        entry_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        record["entry_hash"] = entry_hash
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
        self.prev_hash = entry_hash
        return entry_hash


def sha256_of_file(path: Path, chunk_size: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            h.update(chunk)
    return h.hexdigest()


# ----------------------------------------------------------------------
# 入力検証（不正入力・攻撃面からの防御）
# ----------------------------------------------------------------------
class InputValidationError(Exception):
    pass


def validate_data_path(raw_path: str, base_dir: Path | None = None) -> Path:
    """
    パス・トラバーサルやシンボリックリンク経由の不正な読み出しを防ぎ、
    ファイルサイズの上限を強制する。base_dirを指定した場合は
    そのディレクトリ配下のみ許可する（サーバー/常駐運用時に使う想定）。
    """
    raw = Path(raw_path).expanduser()

    # 重要: シンボリックリンクの判定は resolve() で実体パスに変換する「前」に
    # 行う必要がある。resolve()は既にリンクを解決してしまうため、その後に
    # is_symlink()を呼んでも常にFalseになり検知できない（既知の実装ミスを修正済み）。
    if raw.is_symlink():
        raise InputValidationError("シンボリックリンク経由の入力は許可されていません")

    p = raw.resolve()

    if not p.exists():
        raise InputValidationError(f"データファイルが見つかりません: {raw_path}")
    if not p.is_file():
        raise InputValidationError(f"通常のファイルではありません: {raw_path}")

    if base_dir is not None:
        base_dir = base_dir.expanduser().resolve()
        if base_dir not in p.parents and p != base_dir:
            raise InputValidationError(
                f"許可されたディレクトリ({base_dir})の外のファイルは読み込めません"
            )

    size_mb = p.stat().st_size / (1024 * 1024)
    if size_mb > SAFE_MAX_FILE_MB:
        raise InputValidationError(
            f"ファイルサイズが上限({SAFE_MAX_FILE_MB}MB)を超えています: {size_mb:.1f}MB"
        )

    if p.suffix.lower() != ".csv":
        raise InputValidationError("CSVファイル以外は現状サポートしていません")

    return p


def clamp_resource_params(colony_size: int, max_iter: int) -> tuple[int, int]:
    """暴走防止: リソース上限を超えるリクエストは静かに切り詰めず、
    明示的に警告してから安全値にクランプする（サイレントな挙動変更は
    デバッグ困難にするため避ける）"""
    clamped_colony = min(colony_size, SAFE_MAX_COLONY_SIZE)
    clamped_iter = min(max_iter, SAFE_MAX_ITER)
    if clamped_colony != colony_size:
        print(f"{LOG_PREFIX} 警告: colony_sizeを上限{SAFE_MAX_COLONY_SIZE}にクランプしました")
    if clamped_iter != max_iter:
        print(f"{LOG_PREFIX} 警告: max_iterを上限{SAFE_MAX_ITER}にクランプしました")
    return clamped_colony, clamped_iter


# ----------------------------------------------------------------------
# 蜜源(FoodSource)のエンコーディング
# ----------------------------------------------------------------------
HP_RANGES = {
    "n_estimators": (50, 250),
    "max_depth": (2, 32),
    "min_samples_split": (2, 20),
    "max_features": (0.1, 1.0),
}
HP_KEYS = list(HP_RANGES.keys())


def decode_food_source(vec: np.ndarray, n_features: int):
    feat_scores = vec[:n_features]
    hp_scores = vec[n_features:]
    mask = feat_scores > 0.5
    if not mask.any():
        mask[np.argmax(feat_scores)] = True

    hp = {}
    for i, key in enumerate(HP_KEYS):
        lo, hi = HP_RANGES[key]
        val = lo + hp_scores[i] * (hi - lo)
        if key in ("n_estimators", "max_depth", "min_samples_split"):
            val = int(round(val))
        hp[key] = val
    if hp["max_depth"] <= 2:
        hp["max_depth"] = None
    return mask, hp


def build_model(hp: dict, task: str, random_state: int = 42, n_jobs: int = 1):
    common = dict(
        n_estimators=hp["n_estimators"],
        max_depth=hp["max_depth"],
        min_samples_split=hp["min_samples_split"],
        max_features=hp["max_features"],
        random_state=random_state,
        n_jobs=n_jobs,
    )
    if task == "classification":
        return RandomForestClassifier(**common)
    return RandomForestRegressor(**common)


# ----------------------------------------------------------------------
# Butterfly Effect Engine 本体（ABCアルゴリズム + サーキットブレーカー）
# ----------------------------------------------------------------------
class ButterflyEffectOptimizer:
    """
    働き蜂(employed bee)   : 各蜜源の近傍を探索し改善を試みる
    追従蜂(onlooker bee)   : 良い蜜源ほど高い確率で選ばれ、その近傍を探索する
    偵察蜂(scout bee)      : 一定回数改善しない蜜源を放棄し、ランダムな新蜜源を探す

    max_wall_seconds を超えると、実行中の世代を最後まで終えたうえで
    安全に打ち切る（暴走・想定外の長時間占有からデスクトップ環境を守る）。
    """

    def __init__(
        self,
        X: np.ndarray,
        y: np.ndarray,
        task: str,
        colony_size: int = 20,
        max_iter: int = 30,
        limit: int = 8,
        feature_penalty: float = 0.002,
        cv_folds: int = 5,
        seed: int = 42,
        n_jobs: int = 1,
        max_wall_seconds: float = SAFE_MAX_WALL_SECONDS_DEFAULT,
        audit: AuditLog | None = None,
    ):
        self.X = X
        self.y = y
        self.task = task
        self.n_jobs = n_jobs
        self.n_features = X.shape[1]
        self.dim = self.n_features + len(HP_KEYS)
        self.colony_size = colony_size
        self.max_iter = max_iter
        self.limit = limit
        self.feature_penalty = feature_penalty
        self.cv_folds = cv_folds
        self.rng = np.random.default_rng(seed)
        self.max_wall_seconds = max_wall_seconds
        self.audit = audit
        self.eval_count = 0
        self.error_count = 0

        self.sources = self.rng.random((colony_size, self.dim))
        self.fitness = np.full(colony_size, -np.inf)
        self.trials = np.zeros(colony_size, dtype=int)
        self._cache = {}

        self.best_vec = None
        self.best_fitness = -np.inf
        self.history = []
        self.stopped_early = False
        self.stop_reason = None

    def _evaluate(self, vec: np.ndarray) -> float:
        mask, hp = decode_food_source(vec, self.n_features)
        key = (mask.tobytes(), tuple(hp.items()))
        if key in self._cache:
            return self._cache[key]

        self.eval_count += 1
        Xs = self.X[:, mask]
        model = build_model(hp, self.task, n_jobs=1)
        try:
            if self.task == "classification":
                cv = StratifiedKFold(n_splits=self.cv_folds, shuffle=True, random_state=42)
                scoring = "accuracy"
            else:
                cv = KFold(n_splits=self.cv_folds, shuffle=True, random_state=42)
                scoring = "r2"
            scores = cross_val_score(model, Xs, self.y, cv=cv, scoring=scoring, n_jobs=self.n_jobs)
            score = float(np.mean(scores))
        except Exception as e:
            # 個別の評価失敗でプロセス全体を落とさない（異常値として扱い続行）。
            # 詳細は監査ログにのみ記録し、標準出力には出さない。
            self.error_count += 1
            if self.audit is not None and self.error_count <= 20:
                self.audit.append("evaluation_error", {"error": str(e)[:300]})
            score = -1.0

        penalty = self.feature_penalty * mask.sum()
        fitness = score - penalty
        self._cache[key] = fitness
        return fitness

    def _neighbor(self, i: int) -> np.ndarray:
        j = self.rng.integers(0, self.colony_size)
        while j == i:
            j = self.rng.integers(0, self.colony_size)
        phi = self.rng.uniform(-1, 1, size=self.dim)
        new_vec = self.sources[i] + phi * (self.sources[i] - self.sources[j])
        return np.clip(new_vec, 0.0, 1.0)

    def _time_exceeded(self, t_start: float) -> bool:
        return (time.time() - t_start) > self.max_wall_seconds

    def run(self, verbose: bool = True):
        t_start = time.time()

        # 重要: 初期コロニー評価フェーズ自体もサーキットブレーカーの対象にする。
        # colony_sizeが大きい場合、この初期評価だけで制限時間を超える恐れが
        # あるため、個体ごとに時間チェックを入れる（世代ループの先頭だけで
        # チェックすると、初期フェーズが青天井になってしまう）。
        for i in range(self.colony_size):
            if self._time_exceeded(t_start):
                self.stopped_early = True
                self.stop_reason = (
                    f"max_wall_seconds({self.max_wall_seconds}s)超過のため"
                    f"初期コロニー評価中に安全停止（{i}/{self.colony_size}個体のみ評価済み）"
                )
                if verbose:
                    print(f"{LOG_PREFIX} {self.stop_reason}")
                # 未評価分は最低スコア扱いにして以降のロジックが破綻しないようにする
                self.fitness[i:] = -1e9
                break
            self.fitness[i] = self._evaluate(self.sources[i])
        else:
            pass

        if not self.stopped_early:
            for it in range(1, self.max_iter + 1):
                if self._time_exceeded(t_start):
                    self.stopped_early = True
                    self.stop_reason = f"max_wall_seconds({self.max_wall_seconds}s)超過のため安全停止"
                    if verbose:
                        print(f"{LOG_PREFIX} {self.stop_reason} — 世代{it}で打ち切り")
                    break

                for i in range(self.colony_size):
                    if self._time_exceeded(t_start):
                        break
                    cand = self._neighbor(i)
                    cand_fit = self._evaluate(cand)
                    if cand_fit > self.fitness[i]:
                        self.sources[i] = cand
                        self.fitness[i] = cand_fit
                        self.trials[i] = 0
                    else:
                        self.trials[i] += 1

                if self._time_exceeded(t_start):
                    self.stopped_early = True
                    self.stop_reason = f"max_wall_seconds({self.max_wall_seconds}s)超過のため世代{it}の途中で安全停止"
                    if verbose:
                        print(f"{LOG_PREFIX} {self.stop_reason}")
                    break

                shifted = self.fitness - self.fitness.min() + 1e-6
                probs = shifted / shifted.sum()
                for _ in range(self.colony_size):
                    if self._time_exceeded(t_start):
                        break
                    i = self.rng.choice(self.colony_size, p=probs)
                    cand = self._neighbor(i)
                    cand_fit = self._evaluate(cand)
                    if cand_fit > self.fitness[i]:
                        self.sources[i] = cand
                        self.fitness[i] = cand_fit
                        self.trials[i] = 0
                    else:
                        self.trials[i] += 1

                for i in range(self.colony_size):
                    if self._time_exceeded(t_start):
                        break
                    if self.trials[i] > self.limit:
                        self.sources[i] = self.rng.random(self.dim)
                        self.fitness[i] = self._evaluate(self.sources[i])
                        self.trials[i] = 0

                gen_best_idx = int(np.argmax(self.fitness))
                if self.fitness[gen_best_idx] > self.best_fitness:
                    self.best_fitness = float(self.fitness[gen_best_idx])
                    self.best_vec = self.sources[gen_best_idx].copy()

                self.history.append(self.best_fitness)
                if verbose:
                    print(f"  世代 {it:3d}/{self.max_iter} — 最良スコア(ペナルティ込): {self.best_fitness:.4f}")

        # 初期フェーズで打ち切った場合、best_vec が未設定のことがあるので
        # 評価済みの中から最良のものを拾っておく（結果を必ず返せるようにする）
        if self.best_vec is None:
            valid_idx = int(np.argmax(self.fitness))
            if self.fitness[valid_idx] > -1e8:
                self.best_vec = self.sources[valid_idx].copy()
                self.best_fitness = float(self.fitness[valid_idx])
            else:
                # 1個体も評価できなかった極端なケース（超短いmax_secondsなど）
                self.best_vec = self.sources[0].copy()
                self.best_fitness = float(self.fitness[0]) if np.isfinite(self.fitness[0]) else -1.0

        # 異常検知: エラー率が高すぎる場合は結果の信頼性が低いと警告する
        # （Confusion Detectorの考え方を簡易に反映）
        if self.eval_count > 0 and self.error_count / self.eval_count > 0.3:
            msg = (f"評価の{self.error_count}/{self.eval_count}件でエラーが発生しており、"
                   f"結果の信頼性が低い可能性があります。データ形式を確認してください。")
            print(f"{LOG_PREFIX} 警告: {msg}")
            if self.audit is not None:
                self.audit.append("high_error_rate_warning", {"message": msg})

        return self.best_vec, self.best_fitness


def infer_task(y: pd.Series) -> str:
    if y.dtype == object or y.dtype.name == "category" or y.nunique() <= max(20, int(len(y) * 0.05)):
        return "classification"
    return "regression"


def process_dataset(
    data_path_raw: str,
    target: str,
    output_dir: str,
    task: str = "auto",
    colony_size: int = 20,
    max_iter: int = 30,
    limit: int = 8,
    cv_folds: int = 5,
    n_jobs: int | None = None,
    max_seconds: float = SAFE_MAX_WALL_SECONDS_DEFAULT,
    allowed_base_dir: str | None = None,
    feature_prefixes: list[str] | None = None,
    verbose: bool = True,
) -> dict:
    """
    1件のデータセットに対してButterfly Effect最適化を実行し、モデル・
    レポート・監査ログを output_dir に書き出す。CLI(main)とフォルダ監視
    デーモン(tive_butterfly_watch.py)の両方から共通で呼び出される中核関数。

    InputValidationError（想定内の入力エラー）はそのまま呼び出し元に
    伝播する。呼び出し元がCLIなら終了コード付きで表示し、デーモンなら
    その1件だけをスキップして監視を継続する、という使い分けを想定。
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    audit = AuditLog(out_dir / "butterfly_audit.log")

    t0 = time.time()
    base_dir = Path(allowed_base_dir) if allowed_base_dir else None
    try:
        data_path = validate_data_path(data_path_raw, base_dir=base_dir)
    except InputValidationError as e:
        audit.append("input_validation_failed", {"error": str(e), "raw_path": data_path_raw})
        raise
    input_hash = sha256_of_file(data_path)

    colony_size, max_iter = clamp_resource_params(colony_size, max_iter)

    audit.append("run_start", {
        "data_file": str(data_path),
        "input_sha256": input_hash,
        "target": target,
        "colony_size": colony_size,
        "max_iter": max_iter,
        "max_seconds": max_seconds,
    })

    df = pd.read_csv(data_path)
    if target not in df.columns:
        err = InputValidationError(f"目的変数列 '{target}' がデータに見つかりません")
        audit.append("input_validation_failed", {"error": str(err)})
        raise err

    y_raw = df[target]
    X_df = df.drop(columns=[target]).select_dtypes(include=[np.number]).fillna(0.0)

    if feature_prefixes:
        keep_cols = [c for c in X_df.columns if any(c.startswith(p) for p in feature_prefixes)]
        if not keep_cols:
            err = InputValidationError(
                f"feature_prefixes={feature_prefixes} に一致する列がありません"
                f"（利用可能な数値列: {list(X_df.columns)}）"
            )
            audit.append("input_validation_failed", {"error": str(err)})
            raise err
        X_df = X_df[keep_cols]

    feature_names = list(X_df.columns)
    X = X_df.to_numpy(dtype=float)

    resolved_task = task
    if resolved_task == "auto":
        resolved_task = infer_task(y_raw)

    label_encoder = None
    if resolved_task == "classification":
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y_raw.astype(str))
    else:
        y = y_raw.to_numpy(dtype=float)

    resolved_n_jobs = n_jobs
    if resolved_n_jobs is None:
        cpu = os.cpu_count() or 1
        resolved_n_jobs = 1 if cpu <= 1 else -1
    if verbose:
        print(f"{LOG_PREFIX} タスク種別: {resolved_task} / サンプル数: {X.shape[0]} / 数値特徴数: {X.shape[1]}")
        print(f"{LOG_PREFIX} コロニー起動 (colony_size={colony_size}, max_iter={max_iter}, "
              f"n_jobs={resolved_n_jobs}, max_seconds={max_seconds})")

    optimizer = ButterflyEffectOptimizer(
        X, y, resolved_task,
        colony_size=colony_size,
        max_iter=max_iter,
        limit=limit,
        cv_folds=cv_folds,
        n_jobs=resolved_n_jobs,
        max_wall_seconds=max_seconds,
        audit=audit,
    )
    best_vec, best_fit = optimizer.run(verbose=verbose)
    mask, hp = decode_food_source(best_vec, X.shape[1])
    selected_features = [f for f, m in zip(feature_names, mask) if m]

    final_model = build_model(hp, resolved_task, n_jobs=resolved_n_jobs)
    final_model.fit(X[:, mask], y)

    model_path = out_dir / "best_model.joblib"
    dump(
        {
            "model": final_model,
            "feature_mask": mask,
            "feature_names": feature_names,
            "selected_features": selected_features,
            "task": resolved_task,
            "label_encoder": label_encoder,
            "brand": BRAND,
        },
        model_path,
    )
    model_hash = sha256_of_file(model_path)

    report = {
        "brand": BRAND,
        "source_file": str(data_path),
        "task": resolved_task,
        "feature_prefixes_filter": feature_prefixes,
        "n_samples": int(X.shape[0]),
        "n_features_total": int(X.shape[1]),
        "n_features_selected": len(selected_features),
        "selected_features": selected_features,
        "hyperparameters": hp,
        "best_cv_score_with_penalty": best_fit,
        "colony_size": colony_size,
        "max_iter": max_iter,
        "elapsed_seconds": round(time.time() - t0, 2),
        "stopped_early": optimizer.stopped_early,
        "stop_reason": optimizer.stop_reason,
        "eval_count": optimizer.eval_count,
        "error_count": optimizer.error_count,
        "input_sha256": input_hash,
        "model_sha256": model_hash,
        "score_history": optimizer.history,
    }
    with open(out_dir / "report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    audit.append("run_complete", {
        "elapsed_seconds": report["elapsed_seconds"],
        "n_features_selected": len(selected_features),
        "model_sha256": model_hash,
        "stopped_early": optimizer.stopped_early,
    })

    if verbose:
        print(f"\n{LOG_PREFIX} 完了 — 所要時間: {report['elapsed_seconds']}秒")
        if optimizer.stopped_early:
            print(f"{LOG_PREFIX} 注意: {optimizer.stop_reason}")
        print(f"{LOG_PREFIX} 選択された特徴 ({len(selected_features)}/{len(feature_names)}): {selected_features}")
        print(f"{LOG_PREFIX} 最良ハイパーパラメータ: {hp}")
        print(f"{LOG_PREFIX} モデル保存先: {model_path} (sha256={model_hash[:16]}...)")
        print(f"{LOG_PREFIX} レポート保存先: {out_dir / 'report.json'}")
        print(f"{LOG_PREFIX} 監査ログ: {out_dir / 'butterfly_audit.log'}")

    return report


def main():
    ap = argparse.ArgumentParser(
        description=f"Tive ◉AI {BRAND} Engine — 群知能AutoML（防御機構つき）"
    )
    ap.add_argument("--data", required=True, help="学習用CSVファイルのパス")
    ap.add_argument("--target", required=True, help="目的変数の列名")
    ap.add_argument("--task", choices=["auto", "classification", "regression"], default="auto")
    ap.add_argument("--colony-size", type=int, default=20)
    ap.add_argument("--max-iter", type=int, default=30)
    ap.add_argument("--limit", type=int, default=8, help="改善なしで偵察蜂に切り替える閾値")
    ap.add_argument("--output", default="tive_butterfly_out", help="出力ディレクトリ")
    ap.add_argument("--cv-folds", type=int, default=5)
    ap.add_argument("--n-jobs", type=int, default=None,
                     help="並列数。未指定ならCPUコア数から自動決定（シングルコアなら1）")
    ap.add_argument("--max-seconds", type=float, default=SAFE_MAX_WALL_SECONDS_DEFAULT,
                     help="最大実行時間(秒)。超過したら安全に打ち切る（サーキットブレーカー）")
    ap.add_argument("--allowed-base-dir", default=None,
                     help="指定した場合、このディレクトリ配下のCSVしか読み込まない（常駐運用向け）")
    ap.add_argument("--feature-prefixes", default=None,
                     help="カンマ区切り。指定した接頭辞で始まる数値列のみを特徴量として使う")
    args = ap.parse_args()

    feature_prefixes = None
    if args.feature_prefixes:
        feature_prefixes = [p.strip() for p in args.feature_prefixes.split(",") if p.strip()]

    out_dir_for_error_msg = Path(args.output)
    try:
        process_dataset(
            data_path_raw=args.data,
            target=args.target,
            output_dir=args.output,
            task=args.task,
            colony_size=args.colony_size,
            max_iter=args.max_iter,
            limit=args.limit,
            cv_folds=args.cv_folds,
            n_jobs=args.n_jobs,
            max_seconds=args.max_seconds,
            allowed_base_dir=args.allowed_base_dir,
            feature_prefixes=feature_prefixes,
            verbose=True,
        )
    except InputValidationError as e:
        print(f"{LOG_PREFIX} 入力エラー: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        audit = AuditLog(out_dir_for_error_msg / "butterfly_audit.log")
        audit.append("unexpected_error", {
            "error": str(e)[:500],
            "traceback": traceback.format_exc()[-3000:],
        })
        print(f"{LOG_PREFIX} 想定外のエラーが発生し実行を停止しました。"
              f"詳細は監査ログ({out_dir_for_error_msg / 'butterfly_audit.log'})を確認してください。",
              file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
