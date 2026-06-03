# 🔌 Integrating ML Model with Your RealEstatePro App

## 📋 Overview

This guide shows you how to use the trained Hyderabad housing model in your existing Node.js real estate application.

---

## 🎯 Integration Approaches

### **Approach 1: Python Microservice** ⭐ (Recommended)

Run Python model as a separate API service that your Node.js app calls.

**Pros:**
- Clean separation of concerns
- Easy to update ML model independently
- No Node.js-Python compatibility issues
- Scalable

**Cons:**
- Need to run two services (Node.js + Python)

---

### **Approach 2: Child Process** (Simpler)

Call Python script directly from Node.js when needed.

**Pros:**
- Only one service to manage
- Simpler setup
- Good for low-traffic apps

**Cons:**
- Slower (spawns new process each time)
- More error-prone

---

## 🚀 Approach 1: Python Microservice Setup

### **Step 1: Create Flask API Server**

Create file: `dataset_model/api_server.py`

```python
from flask import Flask, request, jsonify, cors
from predict_price import predict_price
import logging

app = Flask(__name__)

# Enable CORS for cross-origin requests
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        property_data = request.json
        
        # Validate required fields
        required_fields = ['bedrooms', 'bathrooms', 'sqft_living']
        for field in required_fields:
            if field not in property_data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Make prediction
        price = predict_price(property_data)
        
        logger.info(f"Prediction request: {property_data}")
        logger.info(f"Predicted price: ${price:,.2f}")
        
        return jsonify({
            'success': True,
            'predicted_price': price,
            'predicted_price_formatted': f"${price:,.2f}",
            'currency': 'USD',
            'confidence': 'high'  # You can calculate this based on model uncertainty
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'hyderabad-housing-price-predictor'
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Hyderabad Housing Price Prediction API Server")
    print("=" * 60)
    print("Starting server on http://localhost:5001")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5001, debug=True)
```

---

### **Step 2: Update requirements.txt**

Add Flask to `dataset_model/requirements.txt`:

```
pandas==2.1.4
numpy==1.26.2
scikit-learn==1.3.2
joblib==1.3.2
openpyxl==3.1.2
flask==3.0.0
flask-cors==4.0.0
```

Reinstall:
```bash
pip install -r requirements.txt
```

---

### **Step 3: Start Python API Server**

Open a new terminal/command prompt:

```bash
cd c:\Users\kurva\OneDrive\Desktop\realestate\dataset_model
python api_server.py
```

You should see:
```
🚀 Hyderabad Housing Price Prediction API Server
============================================================
Starting server on http://localhost:5001
Press Ctrl+C to stop
============================================================
 * Running on http://0.0.0.0:5001
```

Keep this terminal open - the server needs to stay running!

---

### **Step 4: Add to Your Node.js App**

Create file: `services/pricePredictionService.js`

```javascript
const axios = require('axios');

class PricePredictionService {
  constructor() {
    // Python API server URL
    this.apiUrl = process.env.PREDICTION_API_URL || 'http://localhost:5001/api/predict';
  }

  /**
   * Predict property price using ML model
   * @param {Object} propertyData - Property features
   * @returns {Promise<Object>} Prediction result
   */
  async predictPrice(propertyData) {
    try {
      // Map your app's property format to model's expected format
      const modelInput = {
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        sqft_living: propertyData.area || propertyData.sqft_living || 0,
        sqft_lot: propertyData.sqft_lot || 8000, // Default lot size
        floors: propertyData.floors || 1,
        waterfront: propertyData.waterfront || 0,
        view: propertyData.view || 0,
        condition: propertyData.condition || 3, // Average condition
        sqft_above: propertyData.sqft_above || propertyData.area || 0,
        sqft_basement: propertyData.sqft_basement || 0,
        yr_built: propertyData.yr_built || new Date().getFullYear() - 10,
        yr_renovated: propertyData.yr_renovated || 0,
        city: propertyData.city || 'Hyderabad',
        zipcode: propertyData.zipcode || '98101'
      };

      // Call Python API
      const response = await axios.post(this.apiUrl, modelInput);
      
      if (response.data.success) {
        return {
          success: true,
          predictedPrice: response.data.predicted_price,
          formattedPrice: response.data.predicted_price_formatted,
          confidence: response.data.confidence,
          currency: response.data.currency
        };
      } else {
        throw new Error('Prediction failed');
      }
      
    } catch (error) {
      console.error('Price prediction error:', error.message);
      
      // Fallback to mock data if API is unavailable
      return {
        success: false,
        error: error.message,
        fallback: this.getMockPrediction(propertyData)
      };
    }
  }

  /**
   * Mock prediction as fallback
   */
  getMockPrediction(propertyData) {
    // Your existing mock logic from aiService.js
    const area = propertyData.area || 1000;
    const basePrice = area * 300; // $300 per sqft (Hyderabad average)
    
    return {
      predictedPrice: basePrice,
      formattedPrice: `$${basePrice.toLocaleString()}`,
      confidence: 'low',
      currency: 'USD',
      note: 'Mock prediction - ML model unavailable'
    };
  }

  /**
   * Check if prediction service is available
   */
  async isServiceAvailable() {
    try {
      const response = await axios.get(this.apiUrl.replace('/predict', '/health'));
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PricePredictionService();
```

