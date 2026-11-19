const outbound = [
  ['Naima', '07:30'], ['Thouheed', '07:45'], ['Rahi', '08:15'], ['Thouheed', '08:50'], ['Naima', '09:10'], ['Thouheed', '09:35'],
  ['Rahi', '10:00'], ['Naima', '10:30'], ['Rahi', '11:05'], ['Naima', '11:25'], ['Thouheed', '12:05'], ['Naima', '12:35'],
  ['Thouheed', '13:05'], ['Naima', '13:35'], ['Thouheed', '14:05'], ['Rahi', '14:52'], ['Janaki', '15:20'], ['Thouheed', '15:30'],
  ['Naima', '16:05'], ['Thouheed', '16:20'], ['Rahi', '16:52'], ['Naima', '17:25'], ['Thouheed', '17:40'], ['V P Travels', '18:10'],
  ['Naima', '18:32'], ['V P Travels', '18:52'], ['Thouheed', '19:20'], ['Rahi', '20:00'],
];
const inbound = [
  ['V P Travels', '06:30'], ['Naima', '07:05'], ['Thouheed', '07:25'], ['Rahi', '07:35'], ['Thouheed', '07:50'], ['Janaki', '08:00'],
  ['Naima', '08:40'], ['Thouheed', '09:05'], ['Rahi', '09:30'], ['Naima', '10:05'], ['Thouheed', '10:38'], ['Naima', '11:05'],
  ['Rahi', '11:35'], ['Naima', '12:00'], ['Thouheed', '12:35'], ['Naima', '13:05'], ['Rahi', '13:35'], ['Naima', '14:20'],
  ['Thouheed', '14:45'], ['Rahi', '15:30'], ['Janaki', '15:50'], ['Thouheed', '16:05'], ['Naima', '16:40'], ['Thouheed', '17:05'],
  ['Rahi', '17:35'], ['Naima', '18:00'], ['Thouheed', '18:20'],
];
function makeTrips(items, prefix, from, to) {
  return items.map(([name, departure], index) => ({ id: `${prefix}-${index}`, name, departure, stops: [from, to], operatingDays: 'Every day', confirmed: true }));
}

export const fallbackSchedule = {
  version: 'Community timetable · v1.1',
  updatedAt: '2026-11-19',
  routes: [
    { id: 'new-bus-stand-kambar', from: 'New Bus Stand', to: 'Kambar', trips: makeTrips(outbound, 'nbs', 'New Bus Stand', 'Kambar') },
    { id: 'kambar-new-bus-stand', from: 'Kambar', to: 'New Bus Stand', trips: makeTrips(inbound, 'kam', 'Kambar', 'New Bus Stand') },
  ],
};

export function toTrips(route) {
  return route.trips.map((trip, index) => {
    const [hour, minute] = trip.departure.split(':').map(Number);
    return { ...trip, id: trip.id || `${route.id}-${index}`, hour, minute, minutes: hour * 60 + minute };
  });
}

export function formatTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function nextTrip(route, date = new Date()) {
  const now = date.getHours() * 60 + date.getMinutes();
  const trips = toTrips(route);
  const trip = trips.find((item) => item.minutes >= now);
  return { trip: trip || trips[0], tomorrow: !trip };
}

export function getTripStatus(trip, date = new Date()) {
  const now = date.getHours() * 60 + date.getMinutes();
  if (trip.minutes < now) return 'passed';
  if (trip.minutes - now <= 30) return 'soon';
  return 'upcoming';
}
