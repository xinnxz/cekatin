---
description: Workflow development CekatIn dengan auto-run commands
---

// turbo-all

## Development Workflow

1. Install dependencies
```bash
pip install -r requirements.txt
```

2. Run Flask server
```bash
python app.py
```

3. Retrain NLP model
```bash
curl -X POST http://localhost:5000/api/retrain
```

4. Run evaluasi
```bash
python evaluate.py
```

5. Git add & commit
```bash
git add -A && git commit -m "update"
```

6. Push ke GitHub
```bash
git push origin main
```
