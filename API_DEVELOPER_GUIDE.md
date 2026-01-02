# 📱 Keazy API Developer Guide

> **Version:** 1.0.0  
> **Last Updated:** January 2, 2026  
> **Base URL:** `http://your-server:3000`

This guide helps third-party app developers integrate with the Keazy service matching platform. Follow these instructions to enable voice/text-based service discovery and booking in your mobile or web application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Core Integration Flow](#core-integration-flow)
4. [API Reference](#api-reference)
   - [Query Processing](#1-query-processing)
   - [Booking Management](#2-booking-management)
   - [Provider Discovery](#3-provider-discovery)
   - [Ratings & Reviews](#4-ratings--reviews)
   - [User Management](#5-user-management)
5. [Mobile SDK Examples](#mobile-sdk-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Webhooks (Coming Soon)](#webhooks-coming-soon)

---

## Quick Start

### 1. Make Your First Query

```bash
curl -X POST http://your-server:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "app-user-123",
    "query_text": "I need a plumber urgently",
    "lat": 27.8974,
    "lng": 78.0880,
    "radius_km": 10
  }'
```

### 2. Response

```json
{
  "success": true,
  "query": {
    "detected_service": "plumber",
    "confidence": 95,
    "urgency": "high"
  },
  "business_cards": [
    {
      "name": "ABC Plumbing",
      "contact": "9876543210",
      "rating": 4.7,
      "distance_km": 2.5,
      "next_available_slots": [...]
    }
  ]
}
```

---

## Authentication

Currently, the API uses `user_id` for request attribution. Future versions will support:

- API Key authentication
- OAuth 2.0
- JWT tokens

**For now:** Generate a unique `user_id` per device/user and include it in all requests.

```javascript
// Recommended: Use device ID + random suffix
const user_id = `${deviceId}-${Math.random().toString(36).substr(2, 9)}`;
```

---

## Core Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         YOUR MOBILE/WEB APP                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
   │ 1. Get User   │       │ 2. Capture    │       │ 3. Get GPS    │
   │    Location   │       │    Voice/Text │       │    Coords     │
   └───────────────┘       └───────────────┘       └───────────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     POST /query               │
                    │     {                         │
                    │       user_id,                │
                    │       query_text,             │
                    │       lat, lng, radius_km     │
                    │     }                         │
                    └───────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Display Provider Cards      │
                    │   - Name, Rating, Distance    │
                    │   - Available Slots           │
                    │   - Contact Info              │
                    └───────────────────────────────┘
                                    │
                          User selects slot
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     POST /query/book          │
                    │     { user_id, slot_id }      │
                    └───────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Show Booking Confirmation   │
                    │   - Provider Contact          │
                    │   - Date/Time                 │
                    │   - Booking ID                │
                    └───────────────────────────────┘
                                    │
                        After service completed
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     POST /ratings/add         │
                    │     { provider_id, rating }   │
                    └───────────────────────────────┘
```

---

## API Reference

### 1. Query Processing

#### **POST /query** - Process Natural Language Query

This is your primary endpoint. Send the user's voice/text query along with their location to get matched service providers.

**Request:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ | Unique user/device identifier |
| `query_text` | string | ✅ | Natural language query |
| `state` | string | ❌ | User's state (e.g., "Uttar Pradesh") |
| `city` | string | ❌ | User's city (e.g., "Aligarh") |
| `area` | string | ❌ | User's locality (e.g., "Mangal Vihar") |
| `lat` | number | ❌ | Latitude from GPS |
| `lng` | number | ❌ | Longitude from GPS |
| `radius_km` | number | ❌ | Search radius (default: 10km) |
| `urgency` | string | ❌ | "low", "normal", "high" |

**Example Request:**

```json
{
  "user_id": "device-abc123",
  "query_text": "I need an electrician to fix my fan",
  "state": "Uttar Pradesh",
  "city": "Aligarh",
  "lat": 27.8974,
  "lng": 78.0880,
  "radius_km": 10,
  "urgency": "normal"
}
```

**Response:**

```json
{
  "success": true,
  "query": {
    "text": "I need an electrician to fix my fan",
    "detected_service": "electrician",
    "confidence": 95,
    "source": "rule",
    "urgency": "normal"
  },
  "location": {
    "state": "Uttar Pradesh",
    "city": "Aligarh",
    "area": null,
    "geo": {
      "lat": 27.8974,
      "lng": 78.088,
      "radius_km": 10
    },
    "search_method": "geo"
  },
  "business_cards": [
    {
      "provider_id": "P001",
      "name": "Ravi Electric Works",
      "service": "electrician",
      "contact": "9876543210",
      "location": {
        "city": "Aligarh",
        "state": "Uttar Pradesh",
        "area": "Mangal Vihar"
      },
      "rating": 4.7,
      "verified": true,
      "available_now": true,
      "response_time_min": 30,
      "hourly_rate": 300,
      "distance_km": 2.5,
      "next_available_slots": [
        {
          "slot_id": "69576c89e196ca18dd0746fe",
          "date": "2026-01-03",
          "time": "10:00",
          "duration_min": 60
        },
        {
          "slot_id": "69576c89e196ca18dd0746ff",
          "date": "2026-01-03",
          "time": "11:00",
          "duration_min": 60
        }
      ]
    }
  ],
  "meta": {
    "total_providers": 2,
    "log_id": "695770c0bab3a92398e465f6",
    "latency_ms": 56,
    "user_queries": 5
  }
}
```

**Search Method Explanation:**

| `search_method` | Description |
|-----------------|-------------|
| `geo` | Providers found within radius using GPS coordinates |
| `standard` | Providers found using city/state filters |
| `fallback-no-geo` | Geo search returned 0, fell back to city filter |
| `fallback-state-only` | City search returned 0, fell back to state only |
| `fallback-service-only` | No location match, returned any provider for service |

---

### 2. Booking Management

#### **POST /query/book** - Book a Slot

```json
// Request
{
  "user_id": "device-abc123",
  "slot_id": "69576c89e196ca18dd0746fe",
  "notes": "Please come to the main gate"
}

// Response
{
  "success": true,
  "booking": {
    "slot_id": "69576c89e196ca18dd0746fe",
    "provider": "Ravi Electric Works",
    "service": "electrician",
    "date": "2026-01-03",
    "time": "10:00",
    "status": "booked"
  }
}
```

#### **POST /query/cancel** - Cancel a Booking

```json
// Request
{
  "user_id": "device-abc123",
  "slot_id": "69576c89e196ca18dd0746fe"
}

// Response
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

#### **GET /query/bookings/:user_id** - Get User's Bookings

```
GET /query/bookings/device-abc123
```

```json
// Response
{
  "success": true,
  "bookings": [
    {
      "slot_id": "69576c89e196ca18dd0746fe",
      "provider": "Ravi Electric Works",
      "contact": "9876543210",
      "location": "Mangal Vihar, Aligarh",
      "service": "electrician",
      "date": "2026-01-03",
      "time": "10:00",
      "status": "booked",
      "booked_at": "2026-01-02T10:30:00Z"
    }
  ]
}
```

---

### 3. Provider Discovery

#### **GET /providers/nearby** - Find Nearby Providers

Use this to show providers on a map or in a "near me" list.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | ✅ | Latitude |
| `lng` | number | ✅ | Longitude |
| `radius_km` | number | ❌ | Search radius (default: 10) |
| `service` | string | ❌ | Filter by service type |
| `state` | string | ❌ | Filter by state |
| `city` | string | ❌ | Filter by city |
| `limit` | number | ❌ | Max results (default: 20) |

**Example:**

```
GET /providers/nearby?lat=27.8974&lng=78.0880&radius_km=5&service=electrician
```

**Response:**

```json
{
  "success": true,
  "search": {
    "center": { "lat": 27.8974, "lng": 78.088 },
    "radius_km": 5,
    "filters": { "service": "electrician" }
  },
  "count": 3,
  "providers": [
    {
      "provider_id": "P001",
      "name": "Ravi Electric Works",
      "service": "electrician",
      "rating": 4.7,
      "verified": true,
      "available_now": true,
      "city": "Aligarh",
      "state": "Uttar Pradesh",
      "area": "Mangal Vihar",
      "contact": "9876543210",
      "distance_m": 500,
      "distance_km": 0.5
    }
  ]
}
```

#### **GET /providers** - List All Providers (Paginated)

```
GET /providers?page=1&limit=20
```

---

### 4. Ratings & Reviews

#### **POST /ratings/add** - Submit a Rating

After a service is completed, prompt the user to rate the provider.

```json
// Request
{
  "booking_id": "69576c89e196ca18dd0746fe",
  "provider_id": "P001",
  "rating": 5,
  "review": "Excellent service! Very professional."
}

// Response
{
  "rating_id": "...",
  "status": "submitted",
  "message": "Rating submitted successfully"
}
```

#### **GET /ratings/provider/:provider_id** - Get Provider Ratings

```
GET /ratings/provider/P001?page=1&limit=10
```

```json
// Response
{
  "ratings": [
    {
      "rating": 5,
      "review": "Excellent service!",
      "created_at": "2026-01-02T12:00:00Z"
    }
  ],
  "stats": {
    "total_ratings": 50,
    "average_rating": "4.25",
    "distribution": {
      "1": 2,
      "2": 3,
      "3": 5,
      "4": 20,
      "5": 20
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### 5. User Management

#### **GET /dashboard/users/:id** - Get User Profile with History

```
GET /dashboard/users/device-abc123
```

Returns user details, recent queries, and bookings.

---

## Mobile SDK Examples

### Android (Kotlin)

```kotlin
import okhttp3.*
import org.json.JSONObject

class KeazyClient(private val baseUrl: String) {
    private val client = OkHttpClient()
    
    fun query(
        userId: String,
        queryText: String,
        lat: Double,
        lng: Double,
        radiusKm: Int = 10,
        callback: (JSONObject?) -> Unit
    ) {
        val json = JSONObject().apply {
            put("user_id", userId)
            put("query_text", queryText)
            put("lat", lat)
            put("lng", lng)
            put("radius_km", radiusKm)
        }
        
        val body = RequestBody.create(
            MediaType.parse("application/json"),
            json.toString()
        )
        
        val request = Request.Builder()
            .url("$baseUrl/query")
            .post(body)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val result = JSONObject(response.body()?.string() ?: "{}")
                callback(result)
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
            }
        })
    }
    
    fun bookSlot(userId: String, slotId: String, callback: (JSONObject?) -> Unit) {
        val json = JSONObject().apply {
            put("user_id", userId)
            put("slot_id", slotId)
        }
        
        val body = RequestBody.create(
            MediaType.parse("application/json"),
            json.toString()
        )
        
        val request = Request.Builder()
            .url("$baseUrl/query/book")
            .post(body)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                callback(JSONObject(response.body()?.string() ?: "{}"))
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
            }
        })
    }
}

// Usage with Location
class MainActivity : AppCompatActivity() {
    private lateinit var keazy: KeazyClient
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        keazy = KeazyClient("https://api.keazy.com")
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }
    
    fun searchProviders(voiceQuery: String) {
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            keazy.query(
                userId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID),
                queryText = voiceQuery,
                lat = location.latitude,
                lng = location.longitude,
                radiusKm = 10
            ) { result ->
                result?.let {
                    val providers = it.getJSONArray("business_cards")
                    // Display providers in RecyclerView
                    runOnUiThread { updateProviderList(providers) }
                }
            }
        }
    }
}
```

### iOS (Swift)

```swift
import Foundation
import CoreLocation

