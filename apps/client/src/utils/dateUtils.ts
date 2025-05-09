export function formatMessageTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Generate fixed timestamps relative to a base time
const BASE_TIME = new Date('2025-01-01T12:00:00Z').getTime();

export function getFixedTimestamp(offsetMinutes: number): number {
    return BASE_TIME - offsetMinutes * 60 * 1000;
}
