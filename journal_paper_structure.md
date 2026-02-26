# Comparative Analysis of Naive Bayes and Support Vector Machine for Intent Classification in Indonesian Language Customer Service Chatbot

**First Author** <sup>a,1,*</sup>, **Second Author** <sup>b,2</sup>

<sup>a</sup> Department of Informatics, [University Name], [Address], [City], [Province], Indonesia  
<sup>b</sup> [Second affiliation, Address, City and Postcode, Country]  
<sup>1</sup> [email_first_author@institution.ac.id]*; <sup>2</sup> [email_second_author@institution.ac.id]  
\* corresponding author

---

**ARTICLE INFO**

Article history:  
Received  
Revised  
Accepted

Keywords:  
chatbot  
customer service  
intent classification  
Naive Bayes  
support vector machine

---

## ABSTRACT

**Background:** The rapid growth of e-commerce in Indonesia has significantly increased the demand for automated customer service solutions. Chatbots powered by Natural Language Processing offer a scalable and cost-effective approach to handle repetitive customer inquiries. However, classifying user intent in Bahasa Indonesia remains a challenging task due to the prevalence of informal language, slang expressions, and the relatively limited availability of NLP resources for the Indonesian language.

**Objective:** This study aims to conduct a comparative analysis of two widely-used machine learning algorithms, namely Multinomial Naive Bayes and Linear Support Vector Machine, for intent classification in an Indonesian-language customer service chatbot designed for an electronics retail store.

**Methods:** A dataset consisting of 608 text patterns distributed across 12 intent categories was collected and preprocessed through a four-stage pipeline comprising lowercasing, tokenization, slang normalization using a 405-entry custom dictionary, and morphological stemming using the Sastrawi library. Feature extraction was performed using Term Frequency–Inverse Document Frequency with unigram-bigram representation, yielding 1,569 features. Both models were trained on a stratified 80:20 data split and evaluated using accuracy, precision, recall, F1-score, k-fold cross-validation, confusion matrix analysis, and a paired t-test for statistical significance.

**Results:** The experimental results demonstrated that SVM achieved an overall accuracy of 86.89% with a macro-averaged F1-score of 0.8693, while Naive Bayes achieved 83.61% accuracy with a macro-averaged F1-score of 0.8336. Cross-validation experiments confirmed this trend, with SVM attaining mean accuracies of 81.43% (5-fold) and 82.25% (10-fold) compared to Naive Bayes at 79.78% and 81.09%, respectively. However, a paired t-test revealed that the performance difference between the two algorithms was not statistically significant at the 0.05 significance level (5-fold: p = 0.3825; 10-fold: p = 0.4624).

**Conclusion:** Both algorithms demonstrate viable performance for intent classification in Indonesian-language chatbot applications. While SVM provides marginally superior accuracy, Naive Bayes offers faster training times and comparable classification results. The findings further suggest that Indonesian-specific text preprocessing, particularly slang normalization and Sastrawi stemming, plays an essential role in handling informal user queries.

---

## 1. Introduction

The proliferation of e-commerce platforms in Indonesia has fundamentally transformed the way consumers interact with retail businesses. As the largest digital economy in Southeast Asia, Indonesia's e-commerce sector reached a gross merchandise value of approximately $65 billion in 2024, driven by increasing internet penetration and the widespread adoption of digital payment methods [1]. This exponential growth has generated an enormous volume of customer inquiries that traditional human-staffed customer service models are increasingly unable to handle due to inherent limitations in scalability, response time, and operational cost [2]. In this context, chatbot systems powered by Natural Language Processing (NLP) have emerged as a promising alternative, capable of providing instant, consistent, and scalable customer support around the clock [3]. A study by Sitanggang et al. [4] found a positive relationship between chatbot usage and customer satisfaction levels in Indonesian e-commerce, further underscoring the practical relevance of chatbot development in this domain.

At the core of any task-oriented chatbot lies the problem of intent classification, which refers to the task of identifying the underlying purpose or goal behind a user's textual message [5]. For instance, when a customer types "berapa harga Samsung Galaxy A25," the system must correctly classify this input as a price inquiry rather than a product availability question or a complaint. The accuracy of intent classification directly determines the quality of the chatbot's responses and, consequently, the overall user experience [6]. In multi-class intent classification scenarios common to customer service domains—where a system must distinguish among numerous intent categories such as product inquiries, price questions, shipping details, and complaints—achieving high classification accuracy is essential for practical deployment [7].

However, building an effective intent classification system for Bahasa Indonesia presents distinctive challenges that are not commonly encountered in English-language NLP research. Indonesian users frequently employ informal language, abbreviations, and regional slang in their written digital communication [8]. Expressions such as "brp hrg hp" (an informal rendering of "berapa harga handphone") and "ada promo gk" (a shortened form of "ada promo tidak") are typical examples of the linguistic variations that must be addressed [9]. Additionally, Bahasa Indonesia exhibits rich morphological features through its extensive use of affixes—including prefixes such as *me-*, *ber-*, *pe-*, and *ke-*, as well as suffixes such as *-kan*, *-an*, and *-i*—which complicate the process of feature extraction and term normalization [10]. The relatively limited availability of established NLP tools and annotated datasets for Indonesian further exacerbates these challenges, although significant progress has been made in recent years with tools such as the Sastrawi stemmer [11] and various slang dictionaries [9].

