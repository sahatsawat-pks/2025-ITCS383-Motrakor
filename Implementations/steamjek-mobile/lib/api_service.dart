import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiService {
  // Automatically choose localhost based on the platform being tested
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api';
    } else {
      return 'http://localhost:3000/api';
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }

  static Future<Map<String, String>> getHeaders([bool auth = false]) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // --- Auth ---
  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: await getHeaders(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: await getHeaders(),
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    return jsonDecode(response.body);
  }

  // --- Games ---
  static Future<Map<String, dynamic>> getGames() async {
    final response = await http.get(Uri.parse('$baseUrl/games'));
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getGameDetails(int id) async {
    final response = await http.get(Uri.parse('$baseUrl/games/$id'));
    return jsonDecode(response.body);
  }

  // --- Cart ---
  static Future<Map<String, dynamic>> getCart() async {
    final response = await http.get(
      Uri.parse('$baseUrl/cart'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> addToCart(int gameId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/cart'),
      headers: await getHeaders(true),
      body: jsonEncode({'gameId': gameId}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> removeFromCart(int gameId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/cart/$gameId'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  // --- Purchases ---
  static Future<Map<String, dynamic>> getLibrary() async {
    final response = await http.get(
      Uri.parse('$baseUrl/purchases'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> createPaymentIntent() async {
    final response = await http.post(
      Uri.parse('$baseUrl/purchases/create-payment-intent'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> confirmPayment(
    String paymentIntentId,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/purchases/confirm'),
      headers: await getHeaders(true),
      body: jsonEncode({'paymentIntentId': paymentIntentId}),
    );
    return jsonDecode(response.body);
  }

  // --- Wishlist ---
  static Future<Map<String, dynamic>> getWishlist() async {
    final response = await http.get(
      Uri.parse('$baseUrl/wishlist'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> addToWishlist(int gameId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/wishlist'),
      headers: await getHeaders(true),
      body: jsonEncode({'gameId': gameId}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> removeFromWishlist(int gameId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/wishlist/$gameId'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  // --- Marketplace ---
  static Future<Map<String, dynamic>> getListings() async {
    final response = await http.get(
      Uri.parse('$baseUrl/market/listings'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getMyItems() async {
    final response = await http.get(
      Uri.parse('$baseUrl/market/my-items'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> listMarketItem(
    int itemTypeId,
    int quantity,
    double price,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/market/listings'),
      headers: await getHeaders(true),
      body: jsonEncode({
        'itemTypeId': itemTypeId,
        'quantity': quantity,
        'price': price,
      }),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> buyMarketItem(
    int listingId,
    int quantity,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/market/buy/$listingId'),
      headers: await getHeaders(true),
      body: jsonEncode({'quantity': quantity}),
    );
    return jsonDecode(response.body);
  }

  // --- Profile ---
  static Future<Map<String, dynamic>> getProfile() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/profile'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
  ) async {
    final response = await http.put(
      Uri.parse('$baseUrl/auth/profile'),
      headers: await getHeaders(true),
      body: jsonEncode(data),
    );
    return jsonDecode(response.body);
  }

  // --- Ratings & Reviews ---
  static Future<Map<String, dynamic>> getGameRatings(int gameId) async {
    final response = await http.get(Uri.parse('$baseUrl/ratings/$gameId'));
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> rateGame(
    int gameId,
    int rating,
    String reviewText,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/ratings/$gameId'),
      headers: await getHeaders(true),
      body: jsonEncode({'rating': rating, 'reviewText': reviewText}),
    );
    return jsonDecode(response.body);
  }

  // --- Point Shop ---
  static Future<Map<String, dynamic>> getPoints() async {
    final response = await http.get(
      Uri.parse('$baseUrl/points'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getRewards() async {
    final response = await http.get(
      Uri.parse('$baseUrl/points/rewards'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getMyRewards() async {
    final response = await http.get(
      Uri.parse('$baseUrl/points/my-rewards'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> redeemReward(int rewardId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/points/redeem/$rewardId'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> equipReward(int rewardId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/points/equip/$rewardId'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }

  // --- Community ---
  static Future<Map<String, dynamic>> getThreads({
    int? gameId,
    String? q,
    String? tag,
  }) async {
    final queryParams = <String, String>{};
    if (gameId != null) queryParams['game_id'] = gameId.toString();
    if (q != null && q.isNotEmpty) queryParams['q'] = q;
    if (tag != null && tag != 'All') queryParams['tag'] = tag;

    final uri = Uri.parse(
      '$baseUrl/community/threads',
    ).replace(queryParameters: queryParams);
    final response = await http.get(uri);
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getThread(int threadId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/community/threads/$threadId'),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> createThread(
    Map<String, dynamic> payload,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/community/threads'),
      headers: await getHeaders(true),
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getReplies(int threadId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/community/threads/$threadId/replies'),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> createReply(
    int threadId,
    String content,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/community/threads/$threadId/replies'),
      headers: await getHeaders(true),
      body: jsonEncode({'content': content}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> likeThread(int threadId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/community/threads/$threadId/like'),
      headers: await getHeaders(true),
    );
    return jsonDecode(response.body);
  }
}
