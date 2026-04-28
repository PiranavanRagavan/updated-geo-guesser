// Location data with coordinates mapped to temple locations in India
export const locationCoordinates = {
  v1: { lat: 25.3245, lng: 82.9863, label: 'Kashi Vishwanath', city: 'Varanasi' },
  v2: { lat: 21.6455, lng: 70.3901, label: 'Somnath', city: 'Prabhas Patan' },
  v3: { lat: 13.1829, lng: 79.8343, label: 'Tirupati', city: 'Tirupati' },
  v4: { lat: 9.9252, lng: 78.1198, label: 'Meenakshi', city: 'Madurai' },
  v5: { lat: 19.8136, lng: 85.8312, label: 'Jagannath', city: 'Puri' },
  v6: { lat: 22.2411, lng: 68.9707, label: 'Dwarka', city: 'Dwarka' },
  v7: { lat: 30.7369, lng: 79.9181, label: 'Badrinath', city: 'Badrinath' },
  v8: { lat: 30.7355, lng: 79.5670, label: 'Kedarnath', city: 'Kedarnath' },
  c1: { lat: 11.0076, lng: 79.2987, label: 'Brihadeeswarar', city: 'Thanjavur' },
  c2: { lat: 9.2868, lng: 79.8379, label: 'Ramanathaswamy', city: 'Rameswaram' },
  c3: { lat: 24.6955, lng: 84.7849, label: 'Mahabodhi', city: 'Bodh Gaya' },
  c4: { lat: 23.1815, lng: 77.4143, label: 'Sanchi', city: 'Sanchi' },
  c5: { lat: 15.3350, lng: 76.4631, label: 'Hampi', city: 'Hampi' },
  c6: { lat: 23.1815, lng: 75.7747, label: 'Mahakaleshwar', city: 'Ujjain' },
  c7: { lat: 32.2596, lng: 75.3142, label: 'Vaishno Devi', city: 'Katra' },
  c8: { lat: 19.0760, lng: 74.4960, label: 'Shirdi', city: 'Shirdi' },
  j1: { lat: 15.3350, lng: 76.4631, label: 'Virupaksha', city: 'Hampi' },
  j2: { lat: 12.9352, lng: 79.6245, label: 'Ekambareswarar', city: 'Kanchipuram' },
  j3: { lat: 11.5642, lng: 79.8945, label: 'Nataraja Chidambaram', city: 'Chidambaram' },
  j4: { lat: 10.8945, lng: 78.6789, label: 'Ranganathaswamy', city: 'Srirangam' },
  j5: { lat: 20.2355, lng: 85.8245, label: 'Lingaraja', city: 'Bhubaneswar' },
  j6: { lat: 14.6420, lng: 74.4890, label: 'Murudeshwar', city: 'Murdeshwar' },
  j7: { lat: 10.9172, lng: 76.0315, label: 'Guruvayur', city: 'Guruvayur' },
  j8: { lat: 22.3667, lng: 75.9667, label: 'Omkareshwar', city: 'Omkareshwar' },
};

export const getRandomLocations = (count = 1) => {
  const keys = Object.keys(locationCoordinates);
  const shuffled = [...keys].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(key => ({
    id: key,
    ...locationCoordinates[key],
  }));
};
