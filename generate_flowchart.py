"""
Generate Flowchart — Alur Algoritma Sistem CekatIn
===================================================
Membuat flowchart vertikal seperti contoh jurnal:
- Oval untuk Start/End
- Rectangle untuk proses
- Diamond untuk keputusan
- Panah untuk alur
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

fig, ax = plt.subplots(1, 1, figsize=(7, 18), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 36)
ax.axis('off')
fig.patch.set_facecolor('white')

# ── Style ──
border_color = '#222222'
arrow_color = '#222222'
text_color = '#111111'

# ── Helper Functions ──

def draw_oval(ax, x, y, w, h, text, fontsize=11):
    """Start/End node"""
    ellipse = mpatches.Ellipse((x, y), w, h, facecolor='white',
                                edgecolor=border_color, linewidth=1.8)
    ax.add_patch(ellipse)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            fontweight='bold', color=text_color, fontfamily='serif')

def draw_box(ax, x, y, w, h, text, fontsize=9, bold_first_line=True):
    """Process node (rectangle with rounded corners)"""
    rect = FancyBboxPatch((x - w/2, y - h/2), w, h,
                           boxstyle='round,pad=0.08',
                           facecolor='white', edgecolor=border_color, linewidth=1.5)
    ax.add_patch(rect)
    
    lines = text.split('\n')
    if bold_first_line and len(lines) > 1:
        line_height = 0.22
        total_h = (len(lines) - 1) * line_height
        start_y = y + total_h / 2
        for i, line in enumerate(lines):
            fw = 'bold' if i == 0 else 'normal'
            fs = fontsize if i == 0 else fontsize - 0.5
            ax.text(x, start_y - i * line_height, line, ha='center', va='center',
                    fontsize=fs, fontweight=fw, color=text_color, fontfamily='serif')
    else:
        ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
                fontweight='normal', color=text_color, fontfamily='serif')

def draw_diamond(ax, x, y, w, h, text, fontsize=8):
    """Decision node"""
    diamond = plt.Polygon([(x, y+h/2), (x+w/2, y), (x, y-h/2), (x-w/2, y)],
                           facecolor='white', edgecolor=border_color, linewidth=1.5,
                           closed=True)
    ax.add_patch(diamond)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            fontweight='normal', color=text_color, fontfamily='serif')

def arrow_down(ax, x, y1, y2):
    """Vertical arrow downward"""
    ax.annotate('', xy=(x, y2), xytext=(x, y1),
                arrowprops=dict(arrowstyle='->', color=arrow_color, lw=1.5))

def arrow_to(ax, x1, y1, x2, y2):
    """Arrow from point to point"""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=arrow_color, lw=1.5))

def line_to(ax, x1, y1, x2, y2):
    """Line without arrow"""
    ax.plot([x1, x2], [y1, y2], color=arrow_color, lw=1.5)

def label(ax, x, y, text):
    """Small label near arrows"""
    ax.text(x, y, text, ha='center', va='center', fontsize=8.5,
            fontweight='bold', color='#444444', fontfamily='serif',
            fontstyle='italic')


# ══════════════════════════════════════════════════════════
#  FLOWCHART LAYOUT
# ══════════════════════════════════════════════════════════

cx = 5.0  # center x
bw = 4.2  # box width
bh = 1.1  # box height
gap = 0.5 # gap between nodes

# ── 1. Start ──
y = 34.5
draw_oval(ax, cx, y, 2.4, 0.9, 'Start')
arrow_down(ax, cx, y - 0.45, y - 1.2)

# ── 2. Input User Message ──
y = 32.7
draw_box(ax, cx, y, bw, bh, 'Input User Message\nUser sends text query to chatbot')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 3. Text Preprocessing ──
y = 30.8
draw_box(ax, cx, y, bw, 1.3, 'Text Preprocessing\nLowercasing → Tokenization →\nSlang Normalization → Stemming')
arrow_down(ax, cx, y - 1.3/2, y - 1.3/2 - gap)

# ── 4. Feature Extraction ──
y = 28.8
draw_box(ax, cx, y, bw, bh, 'TF-IDF Feature Extraction\nUnigram + Bigram (1,569 features)')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 5. Classification ──
y = 26.9
draw_box(ax, cx, y, bw, bh, 'Intent Classification\nNaive Bayes & SVM predict intent')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 6. Get Result ──
y = 25.0
draw_box(ax, cx, y, bw, bh, 'Get Prediction Result\nPredicted intent + confidence score')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 7. Decision: Confidence >= Threshold? ──
y_dec = 23.0
draw_diamond(ax, cx, y_dec, 4.5, 1.6, 'Confidence ≥\nThreshold?')

# YES branch → right
line_to(ax, cx + 2.25, y_dec, 8.2, y_dec)
label(ax, 7.0, y_dec + 0.25, 'Yes')
arrow_to(ax, 8.2, y_dec, 8.2, y_dec - 1.2)

# Right box: NLP-Driven
draw_box(ax, 8.2, y_dec - 2.0, 3.2, 1.2, 'NLP-Driven Response\nRetrieve answer from\nKnowledge Base', fontsize=8)

# NO branch → left
line_to(ax, cx - 2.25, y_dec, 1.8, y_dec)
label(ax, 3.0, y_dec + 0.25, 'No')
arrow_to(ax, 1.8, y_dec, 1.8, y_dec - 1.2)

# Left box: AI-Driven
draw_box(ax, 1.8, y_dec - 2.0, 3.2, 1.2, 'AI-Driven Response\nGenerate answer using\nGemini/Groq AI', fontsize=8)

# Merge back to center
y_merge = y_dec - 3.3
line_to(ax, 1.8, y_dec - 2.6, 1.8, y_merge)
line_to(ax, 8.2, y_dec - 2.6, 8.2, y_merge)
line_to(ax, 1.8, y_merge, 8.2, y_merge)
arrow_down(ax, cx, y_merge, y_merge - gap)

# ── 8. Output Response ──
y = y_merge - gap - bh/2
draw_box(ax, cx, y, bw, bh, 'Display Response\nReturn chatbot answer to user')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 9. Evaluate Performance ──
y = y - bh - gap
draw_box(ax, cx, y, bw, 1.3, 'Evaluate Performance\nAccuracy, Precision, Recall,\nF1-Score, Confusion Matrix')
arrow_down(ax, cx, y - 1.3/2, y - 1.3/2 - gap)

# ── 10. Cross Validation ──
y = y - 1.3 - gap
draw_box(ax, cx, y, bw, bh, 'K-Fold Cross-Validation\n5-Fold and 10-Fold CV')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 11. Statistical Test ──
y = y - bh - gap
draw_box(ax, cx, y, bw, bh, 'Paired T-Test\nStatistical significance (α = 0.05)')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 12. Compare Results ──
y = y - bh - gap
draw_box(ax, cx, y, bw, bh, 'Compare NB vs SVM\nAnalyze performance difference')
arrow_down(ax, cx, y - bh/2, y - bh/2 - gap)

# ── 13. End ──
y = y - bh - gap
draw_oval(ax, cx, y, 2.4, 0.9, 'End')

plt.tight_layout(pad=0.5)
plt.savefig('e:/DATA/Ngoding/cekatin/evaluation_results/flowchart_algorithm.png',
            dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
print('✅ Flowchart saved: evaluation_results/flowchart_algorithm.png')
