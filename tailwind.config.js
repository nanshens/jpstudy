/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // 场景 meta.json 里的颜色 class 是动态字符串(JSON 里的值),
  // Tailwind 默认只扫描源码静态字符串,扫不到 JSON 里的 class。
  // 这里把所有可能用到的渐变色 stop 列入 safelist,确保 build 出来
  safelist: [
    // 渐变起点 / 中间 / 终点 (常用组合)
    ...['blue', 'indigo', 'purple', 'pink', 'rose', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'violet', 'fuchsia', 'slate', 'gray', 'zinc', 'neutral', 'stone'].flatMap((c) =>
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => `from-${c}-${s}`),
    ),
    ...['blue', 'indigo', 'purple', 'pink', 'rose', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'violet', 'fuchsia', 'slate', 'gray', 'zinc', 'neutral', 'stone'].flatMap((c) =>
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => `via-${c}-${s}`),
    ),
    ...['blue', 'indigo', 'purple', 'pink', 'rose', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'violet', 'fuchsia', 'slate', 'gray', 'zinc', 'neutral', 'stone'].flatMap((c) =>
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => `to-${c}-${s}`),
    ),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Hiragino Sans"',
          '"Yu Gothic"',
          'Meiryo',
          'sans-serif',
        ],
        jp: ['"Noto Sans JP"', '"Hiragino Sans"', '"Yu Gothic"', 'Meiryo', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        // shadcn-style semantic tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
