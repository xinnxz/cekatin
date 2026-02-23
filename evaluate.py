"""
CekatIn - Evaluasi Perbandingan Naive Bayes vs SVM
=====================================================
Script evaluasi lengkap untuk jurnal SINTA 5.

Menghasilkan:
1. Distribusi dataset
2. Contoh preprocessing
3. Cross-Validation (5-Fold & 10-Fold)
4. Classification Report per model
5. Ringkasan perbandingan
6. Uji Statistik (Paired T-Test)
7. Analisis Error (intent yang sering tertukar)
8. Dokumentasi Hyperparameter
9. Confusion Matrix, F1 Chart, dll

Author: CekatIn Team
"""

import json
import numpy as np
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
from sklearn.model_selection import (
    cross_val_score, StratifiedKFold, train_test_split
)
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score
)
from scipy import stats  # Untuk T-Test

# ============================================================
# Konfigurasi (Hyperparameter — didokumentasikan untuk jurnal)
# ============================================================

CONFIG = {
    # TF-IDF Vectorizer
    'tfidf': {
        'max_features': None,      # Gunakan semua fitur
        'ngram_range': (1, 2),     # Unigram + Bigram
        'min_df': 1,               # Minimal 1 dokumen
        'max_df': 1.0,             # Tidak ada filter max
        'sublinear_tf': True,      # Sublinear TF scaling (1 + log(tf))
    },
    
    # Naive Bayes (MultinomialNB)
    'nb': {
        'alpha': 1.0,              # Laplace smoothing (default)
        'fit_prior': True,         # Learn class prior probabilities
    },
    
    # SVM (Support Vector Machine)
    'svm': {
        'kernel': 'linear',        # Linear kernel
        'C': 1.0,                  # Regularization parameter
        'gamma': 'scale',          # Kernel coefficient
        'random_state': 42,
    },
    
    # Data Split  
    'split': {
        'test_size': 0.20,         # 80% train, 20% test
        'random_state': 42,        # Reproducibility
        'stratify': True,          # Stratified split
    },
    
    # Cross-Validation
    'cv': {
        'n_folds_5': 5,            # 5-Fold CV
        'n_folds_10': 10,          # 10-Fold CV
        'random_state': 42,
    }
}


# ============================================================
# 1. Load & Preprocess Dataset
# ============================================================

def load_dataset():
    """Load dataset dari intents.json."""
    with open('dataset/intents.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data


def preprocess(text):
    """Preprocessing sederhana — lowercase + basic cleaning."""
    import re
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)  # Hapus tanda baca
    text = re.sub(r'\s+', ' ', text)     # Normalize whitespace
    return text


def prepare_data(data):
    """Siapkan X (teks) dan y (label) dari dataset."""
    texts = []
    labels = []
    for intent in data['intents']:
        for pattern in intent['patterns']:
            texts.append(preprocess(pattern))
            labels.append(intent['tag'])
    return texts, labels


# ============================================================
# 2. Evaluasi
# ============================================================

