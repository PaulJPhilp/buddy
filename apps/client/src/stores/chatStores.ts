import { createChatStore } from "./createChatStore";

// Business Chat (Blue theme with rating toolbar)
const businessAgents = [
  {
    id: "analyst",
    name: "Business Analyst",
    description: "Helps with data analysis and business insights",
    status: { mood: 8, energy: 7, health: 9 },
    capabilities: { canSpeak: true, canMove: false, canLearn: true },
  },
  {
    id: "consultant",
    name: "Management Consultant",
    description: "Strategic business advice and planning",
    status: { mood: 7, energy: 8, health: 8 },
    capabilities: { canSpeak: true, canMove: true, canLearn: true },
  },
  {
    id: "finance",
    name: "Financial Advisor",
    description: "Financial planning and investment advice",
    status: { mood: 6, energy: 5, health: 8 },
    capabilities: { canSpeak: true, canMove: false, canLearn: false },
  },
];

const BASE_TIMESTAMP = 1716200000000; // Fixed timestamp for SSR/CSR consistency

const businessMessages = [
  {
    id: "business-1",
    text: "I need to analyze our Q1 2025 performance. Can you help me understand the key metrics?",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 7000,
    metadata: { length: 82 },
  },
  {
    id: "business-2",
    text: "I will help you analyze the Q1 2025 performance. The key metrics show:\n\n• Revenue: $2.1M (+15% YoY)\n• Operating Costs: $1.4M (+8% YoY)\n• Gross Margin: 33% (+2pts)\n• Customer Acquisition Cost: $125 (-10%)\n\nWould you like me to dive deeper into any of these metrics?",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP - 6000,
    metadata: { length: 215 },
  },
  {
    id: "business-3",
    text: "Yes, please explain what is driving the improved gross margin.",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 5000,
    metadata: { length: 58 },
  },
  {
    id: "business-4",
    text: "The 2% improvement in gross margin can be attributed to three main factors:\n\n1. Optimized Pricing Strategy: Successfully implemented dynamic pricing, increasing average order value by 12%\n2. Supply Chain Efficiency: Reduced logistics costs by 15% through new vendor partnerships\n3. Product Mix: Higher proportion of high-margin digital products (now 45% of revenue, up from 35%)\n\nWould you like to see the impact analysis of each factor?",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP - 4000,
    metadata: { length: 345 },
  },
  {
    id: "business-5",
    text: "Yes, particularly interested in the impact of the digital products shift. Can you break that down?",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 3000,
    metadata: { length: 92 },
  },
  {
    id: "business-6",
    text: "Here's the digital products impact analysis:\n\nRevenue Mix Impact:\n• Digital Products: $945k (45% of revenue)\n• Traditional Products: $1.155M (55% of revenue)\n\nMargin Contribution:\n• Digital Products: 45% margin\n• Traditional Products: 23% margin\n\nThis shift to digital added +4.4pts to overall margin, offset by:\n• Marketing costs: -1.2pts\n• Platform fees: -1.2pts\n\nNet impact: +2pts to gross margin\n\nShould we explore strategies to accelerate digital transformation?",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP - 2000,
    metadata: { length: 385 },
  },
  {
    id: "business-7",
    text: "These numbers are compelling. What would be required to reach 60% digital revenue by Q4?",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 1000,
    metadata: { length: 86 },
  },
  {
    id: "business-8",
    text: "To reach 60% digital revenue by Q4, we'll need:\n\n1. Investment Required:\n• Platform scaling: $200K\n• Digital marketing: $150K\n• Team training: $75K\n\n2. Timeline:\n• Q2: Platform upgrade & team training\n• Q3: Marketing campaign & new product launch\n• Q4: Full digital transformation\n\n3. Expected Results:\n• Digital revenue: $1.8M (60%)\n• Gross margin: 38% (+5pts)\n• ROI: 2.1x in first year\n\nShall I prepare a detailed implementation plan?",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP,
    metadata: { length: 425 },
  },
];

export const useBusinessChatStore = createChatStore({
  theme: {
    primaryColor: "#1a365d", // Dark blue
    secondaryColor: "#90cdf4", // Light blue
    activePrimaryColor: "#2c5282",
    activeSecondaryColor: "#63b3ed",
  },
  initialAgents: businessAgents,
  initialMessages: businessMessages,
  hasRatingToolbar: true,
});

