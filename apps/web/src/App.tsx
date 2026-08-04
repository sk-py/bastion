import { createBrowserRouter, RouterProvider } from "react-router"
import Protected from "./components/Layout/protected-route"
import Dashboard from "./features/dashboard/dashboard"
import LoginPage from "./features/auth/login"
import { GuestRoute } from "./components/Layout/guest-route"
import Layout from "./components/Layout/app-layout"
import TerminalPage from "./features/terminal/terminalPage"

function App() {

  const router = createBrowserRouter([
    {
      element: <Protected />,
      children: [
        {
          element: <Layout />,
          children: [
            {
              path: "/",
              element: <Dashboard />
            },
            {
              path: "/servers/:id/terminal",
              element: <TerminalPage />
            }
          ]
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
