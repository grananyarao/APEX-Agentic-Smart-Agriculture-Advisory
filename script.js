const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  },
  { threshold: 0.15 }
);

reveals.forEach((el) => observer.observe(el));

const glow = document.querySelector(".cursor-glow");

window.addEventListener("mousemove", (e) => {
  if (glow) {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  }
});

// --- Demo form → Flask API prediction ---
const cropForm = document.getElementById("crop-form");
const predictedCropEl = document.getElementById("predicted-crop");
const top3ListEl = document.getElementById("top3-list");
const demoErrorEl = document.getElementById("demo-error");
const demoHintEl = document.querySelector(".demo-hint");

if (cropForm) {
  cropForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (demoErrorEl) demoErrorEl.textContent = "";
    if (demoHintEl) {
      demoHintEl.textContent = "Contacting Agentic AI decision engine...";
    }

    const formData = new FormData(cropForm);
    const payload = {
      N: parseFloat(formData.get("N")),
      P: parseFloat(formData.get("P")),
      K: parseFloat(formData.get("K")),
      temperature: parseFloat(formData.get("temperature")),
      humidity: parseFloat(formData.get("humidity")),
      ph: parseFloat(formData.get("ph")),
      rainfall: parseFloat(formData.get("rainfall")),
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Prediction request failed");
      }

      const data = await response.json();

      if (predictedCropEl) {
        predictedCropEl.textContent = data.predicted_crop || "—";
      }

      if (top3ListEl) {
        top3ListEl.innerHTML = "";

        (data.top_3_predictions || []).forEach((item) => {
          const li = document.createElement("li");

          const nameSpan = document.createElement("span");
          const probSpan = document.createElement("span");

          nameSpan.textContent = item.crop;
          probSpan.textContent = `${(item.probability * 100).toFixed(2)}%`;

          li.appendChild(nameSpan);
          li.appendChild(probSpan);
          top3ListEl.appendChild(li);
        });
      }

      if (demoHintEl) {
        if (!data.top_3_predictions || data.top_3_predictions.length === 0) {
          demoHintEl.textContent = "Prediction received.";
        } else {
          demoHintEl.textContent =
            "Prediction received. Here are the top crops by confidence.";
        }
      }
    } catch (err) {
      console.error(err);

      if (demoErrorEl) {
        demoErrorEl.textContent =
          err.message || "Something went wrong. Please try again.";
      }

      if (demoHintEl) {
        demoHintEl.textContent = "Unable to get prediction.";
      }

      if (predictedCropEl) {
        predictedCropEl.textContent = "—";
      }

      if (top3ListEl) {
        top3ListEl.innerHTML = "";
      }
    }
  });
}

// --- Weather form → Flask API weather advisory ---
const weatherForm = document.getElementById("weather-form");
const weatherErrorEl = document.getElementById("weather-error");
const weatherHintEl = document.querySelector(".weather-hint");

const weatherCityEl = document.getElementById("weather-city");
const weatherDescEl = document.getElementById("weather-description");
const weatherTempEl = document.getElementById("weather-temp");
const weatherHumidityEl = document.getElementById("weather-humidity");
const weatherPressureEl = document.getElementById("weather-pressure");
const weatherWindEl = document.getElementById("weather-wind");
const irrigationAdviceEl = document.getElementById("irrigation-advice");
const weatherAdviceEl = document.getElementById("weather-advice");

if (weatherForm) {
  weatherForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (weatherErrorEl) weatherErrorEl.textContent = "";
    if (weatherHintEl) {
      weatherHintEl.textContent = "Fetching live weather and advisory...";
    }

    const formData = new FormData(weatherForm);
    const city = (formData.get("city") || "").toString().trim();

    if (!city) {
      if (weatherErrorEl) {
        weatherErrorEl.textContent = "Please enter a city.";
      }

      if (weatherHintEl) {
        weatherHintEl.textContent =
          "Enter a valid city name to retrieve weather information.";
      }

      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/weather-advisory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ city }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Weather request failed");
      }

      const data = await response.json();

      if (weatherCityEl) {
        weatherCityEl.textContent = `${data.city}, ${data.country}`;
      }

      if (weatherDescEl) {
        weatherDescEl.textContent = data.weather_description || "—";
      }

      if (weatherTempEl) {
        weatherTempEl.textContent =
          data.temperature !== undefined ? Number(data.temperature).toFixed(1) : "—";
      }

      if (weatherHumidityEl) {
        weatherHumidityEl.textContent =
          data.humidity !== undefined ? `${data.humidity}%` : "—";
      }

      if (weatherPressureEl) {
        weatherPressureEl.textContent =
          data.pressure !== undefined ? `${data.pressure} hPa` : "—";
      }

      if (weatherWindEl) {
        weatherWindEl.textContent =
          data.wind_speed !== undefined ? `${data.wind_speed} m/s` : "—";
      }

      if (irrigationAdviceEl) {
        irrigationAdviceEl.textContent =
          data.irrigation_advice || "No irrigation advice available.";
      }

      if (weatherAdviceEl) {
        weatherAdviceEl.textContent =
          data.weather_advice || "No weather advisory available.";
      }

      if (weatherHintEl) {
        weatherHintEl.textContent = "Weather and advisory updated.";
      }
    } catch (err) {
      console.error(err);

      if (weatherErrorEl) {
        weatherErrorEl.textContent =
          err.message || "Something went wrong. Please try again.";
      }

      if (weatherHintEl) {
        weatherHintEl.textContent = "Unable to fetch weather information.";
      }

      if (weatherCityEl) weatherCityEl.textContent = "—";
      if (weatherDescEl) weatherDescEl.textContent = "—";
      if (weatherTempEl) weatherTempEl.textContent = "—";
      if (weatherHumidityEl) weatherHumidityEl.textContent = "—";
      if (weatherPressureEl) weatherPressureEl.textContent = "—";
      if (weatherWindEl) weatherWindEl.textContent = "—";
      if (irrigationAdviceEl) irrigationAdviceEl.textContent = "—";
      if (weatherAdviceEl) weatherAdviceEl.textContent = "—";
    }
  });
}

