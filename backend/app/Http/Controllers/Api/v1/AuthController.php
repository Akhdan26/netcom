<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
  public function login(Request $request)
  {
    $request->validate([
      'email' => 'required|email',
      'password' => 'required|string',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
      throw ValidationException::withMessages([
        'email' => ['Email tidak valid!'],
      ]);
    }

    // Hapus token lama jika ada, lalu buat token baru
    $user->tokens()->delete();
    $token = $user->createToken('admin-dashboard-token')->plainTextToken;

    return response()->json([
      'success' => true,
      'message' => 'Login berhasil',
      'token' => $token,
      'user' => [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
      ],
    ]);
  }

  public function user(Request $request)
  {
    return response()->json($request->user());
  }

  public function logout(Request $request)
  {
    $request->user()->currentAccessToken()->delete();

    return response()->json([
      'success' => true,
      'message' => 'Logout berhasil',
    ]);
  }
}
