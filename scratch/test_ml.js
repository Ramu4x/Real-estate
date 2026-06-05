const ml = require('../services/mlPredictionSimple');
ml.predict({ city: 'kokapet', bedrooms: 3, bathrooms: 2, sqft_living: 1500 })
  .then(res => console.log('Success:', res))
  .catch(err => console.error('Error:', err));