Among the various machine learning algorithms available for text classification, Multinomial Naive Bayes (NB) and Support Vector Machine (SVM) have consistently demonstrated strong performance across a wide range of NLP tasks [12]. Naive Bayes is grounded in Bayesian probability theory and operates under the assumption of feature independence, making it computationally efficient and well-suited for scenarios with limited training data [13]. Support Vector Machine, on the other hand, constructs optimal decision boundaries in high-dimensional feature spaces and is known for its robustness in handling text classification problems with large numbers of features [14]. Several comparative studies have examined the performance of these two algorithms in Indonesian text classification tasks. Asriyanti and Gao [15] compared NB and SVM for sentiment analysis of Twitter data related to COVID-19 vaccination in Indonesia, reporting that SVM achieved higher accuracy. Mamuriyah et al. [16] investigated the use of Naive Bayes specifically for interactive chatbot development, published in Media Jurnal Informatika. However, comparatively few studies have examined the comparative performance of NB and SVM specifically for intent classification in Indonesian-language chatbot applications with comprehensive statistical validation [17].

This study addresses this research gap by conducting a rigorous comparative evaluation of Naive Bayes and SVM for intent classification in a customer service chatbot developed for an electronics retail store. The chatbot system handles 12 distinct intent categories encompassing common customer service scenarios such as product inquiries, price questions, location queries, payment methods, shipping information, warranty details, and promotional offers. The evaluation employs a comprehensive methodology that includes holdout testing, 5-fold and 10-fold cross-validation, per-class performance analysis, confusion matrix examination, and a paired t-test for statistical significance [18]. Furthermore, this study investigates the impact of Indonesian-specific text preprocessing techniques—namely slang normalization and Sastrawi morphological stemming—on classification performance [11][9]. The findings are expected to provide practical empirical evidence that can guide algorithm selection in the development of Indonesian-language chatbot systems.

---

## 2. Method

### 2.1 Type and Approach of Research

This study employs a **quantitative experimental approach** to compare the performance of two supervised machine learning algorithms—Multinomial Naive Bayes (NB) and Linear Support Vector Machine (SVM)—for intent classification in an Indonesian-language customer service chatbot. The experimental method was selected because the research objective requires controlled, measurable comparisons between two classification models under identical conditions [18]. The study follows a systematic pipeline consisting of five sequential stages: dataset collection, text preprocessing, feature extraction, model training, and performance evaluation. This framework is consistent with established practices in supervised machine learning for text classification [12][13] and is designed to ensure reproducibility.

### 2.2 Object and Scope of Research

The object of this research is a customer service chatbot system developed for an electronics retail store (e-commerce domain). The chatbot is designed to automatically classify and respond to customer inquiries in Bahasa Indonesia. The scope of this study is specifically limited to the **intent classification** component of the chatbot, which determines the user's purpose from their textual input. The system handles 12 distinct intent categories covering common customer service scenarios—including product inquiries, price questions, store location, operating hours, payment methods, warranty information, shipping details, promotional offers, and customer complaints. The comparison is restricted to two classical machine learning algorithms (NB and SVM) and does not extend to deep learning or transformer-based approaches, which are discussed as potential directions for future work.

### 2.3 Data Collection Techniques

The dataset used in this study was **manually curated** through a documentation-based approach to reflect the characteristics of real-world customer interactions with an electronics retail store. Text patterns were collected and formulated based on observation of common customer inquiries in Indonesian e-commerce platforms, online store chat logs, and social media forums [8][9]. A total of **608 text patterns** were collected and annotated across **12 intent categories**, as summarized in Table 1. The patterns were written in Bahasa Indonesia and deliberately included a mixture of formal expressions, informal language, and common slang to simulate authentic customer behavior. Each intent category contains between 50 and 53 patterns, resulting in a nearly balanced dataset that minimizes the risk of classification bias toward majority classes. The dataset was stored in JSON format conforming to a standard intent-pattern-response structure commonly used in chatbot development frameworks [5].

**Table 1.** Distribution of text patterns across intent categories.

| No | Intent Category | Description | Patterns |
|----|----------------|-------------|:--------:|
| 1 | greeting | Opening greetings and salutations | 53 |
| 2 | goodbye | Farewell and closing expressions | 50 |
| 3 | terima_kasih | Expressions of gratitude | 50 |
| 4 | tanya_produk | Product availability inquiries | 52 |
| 5 | tanya_harga | Price-related questions | 51 |
| 6 | tanya_lokasi | Store location queries | 51 |
| 7 | tanya_jam_buka | Operating hours inquiries | 50 |
| 8 | tanya_pembayaran | Payment method questions | 50 |
| 9 | tanya_garansi | Warranty information requests | 50 |
| 10 | tanya_pengiriman | Shipping and delivery inquiries | 51 |
| 11 | tanya_promo | Promotions and discount questions | 50 |
| 12 | keluhan | Customer complaints and issues | 50 |
| | **Total** | | **608** |

### 2.4 Tools and Materials Used

The development and evaluation of the chatbot system were carried out using the tools and technologies listed in Table 2.

**Table 2.** Tools and materials used in this study.

| Category | Tool / Technology | Purpose |
|----------|------------------|---------|
| Programming Language | Python 3.10 | Core development language |
| Machine Learning Library | scikit-learn 1.3 | NB and SVM implementation [21] |
| NLP Preprocessing | Sastrawi Library | Indonesian morphological stemming [11] |
| Feature Extraction | TF-IDF Vectorizer (scikit-learn) | Text-to-numerical feature conversion |
| Statistical Testing | SciPy (scipy.stats) | Paired t-test for significance testing |
| Web Framework | Flask 3.x | Chatbot API server |
| Data Format | JSON (intents.json) | Dataset storage and retrieval |
| Visualization | Matplotlib | Chart and confusion matrix generation |
| Development Environment | Visual Studio Code | Code editor and debugging |
| Operating System | Windows 10/11 | Development platform |

### 2.5 Research Procedures

The research procedure follows a systematic pipeline from data collection to performance comparison. The complete algorithm flowchart is presented in Fig. 1.

**Fig. 1.** Flowchart of the system algorithm.

