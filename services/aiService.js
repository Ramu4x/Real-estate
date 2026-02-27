const OpenAI = require("openai");

class AIService {
  constructor() {
    // Check if API key is provided
    this.hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here";

    if (this.hasApiKey) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  // Property price prediction using GPT
  async predictPropertyPrice(propertyData) {
    try {
      // Fallback if no API key
      if (!this.hasApiKey) {
        return this.getMockPricePrediction(propertyData);
      }

      const prompt = `
        Based on the following property details, predict a realistic market price range:
        
        Property Type: ${propertyData.type}
        Location: ${propertyData.location}
        Area: ${propertyData.area} sq ft
        Bedrooms: ${propertyData.bedrooms}
        Bathrooms: ${propertyData.bathrooms}
        Amenities: ${propertyData.amenities?.join(", ") || "None"}
        
        Provide:
        1. Predicted price range (min-max)
        2. Confidence level (high/medium/low)
        3. Key factors influencing the price
        4. Market comparison insights
        
        Respond in JSON format with keys: priceRange, confidence, factors, insights
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a real estate expert and property valuator."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error("AI Price Prediction Error:", error);
      // Return mock data as fallback
      return this.getMockPricePrediction(propertyData);
    }
  }

  // Mock price prediction for demo purposes
  getMockPricePrediction(propertyData) {
    // Simple algorithm based on property features
    let basePrice = 0;

    // Base price by location (demo values in INR per sq ft)
    const locationMultipliers = {
      "mumbai": 50000,
      "delhi": 25000,
      "bengaluru": 15000,
      "pune": 12000,
      "goa": 30000,
      "default": 10000
    };

    // Attempt to match Indian cities from location string
    const locationStr = propertyData.location.toLowerCase();
    let multiplier = locationMultipliers.default;
    for (const city in locationMultipliers) {
      if (locationStr.includes(city)) {
        multiplier = locationMultipliers[city];
        break;
      }
    }

    basePrice = propertyData.area * multiplier;

    // Adjust for bedrooms and bathrooms
    if (propertyData.bedrooms) {
      basePrice += propertyData.bedrooms * 500000;
    }
    if (propertyData.bathrooms) {
      basePrice += propertyData.bathrooms * 200000;
    }

    // Add premium for amenities
    if (propertyData.amenities && propertyData.amenities.length > 0) {
      basePrice += propertyData.amenities.length * 100000;
    }

    // Calculate range (±20%)
    const minPrice = Math.round(basePrice * 0.8);
    const maxPrice = Math.round(basePrice * 1.2);

    return {
      priceRange: `₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`,
      confidence: "medium",
      factors: [
        "Location premium",
        "Property size",
        "Number of bedrooms/bathrooms",
        "Market conditions"
      ],
      insights: "This is a simulated price prediction. For accurate valuation, please add your OpenAI API key to .env file."
    };
  }

  // Generate property description
  async generatePropertyDescription(propertyData, style = "professional") {
    try {
      // Fallback if no API key
      if (!this.hasApiKey) {
        return this.getMockPropertyDescription(propertyData, style);
      }

      const styleInstructions = {
        professional: "Write a professional, marketing-focused description",
        luxury: "Write a luxury, premium-focused description with elegant language",
        family: "Write a family-friendly description highlighting comfort and practicality",
        investment: "Write an investment-focused description highlighting ROI potential"
      };

      const prompt = `
        Create a compelling property description for the following property:
        
        Title: ${propertyData.title}
        Type: ${propertyData.type}
        Location: ${propertyData.location}
        Area: ${propertyData.area} sq ft
        Bedrooms: ${propertyData.bedrooms}
        Bathrooms: ${propertyData.bathrooms}
        Price: $${propertyData.price}
        Amenities: ${propertyData.amenities?.join(", ") || "Standard amenities"}
        
        ${styleInstructions[style] || styleInstructions.professional}
        
        Keep it concise (150-200 words) and highlight the property's best features.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional real estate copywriter."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("AI Description Generation Error:", error);
      // Return mock description as fallback
      return this.getMockPropertyDescription(propertyData, style);
    }
  }

  // Mock property description for demo
  getMockPropertyDescription(propertyData, style) {
    const descriptions = {
      professional: `Beautiful ${propertyData.type} located in the heart of ${propertyData.location}. This well-maintained property features ${propertyData.bedrooms} bedrooms and ${propertyData.bathrooms} bathrooms, offering ${propertyData.area} square feet of comfortable living space. Perfect for families and professionals alike, this home combines modern convenience with classic appeal. The property includes ${propertyData.amenities?.join(", ") || "standard amenities"} and is priced competitively at ₹${propertyData.price?.toLocaleString('en-IN')}. Don't miss this opportunity to own a piece of prime real estate in this desirable location.`,
      luxury: `Exquisite ${propertyData.type} nestled in the prestigious ${propertyData.location} area. This stunning property showcases ${propertyData.bedrooms} elegantly appointed bedrooms and ${propertyData.bathrooms} luxurious bathrooms across ${propertyData.area} square feet of sophisticated living space. Featuring premium ${propertyData.amenities?.join(", ") || "high-end amenities"}, this residence represents the pinnacle of modern luxury living. With its exceptional craftsmanship and attention to detail, this property offers an unparalleled lifestyle experience at the competitive price of ₹${propertyData.price?.toLocaleString('en-IN')}.`,
      family: `Wonderful family ${propertyData.type} in the sought-after ${propertyData.location} neighborhood. This spacious home offers ${propertyData.bedrooms} comfortable bedrooms and ${propertyData.bathrooms} well-appointed bathrooms across ${propertyData.area} square feet of practical living space. Featuring ${propertyData.amenities?.join(", ") || "family-friendly amenities"}, this property provides the perfect environment for raising children while maintaining easy access to schools, parks, and community facilities. Priced at ₹${propertyData.price?.toLocaleString('en-IN')}, it represents excellent value for families seeking a quality home in a great location.`,
      investment: `Strategic investment opportunity in the form of this ${propertyData.type} located in ${propertyData.location}. With ${propertyData.bedrooms} bedrooms and ${propertyData.bathrooms} bathrooms across ${propertyData.area} square feet, this property offers strong rental potential and solid appreciation prospects. The inclusion of ${propertyData.amenities?.join(", ") || "standard amenities"} enhances its market appeal, while the competitive price point of ₹${propertyData.price?.toLocaleString('en-IN')} positions it well below comparable properties in the area. Ideal for investors seeking reliable returns in a growing market segment.`
    };

    return descriptions[style] || descriptions.professional;
  }

  // Property recommendation engine
  async getRecommendations(userPreferences, browsingHistory, propertyPool) {
    try {
      // Fallback if no API key
      if (!this.hasApiKey) {
        return this.getMockRecommendations(userPreferences, propertyPool);
      }

      const prompt = `
        Based on the user's preferences and browsing history, recommend the most suitable properties:
        
        User Preferences:
        - Preferred Location: ${userPreferences.location || "Any"}
        - Property Type: ${userPreferences.propertyType || "Any"}
        - Price Range: $${userPreferences.minPrice || 0} - $${userPreferences.maxPrice || "No limit"}
        
        Recent Browsing History:
        ${browsingHistory.slice(0, 5).map(h => `- ${h.query}`).join("\n") || "None"}
        
        Available Properties:
        ${propertyPool.slice(0, 10).map(p =>
        `- ${p.title} (${p.type}) in ${p.location}: $${p.price}, ${p.bedrooms} beds, ${p.bathrooms} baths`
      ).join("\n")}
        
        Recommend 3-5 most suitable properties and explain why each is a good match.
        Focus on matching user preferences and browsing patterns.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a real estate recommendation specialist."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("AI Recommendations Error:", error);
      // Return mock recommendations as fallback
      return this.getMockRecommendations(userPreferences, propertyPool);
    }
  }

  // Mock recommendations for demo
  getMockRecommendations(userPreferences, propertyPool) {
    if (!propertyPool || propertyPool.length === 0) {
      return "No properties available matching your criteria. Please try adjusting your search preferences.";
    }

    // Simple filtering based on preferences
    let filteredProperties = propertyPool;

    if (userPreferences.location) {
      filteredProperties = filteredProperties.filter(p =>
        p.location.toLowerCase().includes(userPreferences.location.toLowerCase())
      );
    }

    if (userPreferences.propertyType) {
      filteredProperties = filteredProperties.filter(p =>
        p.type === userPreferences.propertyType
      );
    }

    if (userPreferences.minPrice) {
      filteredProperties = filteredProperties.filter(p =>
        p.price >= userPreferences.minPrice
      );
    }

    if (userPreferences.maxPrice) {
      filteredProperties = filteredProperties.filter(p =>
        p.price <= userPreferences.maxPrice
      );
    }

    // Get top 3 recommendations
    const recommendations = filteredProperties.slice(0, 3);

    if (recommendations.length === 0) {
      return "No properties found matching your exact criteria. Consider broadening your search parameters.";
    }

    let response = "Based on your preferences, here are our top recommendations:\n\n";

    recommendations.forEach((property, index) => {
      response += `${index + 1}. **${property.title}**\n`;
      response += `   - Location: ${property.location}\n`;
      response += `   - Price: ₹${property.price?.toLocaleString('en-IN')}\n`;
      response += `   - ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms\n`;
      response += `   - Why it's a good match: Meets your criteria for ${property.type} properties in your preferred price range.\n\n`;
    });

    response += "These properties align well with your search preferences and represent excellent opportunities in the current market.";

    return response;
  }

