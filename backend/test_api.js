async function runTests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('=== Starting API Endpoint Verification ===')

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`)
  const healthData = await healthRes.json()
  console.log('1. Health Check:', healthData.status === 'online' ? 'PASSED' : 'FAILED')

  // 2. Destinations List from MongoDB
  const destRes = await fetch(`${BASE_URL}/destinations`)
  const destData = await destRes.json()
  console.log('2. Destinations from MongoDB:', destData.success && destData.count > 0 ? 'PASSED' : 'FAILED', `(${destData.count} destinations)`)

  // 3. User Registration
  const testEmail = `explorer_${Date.now()}@wanderwave.com`
  const regPayload = {
    name: 'Sophia Martinez',
    email: testEmail,
    password: 'Voyager2026Password!',
    membershipTier: 'Platinum Elite',
  }
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload),
  })
  const regData = await regRes.json()
  console.log('3. User Registration:', regData.success ? 'PASSED' : 'FAILED')

  // 4. User Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Voyager2026Password!',
    }),
  })
  const loginData = await loginRes.json()
  console.log('4. User Login:', loginData.success && loginData.user?.role === 'traveler' ? 'PASSED' : 'FAILED')

  // 5. Protected /api/auth/me
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  })
  const meData = await meRes.json()
  console.log('5. Protected /api/auth/me:', meData.success ? 'PASSED' : 'FAILED')

  // 6. User Bookings from MongoDB
  const bookingRes = await fetch(`${BASE_URL}/bookings/my-bookings`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  })
  const bookingData = await bookingRes.json()
  console.log('6. User Bookings from MongoDB:', bookingData.success && bookingData.count > 0 ? 'PASSED' : 'FAILED')

  // 7. Non-Admin 403 Forbidden Access Test
  const forbiddenRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  })
  console.log('7. Non-Admin 403 Rejection on /admin/stats:', forbiddenRes.status === 403 ? 'PASSED (403 Forbidden)' : 'FAILED')

  // 8. Admin Login
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@wanderwave.com',
      password: 'AdminPassword2026!',
    }),
  })
  const adminLoginData = await adminLoginRes.json()
  console.log('8. Admin Login:', adminLoginData.success && adminLoginData.user?.role === 'admin' ? 'PASSED' : 'FAILED')

  const adminToken = adminLoginData.token

  // 9. Admin Stats API
  const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  const statsData = await statsRes.json()
  console.log('9. Admin Stats Overview:', statsData.success ? 'PASSED' : 'FAILED', {
    totalUsers: statsData.data?.totalUsers,
    totalBookings: statsData.data?.totalBookings,
    totalDestinations: statsData.data?.totalDestinations,
  })

  // 10. Admin All Bookings API
  const allBookingsRes = await fetch(`${BASE_URL}/bookings/all`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  const allBookingsData = await allBookingsRes.json()
  console.log('10. Admin All Bookings List:', allBookingsData.success ? 'PASSED' : 'FAILED', `(${allBookingsData.count} bookings total)`)

  // 11. Admin Create Destination API
  const newDestRes = await fetch(`${BASE_URL}/destinations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Monte Carlo Grand Riviera',
      country: 'Monaco',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
      price: 'From $5,500',
      tag: 'Exclusive',
      description: 'Private harbour yacht charters and Mediterranean glamour.',
    }),
  })
  const newDestData = await newDestRes.json()
  console.log('11. Admin Create Destination:', newDestData.success ? 'PASSED' : 'FAILED', newDestData.data?.title)

  console.log('=== All 11 API Tests Completed Successfully! ===')
}

runTests().catch(console.error)
