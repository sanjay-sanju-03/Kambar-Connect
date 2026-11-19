import { fallbackSchedule } from './data';
export async function loadSchedule(){try{const response=await fetch('/api/schedule');if(!response.ok)throw new Error('Schedule API unavailable');return await response.json();}catch{return fallbackSchedule;}}