def evaluate():
    """Jalankan evaluasi lengkap NB vs SVM."""
    
    print("=" * 70)
    print("  LAPORAN EVALUASI — CekatIn NLP Chatbot")
    print("  Perbandingan Naive Bayes vs SVM untuk Klasifikasi Intent")
    print("=" * 70)
    
    # Load data
    data = load_dataset()
    texts, labels = prepare_data(data)
    label_names = sorted(set(labels))
    
    # ── 1. Distribusi Dataset ──
    print("\n\n1. DISTRIBUSI DATASET")
    print("-" * 50)
    print(f"  {'Intent':<25} {'Jumlah Pattern':>15}")
    print(f"  {'-'*40}")
    
    from collections import Counter
    dist = Counter(labels)
    for tag in sorted(dist.keys()):
        print(f"  {tag:<25} {dist[tag]:>15}")
    print(f"  {'-'*40}")
    print(f"  {'TOTAL':<25} {len(texts):>15}")
    print(f"  {'Jumlah Intent':<25} {len(label_names):>15}")
    
    # ── 2. Contoh Preprocessing ──
    print("\n\n2. CONTOH HASIL PREPROCESSING")
    print("-" * 70)
    print(f"  {'Intent':<20} {'Original':<30} {'Preprocessed':<20}")
    print(f"  {'-'*65}")
    
    shown = set()
    for intent in data['intents']:
        tag = intent['tag']
        if tag not in shown:
            shown.add(tag)
            orig = intent['patterns'][0]
            proc = preprocess(orig)
            print(f"  {tag:<20} {orig:<30} {proc:<20}")
    
    # ── 3. Vectorize ──
    tfidf = TfidfVectorizer(**CONFIG['tfidf'])
    X = tfidf.fit_transform(texts)
    y = np.array(labels)
    
    # ── 4. Train/Test Split ──
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=CONFIG['split']['test_size'],
        random_state=CONFIG['split']['random_state'],
        stratify=y if CONFIG['split']['stratify'] else None
    )
    
    print(f"\n\n3. DATA SPLIT")
    print("-" * 50)
    print(f"  Total data      : {len(texts)}")
    print(f"  Training set    : {X_train.shape[0]} ({100-CONFIG['split']['test_size']*100:.0f}%)")
    print(f"  Testing set     : {X_test.shape[0]} ({CONFIG['split']['test_size']*100:.0f}%)")
    print(f"  Stratified      : {'Ya' if CONFIG['split']['stratify'] else 'Tidak'}")
    print(f"  Random state    : {CONFIG['split']['random_state']}")
    print(f"  Fitur TF-IDF    : {X.shape[1]}")
    
    # ── 5. Train Models ──
    nb_model = MultinomialNB(**CONFIG['nb'])
    nb_model.fit(X_train, y_train)
    nb_pred = nb_model.predict(X_test)
    
    svm_model = SVC(**CONFIG['svm'])
    svm_model.fit(X_train, y_train)
    svm_pred = svm_model.predict(X_test)
    
    # ── 6. Cross-Validation (5-Fold & 10-Fold) ──
    print(f"\n\n4. HASIL CROSS-VALIDATION")
    print("-" * 50)
    
    cv_results = {}
    for n_folds_key in ['n_folds_5', 'n_folds_10']:
        n_folds = CONFIG['cv'][n_folds_key]
        skf = StratifiedKFold(
            n_splits=n_folds, 
            shuffle=True, 
            random_state=CONFIG['cv']['random_state']
        )
        
        nb_cv = cross_val_score(
            MultinomialNB(**CONFIG['nb']), X, y, cv=skf, scoring='accuracy'
        )
        svm_cv = cross_val_score(
            SVC(**CONFIG['svm']), X, y, cv=skf, scoring='accuracy'
        )
        
        cv_results[n_folds] = {'nb': nb_cv, 'svm': svm_cv}
        
        print(f"\n  === {n_folds}-Fold Cross-Validation ===")
        print(f"\n  Naive Bayes:")
        print(f"    Accuracy (mean) : {nb_cv.mean():.4f} ({nb_cv.mean()*100:.2f}%)")
        print(f"    Std. Deviation  : {nb_cv.std():.4f}")
        print(f"    Per fold        : {[f'{v:.4f}' for v in nb_cv]}")
        print(f"\n  SVM (Linear):")
        print(f"    Accuracy (mean) : {svm_cv.mean():.4f} ({svm_cv.mean()*100:.2f}%)")
        print(f"    Std. Deviation  : {svm_cv.std():.4f}")
        print(f"    Per fold        : {[f'{v:.4f}' for v in svm_cv]}")
    
    # ── 7. Classification Report ──
    print(f"\n\n5. CLASSIFICATION REPORT PER MODEL")
    print("=" * 70)
    
    for name, pred in [("Naive Bayes", nb_pred), ("SVM (Linear)", svm_pred)]:
        print(f"\n  === {name} ===")
        report = classification_report(
            y_test, pred, target_names=label_names, output_dict=True
        )
        
        print(f"  {'Intent':<25} {'Precision':>10} {'Recall':>10} {'F1-Score':>10} {'Support':>10}")
        print(f"  {'-'*62}")
        
        for label in label_names:
            r = report[label]
            print(f"  {label:<25} {r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1-score']:>10.4f} {r['support']:>10.0f}")
        
        print(f"  {'-'*62}")
        for avg_type in ['macro avg', 'weighted avg']:
            r = report[avg_type]
            label = avg_type.replace(' avg', ' Avg').title()
            print(f"  {label:<25} {r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1-score']:>10.4f}")
        
        print(f"\n  Overall Accuracy: {report['accuracy']:.4f} ({report['accuracy']*100:.2f}%)")
    
    # ── 8. Ringkasan Perbandingan ──
    nb_report = classification_report(y_test, nb_pred, output_dict=True)
    svm_report = classification_report(y_test, svm_pred, output_dict=True)
    
    cv5 = cv_results[5]
    cv10 = cv_results[10]
    
    print(f"\n\n6. RINGKASAN PERBANDINGAN")
    print("=" * 70)
    print(f"  {'Metrik':<30} {'Naive Bayes':>12} {'SVM (Linear)':>12} {'Selisih':>10}")
    print(f"  {'-'*67}")
    
    metrics = [
        ("Accuracy", nb_report['accuracy'], svm_report['accuracy']),
        ("Precision (macro)", nb_report['macro avg']['precision'], svm_report['macro avg']['precision']),
        ("Recall (macro)", nb_report['macro avg']['recall'], svm_report['macro avg']['recall']),
        ("F1-Score (macro)", nb_report['macro avg']['f1-score'], svm_report['macro avg']['f1-score']),
        ("CV 5-Fold Mean", cv5['nb'].mean(), cv5['svm'].mean()),
        ("CV 10-Fold Mean", cv10['nb'].mean(), cv10['svm'].mean()),
    ]
    
    for name, nb_val, svm_val in metrics:
        diff = nb_val - svm_val
        sign = "+" if diff > 0 else ""
        print(f"  {name:<30} {nb_val:>12.4f} {svm_val:>12.4f} {sign}{diff:>9.4f}")
    
    # ── 9. Uji Statistik — Paired T-Test ──
    print(f"\n\n7. UJI STATISTIK (Paired T-Test)")
    print("=" * 70)
    print("  Hipotesis:")
    print("    H0: Tidak ada perbedaan signifikan antara NB dan SVM")
    print("    H1: Ada perbedaan signifikan antara NB dan SVM")
    print(f"    α (significance level): 0.05")
    
    for folds, cv_data in cv_results.items():
        t_stat, p_value = stats.ttest_rel(cv_data['nb'], cv_data['svm'])
        print(f"\n  {folds}-Fold CV:")
        print(f"    NB Mean  : {cv_data['nb'].mean():.4f} ± {cv_data['nb'].std():.4f}")
        print(f"    SVM Mean : {cv_data['svm'].mean():.4f} ± {cv_data['svm'].std():.4f}")
        print(f"    t-statistic : {t_stat:.4f}")
        print(f"    p-value     : {p_value:.6f}")
        
        if p_value < 0.05:
            winner = "Naive Bayes" if cv_data['nb'].mean() > cv_data['svm'].mean() else "SVM"
            print(f"    Kesimpulan  : ⚡ SIGNIFIKAN (p < 0.05) — {winner} lebih unggul")
        else:
            print(f"    Kesimpulan  : ⚖️  TIDAK SIGNIFIKAN (p >= 0.05) — perbedaan tidak bermakna")
    
    # ── 10. Analisis Error ──
    print(f"\n\n8. ANALISIS ERROR")
    print("=" * 70)
    
    for name, pred in [("Naive Bayes", nb_pred), ("SVM (Linear)", svm_pred)]:
        cm = confusion_matrix(y_test, pred, labels=label_names)
        print(f"\n  === {name} — Intent yang Sering Tertukar ===")
        
        # Cari pasangan intent yang paling sering tertukar
        errors = []
        for i, true_label in enumerate(label_names):
            for j, pred_label in enumerate(label_names):
                if i != j and cm[i][j] > 0:
                    errors.append((cm[i][j], true_label, pred_label))
        
        errors.sort(reverse=True)
        
        if errors:
            print(f"  {'Sebenarnya':<25} {'Diprediksi':<25} {'Jumlah':>8}")
            print(f"  {'-'*60}")
            for count, true_l, pred_l in errors[:10]:
                print(f"  {true_l:<25} {pred_l:<25} {count:>8}")
        else:
            print("  Tidak ada error!")
    
    # ── 11. Contoh Misklasifikasi ──
    print(f"\n\n9. CONTOH KASUS MISKLASIFIKASI")
    print("=" * 70)
    
    _, X_test_raw, _, y_test_raw = train_test_split(
        texts, labels,
        test_size=CONFIG['split']['test_size'],
        random_state=CONFIG['split']['random_state'],
        stratify=labels
    )
    
    print(f"\n  === Naive Bayes ===")
    print(f"  {'Teks':<40} {'Asli':<20} {'Prediksi':<20}")
    print(f"  {'-'*78}")
    shown_count = 0
    for i in range(len(y_test)):
        if y_test[i] != nb_pred[i] and shown_count < 10:
            print(f"  {X_test_raw[i]:<40} {y_test[i]:<20} {nb_pred[i]:<20}")
            shown_count += 1
    if shown_count == 0:
        print("  Semua prediksi benar!")
    
    print(f"\n  === SVM (Linear) ===")
    print(f"  {'Teks':<40} {'Asli':<20} {'Prediksi':<20}")
    print(f"  {'-'*78}")
    shown_count = 0
    for i in range(len(y_test)):
        if y_test[i] != svm_pred[i] and shown_count < 10:
            print(f"  {X_test_raw[i]:<40} {y_test[i]:<20} {svm_pred[i]:<20}")
            shown_count += 1
    if shown_count == 0:
        print("  Semua prediksi benar!")
    
    # ── 12. Dokumentasi Hyperparameter ──
    print(f"\n\n10. DOKUMENTASI HYPERPARAMETER")
    print("=" * 70)
    
    print(f"\n  === TF-IDF Vectorizer ===")
    for k, v in CONFIG['tfidf'].items():
        print(f"    {k:<20} : {v}")
    print(f"    {'jumlah_fitur':<20} : {X.shape[1]}")
    
    print(f"\n  === Naive Bayes (MultinomialNB) ===")
    for k, v in CONFIG['nb'].items():
        print(f"    {k:<20} : {v}")
    
    print(f"\n  === SVM (Support Vector Machine) ===")
    for k, v in CONFIG['svm'].items():
        print(f"    {k:<20} : {v}")
    
    print(f"\n  === Data Split ===")
    for k, v in CONFIG['split'].items():
        print(f"    {k:<20} : {v}")
    
    # ── 13. Kesimpulan ──
    cv5_nb_mean = cv5['nb'].mean()
    cv5_svm_mean = cv5['svm'].mean()
    best = "Naive Bayes" if cv5_nb_mean > cv5_svm_mean else "SVM (Linear)"
    
    print(f"\n\n11. KESIMPULAN")
    print("=" * 70)
    print(f"  Model terbaik berdasarkan CV 5-Fold: {best}")
    print(f"\n  Naive Bayes:")
    print(f"    → Accuracy  = {nb_report['accuracy']*100:.2f}%")
    print(f"    → F1 (macro)= {nb_report['macro avg']['f1-score']*100:.2f}%")
    print(f"    → CV 5-Fold = {cv5_nb_mean*100:.2f}% ± {cv5['nb'].std()*100:.2f}%")
    print(f"    → CV 10-Fold= {cv10['nb'].mean()*100:.2f}% ± {cv10['nb'].std()*100:.2f}%")
    print(f"\n  SVM (Linear):")
    print(f"    → Accuracy  = {svm_report['accuracy']*100:.2f}%")
    print(f"    → F1 (macro)= {svm_report['macro avg']['f1-score']*100:.2f}%")
    print(f"    → CV 5-Fold = {cv5_svm_mean*100:.2f}% ± {cv5['svm'].std()*100:.2f}%")
    print(f"    → CV 10-Fold= {cv10['svm'].mean()*100:.2f}% ± {cv10['svm'].std()*100:.2f}%")
    
    # ── 14. Generate Charts ──
    print("\n\nGenerating charts...")
    generate_charts(
        y_test, nb_pred, svm_pred, label_names,
        cv_results, nb_report, svm_report
    )
    print("✅ Semua chart tersimpan di evaluation_results/")
    
    # Cleanup temp file
    if os.path.exists('count_patterns.py'):
        os.remove('count_patterns.py')


