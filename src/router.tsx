import { createBrowserRouter } from 'react-router'
import { HomePage } from '@/pages/Home'
import { ExamPage } from '@/pages/Exam'
import { ResultPage } from '@/pages/Result'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/exam/:setId', element: <ExamPage /> },
  { path: '/result/:sessionId', element: <ResultPage /> },
])
