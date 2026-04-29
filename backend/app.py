from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
from pathlib import Path

# NEW imports for disease detection
import io
import json
import numpy as np
from PIL import Image
import tensorflow as tf

from backend.weather_utils import generate_weather_advisory

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------- Crop Recommendation Model ----------
CROP_MODEL_PATH = BASE_DIR / "models" / "crop_recommendation_model.pkl"
FEATURES_PATH = BASE_DIR / "models" / "feature_columns.pkl"

crop_model = joblib.load(CROP_MODEL_PATH)
feature_columns = joblib.load(FEATURES_PATH)

# ---------- Disease Detection Model ----------
DISEASE_MODEL_PATH = BASE_DIR / "models" / "plant_disease_model.keras"
CLASS_PATH = BASE_DIR / "models" / "plant_disease_class_names.json"

disease_model = tf.keras.models.load_model(DISEASE_MODEL_PATH)

with open(CLASS_PATH, "r") as f:
    disease_class_names = json.load(f)

IMG_SIZE = (224, 224)


def preprocess_image(file_bytes):
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    image = image.resize(IMG_SIZE)
    image = np.array(image, dtype=np.float32)
    image = np.expand_dims(image, axis=0)
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    return image


# ---------- Routes ----------

@app.route("/")
def home():
    return jsonify({"message": "Smart Agriculture API is running"})


# Crop recommendation
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        input_data = pd.DataFrame([{
            "N": float(data["N"]),
            "P": float(data["P"]),
            "K": float(data["K"]),
            "temperature": float(data["temperature"]),
            "humidity": float(data["humidity"]),
            "ph": float(data["ph"]),
            "rainfall": float(data["rainfall"])
        }])

        input_data = input_data[feature_columns]

        prediction = crop_model.predict(input_data)[0]
        probabilities = crop_model.predict_proba(input_data)[0]
        classes = crop_model.classes_

        top_3 = sorted(
            zip(classes, probabilities),
            key=lambda x: x[1],
            reverse=True
        )[:3]

        top_3_predictions = [
            {"crop": crop, "probability": round(float(prob), 4)}
            for crop, prob in top_3
        ]

        return jsonify({
            "predicted_crop": prediction,
            "top_3_predictions": top_3_predictions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Weather advisory
@app.route("/weather-advisory", methods=["POST"])
def weather_advisory():
    try:
        data = request.get_json()
        city = data.get("city")

        if not city:
            return jsonify({"error": "City is required"}), 400

        result = generate_weather_advisory(city)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Disease detection
@app.route("/predict-disease", methods=["POST"])
def predict_disease():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        image = preprocess_image(file.read())
        preds = disease_model.predict(image, verbose=0)[0]
        pred_idx = int(np.argmax(preds))
        confidence = float(np.max(preds))
        predicted_class = disease_class_names[pred_idx]

        return jsonify({
            "disease": predicted_class,
            "confidence": round(confidence, 4),
            "success": True
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500


if __name__ == "__main__":
    app.run(debug=True)