// Social Chat (Orange theme without rating toolbar)
const socialAgents = [
  {
    id: "friend",
    name: "Social Companion",
    description: "Friendly chat and social interaction",
    status: { mood: 9, energy: 8, health: 9 },
    capabilities: { canSpeak: true, canMove: true, canLearn: false },
  },
  {
    id: "planner",
    name: "Event Planner",
    description: "Helps plan social events and gatherings",
    status: { mood: 8, energy: 7, health: 8 },
    capabilities: { canSpeak: true, canMove: true, canLearn: true },
  },
  {
    id: "guide",
    name: "Local Guide",
    description: "Provides local recommendations and insights",
    status: { mood: 7, energy: 8, health: 7 },
    capabilities: { canSpeak: false, canMove: true, canLearn: true },
  },
];

const socialMessages = [
  {
    id: "social-1",
    text: "Hey! I am planning a weekend trip to the city with friends. Any recommendations?",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 7000,
    metadata: { length: 76 },
  },
  {
    id: "social-2",
    text: "That sounds fun! I would love to help plan your weekend. How many friends are coming and what kind of activities interest you all? Some popular options are:\n\n• Food & Wine Tours\n• Art Gallery Hopping\n• Live Music Venues\n• Outdoor Adventures\n• Cultural Festivals",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP - 6000,
    metadata: { length: 228 },
  },
  {
    id: "social-3",
    text: "We are 4 people, all into food and music. We will be there Friday to Sunday.",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 5000,
    metadata: { length: 75 },
  },
  {
    id: "social-4",
    text: "Perfect! Here is a suggested itinerary:\n\nFriday Evening:\n• Dinner at Bistro Nouveau (make reservations!)\n• Jazz at Blue Room (live band starts 9pm)\n\nSaturday:\n• Brunch at The Terrace (amazing skyline views)\n• Food Market Tour (2pm-4pm)\n• Evening concert at SoundSpace\n\nSunday:\n• Gospel Brunch at Soul Kitchen\n• Walking food tour in Little Italy\n\nWould you like me to help with any reservations?",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP - 4000,
    metadata: { length: 312 },
  },
  {
    id: "social-5",
    text: "Yes please! Can you help with Bistro Nouveau for Friday and the Food Market Tour?",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 3000,
    metadata: { length: 82 },
  },
  {
    id: "social-6",
    text: "Of course! I've checked availability:\n\nBistro Nouveau:\n• Friday 7:30 PM - Table for 4 available\n• Prix fixe menu option ($85/person)\n• Wine pairing available (+$45)\n\nFood Market Tour:\n• Saturday 2 PM slot has 4 spots\n• 3-hour walking tour\n• Includes 8 tastings\n• $65/person\n\nShall I proceed with the bookings?",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP - 2000,
    metadata: { length: 278 },
  },
  {
    id: "social-7",
    text: "The food tour sounds great but Bistro Nouveau is a bit pricey. Any other restaurant suggestions for Friday?",
    sender: "user" as const,
    timestamp: BASE_TIMESTAMP - 1000,
    metadata: { length: 98 },
  },
  {
    id: "social-8",
    text: "Here are some excellent alternatives with great ambiance but gentler prices:\n\n1. Trattoria Milano\n• Authentic Italian\n• Main courses $22-32\n• Amazing wine list\n• Live accordion on Fridays!\n\n2. The Garden Kitchen\n• Farm-to-table American\n• Main courses $18-28\n• Beautiful patio seating\n• Known for craft cocktails\n\n3. Tapas & Tunes\n• Spanish small plates\n• Share plates $8-15\n• Flamenco guitar on weekends\n• Great for groups\n\nAll are near Blue Room for jazz after. Which interests you?",
    sender: "assistant" as const,
    timestamp: BASE_TIMESTAMP,
    metadata: { length: 385 },
  },
];

export const useSocialChatStore = createChatStore({
  theme: {
    primaryColor: "#7B341E", // Dark orange
    secondaryColor: "#FBD38D", // Light orange
    activePrimaryColor: "#9C4221",
    activeSecondaryColor: "#F6AD55",
  },
  initialAgents: socialAgents,
  initialMessages: socialMessages,
  hasRatingToolbar: false,
});
