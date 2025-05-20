import { createChatStore } from './createChatStore';

// Business Chat (Blue theme with rating toolbar)
const businessAgents = [
  {
    id: 'analyst',
    name: 'Business Analyst',
    description: 'Helps with data analysis and business insights',
    status: 'available',
    capabilities: ['analysis', 'reporting', 'forecasting']
  },
  {
    id: 'consultant',
    name: 'Management Consultant',
    description: 'Strategic business advice and planning',
    status: 'available',
    capabilities: ['strategy', 'planning', 'optimization']
  },
  {
    id: 'finance',
    name: 'Financial Advisor',
    description: 'Financial planning and investment advice',
    status: 'busy',
    capabilities: ['financial-planning', 'investment', 'risk-analysis']
  }
];

const businessMessages = Array.from({ length: 15 }, (_, i) => ({
  id: `business-${i}`,
  text: i % 2 === 0 
    ? `Can you analyze our ${['revenue', 'costs', 'growth', 'margins', 'investments'][i % 5]} trends?`
    : `Based on the data, I observe that your ${['revenue', 'costs', 'growth', 'margins', 'investments'][i % 5]} shows a positive trend. Would you like a detailed breakdown?`,
  sender: i % 2 === 0 ? 'user' as const : 'assistant' as const,
  timestamp: Date.now() - (15 - i) * 1000,
  metadata: { length: i % 2 === 0 ? 45 : 120 }
}));

export const useBusinessChatStore = createChatStore({
  theme: {
    primaryColor: '#1a365d',   // Dark blue
    secondaryColor: '#90cdf4', // Light blue
    activePrimaryColor: '#2c5282',
    activeSecondaryColor: '#63b3ed'
  },
  initialAgents: businessAgents,
  initialMessages: businessMessages,
  hasRatingToolbar: true
});

// Social Chat (Orange theme without rating toolbar)
const socialAgents = [
  {
    id: 'friend',
    name: 'Social Companion',
    description: 'Friendly chat and social interaction',
    status: 'available',
    capabilities: ['conversation', 'entertainment', 'recommendations']
  },
  {
    id: 'planner',
    name: 'Event Planner',
    description: 'Helps plan social events and gatherings',
    status: 'available',
    capabilities: ['planning', 'coordination', 'scheduling']
  },
  {
    id: 'guide',
    name: 'Local Guide',
    description: 'Provides local recommendations and insights',
    status: 'available',
    capabilities: ['local-knowledge', 'recommendations', 'navigation']
  }
];

const socialMessages = Array.from({ length: 15 }, (_, i) => ({
  id: `social-${i}`,
  text: i % 2 === 0 
    ? `What's a good place for ${['coffee', 'dinner', 'drinks', 'brunch', 'dancing'][i % 5]} in the city?`
    : `I recommend trying ${['Cafe Luna', 'The Garden Restaurant', 'Skybar', 'Brunch & Co', 'Dance Studio'][i % 5]}! It's known for its great atmosphere and has excellent reviews.`,
  sender: i % 2 === 0 ? 'user' as const : 'assistant' as const,
  timestamp: Date.now() - (15 - i) * 1000,
  metadata: { length: i % 2 === 0 ? 50 : 130 }
}));

export const useSocialChatStore = createChatStore({
  theme: {
    primaryColor: '#7B341E',   // Dark orange
    secondaryColor: '#FBD38D', // Light orange
    activePrimaryColor: '#9C4221',
    activeSecondaryColor: '#F6AD55'
  },
  initialAgents: socialAgents,
  initialMessages: socialMessages,
  hasRatingToolbar: false
});