// --- Disease Detection → Flask API image prediction ---
const diseaseForm = document.getElementById("disease-form");
const fileDrop = document.getElementById("file-drop");
const leafFileInput = document.getElementById("leaf-file");
const previewImage = document.getElementById("preview-image");
const previewPlaceholder = document.querySelector(".preview-placeholder");
const diseaseErrorEl = document.getElementById("disease-error");
const diseaseNameEl = document.getElementById("disease-name");
const diseaseConfidenceEl = document.getElementById("disease-confidence");
const diseaseAdviceTextEl = document.getElementById("disease-advice");
const diseaseHintEl = document.querySelector(".disease-hint");

function updateImagePreview(file) {
  if (!file) {
    if (previewImage) {
      previewImage.style.display = "none";
      previewImage.removeAttribute("src");
    }
    if (previewPlaceholder) {
      previewPlaceholder.style.display = "block";
    }
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    if (previewImage) {
      previewImage.src = event.target.result;
      previewImage.style.display = "block";
    }
    if (previewPlaceholder) {
      previewPlaceholder.style.display = "none";
    }
  };
  reader.readAsDataURL(file);
}

function getDiseaseAdvice(label) {
  const value = (label || "").toLowerCase();

  if (value.includes("healthy")) {
    return "Leaf looks healthy. Continue regular monitoring, balanced irrigation, and proper field hygiene.";
  }

  if (value.includes("early_blight") || value.includes("early blight")) {
    return "Possible early blight detected. Remove affected leaves, avoid overhead irrigation, and follow recommended fungicide guidance from local agriculture experts.";
  }

  if (value.includes("late_blight") || value.includes("late blight")) {
    return "Possible late blight detected. Isolate infected plants quickly, reduce leaf wetness, and consult an agronomist for urgent disease-control measures.";
  }

  return "Disease detected. Please verify with an agriculture expert before applying treatment.";
}

if (fileDrop && leafFileInput) {
  fileDrop.addEventListener("click", () => {
    leafFileInput.click();
  });

  leafFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    updateImagePreview(file);
  });

  fileDrop.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileDrop.classList.add("file-drop--active");
  });

  fileDrop.addEventListener("dragleave", () => {
    fileDrop.classList.remove("file-drop--active");
  });

  fileDrop.addEventListener("drop", (e) => {
    e.preventDefault();
    fileDrop.classList.remove("file-drop--active");

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      if (file.type.startsWith("image/")) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        leafFileInput.files = dataTransfer.files;
        updateImagePreview(file);
      } else {
        if (diseaseErrorEl) {
          diseaseErrorEl.textContent = "Please upload a valid image file.";
        }
      }
    }
  });
}

if (diseaseForm) {
  diseaseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (diseaseErrorEl) diseaseErrorEl.textContent = "";
    if (diseaseHintEl) {
      diseaseHintEl.textContent = "Analyzing leaf image with disease detection model...";
    }

    const file = leafFileInput?.files?.[0];

    if (!file) {
      if (diseaseErrorEl) {
        diseaseErrorEl.textContent = "Please select a leaf image first.";
      }
      if (diseaseHintEl) {
        diseaseHintEl.textContent = "Upload an image to run disease detection.";
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict-disease", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Disease detection request failed");
      }

      const data = await response.json();

      if (diseaseNameEl) {
        diseaseNameEl.textContent = data.disease || "—";
      }

      if (diseaseConfidenceEl) {
        diseaseConfidenceEl.textContent =
          data.confidence !== undefined
            ? `${(Number(data.confidence) * 100).toFixed(2)}%`
            : "—";
      }

      if (diseaseAdviceTextEl) {
        diseaseAdviceTextEl.textContent = getDiseaseAdvice(data.disease);
      }

      if (diseaseHintEl) {
        diseaseHintEl.textContent = "Disease analysis completed successfully.";
      }
    } catch (err) {
      console.error(err);

      if (diseaseErrorEl) {
        diseaseErrorEl.textContent =
          err.message || "Something went wrong during disease detection.";
      }

      if (diseaseHintEl) {
        diseaseHintEl.textContent = "Unable to analyze the uploaded image.";
      }

      if (diseaseNameEl) diseaseNameEl.textContent = "—";
      if (diseaseConfidenceEl) diseaseConfidenceEl.textContent = "—";
      if (diseaseAdviceTextEl) diseaseAdviceTextEl.textContent = "—";
    }
  });
}