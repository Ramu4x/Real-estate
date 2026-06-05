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