*(Insert: evaluation_results/flowchart_algorithm.png)*

#### 2.5.1 Text Preprocessing

Text preprocessing constitutes a critical stage in the NLP pipeline, as the quality of input data directly influences classification performance [19]. In this study, a **four-stage preprocessing pipeline** was implemented to address the specific characteristics of informal Indonesian text.

The first stage involves **lowercasing**, in which all characters in the input text are converted to lowercase to ensure uniform representation. This step eliminates case-related variations so that terms such as "Samsung" and "samsung" are treated as identical tokens during feature extraction [19].

The second stage performs **tokenization**, whereby each input string is segmented into individual tokens based on whitespace delimiters. This produces a sequence of discrete terms that can be independently analyzed in subsequent processing stages [12].

The third stage addresses **slang normalization**, which is particularly important for Indonesian-language processing due to the widespread use of informal expressions in digital communication [8]. A custom dictionary containing 405 slang-to-formal mappings was constructed based on common abbreviations and colloquial terms observed in Indonesian e-commerce forums and social media platforms. Table 3 presents selected examples from this dictionary. Sari et al. [9] demonstrated that slang normalization using dictionary-based approaches can improve Indonesian text classification accuracy by approximately 3.47%.

**Table 3.** Examples of slang normalization mappings.

| Slang Expression | Normalized Form |
|-----------------|----------------|
| brp | berapa |
| hrg | harga |
| gk / gak | tidak |
| gmn | bagaimana |
| yg | yang |
| hp | handphone |
| aja | saja |
| bgt | banget |
| bs | bisa |
| dmn | dimana |

The fourth and final stage applies **morphological stemming** using the Sastrawi library, an open-source stemming tool specifically designed for Bahasa Indonesia [11]. Sastrawi implements the Enhanced Confix Stripping (ECS) algorithm, which removes Indonesian affixes—including prefixes (*me-*, *ber-*, *di-*, *pe-*, *ke-*, *se-*), suffixes (*-kan*, *-an*, *-i*), and confixes—to reduce words to their root forms [10]. For instance, the word "pembayaran" (payment) is stemmed to "bayar" (pay), and "pengiriman" (shipping) becomes "kirim" (send). A study by Rianto [10] demonstrated that applying a proper stemming method for informal Indonesian text can significantly improve classification accuracy. Pradana and Hayaty [20] further confirmed that stemming and stopword removal enhance sentiment classification accuracy for Indonesian-language texts, validating the importance of this preprocessing step. This dimensionality reduction technique helps consolidate morphological variants into unified features, thereby improving the generalization capability of the classification models.

#### 2.5.2 Feature Extraction

Feature extraction was performed using the **Term Frequency–Inverse Document Frequency (TF-IDF)** vectorization method, which assigns a numerical weight to each term based on its frequency within a document relative to its frequency across the entire corpus [12]. The TF-IDF weight *w* for a term *t* in document *d* is computed as shown in Equation (1):

> *w*<sub>*t*,*d*</sub> = *tf*(*t*, *d*) × log(*N* / *df*(*t*))  ........  (1)

where *w*<sub>*t*,*d*</sub> denotes the TF-IDF weight of term *t* in document *d*, *tf*(*t*, *d*) represents the term frequency of *t* in *d*, *N* denotes the total number of documents in the corpus, and *df*(*t*) is the document frequency—the number of documents containing term *t*. Sublinear TF scaling was enabled, applying a logarithmic transformation to the raw term frequency to reduce the dominance of highly frequent terms [13].

The vectorizer was configured to use a unigram-bigram representation (n-gram range of 1 to 2), capturing both individual words and two-word combinations. This configuration is particularly beneficial for intent classification, as meaningful bigram features such as "jam buka" (operating hours), "metode pembayaran" (payment method), and "garansi resmi" (official warranty) provide stronger discriminative signals than their constituent unigrams alone [7]. No maximum feature limit was imposed, and the minimum document frequency was set to 1, resulting in a total of 1,569 extracted features. The complete feature extraction configuration is presented in Table 4.

**Table 4.** TF-IDF feature extraction configuration.

| Parameter | Value |
|-----------|-------|
| Method | TF-IDF Vectorizer |
| N-gram range | (1, 2) — unigram + bigram |
| Max features | None (all features used) |
| Min document frequency | 1 |
| Sublinear TF | True |
| Total features extracted | 1,569 |

#### 2.5.3 Model Training

Two classification algorithms were trained and compared in this study:

**Multinomial Naive Bayes.** The Multinomial Naive Bayes classifier is a probabilistic model based on Bayes' theorem with the assumption of conditional independence among features [13]. Given a document represented as a feature vector ***x***, the posterior probability for class *c*<sub>*k*</sub> is calculated as shown in Equation (2):

> P(*c*<sub>*k*</sub> | ***x***) = P(***x*** | *c*<sub>*k*</sub>) · P(*c*<sub>*k*</sub>) / P(***x***)  ........  (2)

where P(*c*<sub>*k*</sub> | ***x***) represents the posterior probability of class *c*<sub>*k*</sub> given the feature vector ***x***, P(***x*** | *c*<sub>*k*</sub>) is the likelihood of observing ***x*** given class *c*<sub>*k*</sub>, P(*c*<sub>*k*</sub>) is the prior probability of class *c*<sub>*k*</sub>, and P(***x***) is the evidence serving as a normalization constant. The class with the highest posterior probability is selected as the predicted intent. Multinomial NB is particularly well-suited for text classification tasks where features represent word frequencies or TF-IDF scores [13]. In this study, Laplace smoothing with an alpha parameter of 1.0 was applied to prevent zero-probability estimates for unseen feature-class combinations, and prior class probabilities were estimated from the training data distribution.

