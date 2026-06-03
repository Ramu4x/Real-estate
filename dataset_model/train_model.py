"""
Hyderabad Housing Price Prediction Model
========================================
This script trains a machine learning model to predict house prices
based on property features.

Dataset: Hyderabad housing sales
Target Variable: price (INR)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')

# ============================================
# STEP 1: Load Your Dataset
# ============================================

print("=" * 60)
print("🏠 HYDERABAD HOUSING PRICE PREDICTION MODEL")
print("=" * 60)

# Load the Excel/CSV file
try:
    # Try loading as CSV first
    print("\n📂 Loading dataset...")
    df = pd.read_csv('Hyderabad.csv')
    df.rename(columns={'Price': 'price', 'Location': 'city', 'Area': 'sqft_living', 'No. of Bedrooms': 'bedrooms'}, inplace=True)
    print(f"✅ Loaded {len(df):,} records from CSV")
except FileNotFoundError:
    print("\n📂 Dataset not found!")

# Display dataset info
print(f"\n📊 Dataset Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
print(f"\n📋 Columns: {df.columns.tolist()}")
print(f"\n📈 Data Types:\n{df.dtypes}")
print(f"\n💰 Price Range: ${df['price'].min():,.0f} - ${df['price'].max():,.0f}")
print(f"💰 Average Price: ${df['price'].mean():,.0f}")
print(f"💰 Median Price: ${df['price'].median():,.0f}")

# ============================================
# STEP 2: Data Preprocessing
# ============================================

print("\n" + "=" * 60)
print("🔧 DATA PREPROCESSING")
print("=" * 60)

# Handle missing values
print("\n🔍 Checking for missing values...")
missing = df.isnull().sum()
if missing.any():
    print("Missing values found:")
    print(missing[missing > 0])
    
    # Fill numeric missing values with median
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())
            print(f"  ✅ Filled missing {col} with median")
else:
    print("✅ No missing values found!")

# Encode categorical variables
print("\n🔢 Encoding categorical variables...")

# Extract city from city column if it exists
if 'city' in df.columns:
    le_city = LabelEncoder()
    df['city_encoded'] = le_city.fit_transform(df['city'].astype(str))
    print(f"  ✅ Encoded {len(le_city.classes_)} unique cities")
    print(f"     Sample cities: {le_city.classes_[:5]}")

# Extract ZIP code from statezip if it exists
if 'statezip' in df.columns:
    df['zipcode'] = df['statezip'].astype(str).str[-5:]  # Extract last 5 digits
    le_zipcode = LabelEncoder()
    df['zipcode_encoded'] = le_zipcode.fit_transform(df['zipcode'])
    print(f"  ✅ Encoded {len(le_zipcode.classes_)} unique ZIP codes")

# Convert date column if it exists
if 'date' in df.columns:
    df['date'] = pd.to_datetime(df['date'])
    df['year_sold'] = df['date'].dt.year
    df['month_sold'] = df['date'].dt.month
    df['day_sold'] = df['date'].dt.day
    print("  ✅ Extracted year, month, day from date")

# ============================================
# STEP 3: Feature Selection
# ============================================

print("\n" + "=" * 60)
print("🎯 FEATURE SELECTION")
print("=" * 60)

# Define feature columns (exclude target and non-predictive columns)
exclude_cols = ['price', 'date', 'street', 'country', 'statezip', 'city']
if 'zipcode' in df.columns:
    exclude_cols.append('zipcode')

feature_cols = [col for col in df.columns if col not in exclude_cols]

print(f"\n📋 Using {len(feature_cols)} features:")
for i, col in enumerate(feature_cols, 1):
    print(f"  {i:2d}. {col}")

# Prepare X and y
X = df[feature_cols]
y = df['price']

print(f"\n📊 Feature matrix shape: {X.shape}")
print(f"📊 Target vector shape: {y.shape}")

# ============================================
# STEP 4: Train-Test Split
# ============================================

print("\n" + "=" * 60)
print("📊 TRAIN-TEST SPLIT")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, 
    test_size=0.2,      # 80% train, 20% test
    random_state=42,    # For reproducibility
    shuffle=True        # Shuffle data before splitting
)

print(f"✅ Training set: {len(X_train):,} samples ({len(X_train)/len(X)*100:.1f}%)")
print(f"✅ Testing set:  {len(X_test):,} samples ({len(X_test)/len(X)*100:.1f}%)")

# ============================================
# STEP 5: Feature Scaling (Optional but recommended)
# ============================================

print("\n" + "=" * 60)
print("⚖️  FEATURE SCALING")
print("=" * 60)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("✅ Features scaled using StandardScaler")
print(f"   Mean after scaling: ~0")
print(f"   Std after scaling: ~1")

# ============================================
# STEP 6: Model Training - Random Forest
# ============================================

print("\n" + "=" * 60)
print("🌲 TRAINING RANDOM FOREST MODEL")
print("=" * 60)

rf_model = RandomForestRegressor(
    n_estimators=200,       # Number of trees
    max_depth=20,           # Maximum depth
    min_samples_split=5,    # Minimum samples to split
    min_samples_leaf=2,     # Minimum samples per leaf
    random_state=42,
    n_jobs=-1              # Use all CPU cores
)

print("\n⏳ Training Random Forest... (this may take 1-2 minutes)")
rf_model.fit(X_train_scaled, y_train)
print("✅ Random Forest training complete!")

# ============================================
# STEP 7: Model Evaluation
# ============================================

print("\n" + "=" * 60)
print("📊 MODEL EVALUATION")
print("=" * 60)

# Predictions
y_pred_train = rf_model.predict(X_train_scaled)
y_pred_test = rf_model.predict(X_test_scaled)

# Metrics for test set
mae = mean_absolute_error(y_test, y_pred_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
r2 = r2_score(y_test, y_pred_test)

print(f"\n🎯 TEST SET PERFORMANCE:")
print(f"   MAE (Mean Absolute Error):   ${mae:,.0f}")
print(f"   RMSE (Root Mean Squared Error): ${rmse:,.0f}")
print(f"   R² Score:                    {r2:.4f} ({r2*100:.2f}%)")

print(f"\n🎯 TRAINING SET PERFORMANCE:")
train_mae = mean_absolute_error(y_train, y_pred_train)
train_r2 = r2_score(y_train, y_pred_train)
print(f"   MAE: ${train_mae:,.0f}")
print(f"   R²:  {train_r2:.4f} ({train_r2*100:.2f}%)")

# Check for overfitting
if abs(r2 - train_r2) > 0.1:
    print("\n⚠️  WARNING: Possible overfitting detected!")
    print(f"   Gap between train ({train_r2:.2f}) and test ({r2:.2f}) R² is large")
else:
    print("\n✅ Model generalization looks good!")

# ============================================
# STEP 8: Feature Importance Analysis
# ============================================

print("\n" + "=" * 60)
print("🔍 FEATURE IMPORTANCE ANALYSIS")
print("=" * 60)

feature_importance = pd.DataFrame({
    'Feature': feature_cols,
    'Importance': rf_model.feature_importances_
}).sort_values('Importance', ascending=False)

print("\nTop 10 Most Important Features:")
print(feature_importance.head(10).to_string(index=False))

# ============================================
# STEP 9: Save the Model
# ============================================

print("\n" + "=" * 60)
print("💾 SAVING MODEL AND ARTIFACTS")
print("=" * 60)

# Save model
joblib.dump(rf_model, 'hyderabad_housing_model.pkl')
print("✅ Model saved to: hyderabad_housing_model.pkl")

# Save scaler
joblib.dump(scaler, 'scaler.pkl')
print("✅ Scaler saved to: scaler.pkl")

# Save encoders if they exist
if 'city' in df.columns:
    joblib.dump(le_city, 'city_encoder.pkl')
    print("✅ City encoder saved to: city_encoder.pkl")

if 'statezip' in df.columns:
    joblib.dump(le_zipcode, 'zipcode_encoder.pkl')
    print("✅ ZIP code encoder saved to: zipcode_encoder.pkl")

# Save feature list
joblib.dump(feature_cols, 'feature_columns.pkl')
print("✅ Feature columns saved to: feature_columns.pkl")

# ============================================
# STEP 10: Test Predictions
# ============================================

print("\n" + "=" * 60)
print("🧪 SAMPLE PREDICTIONS")
print("=" * 60)

# Take 5 sample properties from test set
sample_indices = X_test.index[:5]
sample_properties = X_test.loc[sample_indices]
sample_actual_prices = y_test.loc[sample_indices]

# Scale the sample properties
sample_scaled = scaler.transform(sample_properties)
sample_predictions = rf_model.predict(sample_scaled)

print("\nSample Property Predictions:")
print("-" * 80)
for i, idx in enumerate(sample_indices):
    actual = sample_actual_prices.loc[idx]
    predicted = sample_predictions[i]
    error = abs(predicted - actual)
    error_pct = (error / actual) * 100
    
    print(f"\n🏠 Property #{i+1}:")
    print(f"   Actual Price:    ${actual:,.0f}")
    print(f"   Predicted Price: ${predicted:,.0f}")
    print(f"   Difference:      ${error:,.0f} ({error_pct:.1f}%)")
    print(f"   Accuracy:        {100 - error_pct:.1f}%")

# ============================================
# STEP 11: Create Prediction Function
# ============================================

print("\n" + "=" * 60)
print("📝 CREATING PREDICTION FUNCTION")
print("=" * 60)

prediction_script = '''
def predict_price(property_data):
    """
    Predict house price based on property features.
    
    Parameters:
    property_data (dict): Dictionary containing property features
    
    Returns:
    float: Predicted price in USD
    """
    import joblib
    import pandas as pd
    import numpy as np
    
    # Load trained model and artifacts
    model = joblib.load('hyderabad_housing_model.pkl')
    scaler = joblib.load('scaler.pkl')
    features = joblib.load('feature_columns.pkl')
    
    try:
        le_city = joblib.load('city_encoder.pkl')
        has_city_encoder = True
    except:
        has_city_encoder = False
    
    try:
        le_zipcode = joblib.load('zipcode_encoder.pkl')
        has_zipcode_encoder = True
    except:
        has_zipcode_encoder = False
    
    # Convert dictionary to DataFrame
    df = pd.DataFrame([property_data])
    
    # Ensure all required columns are present
    for col in features:
        if col not in df.columns:
            df[col] = 0
    
    # Encode city if needed
    if has_city_encoder and 'city' in df.columns:
        try:
            df['city_encoded'] = le_city.transform(df['city'].astype(str))
        except:
            df['city_encoded'] = 0
    
    # Encode zipcode if needed
    if has_zipcode_encoder and 'zipcode' in df.columns:
        try:
            df['zipcode_encoded'] = le_zipcode.transform(df['zipcode'].astype(str))
        except:
            df['zipcode_encoded'] = 0
    
    # Select only the features used in training
    X = df[features]
    
    # Scale features
    X_scaled = scaler.transform(X)
    
    # Make prediction
    predicted_price = model.predict(X_scaled)[0]
    
    return predicted_price


# Example usage:
if __name__ == "__main__":
    # Example property
    example_property = {
        'sqft_living': 1500,
        'bedrooms': 3,
        'city': 'Abids',
        'Resale': 0,
        'MaintenanceStaff': 1,
        'Gymnasium': 1,
        'SwimmingPool': 1,
        'LiftAvailable': 1,
        'CarParking': 1,
        '24X7Security': 1
    }
    
    price = predict_price(example_property)
    print(f"Predicted Price: ${price:,.0f}")
'''

with open('predict_price.py', 'w') as f:
    f.write(prediction_script)

print("✅ Prediction function saved to: predict_price.py")

# ============================================
# FINAL SUMMARY
# ============================================

print("\n" + "=" * 80)
print("🎉 TRAINING COMPLETE!")
print("=" * 80)
print(f"""
📊 MODEL SUMMARY:
   • Algorithm: Random Forest Regressor
   • Training Samples: {len(X_train):,}
   • Testing Samples: {len(X_test):,}
   • Features Used: {len(feature_cols)}
   
🎯 PERFORMANCE METRICS:
   • Test MAE: ${mae:,.0f}
   • Test RMSE: ${rmse:,.0f}
   • Test R²: {r2:.4f} ({r2*100:.2f}%)
   
💾 FILES CREATED:
   1. hyderabad_housing_model.pkl - Trained model
   2. scaler.pkl - Feature scaler
   3. feature_columns.pkl - Feature list
   4. predict_price.py - Prediction function
   5. city_encoder.pkl - City encoder (if applicable)
   6. zipcode_encoder.pkl - ZIP encoder (if applicable)
   
🚀 NEXT STEPS:
   1. Test the model with new property data
   2. Integrate into your real estate application
   3. Monitor performance on production data
   4. Retrain periodically with new data

📝 USAGE EXAMPLE:
   python predict_price.py
   
   OR in Python:
   from predict_price import predict_price
   price = predict_price(property_data)
""")

print("=" * 80)
