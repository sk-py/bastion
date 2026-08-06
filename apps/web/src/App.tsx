import { createBrowserRouter, RouterProvider } from "react-router"
import Protected from "./components/Layout/protected-route"
import Dashboard from "./features/dashboard/dashboard"
import LoginPage from "./features/auth/login"
import { GuestRoute } from "./components/Layout/guest-route"
import Layout from "./components/Layout/app-layout"
import TerminalPage from "./features/terminal/terminalPage"
import GlobalErrorPage from "./components/Layout/global-error-page"

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
    },
    {
      path: "*",
      element: <GlobalErrorPage status={404} />,
    }
  ])

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
