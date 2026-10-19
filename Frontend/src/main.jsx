import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter,  } from 'react-router-dom'
import './index.css'
import './theme.css'
import App from './App.jsx'
import { GlobalProvider } from './context/context.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } } });

ReactDOM.createRoot(document.getElementById('root')).render(

  <BrowserRouter>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <GlobalProvider>
           <App /> 
        </GlobalProvider>
      </QueryClientProvider>
    </StrictMode>
  </BrowserRouter>
)
