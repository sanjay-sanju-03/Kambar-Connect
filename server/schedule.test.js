import test from 'node:test';import assert from 'node:assert/strict';import{findRoute,normaliseTrips}from './schedule.js';
const schedule={routes:[{id:'demo',from:'Kambar',to:'Kasargod',trips:[['Morning','06:30']]}]};
test('finds a route by id',()=>assert.equal(findRoute(schedule,'demo').to,'Kasargod'));
test('normalises compact timetable data',()=>assert.deepEqual(normaliseTrips(schedule.routes[0])[0],{id:'demo-0',name:'Morning',departure:'06:30'}));
test('returns undefined for an unknown route',()=>assert.equal(findRoute(schedule,'missing'),undefined));
