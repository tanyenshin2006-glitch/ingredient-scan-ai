#!/usr/bin/env python3
"""
Fine-tune BGE-M3 on supplement ingredient synonyms.
Tested on RunPod: RTX 4090 / A100 40 GB / A100 80 GB.

── UPLOAD TO RUNPOD ──────────────────────────────────────────
  training_pairs.jsonl    (next to this file)
  finetune.py             (this file)

── RUN ───────────────────────────────────────────────────────
  python finetune.py

── DOWNLOAD ──────────────────────────────────────────────────
  tar -czf bge-m3-ingredients.tar.gz output/bge-m3-ingredients/final
  # Download that archive, then on your local machine:
  # ollama create bge-m3-ingredients -f Modelfile   (see bottom of this file)
──────────────────────────────────────────────────────────────
"""

import subprocess, sys, json
from pathlib import Path

# ── Config ────────────────────────────────────────────────────
BASE_MODEL   = "BAAI/bge-m3"
TRAIN_FILE   = Path("training_pairs.jsonl")
OUTPUT_DIR   = Path("output/bge-m3-ingredients")

EPOCHS       = 5
BATCH_SIZE   = 32    # bump to 64 on A100 80 GB
LR           = 2e-5
WARMUP_RATIO = 0.1
FP16         = True  # set False if bf16 GPU (A100/H100); set bf16=True instead
# ─────────────────────────────────────────────────────────────


def pip(*packages: str) -> None:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *packages])


print("── Installing deps ──────────────────────────────────────")
pip("sentence-transformers>=3.3", "datasets>=2.20", "accelerate>=0.30")

from sentence_transformers import (  # noqa: E402
    SentenceTransformer,
    SentenceTransformerTrainer,
    SentenceTransformerTrainingArguments,
)
from sentence_transformers.losses import MultipleNegativesRankingLoss  # noqa: E402
from datasets import Dataset  # noqa: E402


# ── Load training pairs ───────────────────────────────────────
print(f"\n── Loading {TRAIN_FILE} ──────────────────────────────────")

rows = []
skipped = 0
with open(TRAIN_FILE) as f:
    for raw in f:
        p       = json.loads(raw)
        query   = p["query"]
        pos     = p["pos"][0]
        negs    = p.get("neg", [])
        if not negs:
            skipped += 1
            continue
        for neg in negs:
            rows.append({"anchor": query, "positive": pos, "negative": neg})

dataset = Dataset.from_list(rows)
pair_count = len(rows) // max(1, 2)  # rough pair count assuming 2 negs each
print(f"  {len(dataset):,} training rows  (~{pair_count:,} unique pairs × 2 hard negatives)")
if skipped:
    print(f"  {skipped} pairs skipped (no negatives)")


# ── Model & loss ──────────────────────────────────────────────
print(f"\n── Loading {BASE_MODEL} ─────────────────────────────────")
model = SentenceTransformer(BASE_MODEL)
loss  = MultipleNegativesRankingLoss(model)


# ── Training args ─────────────────────────────────────────────
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

args = SentenceTransformerTrainingArguments(
    output_dir                  = str(OUTPUT_DIR),
    num_train_epochs            = EPOCHS,
    per_device_train_batch_size = BATCH_SIZE,
    learning_rate               = LR,
    warmup_ratio                = WARMUP_RATIO,
    fp16                        = FP16,
    bf16                        = False,
    save_strategy               = "epoch",
    save_total_limit            = 2,
    logging_steps               = 20,
    dataloader_num_workers      = 2,
    run_name                    = "bge-m3-ingredients",
)


# ── Train ─────────────────────────────────────────────────────
print("\n── Training ─────────────────────────────────────────────")
trainer = SentenceTransformerTrainer(
    model         = model,
    args          = args,
    train_dataset = dataset,
    loss          = loss,
)
trainer.train()


# ── Save ──────────────────────────────────────────────────────
final = OUTPUT_DIR / "final"
model.save_pretrained(str(final))

print(f"""
── Done ─────────────────────────────────────────────────────
Model saved → {final}

Next steps:
  1. Pack it up:
       tar -czf bge-m3-ingredients.tar.gz {OUTPUT_DIR}/final

  2. Download to local machine.

  3. Convert to GGUF (on local machine, requires llama.cpp):
       python llama.cpp/convert_hf_to_gguf.py output/bge-m3-ingredients/final \\
           --outtype q8_0 \\
           --outfile bge-m3-ingredients-q8.gguf

  4. Create Modelfile:
       FROM ./bge-m3-ingredients-q8.gguf

  5. Register with Ollama:
       ollama create bge-m3-ingredients -f Modelfile

  6. Update OLLAMA_MODEL in .env.local and re-embed the DB.
─────────────────────────────────────────────────────────────
""")