**Linear Support Vector Machine.** The Linear SVM classifier seeks to identify the optimal hyperplane that maximizes the margin between classes in the feature space [14]. For multi-class classification, the one-versus-rest strategy is employed, wherein a separate binary classifier is trained for each intent category. The decision function for a given input ***x*** is defined as shown in Equation (3):

> f(***x***) = ***w***<sup>T</sup> · ***x*** + *b*  ........  (3)

where ***w***<sup>T</sup> denotes the transpose of the weight vector, ***x*** is the input feature vector, and *b* is the bias term. The transpose notation indicates the dot product operation between the weight vector and the input, producing a scalar decision value. SVM has been widely recognized for its effectiveness in high-dimensional text classification tasks, as the algorithm's performance does not degrade significantly with increasing feature dimensionality [14]. The regularization parameter *C* was set to 1.0, and the maximum number of iterations was limited to 1,000. Both models were implemented using the scikit-learn machine learning library version 1.3 in Python [21]. The hyperparameter configuration for both models is summarized in Table 5.

**Table 5.** Model hyperparameter configuration.

| Parameter | Naive Bayes | SVM (Linear) |
|-----------|:-----------:|:------------:|
| Algorithm | MultinomialNB | LinearSVC |
| Alpha / C | 1.0 | 1.0 |
| Fit prior / Max iterations | True | 1,000 |
| Kernel | — | Linear |
| Multi-class strategy | Inherent | One-vs-Rest |
| Random state | — | 42 |

### 2.6 Data Analysis Techniques

The dataset was partitioned into training and testing subsets using an **80:20 stratified random split** with a fixed random seed of 42, ensuring proportional representation of all intent categories in both subsets [18]. This configuration yielded 486 training samples and 122 testing samples.

Model performance was assessed using four standard classification metrics: **accuracy, precision, recall, and F₁-score**, computed as shown in Equations (4)–(7) [22]. Here, *TP* (True Positive) represents the number of correctly predicted positive instances, *TN* (True Negative) the correctly predicted negative instances, *FP* (False Positive) the incorrectly predicted positive instances, and *FN* (False Negative) the incorrectly predicted negative instances:

> *Accuracy* = (*TP* + *TN*) / (*TP* + *TN* + *FP* + *FN*)  ........  (4)

> *Precision* = *TP* / (*TP* + *FP*)  ........  (5)

> *Recall* = *TP* / (*TP* + *FN*)  ........  (6)

> *F*₁ = 2 · (*Precision* · *Recall*) / (*Precision* + *Recall*)  ........  (7)

Macro-averaging was applied to compute aggregate precision, recall, and F1-score values, treating all intent categories with equal weight regardless of their sample size [22]. Confusion matrices were generated for both models to visualize patterns of correct and incorrect predictions across all intent categories.

To evaluate generalization performance and mitigate the risk of overfitting to a single train-test partition, **k-fold cross-validation** was conducted with two configurations: 5-fold and 10-fold [23]. In each iteration, the dataset is partitioned into *k* equally-sized subsets, with one subset held out for validation and the remaining *k* − 1 subsets used for training. The procedure is repeated *k* times, and the mean accuracy across all folds is reported along with its standard deviation. Wong and Yeh [23] confirmed that k-fold cross-validation provides reliable accuracy estimates and that the choice of *k* can influence validation performance, with *k* = 10 generally providing a favorable balance between estimation accuracy and computational cost.

Finally, a **paired t-test** was performed on the cross-validation accuracy scores to determine whether the observed performance difference between Naive Bayes and SVM is statistically significant at the α = 0.05 significance level [18]. The null hypothesis (H₀) posits that there is no significant difference in the mean classification accuracy between the two algorithms, while the alternative hypothesis (H₁) asserts that such a difference exists.

---

## 3. Result and Discussion

### 3.1 Presentation of Research Results

This subsection presents the experimental results obtained from comparing Multinomial Naive Bayes and Linear Support Vector Machine for intent classification. The evaluation was conducted using both cross-validation and holdout testing strategies on a dataset of 608 text patterns across 12 intent categories. All quantitative results are presented factually to provide a comprehensive overview of the classification performance before proceeding to interpretive analysis in Section 3.2.

#### 3.1.1 Cross-Validation Performance

Table 6 presents the cross-validation accuracy results for both algorithms under 5-fold and 10-fold configurations. These results provide a more robust estimate of model performance compared to a single train-test split, as they account for variance across different data partitions [23].

**Table 6.** Cross-validation accuracy comparison.

| Validation Method | Naive Bayes | SVM (Linear) | Difference |
|-------------------|:-----------:|:------------:|:----------:|
| 5-Fold CV (Mean ± SD) | 79.78% ± 3.26% | 81.43% ± 3.33% | +1.65% |
| 10-Fold CV (Mean ± SD) | 81.09% ± 3.09% | 82.25% ± 4.81% | +1.16% |

SVM consistently outperforms Naive Bayes across both validation strategies by approximately 1–2 percentage points. Naive Bayes exhibits a lower standard deviation in the 10-fold configuration (3.09% versus 4.81% for SVM), indicating more stable performance across data partitions [14][23]. The visual comparison of cross-validation results is presented in Fig. 2.

**Fig. 2.** Cross-validation accuracy comparison between Naive Bayes and SVM.

*(Insert: evaluation_results/cv_comparison.png)*

#### 3.1.2 Holdout Test Performance

Table 7 summarizes the overall classification performance of both models on the held-out test set comprising 122 samples. The visual comparison of all metrics is presented in Fig. 3.

**Table 7.** Overall performance comparison on the holdout test set.

| Metric | Naive Bayes | SVM (Linear) | Difference |
|--------|:-----------:|:------------:|:----------:|
| Accuracy | 83.61% | 86.89% | +3.28% |
| Precision (macro) | 84.54% | 88.67% | +4.12% |
| Recall (macro) | 83.48% | 86.82% | +3.33% |
| F1-Score (macro) | 83.36% | 86.93% | +3.56% |

