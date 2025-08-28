import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
);

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid Google token");
    }

    return {
      id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw new Error("Invalid Google token");
  }
}

export function getGoogleAuthUrl(): string {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
}

export async function getGoogleUserFromCode(code: string): Promise<GoogleUserInfo> {
  try {
    const { tokens } = await client.getToken(code);
    
    if (!tokens.id_token) {
      throw new Error("No ID token received from Google");
    }

    return await verifyGoogleToken(tokens.id_token);
  } catch (error) {
    console.error("Error getting Google user from code:", error);
    throw new Error("Failed to authenticate with Google");
  }
}
