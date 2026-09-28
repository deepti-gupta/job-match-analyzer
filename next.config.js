/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell webpack NOT to bundle native Node.js binaries (.node files)
  // @xenova/transformers uses onnxruntime-node which has native bindings
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Treat onnxruntime-node as external — loaded by Node at runtime, not bundled
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "onnxruntime-node",
        "pdf-parse",
      ];
    }
    return config;
  },
  // Required for @xenova/transformers to work correctly in Next.js API routes
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers", "onnxruntime-node", "pdf-parse"],
  },
};

module.exports = nextConfig;
