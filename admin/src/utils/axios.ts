import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
});


/* axios.ts */
const clientInterceptor = client.interceptors.request.use((request) => {
  const userDataStr = window.localStorage.getItem('userData');
  if (userDataStr) {
    const userData = JSON.parse(userDataStr);
    const token = userData.token;
    request.headers.authorization = `Bearer ${token}`;
  }
  return request;
});


// useInterceptor에서 atom값으로 interceptor 세팅할때 클리어
export const clearDefaultInterceptor = () => {
  client.interceptors.request.eject(clientInterceptor);
}

export default client;
