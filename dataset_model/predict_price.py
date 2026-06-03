
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