  // Virtual property tour assistant
  async propertyTourAssistant(propertyData, userQuestion) {
    try {
      // Fallback if no API key
      if (!this.hasApiKey) {
        return this.getMockTourResponse(propertyData, userQuestion);
      }

      const prompt = `
        You are a virtual property tour assistant for the following property:
        
        Property Details:
        Title: ${propertyData.title}
        Description: ${propertyData.description}
        Location: ${propertyData.location}
        Type: ${propertyData.type}
        Price: $${propertyData.price}
        Area: ${propertyData.area} sq ft
        Bedrooms: ${propertyData.bedrooms}
        Bathrooms: ${propertyData.bathrooms}
        Amenities: ${propertyData.amenities?.join(", ") || "Standard amenities"}
        
        User Question: "${userQuestion}"
        
        Provide a helpful, informative response as if you're giving a virtual tour.
        Be specific about property features and answer questions accurately.
        If you don't have information to answer, politely say so.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a knowledgeable virtual property tour guide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("AI Tour Assistant Error:", error);
      // Return mock response as fallback
      return this.getMockTourResponse(propertyData, userQuestion);
    }
  }

  // Mock tour response for demo
  getMockTourResponse(propertyData, userQuestion) {
    const question = userQuestion.toLowerCase();

    if (question.includes("price") || question.includes("cost") || question.includes("rupee") || question.includes("inr")) {
      return `This ${propertyData.type} is priced at ₹${propertyData.price?.toLocaleString('en-IN')}. Given its ${propertyData.area} square feet of living space with ${propertyData.bedrooms} bedrooms and ${propertyData.bathrooms} bathrooms, this represents excellent value for the ${propertyData.location} area. The price reflects current market conditions and the quality of this property.`;
    }

    if (question.includes("bedroom") || question.includes("room")) {
      return `This property features ${propertyData.bedrooms} well-appointed bedrooms, each designed for comfort and privacy. The master bedroom includes ample space for furniture arrangement, while the additional bedrooms are perfect for family members or guests. All bedrooms benefit from natural lighting and are positioned for optimal privacy.`;
    }

    if (question.includes("bathroom") || question.includes("bath")) {
      return `The property includes ${propertyData.bathrooms} modern bathrooms featuring contemporary fixtures and finishes. The bathrooms are strategically located for convenience and include both full and powder room configurations. Each bathroom has been updated with quality materials and efficient layouts.`;
    }

    if (question.includes("amenity") || question.includes("feature")) {
      const amenities = propertyData.amenities?.join(", ") || "standard modern amenities";
      return `This property comes with ${amenities}. These features enhance the living experience and add value to your investment. The property has been maintained to high standards and includes all essential modern conveniences for comfortable daily living.`;
    }

    if (question.includes("location") || question.includes("neighborhood")) {
      return `Located in ${propertyData.location}, this property benefits from a prime location with easy access to local amenities, transportation, and community facilities. The neighborhood is known for its safety, convenience, and strong property values. You'll enjoy the perfect balance of suburban tranquility and urban accessibility.`;
    }

    // Default response
    return `This is a ${propertyData.type} located in ${propertyData.location}, featuring ${propertyData.bedrooms} bedrooms, ${propertyData.bathrooms} bathrooms, and ${propertyData.area} square feet of living space. The property is priced at ₹${propertyData.price?.toLocaleString('en-IN')} and includes modern amenities. What specific aspect would you like to know more about?`;
  }