class KeazyClient {
    let baseURL: String
    
    init(baseURL: String) {
        self.baseURL = baseURL
    }
    
    func query(
        userId: String,
        queryText: String,
        lat: Double,
        lng: Double,
        radiusKm: Int = 10,
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseURL)/query") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "user_id": userId,
            "query_text": queryText,
            "lat": lat,
            "lng": lng,
            "radius_km": radiusKm
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                return
            }
            
            completion(.success(json))
        }.resume()
    }
    
    func bookSlot(
        userId: String,
        slotId: String,
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseURL)/query/book") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "user_id": userId,
            "slot_id": slotId
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                return
            }
            
            completion(.success(json))
        }.resume()
    }
}

// Usage
class ViewController: UIViewController, CLLocationManagerDelegate {
    let keazy = KeazyClient(baseURL: "https://api.keazy.com")
    let locationManager = CLLocationManager()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        locationManager.delegate = self
        locationManager.requestWhenInUseAuthorization()
    }
    
    func searchProviders(voiceQuery: String) {
        guard let location = locationManager.location else { return }
        
        let userId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        
        keazy.query(
            userId: userId,
            queryText: voiceQuery,
            lat: location.coordinate.latitude,
            lng: location.coordinate.longitude,
            radiusKm: 10
        ) { result in
            switch result {
            case .success(let json):
                if let providers = json["business_cards"] as? [[String: Any]] {
                    DispatchQueue.main.async {
                        self.displayProviders(providers)
                    }
                }
            case .failure(let error):
                print("Error: \(error)")
            }
        }
    }
}
```

### React Native

```javascript
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.keazy.com';

