const winston = require('winston');

// Determine if we are in development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Define severity levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define level based on environment
const level = () => {
    return isDevelopment ? 'debug' : 'http'; // In production, we want to capture everything up to HTTP requests
};

// Define colors for development console logging
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    http: 'magenta',
    debug: 'green',
};

winston.addColors(colors);

// The format for production logs (JSON is extremely parseable by Vercel Log Drains / Datadog / Axiom)
const productionFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }), // Crucial for Vercel 500 tracing
    winston.format.json()
);

// The format for local development logs (Beautifully colored text)
const developmentFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// We define ONLY a console transport since Vercel's Edge/Serverless functions are ephemeral and read-only.
const transports = [
    new winston.transports.Console({
        format: isDevelopment ? developmentFormat : productionFormat,
    }),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});

// Create a stream object with a 'write' function that will be used by `morgan` HTTP logger
logger.stream = {
    write: (message) => {
        // Use the 'http' severity and slice the trailing newline provided by morgan
        logger.http(message.substring(0, message.lastIndexOf('\n')));
    },
};

module.exports = logger;
