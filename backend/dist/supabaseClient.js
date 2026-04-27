"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || 'https://cpnhvqslermplvrnrkqf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwbmh2cXNsZXJtcGx2cm5ya3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQzNDYsImV4cCI6MjA5MjY5MDM0Nn0.D91ZIN2LVmUwQXcOEeyPrMRzQwcu8gCX-EC_H-Hnkyg';
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
