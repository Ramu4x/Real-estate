class LocationService {
  constructor() {
    // Mock location data for demonstration
    // In production, you would integrate with Google Maps API or similar
    this.locationDatabase = {
      "miami": { lat: 25.7617, lng: -80.1918, state: "FL", country: "USA" },
      "new york": { lat: 40.7128, lng: -74.0060, state: "NY", country: "USA" },
      "los angeles": { lat: 34.0522, lng: -118.2437, state: "CA", country: "USA" },
      "chicago": { lat: 41.8781, lng: -87.6298, state: "IL", country: "USA" },
      "houston": { lat: 29.7604, lng: -95.3698, state: "TX", country: "USA" },
      "phoenix": { lat: 33.4484, lng: -112.0740, state: "AZ", country: "USA" },
      "philadelphia": { lat: 39.9526, lng: -75.1652, state: "PA", country: "USA" },
      "san antonio": { lat: 29.4241, lng: -98.4936, state: "TX", country: "USA" },
      "san diego": { lat: 32.7157, lng: -117.1611, state: "CA", country: "USA" },
      "dallas": { lat: 32.7767, lng: -96.7970, state: "TX", country: "USA" }
    };
  }

  // Get coordinates for a location
  getLocationCoordinates(locationQuery) {
    const normalizedQuery = locationQuery.toLowerCase().trim();
    
    // Exact match
    if (this.locationDatabase[normalizedQuery]) {
      return this.locationDatabase[normalizedQuery];
    }
    
    // Partial match
    for (const [key, value] of Object.entries(this.locationDatabase)) {
      if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
        return value;
      }
    }
    
    // Return default coordinates (center of USA)
    return { lat: 39.8283, lng: -98.5795, state: "Unknown", country: "USA" };
  }

  // Find nearby locations
  findNearbyLocations(latitude, longitude, maxDistanceKm = 50) {
    const nearby = [];
    const maxDistance = maxDistanceKm * 1000; // Convert to meters
    
    for (const [location, coords] of Object.entries(this.locationDatabase)) {
      const distance = this.calculateDistance(latitude, longitude, coords.lat, coords.lng);
      if (distance <= maxDistance) {
        nearby.push({
          location,
          ...coords,
          distance: Math.round(distance / 1000) // Convert to km
        });
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Get location suggestions for autocomplete
  getLocationSuggestions(query) {
    const normalizedQuery = query.toLowerCase().trim();
    const suggestions = [];
    
    for (const [location, coords] of Object.entries(this.locationDatabase)) {
      if (location.startsWith(normalizedQuery) || 
          location.includes(normalizedQuery)) {
        suggestions.push({
          location,
          display: `${this.capitalize(location)}, ${coords.state}, ${coords.country}`,
          ...coords
        });
      }
    }
    
    return suggestions.slice(0, 10); // Return top 10 suggestions
  }

  // Capitalize first letter of each word
  capitalize(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  // Parse address components
  parseAddress(addressString) {
    // Simple address parsing - in production use proper address parsing service
    const parts = addressString.split(',').map(part => part.trim());
    
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      country: parts[3] || 'USA',
      zipCode: parts[4] || ''
    };
  }

  // Get properties within radius
  async getPropertiesInRadius(latitude, longitude, radiusKm, propertyQuery = {}) {
    try {
      // This would use MongoDB's $near operator in production
      // For now, we'll simulate it with distance calculation
      
      // In a real implementation, you'd use:
      // Property.find({
      //   location: {
      //     $near: {
      //       $geometry: {
      //         type: "Point",
      //         coordinates: [longitude, latitude]
      //       },
      //       $maxDistance: radiusKm * 1000
      //     }
      //   },
      //   ...propertyQuery
      // });
      
      // Mock implementation
      return [];
    } catch (error) {
      console.error('Geospatial query error:', error);
      throw error;
    }
  }
}

module.exports = new LocationService();