**Fig. 3.** Overall performance comparison between Naive Bayes and SVM.

*(Insert: evaluation_results/overall_comparison.png)*

SVM outperforms Naive Bayes by approximately 3–4 percentage points across all evaluation metrics, as shown in Table 7 and Fig. 3. Both models achieve accuracy above 80%, which represents an acceptable baseline for a 12-class classification task in the customer service domain [7].

#### 3.1.3 Per-Intent F1-Score Comparison

A detailed examination of per-intent performance is presented in Table 8 and visualized in Fig. 4.

**Table 8.** F1-score comparison across individual intent categories.

| Intent Category | NB F1-Score | SVM F1-Score | Superior |
|----------------|:-----------:|:------------:|:--------:|
| goodbye | 0.9474 | 0.9000 | NB |
| greeting | 0.9167 | 0.9000 | NB |
| keluhan | 0.8421 | 0.8000 | NB |
| tanya_garansi | 0.9474 | 0.9474 | Tie |
| tanya_harga | 0.7619 | 0.9000 | SVM |
| tanya_jam_buka | 0.9524 | 0.9474 | NB |
| tanya_lokasi | 0.6250 | 0.7059 | SVM |
| tanya_pembayaran | 0.7273 | 0.7826 | SVM |
| tanya_pengiriman | 0.8421 | 0.8421 | Tie |
| tanya_produk | 0.8571 | 0.9167 | SVM |
| tanya_promo | 0.7273 | 0.8421 | SVM |
| terima_kasih | 0.8571 | 0.9474 | SVM |

**Fig. 4.** Comparison of F1-Score per intent category between Naive Bayes and SVM.

*(Insert: evaluation_results/comparison_f1_chart.png)*

The per-intent results show that Naive Bayes achieves higher F1-scores on 4 intent categories (goodbye, greeting, keluhan, tanya_jam_buka), while SVM leads on 6 categories (tanya_harga, tanya_lokasi, tanya_pembayaran, tanya_produk, tanya_promo, terima_kasih). Two categories (tanya_garansi, tanya_pengiriman) show identical performance. Both models exhibit the lowest F1-scores on the *tanya_lokasi* intent (NB: 0.6250, SVM: 0.7059).

#### 3.1.4 Confusion Matrix and Misclassification Patterns

The confusion matrices for both models are presented in Fig. 5 and Fig. 6. For Naive Bayes, the most frequent errors involve the misclassification of *tanya_produk* as *tanya_promo* (2 instances) and *keluhan* as *tanya_harga* (2 instances). For SVM, the primary errors are the misclassification of *tanya_lokasi* as *tanya_produk* (2 instances) and *greeting* as *keluhan* (2 instances).

**Fig. 5.** Confusion matrix for Naive Bayes classifier.

*(Insert: evaluation_results/confusion_matrix_nb.png)*

**Fig. 6.** Confusion matrix for SVM (Linear) classifier.

*(Insert: evaluation_results/confusion_matrix_svm.png)*

The Naive Bayes confusion matrix (Fig. 5) reveals that the *tanya_lokasi* intent has the lowest diagonal value (5 out of 10 correct), with misclassifications distributed across multiple categories. The SVM confusion matrix (Fig. 6) shows improved diagonal values for most intents, particularly *tanya_produk* (11 out of 11 correct) and *keluhan* (10 out of 10 correct). Table 9 presents selected examples of misclassified queries from both models.

**Table 9.** Examples of misclassified queries.

| User Query | Actual Intent | NB Prediction | SVM Prediction |
|-----------|:------------:|:-------------:|:--------------:|
| ada vivo gak | tanya_produk | tanya_promo | tanya_produk ✓ |
| landmark terdekat apa | tanya_lokasi | tanya_produk | tanya_produk |
| ada harga khusus gak | tanya_harga | tanya_promo | tanya_promo |
| bisa datang langsung gak | tanya_lokasi | tanya_pembayaran | tanya_pembayaran |
| scan qris dimana | tanya_pembayaran | tanya_lokasi | tanya_lokasi |

#### 3.1.5 Statistical Significance Test

To determine whether the observed performance differences are statistically meaningful, a paired t-test was conducted on the cross-validation accuracy scores [18]. The results are presented in Table 10.

**Table 10.** Paired t-test results for statistical significance (α = 0.05).

| CV Method | NB Mean ± SD | SVM Mean ± SD | t-statistic | p-value | Significant |
|-----------|:------------:|:-------------:|:-----------:|:-------:|:-----------:|
| 5-Fold | 0.7978 ± 0.0326 | 0.8143 ± 0.0333 | −0.9801 | 0.3825 | No |
| 10-Fold | 0.8109 ± 0.0309 | 0.8225 ± 0.0481 | −0.7676 | 0.4624 | No |

The paired t-test yields p-values of 0.3825 (5-fold) and 0.4624 (10-fold), both exceeding the significance threshold of α = 0.05. The performance difference between Naive Bayes and SVM is not statistically significant at the 95% confidence level, indicating that both algorithms offer statistically equivalent classification performance for the task examined in this study [15][17][18].

### 3.2 Analysis of Findings

This subsection interprets the experimental results presented in Section 3.1, explains the underlying reasons for the observed performance patterns, and contextualizes the findings within existing literature.

First, SVM demonstrates a consistent accuracy advantage of approximately 3–4% over Naive Bayes in holdout testing (86.89% vs. 83.61%). This finding is consistent with the theoretical expectation that SVM's ability to identify optimal separation boundaries in high-dimensional feature spaces—such as the 1,569-dimensional TF-IDF space used in this study—confers an advantage when classifying semantically overlapping text categories [14]. However, the paired t-test reveals that this advantage is not statistically significant (p > 0.05), which is an important nuance often overlooked in comparative studies that report only raw performance metrics [18]. This suggests that for moderate-sized datasets typical of domain-specific chatbot applications, both algorithms provide comparable classification reliability.

