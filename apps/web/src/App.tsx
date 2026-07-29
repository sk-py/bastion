import { createBrowserRouter, RouterProvider } from "react-router"
import Protected from "./components/Layout/ProtectedRoute"
import Dashboard from "./features/dashboard/dashboard"
import LoginPage from "./features/auth/login"
import { GuestRoute } from "./components/Layout/GuestRoute"

function App() {

  const router = createBrowserRouter([
    {
      element: <Protected />,
      children: [
        {
          path: "/",
          element: <Dashboard />
        }
      ]
    },
    {
      element: <GuestRoute />,
      children: [
        {
          path: "/login",
          element: <LoginPage />
        }
      ]
    }
  ])

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
