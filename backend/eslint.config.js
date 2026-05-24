const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: ['vitest.config.js', '__tests__/**'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                afterAll: 'readonly',
                beforeAll: 'readonly',
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': ['error', { 
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            'no-undef': 'error',
        },
    },
];
