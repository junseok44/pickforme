import "@/styles/globals.css";
import { Suspense } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import CheckLogin from "@/components/CheckLogin";
import CheckReady from "@/components/CheckReady";
import Header from "@/components/Header";
import { Provider as JotaiProvider } from "jotai";
import { AnalyticsDateProvider } from "@/contexts/AnalyticsDateContext";
import styled from "@emotion/styled";

import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <JotaiProvider>
        <AnalyticsDateProvider>
          <CheckReady>
            <CheckLogin>
              <Header />
              <MainContent>
                <Component {...pageProps} />
              </MainContent>
            </CheckLogin>
          </CheckReady>
        </AnalyticsDateProvider>
      </JotaiProvider>
    </GoogleOAuthProvider>
  );
}

const MainContent = styled.div`
  padding-top: 60px; /* 네비게이션 바 높이만큼 패딩 추가 */
`;
