import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0080e6',
      600: '#0064b4',
      700: '#004882',
      800: '#002c50',
      900: '#001020',
    },
    navy: {
      50: '#e8edf5',
      100: '#c5cee3',
      200: '#9faed0',
      300: '#798ebd',
      400: '#5d76af',
      500: '#415ea1',
      600: '#37529a',
      700: '#2b4290',
      800: '#1f3385',
      900: '#0a1628',
    },
    teal: {
      50: '#e0f7fa',
      100: '#b2ebf2',
      200: '#80deea',
      300: '#4dd0e1',
      400: '#26c6da',
      500: '#00bcd4',
      600: '#00acc1',
      700: '#0097a7',
      800: '#00838f',
      900: '#006064',
    },
    emergency: {
      50: '#fff5f5',
      100: '#fed7d7',
      200: '#feb2b2',
      300: '#fc8181',
      400: '#f56565',
      500: '#e53e3e',
      600: '#c53030',
      700: '#9b2c2c',
      800: '#822727',
      900: '#63171b',
    },
    dark: {
      50: '#f2f2f2',
      100: '#d9d9d9',
      200: '#bfbfbf',
      300: '#a6a6a6',
      400: '#8c8c8c',
      500: '#737373',
      600: '#595959',
      700: '#404040',
      800: '#1a1a2e',
      900: '#0d0d1a',
    }
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        bg: '#0a0e1a',
        color: 'white',
        minHeight: '100vh',
      },
      '::-webkit-scrollbar': {
        width: '8px',
      },
      '::-webkit-scrollbar-track': {
        bg: '#0d1117',
      },
      '::-webkit-scrollbar-thumb': {
        bg: '#2d3748',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        bg: '#4a5568',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
      },
      variants: {
        emergency: {
          bg: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          color: 'white',
          _hover: {
            bg: 'linear-gradient(135deg, #fc8181 0%, #e53e3e 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(229, 62, 62, 0.4)',
          },
        },
        brand: {
          bg: 'linear-gradient(135deg, #0080e6 0%, #00bcd4 100%)',
          color: 'white',
          _hover: {
            bg: 'linear-gradient(135deg, #1a9dff 0%, #26c6da 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 128, 230, 0.4)',
          },
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(20px)',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.15)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(15, 20, 40, 0.8)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: '#0f1428',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
        },
        overlay: {
          backdropFilter: 'blur(8px)',
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            _hover: {
              bg: 'rgba(255, 255, 255, 0.08)',
            },
            _focus: {
              bg: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px #1a9dff',
            },
            _placeholder: {
              color: 'whiteAlpha.400',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Select: {
      variants: {
        filled: {
          field: {
            bg: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            _hover: {
              bg: 'rgba(255, 255, 255, 0.08)',
            },
            _focus: {
              bg: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'brand.400',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Textarea: {
      variants: {
        filled: {
          bg: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: 'white',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.08)',
          },
          _focus: {
            bg: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'brand.400',
          },
          _placeholder: {
            color: 'whiteAlpha.400',
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
  },
});

export default theme;
