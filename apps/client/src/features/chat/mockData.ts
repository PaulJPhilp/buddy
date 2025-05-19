import { getFixedTimestamp } from "../utils/dateUtils";
import type { MessageApi } from "./ChatServiceApi";

export const MOCK_THREADS = {
    thread1: [
        {
            id: "1",
            text: "Hi, I need help with my React application",
            sender: "user" as const,
            timestamp: getFixedTimestamp(50),
            attachments: [],
        },
        {
            id: "2",
            text: "I'd be happy to help! What specific issues are you encountering with your React application?",
            sender: "assistant" as const,
            timestamp: getFixedTimestamp(45),
            attachments: [],
        },
        {
            id: "3",
            text: "I'm having trouble with state management. My components aren't updating when I expect them to.",
            sender: "user" as const,
            timestamp: getFixedTimestamp(40),
            attachments: [],
        },
        {
            id: "4",
            text: "That's a common issue. Could you share a specific example of where the state updates aren't working as expected?",
            sender: "assistant" as const,
            timestamp: getFixedTimestamp(35),
            attachments: [],
        },
        {
            id: "5",
            text: "Sure, I have a counter component that's not updating when I click the increment button.",
            sender: "user" as const,
            timestamp: getFixedTimestamp(30),
            attachments: [],
        },
        {
            id: "6",
            text: "Here's the code for my counter component. The state doesn't update as expected.",
            sender: "user",
            timestamp: getFixedTimestamp(28),
            attachments: [],
        },
        {
            id: "7",
            text: "Thanks for sharing! I see you're using setState, but are you using the previous state value?",
            sender: "assistant",
            timestamp: getFixedTimestamp(25),
            attachments: [],
        },
        {
            id: "8",
            text: "No, I'm just calling setCount(count + 1). Should I use a function instead?",
            sender: "user",
            timestamp: getFixedTimestamp(22),
            attachments: [],
        },
        {
            id: "9",
            text: "Yes, using setCount(prev => prev + 1) is safer, especially with async updates.",
            sender: "assistant",
            timestamp: getFixedTimestamp(20),
            attachments: [],
        },
        {
            id: "10",
            text: "That fixed it! Thank you so much for your help.",
            sender: "user",
            timestamp: getFixedTimestamp(18),
            attachments: [],
        }
    ] as MessageApi[],

    thread2: [
        {
            id: "1",
            text: "Can you help me optimize my database queries?",
            sender: "user" as const,
            timestamp: getFixedTimestamp(45),
            attachments: [],
        },
        {
            id: "2",
            text: "Of course! Are you using any specific database system?",
            sender: "assistant" as const,
            timestamp: getFixedTimestamp(40),
            attachments: [],
        },
        {
            id: "3",
            text: "Yes, I'm using PostgreSQL with multiple joins that are running slowly",
            sender: "user" as const,
            timestamp: getFixedTimestamp(35),
            attachments: [],
        },
        {
            id: "4",
            text: "Could you share one of the slow queries? We can look at the execution plan.",
            sender: "assistant" as const,
            timestamp: getFixedTimestamp(30),
            attachments: [],
        },
        {
            id: "5",
            text: "Here's my query: SELECT * FROM users JOIN orders ON users.id = orders.user_id JOIN products ON orders.product_id = products.id",
            sender: "user" as const,
            timestamp: getFixedTimestamp(25),
            attachments: [],
        },
        {
            id: "6",
            text: "I see several potential optimizations: 1) Use specific columns instead of SELECT * 2) Add indexes on join columns 3) Consider if all joins are necessary",
            sender: "assistant" as const,
            timestamp: getFixedTimestamp(20),
            attachments: [],
        },
        {
            id: "7",
            text: "Thanks! I'll try adding indexes. Should I also use EXPLAIN ANALYZE?",
            sender: "user",
            timestamp: getFixedTimestamp(18),
            attachments: [],
        },
        {
            id: "8",
            text: "Absolutely! EXPLAIN ANALYZE will show you where the bottlenecks are.",
            sender: "assistant",
            timestamp: getFixedTimestamp(16),
            attachments: [],
        },
        {
            id: "9",
            text: "I ran EXPLAIN and it says 'Seq Scan' on products. Is that bad?",
            sender: "user",
            timestamp: getFixedTimestamp(14),
            attachments: [],
        },
        {
            id: "10",
            text: "A sequential scan means there's no index being used. Try adding an index on products.id.",
            sender: "assistant",
            timestamp: getFixedTimestamp(12),
            attachments: [],
        }
    ] as MessageApi[]
};
