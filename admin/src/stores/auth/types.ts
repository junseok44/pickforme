export interface UserData {
  _id: string,
  email: string,
  token: string,
  point: number,
}

export interface GoogleLoginParams {
  accessToken: string,
}

export interface LoginResponse {
  user: UserData;
  isRegister: boolean;
}