// Get or create user ID
async function getUserId() {
  let userId = await AsyncStorage.getItem('keazy_user_id');
  if (!userId) {
    userId = `rn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('keazy_user_id', userId);
  }
  return userId;
}

// Main query function
async function searchProviders(queryText, options = {}) {
  const userId = await getUserId();
  
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              query_text: queryText,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              radius_km: options.radius_km || 10,
              urgency: options.urgency || 'normal',
            }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'Query failed'));
          }
        } catch (error) {
          reject(error);
        }
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
}

// Book a slot
async function bookSlot(slotId, notes = '') {
  const userId = await getUserId();
  
  const response = await fetch(`${API_BASE}/query/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      slot_id: slotId,
      notes,
    }),
  });
  
  return response.json();
}

// Get user's bookings
async function getMyBookings() {
  const userId = await getUserId();
  
  const response = await fetch(`${API_BASE}/query/bookings/${userId}`);
  return response.json();
}

// Submit rating
async function rateProvider(bookingId, providerId, rating, review = '') {
  const response = await fetch(`${API_BASE}/ratings/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking_id: bookingId,
      provider_id: providerId,
      rating,
      review,
    }),
  });
  
  return response.json();
}

// Usage in component
function ServiceSearchScreen() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleVoiceQuery = async (voiceText) => {
    setLoading(true);
    try {
      const result = await searchProviders(voiceText);
      setProviders(result.business_cards);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookSlot = async (slotId) => {
    try {
      const result = await bookSlot(slotId);
      if (result.success) {
        Alert.alert('Success', `Booked with ${result.booking.provider}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Booking failed');
    }
  };
  
  return (
    <View>
      {/* Your UI here */}
    </View>
  );
}