def generate_charts(y_test, nb_pred, svm_pred, label_names,
                    cv_results, nb_report, svm_report):
    """Generate semua chart evaluasi."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    
    os.makedirs('evaluation_results', exist_ok=True)
    
    plt.rcParams['figure.dpi'] = 150
    plt.rcParams['font.size'] = 10
    
    # ── Confusion Matrix: NB ──
    fig, ax = plt.subplots(figsize=(10, 8))
    cm_nb = confusion_matrix(y_test, nb_pred, labels=label_names)
    im = ax.imshow(cm_nb, interpolation='nearest', cmap=plt.cm.Blues)
    ax.set_title('Confusion Matrix — Naive Bayes', fontsize=14, fontweight='bold')
    plt.colorbar(im)
    tick_marks = np.arange(len(label_names))
    ax.set_xticks(tick_marks)
    ax.set_xticklabels(label_names, rotation=45, ha='right', fontsize=8)
    ax.set_yticks(tick_marks)
    ax.set_yticklabels(label_names, fontsize=8)
    
    for i in range(len(label_names)):
        for j in range(len(label_names)):
            color = "white" if cm_nb[i, j] > cm_nb.max() / 2 else "black"
            ax.text(j, i, str(cm_nb[i, j]), ha="center", va="center", color=color, fontsize=9)
    
    ax.set_ylabel('Actual', fontsize=12)
    ax.set_xlabel('Predicted', fontsize=12)
    plt.tight_layout()
    plt.savefig('evaluation_results/confusion_matrix_nb.png')
    plt.close()
    
    # ── Confusion Matrix: SVM ──
    fig, ax = plt.subplots(figsize=(10, 8))
    cm_svm = confusion_matrix(y_test, svm_pred, labels=label_names)
    im = ax.imshow(cm_svm, interpolation='nearest', cmap=plt.cm.Oranges)
    ax.set_title('Confusion Matrix — SVM (Linear)', fontsize=14, fontweight='bold')
    plt.colorbar(im)
    ax.set_xticks(tick_marks)
    ax.set_xticklabels(label_names, rotation=45, ha='right', fontsize=8)
    ax.set_yticks(tick_marks)
    ax.set_yticklabels(label_names, fontsize=8)
    
    for i in range(len(label_names)):
        for j in range(len(label_names)):
            color = "white" if cm_svm[i, j] > cm_svm.max() / 2 else "black"
            ax.text(j, i, str(cm_svm[i, j]), ha="center", va="center", color=color, fontsize=9)
    
    ax.set_ylabel('Actual', fontsize=12)
    ax.set_xlabel('Predicted', fontsize=12)
    plt.tight_layout()
    plt.savefig('evaluation_results/confusion_matrix_svm.png')
    plt.close()
    
    # ── F1-Score Comparison ──
    fig, ax = plt.subplots(figsize=(12, 6))
    nb_f1 = [classification_report(y_test, nb_pred, output_dict=True).get(l, {}).get('f1-score', 0) for l in label_names]
    svm_f1 = [classification_report(y_test, svm_pred, output_dict=True).get(l, {}).get('f1-score', 0) for l in label_names]
    
    x = np.arange(len(label_names))
    width = 0.35
    bars1 = ax.bar(x - width/2, nb_f1, width, label='Naive Bayes', color='#4C72B0', alpha=0.8)
    bars2 = ax.bar(x + width/2, svm_f1, width, label='SVM (Linear)', color='#DD8452', alpha=0.8)
    
    ax.set_title('Perbandingan F1-Score per Intent', fontsize=14, fontweight='bold')
    ax.set_xlabel('Intent', fontsize=12)
    ax.set_ylabel('F1-Score', fontsize=12)
    ax.set_xticks(x)
    ax.set_xticklabels(label_names, rotation=45, ha='right', fontsize=8)
    ax.legend()
    ax.set_ylim(0, 1.1)
    ax.grid(axis='y', alpha=0.3)
    
    for bar in bars1:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h, f'{h:.2f}', ha='center', va='bottom', fontsize=7)
    for bar in bars2:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h, f'{h:.2f}', ha='center', va='bottom', fontsize=7)
    
    plt.tight_layout()
    plt.savefig('evaluation_results/comparison_f1_chart.png')
    plt.close()
    
    # ── Cross-Validation Comparison ──
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    for idx, (folds, cv_data) in enumerate(cv_results.items()):
        ax = axes[idx]
        fold_nums = range(1, folds + 1)
        ax.plot(fold_nums, cv_data['nb'], 'o-', label='Naive Bayes', color='#4C72B0', linewidth=2)
        ax.plot(fold_nums, cv_data['svm'], 's-', label='SVM (Linear)', color='#DD8452', linewidth=2)
        ax.axhline(y=cv_data['nb'].mean(), color='#4C72B0', linestyle='--', alpha=0.5)
        ax.axhline(y=cv_data['svm'].mean(), color='#DD8452', linestyle='--', alpha=0.5)
        ax.set_title(f'{folds}-Fold Cross-Validation', fontsize=12, fontweight='bold')
        ax.set_xlabel('Fold')
        ax.set_ylabel('Accuracy')
        ax.set_xticks(list(fold_nums))
        ax.legend()
        ax.grid(alpha=0.3)
        ax.set_ylim(0.5, 1.0)
    
    plt.tight_layout()
    plt.savefig('evaluation_results/cv_comparison.png')
    plt.close()
    
    # ── Overall Comparison Bar Chart ──
    fig, ax = plt.subplots(figsize=(10, 6))
    
    metric_names = ['Accuracy', 'Precision\n(macro)', 'Recall\n(macro)', 'F1-Score\n(macro)', 'CV 5-Fold', 'CV 10-Fold']
    nb_vals = [
        nb_report['accuracy'],
        nb_report['macro avg']['precision'],
        nb_report['macro avg']['recall'],
        nb_report['macro avg']['f1-score'],
        cv_results[5]['nb'].mean(),
        cv_results[10]['nb'].mean()
    ]
    svm_vals = [
        svm_report['accuracy'],
        svm_report['macro avg']['precision'],
        svm_report['macro avg']['recall'],
        svm_report['macro avg']['f1-score'],
        cv_results[5]['svm'].mean(),
        cv_results[10]['svm'].mean()
    ]
    
    x = np.arange(len(metric_names))
    width = 0.35
    bars1 = ax.bar(x - width/2, nb_vals, width, label='Naive Bayes', color='#4C72B0', alpha=0.85)
    bars2 = ax.bar(x + width/2, svm_vals, width, label='SVM (Linear)', color='#DD8452', alpha=0.85)
    
    ax.set_title('Perbandingan Keseluruhan NB vs SVM', fontsize=14, fontweight='bold')
    ax.set_ylabel('Score', fontsize=12)
    ax.set_xticks(x)
    ax.set_xticklabels(metric_names, fontsize=9)
    ax.legend(fontsize=11)
    ax.set_ylim(0.5, 1.05)
    ax.grid(axis='y', alpha=0.3)
    
    for bar in bars1:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 0.01, f'{h:.3f}', ha='center', va='bottom', fontsize=8)
    for bar in bars2:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 0.01, f'{h:.3f}', ha='center', va='bottom', fontsize=8)
    
    plt.tight_layout()
    plt.savefig('evaluation_results/overall_comparison.png')
    plt.close()
    
    print("  📊 confusion_matrix_nb.png")
    print("  📊 confusion_matrix_svm.png")
    print("  📊 comparison_f1_chart.png")
    print("  📊 cv_comparison.png")
    print("  📊 overall_comparison.png")


# ============================================================
# Main
# ============================================================

if __name__ == '__main__':
    # Redirect output ke file juga
    import sys
    
    os.makedirs('evaluation_results', exist_ok=True)
    
    class Tee:
        """Output ke terminal DAN file sekaligus."""
        def __init__(self, *files):
            self.files = files
        def write(self, obj):
            for f in self.files:
                f.write(obj)
                f.flush()
        def flush(self):
            for f in self.files:
                f.flush()
    
    report_file = open('evaluation_results/evaluation_report.txt', 'w', encoding='utf-8')
    sys.stdout = Tee(sys.__stdout__, report_file)
    
    evaluate()
    
    sys.stdout = sys.__stdout__
    report_file.close()
    print("\n✅ Report tersimpan di: evaluation_results/evaluation_report.txt")
