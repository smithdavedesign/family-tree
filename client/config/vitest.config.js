import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/e2e/**',  // Exclude Playwright E2E tests
            '**/.{idea,git,cache,output,temp}/**'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.config.js',
                '**/mockData.js',
                '**/mockSupabase.js'
            ]
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../src')
        }
    }
});
