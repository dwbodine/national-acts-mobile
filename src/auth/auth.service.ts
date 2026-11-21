import { ApiError, request } from "../api/client";
import type { User, UserLoginResponse } from "./types";

export async function login(
  username: string,
  password: string,
): Promise<UserLoginResponse> {
  try {
    const options = {
      body: { username, password },
      apiKey: process.env.EXPO_PUBLIC_USER_API_KEY,
      login: true,
    };
    const user = (await request("/user/login", options)) as User;
    if (!user?.isAuthenticated || !user.token)
      throw new Error("Login did not return an authenticated user.");
    if (user.requireResetPassword)
      throw new Error(
        "Please reset your password in the users website before signing in here.",
      );
    return { statusCode: 200, success: true, user };
  } catch (error) {
    return {
      statusCode: error instanceof ApiError ? error.status : 500,
      success: false,
      error: error instanceof Error ? error.message : "Unable to sign in.",
    };
  }
}