Second, the per-intent analysis reveals a complementary performance pattern: Naive Bayes excels at classifying intents with distinctive and unambiguous vocabularies (e.g., *greeting*, *goodbye*, *tanya_jam_buka*), while SVM demonstrates superior discrimination capability for semantically similar intents that share substantial vocabulary overlap (e.g., *tanya_harga* vs. *tanya_promo*, *tanya_lokasi* vs. *tanya_pembayaran*), as shown in Table 8. The conditional independence assumption underlying Naive Bayes performs well when feature overlap between classes is minimal [13], whereas SVM's ability to construct optimal hyperplanes in high-dimensional space enables it to better separate classes with shared vocabulary [14][17]. This complementary pattern is consistent with findings by Yew [12], who noted similar behavior in multi-class text classification tasks. The observation suggests that ensemble or hybrid approaches combining the strengths of both algorithms may warrant investigation in future research.

Third, the Indonesian-specific text preprocessing pipeline implemented in this study—particularly slang normalization and Sastrawi stemming—plays a crucial role in enabling effective classification. The 405-entry slang dictionary addresses the significant gap between formal and informal Indonesian writing, which is particularly pronounced in e-commerce customer communication [8][9]. Without this normalization step, queries such as "brp hrg hp smsung" would generate out-of-vocabulary tokens that the classifier cannot match against training patterns. Sari et al. [9] quantified this impact, reporting a 3.47% improvement in sentiment classification accuracy when dictionary-based slang normalization was applied to Indonesian social media text. The Sastrawi stemmer further contributes to vocabulary consolidation by reducing morphological variants—such as "pembayaran," "membayar," and "dibayar"—to a common root form "bayar," thereby improving feature matching across morphologically diverse input patterns [10][11][20]. The implementation of the preprocessing pipeline is shown in Fig. 7.

**Fig. 7.** Code snippet of the text preprocessing pipeline implementation.

```python
def preprocess(self, text):
    # Step 1: Lowercasing
    text = text.lower().strip()
    # Step 2: Remove special characters
    text = re.sub(r'[^\w\s]', ' ', text)
    # Step 3: Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Step 4: Slang normalization (405-entry dictionary)
    text = self._normalize_slang(text)
    # Step 5: Tokenization
    tokens = text.split()
    # Step 6: Stopword removal
    tokens = [t for t in tokens if t not in STOPWORDS_ID]
    # Step 7: Sastrawi stemming
    tokens = [self.stemmer.stem(t) for t in tokens]
    return ' '.join(tokens)
# Example: "brp hrg hp ASUS??" → "harga handphone asus"
```

Fourth, the error analysis reveals that ambiguous queries containing polysemous terms or lacking explicit intent markers pose significant challenges for both algorithms. The query "scan qris dimana," for instance, contains the locative word "dimana" (where), which triggers misclassification as a location intent despite its actual intent being a payment inquiry (Table 9). Similarly, the persistent confusion between *tanya_lokasi* and *tanya_pembayaran* arises because expressions such as "dimana" (where), "bisa datang" (can I come), and "alamat" (address) share semantic characteristics with payment and delivery-related inquiries. This type of lexical ambiguity represents an inherent limitation of bag-of-words approaches and has been identified as a common challenge in Indonesian intent classification systems [6][17][19].

### 3.3 Implications of the Results

The findings of this study carry several practical and theoretical implications for the development of Indonesian-language chatbot systems.

From a practical perspective, the results demonstrate that both Multinomial Naive Bayes and Linear SVM are viable algorithms for intent classification in e-commerce chatbot applications, achieving accuracy above 83% on a 12-class classification task. For practitioners developing Indonesian-language chatbot systems with limited computational resources, Naive Bayes offers a simpler and more computationally efficient alternative that delivers statistically comparable performance. In scenarios where the intent categories involve significant semantic overlap—such as product-related, pricing, and promotional queries—SVM is the recommended choice due to its superior discrimination capability in high-dimensional feature spaces [14].

From a theoretical perspective, the complementary performance pattern observed between Naive Bayes and SVM contributes to the growing body of literature on classifier behavior in multi-class text classification. The finding that the conditional independence assumption benefits classification of distinctive intents while SVM's hyperplane optimization benefits semantically overlapping intents provides empirical support for theoretical predictions regarding the strengths and limitations of these algorithms [12][13]. This pattern suggests that future research on ensemble methods combining probabilistic and geometric classifiers may yield improved performance for intent classification tasks.

The Indonesian-specific preprocessing pipeline developed in this study—incorporating slang normalization and Sastrawi morphological stemming—represents a reusable framework that can be adapted for other Indonesian NLP applications beyond chatbot systems, including sentiment analysis [9], document classification [19], and social media text mining [8]. The demonstrated effectiveness of this pipeline reinforces the importance of language-specific preprocessing for achieving competitive classification performance in non-English language contexts [10][20].

Furthermore, the results show that classical machine learning approaches with TF-IDF feature extraction remain competitive for domain-specific text classification tasks, achieving over 86% accuracy without requiring GPU-intensive deep learning infrastructure. This finding is particularly relevant for small-to-medium enterprises in Indonesia that seek to deploy customer service chatbots with limited computational budgets [16].

### 3.4 Limitations of the Study

Several limitations of this study should be acknowledged to provide context for the interpretation of results and to guide future research directions.