---

### **Step 5: Update Your AI Controller**

Modify `controllers/aiController.js` to use the ML model:

```javascript
const pricePredictionService = require('../services/pricePredictionService');

exports.predictPrice = async (req, res) => {
  try {
    const propertyData = req.body;

    // Validate required fields
    if (!propertyData.type || !propertyData.location || !propertyData.area) {
      return res.status(400).json({
        message: "Property type, location, and area are required"
      });
    }

    // Check if ML model is available
    const mlAvailable = await pricePredictionService.isServiceAvailable();
    
    if (mlAvailable) {
      // Use trained ML model
      const prediction = await pricePredictionService.predictPrice(propertyData);
      
      res.json({
        success: true,
        source: 'ml_model',
        data: prediction
      });
    } else {
      // Fallback to OpenAI or mock data
      console.log('ML model unavailable, using AI service fallback');
      const prediction = await aiService.predictPropertyPrice(propertyData);
      
      res.json({
        success: true,
        source: 'ai_service',
        data: prediction
      });
    }

  } catch (error) {
    console.error('Price prediction error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### **Step 6: Test the Integration**

Create test file: `test_ml_prediction.js`

```javascript
const pricePredictionService = require('./services/pricePredictionService');

async function testPrediction() {
  console.log('Testing ML Price Prediction...\n');
  
  const testProperty = {
    bedrooms: 3,
    bathrooms: 2.5,
    area: 2000,
    sqft_lot: 8000,
    floors: 2,
    city: 'Hyderabad',
    zipcode: '98115'
  };
  
  const result = await pricePredictionService.predictPrice(testProperty);
  
  console.log('Test Property:', testProperty);
  console.log('\nPrediction Result:');
  console.log('- Success:', result.success);
  console.log('- Predicted Price:', result.formattedPrice);
  console.log('- Confidence:', result.confidence);
  console.log('- Currency:', result.currency);
  
  if (result.fallback) {
    console.log('\n⚠️ Using fallback (ML model not available)');
    console.log('Fallback Price:', result.fallback.formattedPrice);
  }
}

testPrediction().catch(console.error);
```

Run test:
```bash
node test_ml_prediction.js
```

---

## 🚀 Approach 2: Child Process (Simpler)

If you don't want to run a separate Python server:

### **Create: `services/mlPredictionSimple.js`**

```javascript
const { spawn } = require('child_process');
const path = require('path');

class SimpleMLPrediction {
  constructor() {
    this.pythonPath = 'python'; // or full path to python.exe
    this.scriptPath = path.join(__dirname, '../dataset_model/predict_from_cli.py');
  }

  predict(propertyData) {
    return new Promise((resolve, reject) => {
      // Spawn Python process
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        JSON.stringify(propertyData)
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error('Failed to parse Python output'));
          }
        } else {
          reject(new Error(errorOutput || 'Python process failed'));
        }
      });
    });
  }
}

module.exports = new SimpleMLPrediction();
```

### **Create: `dataset_model/predict_from_cli.py`**

```python
import sys
import json
from predict_price import predict_price

if __name__ == "__main__":
    try:
        # Get property data from command line argument
        property_json = sys.argv[1]
        property_data = json.loads(property_json)
        
        # Make prediction
        price = predict_price(property_data)
        
        # Return JSON response
        result = {
            'success': True,
            'predicted_price': float(price),
            'formatted_price': f"${price:,.2f}"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)
```

---

## 📊 Comparison Table

| Feature | Microservice (Approach 1) | Child Process (Approach 2) |
|---------|--------------------------|----------------------------|
| **Setup Complexity** | Medium | Simple |
| **Performance** | Fast (persistent) | Slower (spawn each time) |
| **Resource Usage** | Higher (always running) | Lower (on-demand) |
| **Scalability** | Excellent | Limited |
| **Error Handling** | Robust | Basic |
| **Best For** | Production apps | Development/testing |

---

## ✅ Recommendation

**For Production:** Use Approach 1 (Microservice)
- Better performance
- Easier monitoring
- Can scale independently

**For Testing/Development:** Use Approach 2 (Child Process)
- Simpler setup
- Fewer moving parts
- Good for learning

---

## 🎯 Next Steps

1. **Choose your approach** (1 or 2)
2. **Follow the setup steps** above
3. **Train your model** first (see QUICKSTART.md)
4. **Test locally** before integrating
5. **Monitor performance** in production

---

## 📞 Troubleshooting

### **"Connection refused" error**
Make sure Python API server is running:
```bash
python dataset_model/api_server.py
```

### **"Module not found" in Node.js**
Install axios:
```bash
npm install axios
```

### **Python script not found**
Check paths are correct. Use absolute paths if needed.

### **Slow predictions**
Use Approach 1 (microservice) instead of child process.

---

## 🎉 Success!

Once integrated, your app will have:
- ✅ Trained ML model predictions
- ✅ Fallback to AI/mock data
- ✅ Accurate price estimates
- ✅ Happy users!

**Your RealEstatePro app now has real ML-powered price predictions!** 🚀
