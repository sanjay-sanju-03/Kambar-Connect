import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dataPath=path.join(path.dirname(fileURLToPath(import.meta.url)),'data','schedule.json');
export async function readSchedule(){return JSON.parse(await fs.readFile(dataPath,'utf8'));}
export function findRoute(schedule,routeId){return schedule.routes.find(route=>route.id===routeId);}
export function normaliseTrips(route){return route.trips.map((trip,index)=>{
  if(!Array.isArray(trip))return{id:trip.id||`${route.id}-${index}`,...trip};
  const [name,time]=trip;
  return{id:`${route.id}-${index}`,name,departure:time};
});}