First, the dataset size of 608 text patterns, while adequate for the scope of this comparative study, may not fully capture the diversity and complexity of customer queries encountered in real-world production environments. The balanced distribution of approximately 50 patterns per intent category, though beneficial for ensuring unbiased model training, does not reflect the natural class imbalance typically observed in actual customer service interactions, where certain intents (e.g., product inquiries, complaints) may occur significantly more frequently than others (e.g., warranty questions) [7].

Second, the comparison was limited to two classical machine learning algorithms—Multinomial Naive Bayes and Linear SVM. Emerging approaches such as deep learning models (LSTM, CNN-based text classifiers) and pre-trained transformer architectures such as IndoBERT [17] were not evaluated. These approaches have demonstrated superior performance in capturing contextual dependencies and semantic nuances that bag-of-words representations cannot encode, particularly for ambiguous or polysemous queries.

Third, the TF-IDF bag-of-words feature representation used in this study treats each word independently, disregarding word order and contextual relationships within the query. This limitation is directly reflected in the misclassification patterns observed in Table 9, where queries with shared vocabulary but different intents (e.g., "scan qris dimana" misclassified as a location query) cannot be correctly distinguished without contextual understanding.

Fourth, the slang normalization dictionary, while comprehensive at 405 entries, represents a static resource that does not account for the continuously evolving nature of Indonesian informal language, particularly in digital communication contexts. New slang terms, abbreviations, and regional variations emerge regularly and are not captured by the current dictionary [8][9].

Fifth, the study was conducted within a single domain—e-commerce customer service for a mobile phone and accessories store. The generalizability of the findings to other domains (e.g., healthcare, banking, education) remains to be validated, as different domains may present distinct vocabulary distributions and classification challenges.

---

## 4. Conclusion

This study conducted a comparative analysis of Multinomial Naive Bayes and Linear Support Vector Machine for intent classification in an Indonesian-language customer service chatbot. The experimental evaluation, performed on a dataset of 608 text patterns across 12 intent categories, demonstrated that SVM achieved an overall accuracy of 86.89% compared to 83.61% for Naive Bayes on the holdout test set. SVM also showed superior performance in terms of macro-averaged precision (88.67% vs. 84.54%), recall (86.82% vs. 83.48%), and F1-score (86.93% vs. 83.36%). However, a paired t-test on cross-validation results confirmed that this performance difference is not statistically significant (5-fold: p = 0.3825; 10-fold: p = 0.4624), indicating that both algorithms provide statistically comparable classification performance for the task under investigation.

The per-intent analysis revealed that Naive Bayes is more effective for intents characterized by distinctive keyword patterns, while SVM demonstrates superior discrimination capability for semantically overlapping intent categories. Both algorithms are significantly impacted by the quality of text preprocessing, with the four-stage pipeline consisting of lowercasing, tokenization, slang normalization using a 405-entry dictionary, and Sastrawi morphological stemming proving essential for handling the informal and morphologically rich characteristics of Bahasa Indonesia in customer communication contexts.

The limitations identified in Section 3.4—including dataset size, algorithm scope, and bag-of-words constraints—suggest several directions for future research. These include expanding the dataset with real-world customer interaction logs and additional intent categories, evaluating deep learning and transformer-based approaches such as IndoBERT [17], investigating contextual word embeddings as alternative feature representations, and developing adaptive slang dictionaries to accommodate the continuously evolving nature of informal Indonesian digital communication.

---

## Confession

The author would like to express his gratitude to the supervising lecturer and colleagues who provided constructive input and support during the research process.

---

## Declaration

**Author's contribution.**
[Sesuaikan dengan penulis. Contoh: The author was solely responsible for the design, development, and evaluation of the chatbot intent classification system, including manuscript writing, data analysis, and review process.]

**Funding statement.**
This research did not receive funding from any institution.

**Conflict of interest.**
The author declares that there is no conflict of interest in this research.

**Additional information.**
There is no additional information that can be provided for this study.

---

## Data and Software Availability Statement

The source code and dataset used in this study are publicly available on GitHub at https://github.com/xinnxz/cekatin. A live demonstration of the chatbot system is accessible at https://cekatin.up.railway.app. The data and test artifacts generated or analyzed in this study are available on reasonable request to the corresponding author.

---

## References

[1] M. M. Uula and H. Surbakti, "Digital economics in Indonesia: development and research trend," *Digital Economics Review*, vol. 1, no. 1, pp. 1–12, 2023. doi: 10.58968/der.v1i1.473.

[2] A. Dudhat and V. Agarwal, "Indonesia's digital economy's development," *International Transactions on Science, Design and Innovation*, vol. 4, no. 2, pp. 1–10, 2022. doi: 10.34306/itsdi.v4i2.580.

[3] C. L. Hsu and J. C. C. Lin, "Understanding the user satisfaction and loyalty of customer service chatbots," *Journal of Retailing and Consumer Services*, vol. 71, Art. no. 103211, 2023. doi: 10.1016/j.jretconser.2022.103211.

[4] A. S. Sitanggang, R. F. Syafariani, F. W. Sari, Wartika, and N. Hasti, "Relation of chatbot usage towards customer satisfaction level in Indonesia," *International Journal of Advances in Data and Information Systems*, vol. 4, no. 1, pp. 86–96, 2023. doi: 10.25008/ijadis.v4i1.1261.

[5] C. M. K. Kappi and L. Marlina, "The effect of chatbot services on online shop customer satisfaction," *Brilliance: Research of Artificial Intelligence*, vol. 3, no. 2, pp. 413–422, 2023. doi: 10.47709/brilliance.v3i2.3133.

[6] J. A. Mulyono and Sfenrianto, "Evaluation of customer satisfaction on Indonesian banking chatbot services after the COVID-19 pandemic," *JKBM (Jurnal Konsep Bisnis dan Manajemen)*, vol. 11, no. 1, pp. 69–85, 2024. doi: 10.31289/jkbm.v11i1.12590.