export { searchProviders, bookSlot, getMyBookings, rateProvider };
```

### Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

class KeazyClient {
  final String baseUrl;
  
  KeazyClient({required this.baseUrl});
  
  Future<String> _getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    String? userId = prefs.getString('keazy_user_id');
    if (userId == null) {
      userId = 'flutter-${DateTime.now().millisecondsSinceEpoch}';
      await prefs.setString('keazy_user_id', userId);
    }
    return userId;
  }
  
  Future<Map<String, dynamic>> query({
    required String queryText,
    int radiusKm = 10,
    String urgency = 'normal',
  }) async {
    final userId = await _getUserId();
    final position = await Geolocator.getCurrentPosition();
    
    final response = await http.post(
      Uri.parse('$baseUrl/query'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'user_id': userId,
        'query_text': queryText,
        'lat': position.latitude,
        'lng': position.longitude,
        'radius_km': radiusKm,
        'urgency': urgency,
      }),
    );
    
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> bookSlot(String slotId, {String notes = ''}) async {
    final userId = await _getUserId();
    
    final response = await http.post(
      Uri.parse('$baseUrl/query/book'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'user_id': userId,
        'slot_id': slotId,
        'notes': notes,
      }),
    );
    
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> rateProvider({
    required String bookingId,
    required String providerId,
    required int rating,
    String review = '',
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/ratings/add'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'booking_id': bookingId,
        'provider_id': providerId,
        'rating': rating,
        'review': review,
      }),
    );
    
    return jsonDecode(response.body);
  }
}

// Usage
void main() async {
  final keazy = KeazyClient(baseUrl: 'https://api.keazy.com');
  
  // Search for providers
  final result = await keazy.query(queryText: 'I need a plumber');
  print('Found ${result['business_cards'].length} providers');
  
  // Book first available slot
  final firstProvider = result['business_cards'][0];
  final firstSlot = firstProvider['next_available_slots'][0];
  
  final booking = await keazy.bookSlot(firstSlot['slot_id']);
  print('Booking status: ${booking['booking']['status']}');
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check required parameters |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Retry with exponential backoff |

### Error Response Format

```json
{
  "error": "query_text required",
  "code": "MISSING_PARAM"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `query_text required` | Empty query | Prompt user to speak/type |
| `user_id required` | Missing user ID | Generate unique device ID |
| `Could not detect service` | Query too vague | Ask user to be more specific |
| `No providers found` | No match in radius | Increase radius or remove filters |
| `Slot already booked` | Race condition | Refresh slots and retry |

### Retry Strategy

```javascript
async function queryWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/query', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 500) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      
      // Client error - don't retry
      throw new Error(await response.text());
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## Best Practices

### 1. Location Handling

```javascript
// ✅ DO: Request location before query
async function search(query) {
  const position = await getLocation();
  return await apiQuery({ query, lat: position.lat, lng: position.lng });
}

// ❌ DON'T: Send query without location
async function search(query) {
  return await apiQuery({ query }); // Geo search won't work
}
```

### 2. User ID Persistence

```javascript
// ✅ DO: Persist user ID across sessions
const userId = localStorage.getItem('userId') || generateNewId();
localStorage.setItem('userId', userId);

// ❌ DON'T: Generate new ID on every request
const userId = Math.random().toString(); // Loses booking history
```

### 3. Slot Booking UX

```javascript
// ✅ DO: Check slot availability before showing
if (slot.available) {
  showBookButton(slot);
}

// ✅ DO: Handle booking conflicts gracefully
try {
  await bookSlot(slotId);
} catch (error) {
  if (error.code === 'SLOT_TAKEN') {
    refreshSlots(); // Reload available slots
    showMessage('Slot was just taken, please select another');
  }
}
```

### 4. Caching

```javascript
// ✅ DO: Cache provider list for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let cachedProviders = null;
let cacheTime = 0;

async function getNearbyProviders(lat, lng) {
  if (cachedProviders && Date.now() - cacheTime < CACHE_TTL) {
    return cachedProviders;
  }
  
  cachedProviders = await fetch(`/providers/nearby?lat=${lat}&lng=${lng}`);
  cacheTime = Date.now();
  return cachedProviders;
}
```

### 5. Offline Support

```javascript
// ✅ DO: Queue requests when offline
const offlineQueue = [];

async function queryWithOfflineSupport(params) {
  if (!navigator.onLine) {
    offlineQueue.push(params);
    showMessage('Query saved. Will send when online.');
    return;
  }
  
  return await apiQuery(params);
}

// Process queue when back online
window.addEventListener('online', async () => {
  while (offlineQueue.length > 0) {
    const params = offlineQueue.shift();
    await apiQuery(params);
  }
});
```

---

## Webhooks (Coming Soon)

Future versions will support webhooks for:

- **Booking Confirmed** - When a slot is booked
- **Booking Cancelled** - When user cancels
- **Provider Arrived** - When provider marks arrival
- **Service Completed** - When job is done
- **Rating Received** - When user submits rating

---

## Support

- **Email:** api-support@keazy.com
- **Documentation:** https://docs.keazy.com
- **Status Page:** https://status.keazy.com

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2, 2026 | Initial release with geo search |