  // Market analysis insights
  async marketAnalysis(location, propertyType) {
    try {
      // Fallback if no API key
      if (!this.hasApiKey) {
        return this.getMockMarketAnalysis(location, propertyType);
      }

      const prompt = `
        Provide real estate market analysis for ${propertyType} properties in ${location}.
        
        Include insights on:
        1. Current market trends
        2. Price movements (up/down/stable)
        3. Investment potential
        4. Future outlook
        5. Key factors affecting the market
        
        Keep the analysis professional and data-driven.
        Format the response in a clear, structured way.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a real estate market analyst."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 600
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("AI Market Analysis Error:", error);
      // Return mock analysis as fallback
      return this.getMockMarketAnalysis(location, propertyType);
    }
  }

  // Mock market analysis for demo
  getMockMarketAnalysis(location, propertyType) {
    return `## Real Estate Market Analysis: ${propertyType} in ${location}

### Current Market Trends
The ${location} real estate market for ${propertyType} properties is currently showing **moderate growth** with steady demand from both buyers and investors. Recent market indicators suggest a healthy balance between supply and demand.

### Price Movements
- **Trend**: Slightly upward (2-5% year-over-year)
- **Median Price**: ₹${this.getMockMedianPrice(location, propertyType).toLocaleString('en-IN')}
- **Market Stability**: Moderate - some fluctuations but overall stable

### Investment Potential
This market presents **favorable investment opportunities** with:
- Strong rental demand
- Gradual appreciation potential
- Good liquidity
- Stable neighborhood fundamentals

### Future Outlook
**Positive outlook** expected over the next 12-24 months due to:
- Ongoing infrastructure development
- Population growth trends
- Economic stability in the region
- Limited new inventory

### Key Market Factors
1. **Location Premium**: ${location} maintains strong desirability
2. **Employment Base**: Stable job market supporting housing demand
3. **Inventory Levels**: Moderate supply supporting price stability
4. **Interest Rates**: Current rates are favorable for buyers

*Note: This is simulated market analysis for demonstration purposes. For real investment decisions, please consult professional real estate market reports.*`;
  }

  // Helper function for mock median price
  getMockMedianPrice(location, propertyType) {
    const basePrices = {
      "mumbai": { "house": 50000000, "flat": 30000000, "commercial": 80000000 },
      "goa": { "house": 40000000, "flat": 20000000, "commercial": 30000000 },
      "pune": { "house": 25000000, "flat": 12000000, "commercial": 35000000 },
      "bengaluru": { "house": 35000000, "flat": 18000000, "commercial": 50000000 },
      "delhi": { "house": 45000000, "flat": 25000000, "commercial": 60000000 },
      "default": { "house": 20000000, "flat": 10000000, "commercial": 20000000 }
    };

    const locationKey = location.toLowerCase();
    const typePrices = basePrices[locationKey] || basePrices.default;
    return typePrices[propertyType] || typePrices.house;
  }
}

module.exports = new AIService();