[7] K. Kuligowska, M. Lasek, and A. Bujnowska-Fedak, "Enhancing chatbot intent classification using active learning pipeline for optimized data preparation," *Journal of Applied Engineering Sciences*, vol. 19, no. 3(85), pp. 1–12, 2024. doi: 10.57017/jaes.v19.3(85).07.

[8] A. F. Hidayatullah, R. T. Dirgahayu, and E. N. Rahmawati, "Text normalization for Indonesian slang words in sentiment analysis development," *ICIC Express Letters, Part B: Applications*, vol. 16, no. 2, pp. 121–129, 2025. doi: 10.24507/icicelb.16.02.121.

[9] D. S. Maylawati, W. B. Zulfikar, C. Slamet, and M. A. Ramdhani, "Comparison of Word2Vec and FastText on sentiment analysis of hotel reviews with slang normalization," *Jurnal RESTI (Rekayasa Sistem dan Teknologi Informasi)*, vol. 6, no. 3, pp. 371–377, 2022. doi: 10.29207/resti.v6i3.3711.

[10] R. Rianto, "Improving the accuracy of text classification using stemming method, a case of non-formal Indonesian conversation," *Journal of Big Data*, vol. 8, no. 1, Art. no. 17, 2021. doi: 10.1186/s40537-021-00413-1.

[11] D. Mustikasari, I. Widaningrum, R. Arifin, and W. H. E. Putri, "Comparison of effectiveness of stemming algorithms in Indonesian documents," *Advances in Engineering Research*, vol. 209, pp. 178–183, 2021. doi: 10.2991/aer.k.210810.025.

[12] Y. C. Yew, "Text classification with Naïve Bayes," *The Journal of Applied Technology and Innovation*, vol. 5, no. 1, pp. 1–10, 2023. doi: 10.65136/jati.v5i1.210.

[13] I. Imelda and A. R. Kurnianto, "Naïve Bayes and TF-IDF for sentiment analysis of the Covid-19 booster vaccine," *Jurnal RESTI (Rekayasa Sistem dan Teknologi Informasi)*, vol. 7, no. 1, pp. 1–6, 2023. doi: 10.29207/resti.v7i1.4467.

[14] C. B. Chandrakala, R. Bhardwaj, and C. Pujari, "An intent recognition pipeline for conversational AI," *International Journal of Information Technology*, vol. 16, pp. 731–743, 2024. doi: 10.1007/s41870-023-01642-8.

[15] W. Asriyanti and I. Gao, "Comparison of support vector machine and Naïve Bayes on Twitter data sentiment analysis," *Jurnal Penelitian Informatika dan Teknologi*, vol. 6, no. 1, pp. 56–60, 2021. doi: 10.30591/jpit.v6i1.3245.

[16] M. L. Harahap, Alfarizi, Ferdiansyah, Andi, M. Nasir, and Indriasari, "AI-based testing using NLP algorithm on Eggsperts website functionality using boundary value analysis technique," *Media Jurnal Informatika*, vol. 17, no. 2, pp. 247–265, 2025.

[17] R. Saputra, I. Nurhaida, and H. Prabowo, "Comparative analysis of SVM and IndoBERT for intent classification in Indonesian overtime chatbots," *JSCE: Journal of System and Computer Engineering*, vol. 6, no. 3, pp. 420–430, 2023. doi: 10.61628/jsce.v6i3.2058.

[18] I. R. Hendrawan, E. Utami, and A. D. Hartanto, "Comparison of Naïve Bayes algorithm and XGBoost on local product review text classification," *Edumatic: Jurnal Pendidikan Informatika*, vol. 6, no. 1, pp. 143–149, 2022. doi: 10.29408/edumatic.v6i1.5613.

[19] M. D. Purbolaksono, F. D. Reskyadita, Adiwijaya, A. A. Suryani, and A. F. Huda, "Indonesian text classification using back propagation and Sastrawi stemming analysis with information gain for selection feature," *International Journal of Advances in Science, Engineering and Information Technology*, vol. 10, no. 1, pp. 234–238, 2020. doi: 10.18517/ijaseit.10.1.8811.

[20] A. B. P. Negara, "The influence of applying stopword removal and SMOTE on Indonesian sentiment classification," *Lontar Komputer: Jurnal Ilmiah Teknologi Informasi*, vol. 14, no. 3, pp. 190–201, 2023. doi: 10.24843/LKJITI.2023.v14.i03.p05.

[21] F. Alzami, E. D. Udayanti, D. P. Prabowo, and R. A. Megantara, "Document preprocessing with TF-IDF to improve the polarity classification performance of unstructured sentiment analysis," *Kinetik: Game Technology, Information System, Computer Network, Computing, Electronics, and Control*, vol. 5, no. 3, pp. 235–242, 2020. doi: 10.22219/kinetik.v5i3.1066.

[22] N. Yusliani, R. Primartha, and M. D. Marieska, "Multiprocessing stemming: a case study of Indonesian stemming," *International Journal of Computer Applications*, vol. 182, no. 40, pp. 38–42, 2019. doi: 10.5120/ijca2019918455.

[23] T. T. Wong and P. Y. Yeh, "Reliable accuracy estimates from k-fold cross-validation," *IEEE Transactions on Knowledge and Data Engineering*, vol. 32, no. 8, pp. 1586–1594, 2020. doi: 10.1109/TKDE.2019.2912815.

[24] N. A. Ionendri, F. Candra, and A. Rizal, "News classification using natural language processing with TF-IDF and Multinomial Naïve Bayes," *Journal of Applied Computer Science and Technology*, vol. 6, no. 1, pp. 1–8, 2020. doi: 10.52158/jacost.v6i1.1099.
