import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e-production',use:{baseURL:'http://localhost:4173',viewport:{width:1024,height:768},hasTouch:true},webServer:{command:'npm run preview -- --port 4173 --strictPort',url:'http://localhost:4173',reuseExistingServer:!process.env.CI},reporter:'list'});
