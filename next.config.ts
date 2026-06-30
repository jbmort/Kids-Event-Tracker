import type { NextConfig } from "next";
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',              
  // Switch back to `process.env.NODE_ENV === 'development'` for normal coding.
  disable: true, 
  register: true,           
});

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

};

export default withPWA(nextConfig);