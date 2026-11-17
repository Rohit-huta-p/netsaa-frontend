import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/*
          maximum-scale=1 prevents mobile browsers (iOS Safari, Chrome Android)
          from auto-zooming the page when the user taps an input field.
          Without it, browsers zoom toward the input and the user has to
          pinch-out manually. The app is a fixed-layout RN experience so
          pinch-to-zoom is not needed.
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
