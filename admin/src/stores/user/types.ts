export interface GetUsersParams {
  start?: string,
  end?: string,
}

export interface User {
  _id: string,
  email: string,
  point: number,
  level: number,
  push: {
    chat: string,
    service: string
  },
  createdAt: string,
  updatedAt: string,
  pushToken: string,
  originEmail?: string
}

