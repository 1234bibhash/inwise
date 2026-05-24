/**
 * Hooghly AI Script Service
 * Senior Dev Implementation: Managing deterministic call playbooks.
 */

export interface CallScript {
  id: string;
  name: string;
  opening: string;
  objectives: string[];
  faq: { question: string; answer: string }[];
}

const DEFAULT_SCRIPT: CallScript = {
  id: 'default',
  name: 'Standard Service Script',
  opening: "Hello, I am calling from Hooghly Electronics regarding your recent purchase.",
  objectives: [
    "Verify the product performance",
    "Check if the customer has any maintenance concerns",
    "Confirm the current address for service records"
  ],
  faq: [
    { question: "What is the warranty period?", answer: "All our primary products come with a 2-year comprehensive warranty from the date of purchase." },
    { question: "How do I book a service?", answer: "I can initiate a service call for you right now, or you can use our website's Service Hub." },
    { question: "What is Hooghly Electronics?", answer: "We are the leading home appliance retailer in West Bengal, known for premium service and LG/Samsung partnerships." }
  ]
};

export function getActiveScript(): CallScript {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hooghly_active_script');
    return saved ? JSON.parse(saved) : DEFAULT_SCRIPT;
  }
  return DEFAULT_SCRIPT;
}

export function saveScript(script: CallScript) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hooghly_active_script', JSON.stringify(script));
  }
}
