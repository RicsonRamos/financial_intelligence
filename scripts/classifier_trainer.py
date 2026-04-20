import json
import sys
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import pickle
import os

def train_model(data_path, model_output_path):
    if not os.path.exists(data_path):
        print(f"Error: Data file {data_path} not found.")
        return

    with open(data_path, 'r') as f:
        data = json.load(f)

    if len(data) < 5:
        print("Insufficient data for training. Need at least 5 corrected transactions.")
        return

    descriptions = [item['description'] for item in data]
    categories = [item['category_name'] for item in data]

    # Simple NLP Pipeline
    pipeline = Pipeline([
        ('vectorizer', CountVectorizer(ngram_range=(1, 2))),
        ('classifier', RandomForestClassifier(n_estimators=100))
    ])

    print(f"Training on {len(data)} samples...")
    pipeline.fit(descriptions, categories)

    with open(model_output_path, 'wb') as f:
        pickle.dump(pipeline, f)
    
    print(f"Model saved to {model_output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python classifier_trainer.py <data_json> <model_pkl>")
        sys.exit(1)
    
    train_model(sys.argv[1], sys.argv[2])
